var NJ={st:'IDLE',busy:false,open:false,voice:false,hist:[],ctl:null,rec:null,speaking:false,mood:null};
var THREE_URL='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
var njRoot=document.createElement('div');njRoot.id='nj';
njRoot.innerHTML='<div class="nj-panel" id="njPanel" role="dialog" aria-label="Dal_Abba chat" aria-modal="false">'+
 '<div class="nj-h"><img id="njLogo" alt=""><div><b>Dal_Abba</b><span class="sub"><i class="off" id="njDot"></i><span id="njSt">DAL_ABBA</span></span></div><span class="sp"></span>'+
 '<button class="nj-ib" id="njSpk" aria-label="Turn voice replies on" aria-pressed="false" title="Voice replies"><i class="ph ph-speaker-slash" id="njSpkI" aria-hidden="true"></i></button>'+
 '<button class="nj-ib'+(SFX.on?' on':' off')+'" id="njSfx" aria-label="Toggle sound effects" aria-pressed="'+SFX.on+'" title="Sound effects"><i class="ph ph-music-notes" aria-hidden="true"></i></button>'+
 '<button class="nj-ib" id="njClr" aria-label="Clear conversation" title="Clear"><i class="ph ph-trash" aria-hidden="true"></i></button>'+
 '<button class="nj-ib" id="njX" aria-label="Close chat" title="Close"><i class="ph ph-x" aria-hidden="true"></i></button></div>'+
 '<div class="nj-msgs" id="njMsgs" role="log" aria-live="polite"></div><div class="nj-sug" id="njSug"></div>'+
 '<div class="nj-f"><button class="nj-ib" id="njMic" aria-label="Speak to the Ninja" title="Speak"><i class="ph ph-microphone" aria-hidden="true"></i></button><textarea id="njIn" rows="1" placeholder="Ask me anything..." aria-label="Message" maxlength="1500"></textarea><button class="nj-ib go" id="njGo" aria-label="Send message" title="Send"><i class="ph ph-paper-plane-tilt" id="njGoI" aria-hidden="true"></i></button></div></div>'+
 '<div class="nj-stage" id="njStage" role="button" tabindex="0" aria-label="Open Dal_Abba assistant"><span class="nj-tip">Ask Dal_Abba</span><span class="nj-hit"></span><canvas id="njCv" aria-hidden="true"></canvas></div>'+
 '<button class="nj-flat" id="njFlat" aria-label="Open Dal_Abba assistant"><img id="njLogo2" alt="">Ask Dal_Abba</button>';
document.body.appendChild(njRoot);
function njSetLogo(){var s=$('logoImg').src;$('njLogo').src=s;$('njLogo2').src=s}
setTimeout(njSetLogo,300);
/* idle life: yawns, naps, coffee, singing */
var njLastAct=Date.now(),njAuto=Date.now()+18000;
function njTouch(){if(NJ.sleepLock)return;njLastAct=Date.now();if(NJ.st==='SLEEPING'){njState('EXCITED',1000);sfx('wake')}}
(function(){var ev=['mousemove','mousedown','keydown','touchstart','scroll'],i;for(i=0;i<ev.length;i++)document.addEventListener(ev[i],njTouch,{passive:true})})();
setInterval(function(){
  if(RM||document.hidden||NJ.busy||NJ.open||NJ.st!=='IDLE')return;var now=Date.now();
  if(now-njLastAct>80000){njState('YAWNING',2500);setTimeout(function(){if(NJ.st==='IDLE'&&Date.now()-njLastAct>80000)njState('SLEEPING')},2600);return}
  if(now>njAuto){njAuto=now+16000+Math.random()*20000;var a=['YAWNING','COFFEE','SINGING','DANCING','LAUGHING','COFFEE'][Math.floor(Math.random()*6)];njState(a,a==='COFFEE'?9000:a==='YAWNING'?2600:5200)}
},2000);
