 //分割polygon lineString





  //深复制
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




  //分割
   //一次分割多个复杂 ，暂支持分割两个
 	function splitPolygon(polygon,lineString){
 	  let tx1=NaN,ty1=NaN,tx2=NaN,ty2=NaN;
 	  let split=0;
 	  let line=[];
 	  let commonPoints=[
      // {
      //   lineIndex:0,
      //   point:{
      //     coordinates:[],
      //     polygonIndex:0
      //   }
      // }
    ];
 	  let point=[];
 	  let start=[],end=[];
 	  for(let i=0; i<lineString.length; i++){
 	    split=i;
 	    start=lineString[split];
 	    split++;
 	    if(split>=lineString.length){
 	      break;
      }
      end=lineString[split];
 	    line=[start,end];
 	    point=OlHelper.getPointsCommon(polygon,line);
 	    if(point.length>0){
        for(let j=0; j<point.length; j++){
          commonPoints.push({lineIndex:i,point:point[j]})
        }
      }
    }

    let startPoint=commonPoints[0];
    let endPoint=commonPoints[1];
    let direction=false;
    let fragment1;
    let fragment2;
    let fragment3;
    let fragment4=getArrayByRange(lineString,startPoint.lineIndex+1,endPoint.lineIndex);
    fragment4.unshift(startPoint.point.coordinates);
    fragment4.push(endPoint.point.coordinates);
    let fragment4R=deepClone(fragment4).reverse();
    let polygon1,polygon2;

    if(startPoint.point.polygonIndex - endPoint.point.polygonIndex <0){
      console.log('right')
      fragment1=getArrayByRange(polygon[0],0,startPoint.point.polygonIndex);
      fragment2=getArrayByRange(polygon[0],startPoint.point.polygonIndex+1,endPoint.point.polygonIndex);
      fragment3=getArrayByRange(polygon[0],endPoint.point.polygonIndex+1,polygon[0].length);
      polygon1=[Array.concat(fragment1,fragment4,fragment3)];
      polygon2=[Array.concat(fragment2,fragment4R)];
    }else{
      fragment1=getArrayByRange(polygon[0],0,endPoint.point.polygonIndex);
      fragment2=getArrayByRange(polygon[0],endPoint.point.polygonIndex+1,startPoint.point.polygonIndex);
      fragment3=getArrayByRange(polygon[0],startPoint.point.polygonIndex+1,polygon[0].length);
      polygon1=[Array.concat(fragment1,fragment4R,fragment3)];
      polygon2=[Array.concat(fragment2,fragment4)];
    }


    return {polygons:[polygon1,polygon2],points:commonPoints};
  }

    //判断线段交点
   //多边形返回多个
   //线段返回一个
   //@polygon 线段数组
   //@lineString 一定要是线段
  function getPointsCommon(polygon,lineString){
    let lineStart=lineString[0];
    let lineEnd=lineString[lineString.length-1];
    let polygonPoints=polygon[0];

    let startX=lineStart[0];
    let startY=lineStart[1];
    let endX=lineEnd[0];
    let endY=lineEnd[1];

    let x1=NaN,y1=NaN,x2=NaN,y2=NaN; //交点坐标
    let index1=0,index2=0;
    let tx1,ty1,tx2,ty2;
    let x=NaN,y=NaN;

    let points=[
      // {index:0,point:[]}
      ]

    for(let i=0; i<polygonPoints.length-1; i++){
      let split=i;
      tx1=polygonPoints[split][0];
      ty1=polygonPoints[split][1];

      split+=1;

      tx2=polygonPoints[split][0];
      ty2=polygonPoints[split][1];
      if(isNaN(x)){
        x=(tx1*(ty2-ty1)/(tx2-tx1) - startX*(endY-startY)/(endX-startX) + startY - ty1)/((ty2-ty1)/(tx2-tx1) - (endY-startY)/(endX-startX));

        if(!isNaN(x)){

          y=(((x-tx1)*(ty2-ty1))/(tx2-tx1))+ty1;


          //判断是否在线段内
          if((x>startX&&x>endX)||(x<startX&&x<endX)){
            x=NaN;
            y=NaN;
          }
          if((x>tx1&&x>tx2)||(x<tx1&&x<tx2)){
            x=NaN;
            y=NaN;
          }

        }

        if(!isNaN(x)&&!isNaN(y)){
          points.push({polygonIndex:i,coordinates:[x,y]})
        }

        x=NaN;
        y=NaN;
      }
    }

    return points;
  }