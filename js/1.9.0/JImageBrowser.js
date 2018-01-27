

//摘自jquery easing 缓动函数
var pow = Math.pow,
	sqrt = Math.sqrt,
	sin = Math.sin,
	cos = Math.cos,
	PI = Math.PI,
	c1 = 1.70158,
	c2 = c1 * 1.525,
	c3 = c1 + 1,
	c4 = ( 2 * PI ) / 3,
	c5 = ( 2 * PI ) / 4.5;

	function easeInExpo (x) {
		return x === 0 ? 0 : pow( 2, 10 * x - 10 );
	}
	function easeOutExpo(x) {
		return x === 1 ? 1 : 1 - pow( 2, -10 * x );
	}
	function easeInOutExpo(x) {
		return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ?
			pow( 2, 20 * x - 10 ) / 2 :
			( 2 - pow( 2, -20 * x + 10 ) ) / 2;
	}

	//公共canvas，用于存放临时数据
	let commonCanvas=document.createElement('canvas');
	commonCanvas.style.display='none';

	class ImageEditor{
		constructor(options){
			this.options=options;//自定义
			this.created=this.options.created||function(imageEditor){console.log('created')};//canvas初始化完成后 参数ImageEditor
			this.beforeReadFile=this.options.beforeReadFile||function(file){console.log('beforeReadFile')};//读取文件之前
			this.afterReadFile=this.options.afterReadFile||function(url){console.log('afterReadFile')};//读取文件后 url为base64
			this.beforeLoadImage=this.options.beforeLoadImage||function(url){console.log('beforeLoadImage')};
			this.afterLoadImage=this.options.afterLoadImage||function(image){console.log('afterLoadImage')};//钩子
			this.beforeSave=this.options.beforeSave||function(){console.log('beforeSave')};
			this.afterSave=this.options.afterSave||function(url,blob){console.log('afterSave')};
			this.afterRender=this.options.afterRender||function(){console.log('afterRender')}
			this.canvas1;//主canvas
			this.canvas2;//editor canvas
			this.shadowImageCanvas=document.createElement('canvas');//用于绘制阴影图片的canvas
			this.width=options.width;//画布宽度
			this.height=options.height;//画布高度
			this.animationFrame={};
			this.center={//画布中心
				x:0,
				y:0,
			};
			this.editorRect={//编辑器信息
				x:300,
				y:300,
				w:options.limit.maxWidth||200,
				h:options.limit.maxHeight||200,
			};
			this.imageRect={ //图片的信息
				x:0,y:0,w:0,h:0,centerx:0,centery:0,
			};
			this.imageTransform={ //图片绘制的变形量
				translatex:0,
				translatey:0,
				scale:1,
				scaleCenter:{
					x:0,
					y:0,
					initx:0,//ctx位置
					inity:0,
				},
				rotate:0,
			};
			this.targetTransform={//用于作动画 目标值
				translatex:0,
				translatey:0,
				scale:1,
				scaleCenter:{
					x:0,
					y:0,
					initx:0,
					inity:0,
				},
				rotate:0,
			};
			this.offset={//用于动画 偏移值
				translatex:0,
				translatey:0,
				rotate:0,
				scale:0,
				scaleCenter:{
					x:0,y:0,initx:0,inity:0
				}
			};
			this.scaleTime=0;//记录缩放动画的时间
			this.rotateTime=0;//记录旋转动画的时间
			this.scale=this.initScale=1;//旋转
			this.rotate=this.initRotate=0;//缩放


			this.image;//当前画布中的图片对象
			this.shadowImage;//处理后的图片
			this.imageLoaded=false;
			this.lineWidth=1;//编辑器粗细

			this.controllersContainer;//编辑器的dom控制层容器
			this.container;//画布容器

			this.limit={
				maxHeight:options.limit.maxHeight||0,
				maxWidth:options.limit.maxWidth||0,
				minHeight:options.limit.minHeight||0,
				minWidth:options.limit.minWidth||0,
				proportion:options.limit.proportion||0,
				maxSize:options.limit.maxSize||0,
			}

			this.init();

		}

		init(){
			this.createCanvas();
			this.initEvent();
			this.initImage();
		}

		//绑定canvas事件 移动图片 缩放
		initEvent(){
			let canvas1=this.canvas1;
			let startPosition={
				x:0,
				y:0
			};
			let currentPosition=startPosition;
			let offsetPosition={
				x:0,
				y:0
			};
			let onControling=false;
			let calcOffset = (e) => {
					if(onControling){
						currentPosition={
							x:e.pageX,
							y:e.pageY
						};
						offsetPosition={
							x:currentPosition.x-startPosition.x,
							y:currentPosition.y-startPosition.y,
						};
						startPosition=currentPosition;
					}
					return offsetPosition;
				};

			//滚轮缩放图片
			this.container.addEventListener('mousewheel', (e) => {
				e.stopPropagation();
				e.preventDefault()
				let direction=0;
				let scale=0;
				if(e.wheelDelta){//IE/Opera/Chrome     
			        if(e.wheelDelta>0){    
			            //向上滚动事件   
			            direction=1;  
			        }else{  
			            //向下滚动事件  
			            direction=-1;  
			        }  
			    }else if(e.detail){//Firefox   
			         if(e.detail<0) {  
			             //向上滚动事件  
			            direction=1;     
			         }else{  
			             //向下滚动事件  
			            direction=-1;  
			         }  
			    }

			    if(direction>0){
					scale=0.02;
			    }else{
			    	scale=-0.02;
			    }

			    // this.initImageData(lastScale,this.scale,{x:0,y:0},{x:e.pageX,y:e.pageY});
			    this.transformImage({
			    	scaleCenter:{
			    		x:e.pageX,
			    		y:e.pageY,
			    		scale,
			    	}
			    })
			});

			//为editor绑定事件	点击画布移动图片
			canvas1.addEventListener('mousedown',(e) => {
				e.preventDefault();
				onControling=true;
				startPosition={
					x:e.pageX,
					y:e.pageY,
				}
			});
			canvas1.addEventListener('mousemove',(e) => {
				e.preventDefault();
				if(onControling){
					let offsetPosition=calcOffset(e);
					// this.initImageData(this.scale,this.scale,{
					// 	x:offsetPosition.x,
					// 	y:offsetPosition.y
					// });
					this.transformImage({translatex:offsetPosition.x,translatey:offsetPosition.y});
				}
			});
			canvas1.addEventListener('mouseup',(e) => {
				e.preventDefault();
				onControling=false;

			});
			canvas1.addEventListener('mouseout',(e) => {
				e.preventDefault();
				onControling=false;
			});

		}

		//创建canvas并初始化样式
		createCanvas(){
			let canvas1ID='imageEditorCanvas1';
			let canvas2ID='imageEditorCanvas2';
			let canvas1=this.canvas1=document.createElement('canvas');
			let canvas2=this.canvas2=document.createElement('canvas');
			let container=this.container=document.querySelector(this.options.container);

			container.appendChild(canvas1);
			container.appendChild(canvas2);

			this.refreshCanvasStyle()
			this.created(this);

		}

		//刷新canvas样式 大小，计算中心点
		refreshCanvasStyle(){
			let canvas1=this.canvas1;
			let canvas2=this.canvas2;
			let container=this.container;
			if(!this.width) this.width=container.offsetWidth;
			if(!this.height) this.height=container.offsetHeight;
			canvas1.width=canvas2.width=this.width;
			canvas1.height=canvas2.height=this.height;
			canvas1.style.zIndex='10';
			this.center={
				x:canvas1.width/2,
				y:canvas1.height/2
			};
			//使编辑器居中
			this.editorRect.x=this.center.x-this.editorRect.w/2;
			this.editorRect.y=this.center.y-this.editorRect.h/2;

			canvas1.style.position='absolute';
			canvas1.style.top=canvas1.style.left='0';
			canvas2.style.display='none';

		}



		//载入图片
		initImage(img,callBack){
			if(typeof img == 'object'){
				this.image=img;
					if(callBack) callBack();
					this.beforeLoadImage();
					this.afterLoadImage(this.image);
					this.refreshCanvasStyle();
					this.startDraw();
			}else{
				this.image=new Image;
				if(img){
					this.options.imageUrl=img;
				}
				if(!this.options.imageUrl) return;
				this.image.onload = () => {
					if(callBack) callBack();
					this.afterLoadImage(this.image);
					this.refreshCanvasStyle();
					this.startDraw();
				}
				this.beforeLoadImage(this.options.imageUrl);
				this.image.src=this.options.imageUrl;
			}
			
			this.clearCanvas()
		}

		//初始化画布及图片
		initStage(mainCtx){
			let ctx=mainCtx;

			this.scale=this.initScale=1;
			this.rotate=this.initRotate=0;

			this.imageRect={
				w:this.image.width,
				h:this.image.height,
				centerx:this.image.width/2,
				centery:this.image.height/2,
			}

			this.shadowImageCanvas.width=this.image.width;
			this.shadowImageCanvas.height=this.image.height;

			this.imageFitScreen();
		}

		//根据屏幕缩放图片
		imageFitScreen(){
			let w=this.width;
			let h=this.height;
			let iw=this.image.width;
			let ih=this.image.height;
			let imgwToh=iw/ih;
			let imgHeight=0;
			let imgWidth=0;
			let startX=0,
				startY=0;
			let offsetScale=0;
			let rotate=this.rotate+this.offset.rotate;

			if(rotate%180 != 0){
				let temp=w;
				w=h;
				h=temp;
			}
			let wToh=w/h;

			//根据宽高比对图片进行缩放
			if(imgwToh>wToh){
				imgWidth=w;
				imgHeight=w/imgwToh;
				startX=0;
				startY=(h/2) - (imgHeight/2);
				if(rotate%180 != 0){
					startX=h/2-(imgWidth/2);
					startY=w/2-(imgHeight/2);
				}
				this.initScale=imgWidth/iw;
				offsetScale=this.initScale-this.scale;
			}else{
				imgHeight=h;
				imgWidth=imgwToh*h;
				startX=(w/2) - (imgWidth/2);
				startY=0;
				if(rotate%180 != 0){
					startX=h/2-(imgWidth/2);
					startY=w/2-(imgHeight/2);
				}
				this.initScale=imgHeight/ih;
				offsetScale=this.initScale-this.scale;
			}
			this.targetTransform.translatex=0;
			this.targetTransform.translatey=0;
			this.targetTransform.scaleCenter={
				x:0,y:0,initx:0,inity:0
			};

			this.scaleInCenter(offsetScale)
			// this.scaleTo(offsetScale);
		}


		//渲染
		startDraw(){
			let ctx2=this.canvas2.getContext('2d');
			let ctx=this.canvas1.getContext('2d');
			
			this.initStage(ctx);

			window.cancelAnimationFrame(this.animationFrame);

			//渲染
			let l=() => {
				this.update();//先update
				this.render(ctx,ctx2);
				this.animationFrame=window.requestAnimationFrame(l)
			};
			l();
			this.afterRender();
		}

		clearCanvas(){
			this.canvas1.getContext('2d').clearRect(0,0,this.width,this.height);
			window.cancelAnimationFrame(this.animationFrame);
		}


		//根据鼠标输入计算偏移量
		transformImage(transform){
			let translatex=transform.translatex||0;
			let translatey=transform.translatey||0;
			let scaleCenter=transform.scaleCenter;
			if(translatex){
				this.targetTransform.translatex+=translatex/this.scale;
			}
			if(translatey){
				this.targetTransform.translatey+=translatey/this.scale;
			}
			if(scaleCenter){
				if(scaleCenter.x!=this.targetTransform.scaleCenter.x&&this.targetTransform.scaleCenter.y!=scaleCenter.y){
					let lastCenterX=this.targetTransform.scaleCenter.x;
					let lastCenterY=this.targetTransform.scaleCenter.y;

					this.targetTransform.scaleCenter.x=scaleCenter.x;
					this.targetTransform.scaleCenter.y=scaleCenter.y;

					let lastInitx=this.targetTransform.scaleCenter.initx;
					let lastInity=this.targetTransform.scaleCenter.inity;

					let lastScale=this.scale;
					let currentScale=this.scale+0.02;

					//根据鼠标位置缩放图片

					let lastW=this.image.width*lastScale;
					let lastH=this.image.height*lastScale;
					let lastX=lastCenterX-(lastCenterX-lastInitx)*lastScale;
					let lastY=lastCenterY-(lastCenterY-lastInity)*lastScale;

					let leftToWidth=(scaleCenter.x-lastX)/lastW;
					let topToHeight=(scaleCenter.y-lastY)/lastH;


					let initx=scaleCenter.x-this.image.width*leftToWidth;
					let inity=scaleCenter.y-this.image.height*topToHeight;

					this.targetTransform.scaleCenter.initx=initx;
					this.targetTransform.scaleCenter.inity=inity;
				}

				//缩放动画开始
				this.scaleTo(scaleCenter.scale);

			}
		}

		applyTransform(ctx,transform){
			//应用缩放
			ctx.translate(transform.scaleCenter.x,transform.scaleCenter.y);
			ctx.scale(this.scale,this.scale);
			ctx.translate(transform.scaleCenter.initx-transform.scaleCenter.x,transform.scaleCenter.inity-transform.scaleCenter.y);
			// ctx.translate(transform.scaleCenter.initx-transform.scaleCenter.x,transform.scaleCenter.inity-transform.scaleCenter.y);


			// 应用位移
			ctx.translate(transform.translatex,transform.translatey);

			//应用旋转
			ctx.translate(this.imageRect.centerx,this.imageRect.centery);
			ctx.rotate(this.rotate/180*Math.PI);
			ctx.translate(-this.imageRect.centerx,-this.imageRect.centery);
		}

		scaleTo(offsetScale){
			if(!offsetScale){
				this.offset.scale=0;
			}else{
				this.scaleTime=0;
				this.initScale=this.scale;
				if(this.offset.scale*offsetScale<0) this.offset.scale=0; //如果是在放大动画中缩小
				this.offset.scale+=offsetScale;
			}

		}

		scaleInCenter(offsetScale){
			this.targetTransform.scaleCenter.x=this.center.x;
			this.targetTransform.scaleCenter.y=this.center.y;
			this.targetTransform.scaleCenter.initx=(this.width-this.image.width)/2;
			this.targetTransform.scaleCenter.inity=(this.height-this.image.height)/2;
			this.scaleTo(0);
			this.scaleTo(offsetScale);
		}

		//更新数据 计算动画帧 
		update(){
			let imgT=this.imageTransform;
			let targetT=this.targetTransform;
			imgT.translatex=targetT.translatex;
			imgT.translatey=targetT.translatey;

			if(this.scaleTime<1){
				this.scaleTime+=0.01;
				this.scale=easeOutExpo(this.scaleTime)*this.offset.scale+this.initScale;
				if(this.scale<0.05){
					this.scale=0.05; 
					this.scaleTime=1;
				}
			}else{
				this.offset.scale=0;
				this.scaleTime=1;
			}

			if(this.rotateTime<1){
				this.rotateTime+=0.01;
				this.rotate=easeOutExpo(this.rotateTime)*this.offset.rotate+this.initRotate;
			}else{
				this.rotate=this.offset.rotate+this.initRotate;
				if(this.rotate == 360){
					this.rotate=0;
				}
				this.offset.rotate=0;
				this.initRotate=this.rotate;
				this.rotateTime=1;
			}


			imgT.scaleCenter.x=targetT.scaleCenter.x;
			imgT.scaleCenter.y=targetT.scaleCenter.y;
			imgT.scaleCenter.initx=targetT.scaleCenter.initx;
			imgT.scaleCenter.inity=targetT.scaleCenter.inity;

		}

        //开始绘制
		render(ctx,ctx2){
			let transform=this.imageTransform;
			let point={
					x:this.editorRect.x,
					y:this.editorRect.y
				},
				size={
					w:this.editorRect.w,
					h:this.editorRect.h,
				};
			ctx.clearRect(0,0,this.width,this.height);


			//渲染底部大图	
			ctx.save();
			this.applyTransform(ctx,transform);			
			ctx.drawImage(this.image,0,0);
			ctx.restore();

			//渲染2编辑器
			// this.drawEditor(ctx2,point,size);

			//取得编辑器的图片
			// ctx.drawImage(this.canvas2, 0, 0);

			// ctx.beginPath();
			// ctx.arc(transform.translatex,transform.translatex,10,0,2*Math.PI,true);
			// ctx.closePath();
			// ctx.fillStyle='#fff';
			// ctx.fill();




			//渲染一些信息
			ctx.font="10px Verdana";
			ctx.fillStyle='#fff';
			ctx.fillText('缩放： '+parseInt(this.scale*100)+'%',10,20);
			ctx.fillText('图片大小： '+this.image.width+'*'+this.image.height,10,40);
		}


		rotateZ(deg){
			if(this.rotateTime == 1){
				this.offset.rotate=deg;
				this.rotateTime=0;
				this.imageFitScreen();
			}
			
		}

		readFile(file){
			this.beforeReadFile(file);
			if(FileReader){
				let fileReader=new FileReader();
				fileReader.readAsDataURL(file);
				fileReader.onload=(e) => {
					this.initImage(e.target.result);
					this.afterReadFile(e.target.result);
				}
			}else{
				let url=window.URL.createObjectURL(file);
				this.initImage(url);
				this.afterReadFile(url);
			}
			this.clearCanvas();
			
		}
	}



	function type(obj) {
	  var toString = Object.prototype.toString;
	  var map = {
	    '[object Boolean]'  : 'boolean',
	    '[object Number]'   : 'number',
	    '[object String]'   : 'string',
	    '[object Function]' : 'function',
	    '[object Array]'    : 'array',
	    '[object Uint8ClampedArray]':'array',
	    '[object ImageData]':'array',
	    '[object Date]'     : 'date',
	    '[object RegExp]'   : 'regExp',
	    '[object Undefined]': 'undefined',
	    '[object Null]'     : 'null',
	    '[object Object]'   : 'object'
	  };
	  if(obj instanceof Element) {
	    return 'element';
	  }
	  return map[toString.call(obj)];
	}

	function deepClone(data) {
	  var t = type(data), o, i, ni;
	  if(t === 'array') {
	    o = [];
	  }else if( t === 'object') {
	    o = {};
	  }else {
	    return data;
	  }

	  if(t === 'array') {
	    for (i = 0, ni = data.length; i < ni; i++) {
	      o.push(deepClone(data[i]));
	    }
	    return o;
	  }else if( t === 'object') {
	    for( i in data) {
	      o[i] = deepClone(data[i]);
	    }
	    return o;
	  }
	}


	var throttle=(function(){
		let timeout={};
		let throttle=false;

		return function(fn,delay=17){
			if(throttle) return;
			fn();
			throttle=true;
			timeout=setTimeout(function(){
				throttle=false;
			},delay)
		}
	})();























