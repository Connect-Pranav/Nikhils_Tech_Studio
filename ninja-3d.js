/* ---------- ANIM: state machine ---------- */
var STATES={
 IDLE:{yaw:1,pitch:0,roll:0,eye:1,happy:0,bob:.02,aL:0,aR:0,eL:0,eR:0,cam:8.2,ring:.5,part:.4,think:0,talk:0,jump:0,err:0,energy:0,sleep:0,yawn:0,cup:0,sing:0,dance:0,laugh:0},
 LISTENING:{yaw:0,pitch:.05,roll:.04,eye:1.25,happy:0,bob:.015,aL:0,aR:0,eL:0,eR:0,cam:7.7,ring:1.2,part:.7,think:0,talk:0,jump:0,err:0,energy:.5,nod:1},
 THINKING:{yaw:0,pitch:-.28,roll:.12,eye:1,happy:0,bob:.015,aL:0,aR:-1.05,eL:0,eR:-1.7,cam:7.9,ring:3.2,part:2.6,think:1,talk:0,jump:0,err:0,energy:.3},
 TALKING:{yaw:.3,pitch:0,roll:0,eye:1.1,happy:.6,bob:.025,aL:-.25,aR:-.25,eL:-.3,eR:-.3,cam:7.3,ring:1,part:1.2,think:0,talk:1,jump:0,err:0,energy:.8},
 HAPPY:{yaw:.4,pitch:-.05,roll:.16,eye:1,happy:1,bob:.02,aL:0,aR:-.5,eL:-.4,eR:-.9,cam:7.5,ring:1.5,part:1.4,think:0,talk:0,jump:.5,err:0,energy:1},
 EXCITED:{yaw:.2,pitch:-.1,roll:0,eye:1.2,happy:1,bob:.03,aL:-1.3,aR:-1.3,eL:-.2,eR:-.2,cam:7.4,ring:2.4,part:2.2,think:0,talk:0,jump:1,err:0,energy:1.4},
 CONFUSED:{yaw:.2,pitch:.02,roll:.3,eye:.8,happy:0,bob:.012,aL:0,aR:-.9,eL:0,eR:-2,cam:7.9,ring:.8,part:.5,think:0,talk:0,jump:0,err:0,energy:.2},
 ERROR:{yaw:0,pitch:.28,roll:-.08,eye:.5,happy:0,bob:.008,aL:.1,aR:.1,eL:0,eR:0,cam:8.2,ring:.3,part:.2,think:0,talk:0,jump:0,err:1,energy:0},
 SLEEPING:{yaw:0,pitch:0,roll:0,eye:0,happy:0,bob:.008,aL:.12,aR:.12,eL:.2,eR:.2,cam:8.4,ring:.12,part:.1,think:0,talk:0,jump:0,err:0,energy:0,sleep:1},
 YAWNING:{yaw:0,pitch:0,roll:0,eye:.12,happy:0,bob:.02,aL:0,aR:0,eL:0,eR:0,cam:8,ring:.4,part:.3,think:0,talk:0,jump:0,err:0,energy:.2,yawn:1},
 COFFEE:{yaw:.3,pitch:0,roll:.05,eye:1,happy:.6,bob:.02,aL:0,aR:0,eL:0,eR:0,cam:7.6,ring:.8,part:.6,think:0,talk:0,jump:0,err:0,energy:.4,cup:1},
 SINGING:{yaw:.2,pitch:-.1,roll:0,eye:1,happy:1,bob:.03,aL:-.5,aR:-.5,eL:-.8,eR:-.8,cam:7.5,ring:1.4,part:1.4,think:0,talk:0,jump:0,err:0,energy:.9,sing:1},
 DANCING:{yaw:.1,pitch:-.05,roll:0,eye:1,happy:1,bob:.04,aL:0,aR:0,eL:-.4,eR:-.4,cam:7.7,ring:2.6,part:2.4,think:0,talk:0,jump:.3,err:0,energy:1.5,dance:1},
 LAUGHING:{yaw:0,pitch:-.18,roll:.05,eye:1,happy:1,bob:.03,aL:-.3,aR:-.3,eL:-.9,eR:-.9,cam:7.6,ring:1.6,part:1.6,think:0,talk:0,jump:.15,err:0,energy:1.2,laugh:1},
 GOODBYE:{yaw:.5,pitch:-.05,roll:.1,eye:1,happy:1,bob:.02,aL:0,aR:-2.4,eL:0,eR:-.4,cam:7,ring:1,part:1,think:0,talk:0,jump:0,err:0,energy:.8,wave:1}
};
var NJT=null;
var NLAB={IDLE:'',THINKING:'THINKING',TALKING:'TALKING',LISTENING:'LISTENING',HAPPY:'HAPPY',EXCITED:'EXCITED',CONFUSED:'CONFUSED',ERROR:'OOPS',GOODBYE:'BYE',SLEEPING:'SLEEPING, ZZZ',YAWNING:'YAWNING',COFFEE:'COFFEE BREAK',SINGING:'SINGING',DANCING:'DANCING',LAUGHING:'LAUGHING'};
function njState(n,hold){
  if(!STATES[n])n='IDLE';NJ.st=n;if(NJT){clearTimeout(NJT);NJT=null}
  if(hold)NJT=setTimeout(function(){njState(NJ.busy?'THINKING':'IDLE')},hold);
  if(NJ.open)njStat();
}

/* ---------- CHAR: procedural 3D ninja (swap-ready) ---------- */
/* HANDLES returned by buildNinja: {root, body, head, eyesArc[2], eyesOpen[2], armL, armR, elbowL, elbowR, tails[], ring, aiRing, parts, glow} */
var W3=null,W3L=null;
var NTHEME={
  light:{navy:0x0a1120,cloth:0x080d16,wrap:0x2c4468,wrapD:0x1c2c45,band:0xffffff,eye:0x0b1018,grip:0x111923,scarf:0x14213a,amb:.32,key:.95,rim:1.25,fill:.5},
  dark:{navy:0xf2f5fb,cloth:0xffffff,wrap:0x7f9fe0,wrapD:0x5d80c6,band:0x0c1424,eye:0xffffff,grip:0xb7c1d4,scarf:0xdde4f1,amb:.5,key:.8,rim:.8,fill:.4}
};
function njTheme(){
  if(!W3)return;var P=NTHEME[document.documentElement.getAttribute('data-theme')==='light'?'light':'dark'],k;
  for(k in P){if(W3.M[k])W3.M[k].color.setHex(P[k])}
  if(W3L){W3L.amb.intensity=P.amb;W3L.key.intensity=P.key;W3L.rim.intensity=P.rim;W3L.fill.intensity=P.fill}
}
function buildNinja(T){
  var M={
   navy:new T.MeshPhysicalMaterial({color:0x0a1120,roughness:.32,metalness:.05,clearcoat:.5,clearcoatRoughness:.3}),
   cloth:new T.MeshStandardMaterial({color:0x080d16,roughness:.75,metalness:.02}),
   wrap:new T.MeshStandardMaterial({color:0x2c4468,roughness:.5,metalness:.2}),
   wrapD:new T.MeshStandardMaterial({color:0x1c2c45,roughness:.55,metalness:.2}),
   band:new T.MeshStandardMaterial({color:0xffffff,roughness:.42,metalness:0,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),
   eye:new T.MeshBasicMaterial({color:0x0b1018}),
   steel:new T.MeshStandardMaterial({color:0xeef2f8,metalness:.15,roughness:.22,emissive:0x2a3342}),
   grip:new T.MeshStandardMaterial({color:0x111923,roughness:.5,metalness:.3}),
   scarf:new T.MeshStandardMaterial({color:0x14213a,roughness:.55,metalness:.1,side:T.DoubleSide})
  };
  function capsule(r,len,mat){var pts=[],i,n=8,a;for(i=0;i<=n;i++){a=-Math.PI/2+(Math.PI/2)*i/n;pts.push(new T.Vector2(Math.cos(a)*r,-len/2+Math.sin(a)*r))}for(i=0;i<=n;i++){a=(Math.PI/2)*i/n;pts.push(new T.Vector2(Math.cos(a)*r,len/2+Math.sin(a)*r))}return new T.Mesh(new T.LatheGeometry(pts,22),mat)}
  function ring(r,tube,mat,y,rx){var m=new T.Mesh(new T.TorusGeometry(r,tube,10,40),mat);m.position.y=y;m.rotation.x=rx==null?Math.PI/2:rx;return m}
  var root=new T.Group(),body=new T.Group();root.add(body);
  /* torso, belt, sash */
  var torso=capsule(.46,.5,M.cloth);torso.position.y=1.0;torso.scale.set(1.08,1,.9);body.add(torso);
  var belt=ring(.5,.075,M.wrapD,.86);belt.scale.set(1.08,.9,1);body.add(belt);
  var knot=new T.Mesh(new T.BoxGeometry(.2,.16,.1),M.wrap);knot.position.set(0,.86,.5);body.add(knot);
  var t1=new T.Mesh(new T.BoxGeometry(.11,.4,.03),M.wrap);t1.position.set(-.08,.6,.52);t1.rotation.z=.12;body.add(t1);
  var t2=new T.Mesh(new T.BoxGeometry(.11,.34,.03),M.wrapD);t2.position.set(.1,.62,.52);t2.rotation.z=-.15;body.add(t2);
  var sash=new T.Mesh(new T.BoxGeometry(.13,.95,.03),M.wrapD);sash.position.set(0,1.15,.43);sash.rotation.z=.62;body.add(sash);
  /* legs */
  var s,legs=[];
  for(s=-1;s<=1;s+=2){
    var lg=capsule(.2,.36,M.cloth);lg.position.set(s*.25,.42,0);body.add(lg);
    var wr=ring(.21,.05,M.wrap,.3);wr.position.x=s*.25;body.add(wr);
    var bt=new T.Mesh(new T.SphereGeometry(.26,18,14),M.navy);bt.scale.set(1,.58,1.35);bt.position.set(s*.26,.1,.08);body.add(bt);
  }
  /* arms with katana */
  function arm(side){
    var sh=new T.Group();sh.position.set(side*.6,1.32,0);body.add(sh);
    var up=capsule(.16,.34,M.cloth);up.position.y=-.3;sh.add(up);
    var w1=ring(.17,.04,M.wrap,-.2);sh.add(w1);
    var el=new T.Group();el.position.y=-.58;sh.add(el);
    var fo=capsule(.15,.3,M.cloth);fo.position.y=-.28;el.add(fo);
    var w2=ring(.16,.045,M.wrap,-.42);el.add(w2);
    var hand=new T.Mesh(new T.SphereGeometry(.18,18,14),M.grip);hand.position.y=-.62;el.add(hand);
    var kat=new T.Group();kat.position.y=-.62;kat.rotation.x=.55;kat.rotation.z=-side*2.15;el.add(kat);
    var hd=new T.Mesh(new T.CylinderGeometry(.045,.045,.34,10),M.grip);hd.position.y=-.02;kat.add(hd);
    var tg=new T.Mesh(new T.CylinderGeometry(.11,.11,.025,16),M.steel);tg.position.y=.17;kat.add(tg);
    var bl=new T.Mesh(new T.BoxGeometry(.11,.9,.02),M.steel);bl.position.y=.65;kat.add(bl);
    var tip=new T.Mesh(new T.ConeGeometry(.055,.16,4),M.steel);tip.position.y=1.18;tip.scale.z=.24;tip.rotation.y=Math.PI/4;kat.add(tip);
    return {sh:sh,el:el,kat:kat};
  }
  var aL=arm(-1),aR=arm(1);aL.sh.rotation.z=-.42;aR.sh.rotation.z=.42;aL.el.rotation.x=-.5;aR.el.rotation.x=-.5;
  /* coffee mug (shown only while having coffee) */
  var mug=new T.Group();mug.scale.set(1.5,1.5,1.5);mug.position.set(0,-.7,.04);mug.visible=false;
  var cupM=new T.MeshStandardMaterial({color:0xe8643c,roughness:.45}),cof=new T.Mesh(new T.CircleGeometry(.125,18),new T.MeshBasicMaterial({color:0x3a1e0c}));
  var cupB=new T.Mesh(new T.CylinderGeometry(.14,.11,.24,18),cupM);cupB.position.y=.06;mug.add(cupB);
  cof.rotation.x=-Math.PI/2;cof.position.y=.185;mug.add(cof);
  var hdl=new T.Mesh(new T.TorusGeometry(.07,.022,8,14,Math.PI),cupM);hdl.position.set(.15,.06,0);hdl.rotation.z=-Math.PI/2;mug.add(hdl);
  var steam=[],sm=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,depthWrite:false});
  for(s=0;s<3;s++){var sp=new T.Mesh(new T.SphereGeometry(.035,8,6),sm.clone());mug.add(sp);steam.push(sp)}
  aR.el.add(mug);
  /* head */
  var head=new T.Group();head.position.set(0,1.5,0);body.add(head);
  var skull=new T.Mesh(new T.SphereGeometry(.92,48,34),M.navy);skull.position.y=.52;skull.scale.set(1,.97,.98);head.add(skull);
  function pt(phi,th,r){return new T.Vector3(-r*Math.cos(phi)*Math.sin(th),r*Math.cos(th),r*Math.sin(phi)*Math.sin(th))}
  var band=new T.Mesh(new T.SphereGeometry(.925,40,12,Math.PI/2-1.0,2.0,1.12,.56),M.band);skull.add(band);
  var arcs=[],opens=[],ex;
  for(s=-1;s<=1;s+=2){
    var p=pt(Math.PI/2+s*.46,1.4,.935),eg=new T.Group();eg.position.copy(p);eg.lookAt(p.clone().multiplyScalar(3));skull.add(eg);
    var arc=new T.Mesh(new T.TorusGeometry(.11,.032,8,18,Math.PI),M.eye);arc.position.y=-.03;eg.add(arc);
    var op=new T.Mesh(new T.SphereGeometry(.1,16,12),M.eye);op.scale.set(.9,1.15,.35);eg.add(op);
    arcs.push(arc);opens.push(op);
  }
  var mgp=pt(Math.PI/2,1.9,.955),mg=new T.Group();mg.position.copy(mgp);mg.lookAt(mgp.clone().multiplyScalar(3));skull.add(mg);
  var mouth=new T.Mesh(new T.SphereGeometry(.12,16,12),new T.MeshBasicMaterial({color:0x2a0f1a}));mouth.scale.set(1.2,.02,.3);mouth.visible=false;mg.add(mouth);
  /* headband knot and flowing tails */
  var tails=[];
  var kn=new T.Mesh(new T.SphereGeometry(.13,14,10),M.scarf);kn.position.set(-.55,.62,-.7);head.add(kn);
  function tail(dy,dz,len,wd,rot){
    var g=new T.PlaneGeometry(len,wd,10,2);g.translate(len/2,0,0);
    var m=new T.Mesh(g,M.scarf);m.position.set(-.55,.62+dy,-.7+dz);m.rotation.set(0,rot,.0);head.add(m);
    var base=g.attributes.position.array.slice();tails.push({m:m,base:base,len:len,rot:rot});
  }
  tail(.06,.0,1.15,.3,Math.PI-.5);tail(-.05,-.05,.95,.26,Math.PI-.15);
  /* stage: rings, glow, shadow, particles */
  var stage=new T.Group();root.add(stage);
  var glowMat=new T.MeshBasicMaterial({color:0x4d8dff,transparent:true,opacity:.75});
  var rg=ring(1.35,.014,glowMat,.03);stage.add(rg);
  var rg2=ring(1.7,.008,new T.MeshBasicMaterial({color:0x4d8dff,transparent:true,opacity:.3}),.03);stage.add(rg2);
  function radial(c0,c1){var cv=document.createElement('canvas');cv.width=cv.height=128;var g=cv.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,c0);gr.addColorStop(1,c1);g.fillStyle=gr;g.fillRect(0,0,128,128);return new T.CanvasTexture(cv)}
  var sh=new T.Mesh(new T.PlaneGeometry(2.6,2.6),new T.MeshBasicMaterial({map:radial('rgba(0,0,0,.55)','rgba(0,0,0,0)'),transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.005;stage.add(sh);
  var gl=new T.Mesh(new T.PlaneGeometry(3.6,3.6),new T.MeshBasicMaterial({map:radial('rgba(77,141,255,.45)','rgba(77,141,255,0)'),transparent:true,depthWrite:false,blending:T.AdditiveBlending}));gl.rotation.x=-Math.PI/2;gl.position.y=.01;stage.add(gl);
  var ai=new T.Mesh(new T.TorusGeometry(1.25,.02,8,60),new T.MeshBasicMaterial({color:0x7aa8ff,transparent:true,opacity:0}));ai.position.y=2.1;ai.rotation.x=Math.PI/2;stage.add(ai);
  var N=LOW_?14:30,pg=new T.BufferGeometry(),pa=new Float32Array(N*3),i;
  for(i=0;i<N;i++){pa[i*3]=(Math.random()-.5)*3.2;pa[i*3+1]=Math.random()*3.4;pa[i*3+2]=(Math.random()-.5)*2.2}
  pg.setAttribute('position',new T.BufferAttribute(pa,3));
  var parts=new T.Points(pg,new T.PointsMaterial({color:0x7aa8ff,size:.05,transparent:true,opacity:.7,depthWrite:false}));stage.add(parts);
  function glyph(ch,col){var cv=document.createElement('canvas');cv.width=cv.height=64;var g=cv.getContext('2d');g.font='700 46px Geist,Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=6;g.strokeStyle='rgba(8,16,32,.85)';g.strokeText(ch,32,34);g.fillStyle=col;g.fillText(ch,32,34);return new T.CanvasTexture(cv)}
  function sprites(ch,col,n){var a=[],j;for(j=0;j<n;j++){var m=new T.Sprite(new T.SpriteMaterial({map:glyph(ch[j%ch.length],col),transparent:true,opacity:0,depthWrite:false}));m.scale.set(.4,.4,.4);root.add(m);a.push(m)}return a}
  var zzz=sprites(['Z','z','Z'],'#9fc2ff',3),notes=sprites(['\u266A','\u266B','\u266A','\u266B'],'#ffd166',4);
  return {zzz:zzz,notes:notes,mouth:mouth,mug:mug,steam:steam,M:M,root:root,body:body,head:head,arcs:arcs,opens:opens,aL:aL,aR:aR,tails:tails,ring:rg,ring2:rg2,aiRing:ai,parts:parts,partArr:pa,glowMat:glowMat,glow:gl};
}
var LOW_=((navigator.hardwareConcurrency||4)<=4)||window.innerWidth<820;

/* ---------- 3D scene + loop ---------- */
var njCtl={P:null,mx:0,my:0,near:false,t:0,blink:0,nextBlink:2,nextIdle:4,look:0,lookT:0,tiltT:0,pose:0,last:0,acc:0};
function initP(){var o={},k;for(k in STATES.IDLE){o[k]=STATES.IDLE[k]}o.yawL=0;o.nod=0;o.wave=0;return o}
function lerp(a,b,k){return a+(b-a)*k}
function startScene(T){
  var cv=$('njCv'),R;
  try{R=new T.WebGLRenderer({canvas:cv,alpha:true,antialias:!LOW_,powerPreference:'low-power'})}catch(err){njRoot.className+=' noWebgl';return}
  if(!R||!R.getContext){njRoot.className+=' noWebgl';return}
  R.setClearColor(0x000000,0);
  var scene=new T.Scene(),cam=new T.PerspectiveCamera(30,.8,.1,50);
  var amb=new T.AmbientLight(0x7f93b8,.32);scene.add(amb);
  var key=new T.DirectionalLight(0xffffff,.95);key.position.set(3,5,5);scene.add(key);
  var rim=new T.DirectionalLight(0x3b82f6,1.25);rim.position.set(-4,3,-3);scene.add(rim);
  var fill=new T.PointLight(0x2b4a78,.5,20);fill.position.set(2,.6,3);scene.add(fill);
  try{W3=buildNinja(T)}catch(err){njRoot.className+=' noWebgl';return}
  scene.add(W3.root);W3.root.rotation.y=-.3;W3L={amb:amb,key:key,rim:rim,fill:fill};njTheme();
  try{new MutationObserver(njTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})}catch(err){}
  njCtl.P=initP();
  function size(){var r=$('njStage').getBoundingClientRect(),w=Math.max(80,r.width),h=Math.max(100,r.height);R.setPixelRatio(Math.min(window.devicePixelRatio||1,LOW_?1.5:2));R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
  size();window.addEventListener('resize',size);
  var clock=new T.Clock(),raf=0;
  function frame(){
    raf=requestAnimationFrame(frame);
    if(document.hidden)return;
    var dt=Math.min(clock.getDelta(),.05),C=njCtl,P=C.P,S=STATES[NJ.st],k;
    C.acc+=dt;if(LOW_&&C.acc<1/30){return}dt=C.acc;C.acc=0;
    C.t+=dt;var t=C.t,rate=Math.min(1,dt*5),ex=RM?.4:1;
    for(k in S){if(typeof S[k]==='number'&&typeof P[k]==='number')P[k]=lerp(P[k],S[k],rate)}
    P.nod=lerp(P.nod,S.nod||0,rate);P.wave=lerp(P.wave,S.wave||0,rate);
    var NK=['sleep','yawn','cup','sing','dance','laugh'];for(k=0;k<6;k++){P[NK[k]]=lerp(P[NK[k]]||0,S[NK[k]]||0,rate)}
    var energy=P.energy+(C.near?.6:0);
    /* idle randomness */
    if(t>C.nextBlink){C.blink=1;C.nextBlink=t+2.4+Math.random()*3}
    C.blink=Math.max(0,C.blink-dt*7);
    if(t>C.nextIdle){var r=Math.random();C.nextIdle=t+3+Math.random()*3.5;if(r<.3)C.lookT=-.5;else if(r<.55)C.lookT=.5;else if(r<.8)C.tiltT=.16*(Math.random()<.5?-1:1);else C.pose=1.2;
      setTimeout(function(){C.lookT=0;C.tiltT=0},1100)}
    C.look=lerp(C.look,C.lookT,dt*3);C.tilt=lerp(C.tilt||0,C.tiltT,dt*3);C.pose=Math.max(0,C.pose-dt*.9);
    var follow=S.yaw*ex;
    var yaw=(C.mx*.45)*follow+C.look*(NJ.st==='IDLE'?1:0),pit=C.my*.35*(follow>0?1:0)*.8;
    var W=W3,h=W.head,talk=P.talk*Math.max(0,Math.sin(t*9.5)*.5+Math.sin(t*5.3)*.5);
    h.rotation.y=yaw;h.rotation.x=P.pitch+pit*(NJ.st==='IDLE'?1:.3)+Math.sin(t*(NJ.st==='LISTENING'?5:1.1))*(NJ.st==='LISTENING'?.06:.015)*ex+talk*.07;
    h.rotation.z=P.roll+C.tilt;
    var jump=P.jump*Math.abs(Math.sin(t*(NJ.st==='EXCITED'?8:5.5)))*.16;
    W.body.position.y=Math.sin(t*(1.5+energy*.8))*P.bob*ex+jump;
    W.body.scale.y=1+Math.sin(t*(1.6+energy*.6))*.012*ex;
    W.root.rotation.y=-.3+yaw*.3;
    /* arms */
    var gest=P.talk*ex,wave=P.wave*Math.sin(t*9)*.35;
    W.aR.sh.rotation.x=P.aR+Math.sin(t*3.1)*.28*gest+wave+C.pose*-.5;
    W.aL.sh.rotation.x=P.aL+Math.sin(t*2.4+1)*.22*gest+Math.sin(t*1.3)*.02;
    W.aR.el.rotation.x=-.5+P.eR+Math.sin(t*3.8)*.25*gest;
    W.aL.el.rotation.x=-.5+P.eL+Math.sin(t*2.9)*.18*gest;
    W.aR.sh.rotation.z=.42-(P.aR<-.5?.25:0);
    /* new moods: sleeping, yawning, coffee, singing, dancing, laughing */
    var sl=P.sleep,yw=P.yawn,cp=P.cup,sg=P.sing,dn=P.dance,lf=P.laugh,sk=.5+.5*Math.sin(t*1.1),mo;
    h.rotation.x+=sl*(.5+Math.sin(t*1.2)*.04)-yw*(.38-Math.sin(t*1.3)*.04)-cp*sk*.14;
    h.rotation.z+=sl*.2+sg*Math.sin(t*2.4)*.16+dn*Math.sin(t*6)*.12+lf*Math.sin(t*20)*.03;
    W.body.position.y+=-sl*.1+dn*Math.abs(Math.sin(t*6))*.18+lf*Math.sin(t*22)*.025+sl*Math.sin(t*1.2)*.015;
    W.body.rotation.z=dn*Math.sin(t*3)*.1+sg*Math.sin(t*1.2)*.05;W.body.rotation.x=sl*.16-yw*.07;
    W.body.scale.y+=yw*.05+lf*Math.sin(t*22)*.01;
    W.root.rotation.y+=dn*Math.sin(t*2.2)*.7+sg*Math.sin(t*1.2)*.15;
    W.aR.sh.rotation.x+=dn*(-1.3+Math.sin(t*6)*.9)+sg*(-.3+Math.sin(t*2.4)*.3)-yw*2.5-lf*.2;
    W.aL.sh.rotation.x+=dn*(-1.3-Math.sin(t*6)*.9)+sg*(-.3-Math.sin(t*2.4)*.3)-yw*2.3-lf*.2;
    if(cp>.02){W.aR.sh.rotation.x=lerp(W.aR.sh.rotation.x,-1.3-sk*.2,cp);W.aR.el.rotation.x=lerp(W.aR.el.rotation.x,-1.15-sk*1.1,cp);W.aR.sh.rotation.z=lerp(W.aR.sh.rotation.z,.12,cp)}
    W.aR.kat.visible=cp<.4;W.mug.visible=cp>.4;W.mug.rotation.x=-(W.aR.sh.rotation.x+W.aR.el.rotation.x)+.2;
    for(k=0;k<3;k++){var sv=W.steam[k],ph=(t*.5+k/3)%1;sv.position.set(Math.sin(ph*7+k)*.04,.25+ph*.4,0);sv.material.opacity=cp*.5*Math.sin(Math.PI*ph)}
    mo=Math.max(yw*.9,sg*(.25+.6*Math.abs(Math.sin(t*5.5))),lf*(.3+.6*Math.abs(Math.sin(t*14))),talk*.7);
    W.mouth.visible=mo>.05;W.mouth.scale.y=.02+mo*.75;
    for(k=0;k<3;k++){var zz=W.zzz[k],zp=(t*.3+k/3)%1;zz.position.set(.5+zp*.55,2.5+zp*.9,.2);zz.material.opacity=sl*Math.sin(Math.PI*zp);var zs=.2+zp*.35;zz.scale.set(zs,zs,zs)}
    for(k=0;k<4;k++){var nn=W.notes[k],np=(t*.4+k/4)%1;nn.position.set(Math.sin(np*6+k*1.7)*.8,2.3+np*1.1,.4);nn.material.opacity=Math.max(sg,dn*.7)*Math.sin(Math.PI*np)}
    /* eyes */
    var open=Math.max(.06,P.eye*(1-C.blink)),hp=P.happy>.5&&sl<.5;
    for(k=0;k<2;k++){W.arcs[k].visible=hp;W.opens[k].visible=!hp;W.opens[k].scale.y=1.15*open;W.arcs[k].scale.y=Math.max(.2,1-C.blink*.8)}
    /* scarf */
    for(k=0;k<W.tails.length;k++){var tl=W.tails[k],pos=tl.m.geometry.attributes.position,a=pos.array,j,u,x;
      for(j=0;j<a.length;j+=3){x=tl.base[j];u=x/tl.len;a[j+1]=tl.base[j+1]+Math.sin(t*2.6+u*3.5+k)*.07*u*(1+energy*.5)-u*u*.1;a[j+2]=tl.base[j+2]+Math.sin(t*3.1+u*4.2+k*1.7)*.16*u*(1+energy*.6)}
      pos.needsUpdate=true}
    /* stage */
    W.ring.rotation.z+=dt*P.ring;W.ring2.rotation.z-=dt*P.ring*.5;
    W.aiRing.material.opacity=lerp(W.aiRing.material.opacity,P.think*.8,rate);W.aiRing.rotation.z+=dt*4;W.aiRing.position.y=2.1+Math.sin(t*2)*.08;
    W.glowMat.color.setRGB(lerp(.3,.94,P.err),lerp(.55,.27,P.err),lerp(1,.27,P.err));
    var pa=W.partArr,pi;for(pi=1;pi<pa.length;pi+=3){pa[pi]+=dt*P.part*.35;if(pa[pi]>3.6)pa[pi]=0}W.parts.geometry.attributes.position.needsUpdate=true;
    W.parts.visible=!RM;
    /* camera */
    cam.position.set(Math.sin(t*.3)*.2*ex+C.mx*.25,1.55+Math.sin(t*.4)*.05*ex-C.my*.1,lerp(cam.position.z||8.2,NJ.open&&NJ.st==='IDLE'?7.7:P.cam,dt*2.2));
    cam.lookAt(0,1.4,0);
    R.render(scene,cam);
  }
  frame();
  document.addEventListener('visibilitychange',function(){clock.getDelta()});
  window.addEventListener('pagehide',function(){cancelAnimationFrame(raf);try{R.dispose()}catch(err){}});
}
function loadThree(){
  if(window.THREE){startScene(window.THREE);return}
  var s=document.createElement('script');s.src=THREE_URL;s.async=true;
  s.onload=function(){if(window.THREE)startScene(window.THREE);else njRoot.className+=' noWebgl'};
  s.onerror=function(){njRoot.className+=' noWebgl'};
  document.head.appendChild(s);
}
if('requestIdleCallback' in window)requestIdleCallback(loadThree,{timeout:2500});else setTimeout(loadThree,1200);

/* pointer: ninja notices the cursor */
document.addEventListener('mousemove',function(e){
  var r=$('njStage').getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height*.35,dx=e.clientX-cx,dy=e.clientY-cy,d=Math.sqrt(dx*dx+dy*dy);
  njCtl.mx=Math.max(-1,Math.min(1,dx/500));njCtl.my=Math.max(-1,Math.min(1,dy/500));njCtl.near=d<260;
});
document.addEventListener('mouseleave',function(){njCtl.mx=0;njCtl.my=0;njCtl.near=false});
