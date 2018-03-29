# j-image-editor
canvas image editor

# Demo
[在线演示](https://gitjinfeiyang.github.io/j-image-editor/index.html)

# 使用
请参考demo  
     `let editor = new ImageEditor(options);`
     
# Options   
`{

	container:'.wrapper',   //必填 挂载容器
	limit:{
		minWidth:500,//宽度限制
		maxWidth:200,
		minHeight:50,//高度限制
		maxHeight:200,
		maxSize:50,//图片大小限制 kb
	},
    created:function(imageEditor){
      //editor被初始化后
    },
    beforeReadFile:function(){
     //初始化file之前 只有调用`readFile(file)`才会触发 (建议在这一步显示编辑器)
    },
    afterReadFile:function(){
		  //通过FileReader读取文件之后
		},
    beforeLoadImage:function(){
		  //读取图片前 (显示编辑器)
		},
    afterLoadImage:function(){
		  //读取图片后
		},
    beforeSave:function(){
		  //保存之前
		},
    afterSave:function(){
		  //保存之后
		},
     afterRender:function(){
      //图片加载并开始渲染
     }
		
}`


# API
`initImage(url,callback)` 读取图片链接

`readFile(file)` 读取`File`

`save()` 保存结果，返回 `blob，dataUrl`

`scaleInCenter(scale)` 以canvas中心为中心缩放

`rotateZ(deg)` 以canvas中心为中心旋转

其他使用请参考demo
