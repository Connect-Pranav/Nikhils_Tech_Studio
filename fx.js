/* ---------- depth and interaction ---------- */
(function(){
  var coin=$('coin'),glow=$('glow'),cv=$('fx'),cx=cv.getContext&&cv.getContext('2d'),mx=0,my=0,tx=0,ty=0,W=0,H=0,pts=[],raf=0,i;
  function tilt(el,e,max){var r=el.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
    el.style.transform='perspective(900px) rotateX('+((.5-py)*max*2).toFixed(2)+'deg) rotateY('+((px-.5)*max*2).toFixed(2)+'deg) translateZ(0)';
    el.style.setProperty('--mx',(px*100)+'%');el.style.setProperty('--my',(py*100)+'%')}
  document.addEventListener('mousemove',function(e){
    tx=(e.clientX/window.innerWidth-.5);ty=(e.clientY/window.innerHeight-.5);
    glow.style.opacity=1;glow.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)';
    if(RM)return;
    var t=e.target,c=t.closest&&t.closest('.card');
    if(c&&!c.querySelector('input,textarea,select')&&!c.classList.contains('flat')){tilt(c,e,3)}
    else if(c){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')}
    if(coin){var r2=coin.getBoundingClientRect(),dx=(e.clientX-(r2.left+r2.width/2))/Math.max(window.innerWidth,1),dy=(e.clientY-(r2.top+r2.height/2))/Math.max(window.innerHeight,1);
      coin.style.transform='perspective(700px) rotateY('+Math.max(-14,Math.min(14,dx*28)).toFixed(1)+'deg) rotateX('+Math.max(-12,Math.min(12,-dy*24)).toFixed(1)+'deg)'}
  });
  document.addEventListener('mouseout',function(e){var c=e.target.closest&&e.target.closest('.card');if(c&&(!e.relatedTarget||!c.contains(e.relatedTarget)))c.style.transform=''});
  document.addEventListener('click',function(e){
    var w=e.target.closest&&e.target.closest('[data-who]');
    if(w){state.owner=w.getAttribute('data-who');state.taskTab='pending';state.status='All';state.when='any';go('tasks');return}
    var m=e.target.closest&&e.target.closest('#sMore');
    if(m){var o=$('side').className.indexOf('open')>-1;$('side').className=o?'side':'side open';m.setAttribute('aria-expanded',o?'false':'true')}
  });
  /* depth field: points at different z, parallax with the pointer */
  function size(){W=cv.width=window.innerWidth;H=cv.height=window.innerHeight}
  function seed(){pts=[];var n=Math.round(Math.min(90,W*H/22000));for(i=0;i<n;i++){pts.push({x:Math.random()*W,y:Math.random()*H,z:.2+Math.random()*.8,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25})}}
  function col(){return getComputedStyle(document.documentElement).getPropertyValue('--act').trim()||'#7aa8ff'}
  function draw(){
    var c=col(),a,b,d,j,px,py,qx,qy;cx.clearRect(0,0,W,H);mx+=(tx-mx)*.05;my+=(ty-my)*.05;cx.fillStyle=c;cx.strokeStyle=c;
    for(i=0;i<pts.length;i++){a=pts[i];if(!RM){a.x+=a.vx*a.z;a.y+=a.vy*a.z;if(a.x<-20)a.x=W+20;if(a.x>W+20)a.x=-20;if(a.y<-20)a.y=H+20;if(a.y>H+20)a.y=-20}
      a._x=a.x-mx*80*a.z;a._y=a.y-my*80*a.z;cx.globalAlpha=.15+a.z*.4;cx.beginPath();cx.arc(a._x,a._y,.6+a.z*1.8,0,6.283);cx.fill()}
    for(i=0;i<pts.length;i++){for(j=i+1;j<pts.length;j++){a=pts[i];b=pts[j];px=a._x-b._x;py=a._y-b._y;d=px*px+py*py;
      if(d<14000){cx.globalAlpha=(1-d/14000)*.18*Math.min(a.z,b.z);cx.lineWidth=.7;cx.beginPath();cx.moveTo(a._x,a._y);cx.lineTo(b._x,b._y);cx.stroke()}}}
    if(!RM&&!document.hidden)raf=requestAnimationFrame(draw)
  }
  if(cx){size();seed();draw();window.addEventListener('resize',function(){size();seed();if(RM)draw()});
    document.addEventListener('visibilitychange',function(){if(!document.hidden&&!RM){cancelAnimationFrame(raf);draw()}})}
})();
