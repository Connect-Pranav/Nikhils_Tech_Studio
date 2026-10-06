/* ---------- sound effects (synthesised, no files, no cost) ---------- */
var SFX={on:true,c:null};try{SFX.on=localStorage.getItem('nts_sfx')!=='0'}catch(err){}
function sfxC(){if(!SFX.c){try{var A=window.AudioContext||window.webkitAudioContext;if(A)SFX.c=new A()}catch(err){}}if(SFX.c&&SFX.c.state==='suspended'){try{SFX.c.resume()}catch(err){}}return SFX.c}
function sTone(type,f0,f1,dur,vol,at,vr,vd,fm,tm){
  var c=sfxC();if(!c)return;try{var t0=c.currentTime+(at||0),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f0,t0);
  if(fm)o.frequency.exponentialRampToValueAtTime(fm,t0+dur*(tm||.3));o.frequency.exponentialRampToValueAtTime(f1,t0+dur);
  g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(vol||.2,t0+.015);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
  if(vr){var l=c.createOscillator(),lg=c.createGain();l.frequency.value=vr;lg.gain.value=vd||20;l.connect(lg);lg.connect(o.frequency);l.start(t0);l.stop(t0+dur+.05)}
  o.connect(g);g.connect(c.destination);o.start(t0);o.stop(t0+dur+.05)}catch(err){}
}
function sNoise(dur,vol,at,f0,f1,q){
  var c=sfxC();if(!c)return;try{var t0=c.currentTime+(at||0),n=Math.max(1,Math.floor(c.sampleRate*dur)),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0),i;for(i=0;i<n;i++)d[i]=Math.random()*2-1;
  var s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;f.type='bandpass';f.Q.value=q||1;f.frequency.setValueAtTime(f0,t0);f.frequency.exponentialRampToValueAtTime(f1,t0+dur);
  g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+dur*.25);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);s.connect(f);f.connect(g);g.connect(c.destination);s.start(t0);s.stop(t0+dur+.02)}catch(err){}
}
function sfx(n){
  if(!SFX.on)return;var i;
  switch(n){
    case 'boing':sTone('sine',150,100,.6,.4,0,24,45,640,.12);sTone('triangle',300,200,.5,.15,0,24,60,1000,.12);break;
    case 'squeak':sTone('square',1500,2700,.07,.07);sTone('square',2500,1700,.1,.07,.08);break;
    case 'whistle':sTone('sine',380,1900,.5,.22,0,9,35);break;
    case 'bonk':sTone('sine',330,70,.18,.45);sNoise(.04,.25,0,2200,800,1);break;
    case 'kazoo':sTone('sawtooth',230,205,.28,.1,0,30,8);sTone('sawtooth',310,270,.32,.1,.3,30,8);break;
    case 'raspberry':sTone('sawtooth',115,52,.5,.2,0,38,20);break;
    case 'pop':sTone('sine',900,220,.08,.3);break;
    case 'blip':sTone('sine',880,1180,.06,.07);break;
    case 'send':sTone('sine',520,780,.07,.09);break;
    case 'yawn':sNoise(1.5,.14,0,720,260,1.2);sTone('sawtooth',220,120,1.5,.05,0,5,6,330,.35);break;
    case 'snore':for(i=0;i<2;i++){sNoise(.55,.2,i*1.2,200,90,.8);sTone('sawtooth',70,55,.5,.06,i*1.2)}break;
    case 'sip':sNoise(.7,.12,0,1900,700,3);sTone('sine',720,300,.5,.04);break;
    case 'ding':sTone('sine',1320,1320,.55,.12);sTone('sine',1980,1980,.4,.05);break;
    case 'laugh':for(i=0;i<4;i++){sTone('sawtooth',330-i*20,270-i*20,.12,.13,i*.17)}break;
    case 'sing':var ns=[523,659,784,659,880,784,659,523];for(i=0;i<ns.length;i++){sTone('triangle',ns[i],ns[i],.24,.16,i*.27,6,7)}break;
    case 'wake':sTone('square',900,1500,.08,.07);sTone('square',1200,1800,.1,.07,.1);break;
  }
}
var POKES=[['boing','EXCITED'],['squeak','HAPPY'],['whistle','DANCING'],['bonk','CONFUSED'],['kazoo','SINGING'],['raspberry','LAUGHING'],['pop','HAPPY'],['boing','EXCITED']];
function njPoke(){
  var now=Date.now(),pk;NJ.pokes=(NJ.pokes||[]).filter(function(x){return now-x<2400});NJ.pokes.push(now);NJ.sleepLock=false;
  pk=NJ.pokes.length>=4?['raspberry','LAUGHING']:POKES[Math.floor(Math.random()*POKES.length)];
  sfx(pk[0]);if(NJ.busy)return;njState(pk[1],pk[1]==='SINGING'||pk[1]==='DANCING'?3200:1500);
}
