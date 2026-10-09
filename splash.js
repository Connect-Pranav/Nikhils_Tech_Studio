/* Welcome splash: shows once per browser session, then fades into the app. Tap, click or any key skips it. */
(function(){
  var el=document.getElementById('splash');if(!el)return;
  var shown=false;try{shown=sessionStorage.getItem('nts_splash')==='1'}catch(e){}
  if(shown){el.parentNode.removeChild(el);return}
  var rm=false;try{rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
  var who='',h=new Date().getHours(),g=h<5?'Welcome':h<12?'Good morning':h<17?'Good afternoon':h<22?'Good evening':'Welcome';
  try{var c=JSON.parse(localStorage.getItem('nts_rq_cfg')||'null');if(c&&c.who)who=String(c.who)}catch(e){}
  try{var lg=localStorage.getItem('nts_logo');if(lg&&/^(data:image\/|https?:\/\/|[\w.\/-]+$)/.test(lg))document.getElementById('spImg').src=lg}catch(e){}
  var w=document.getElementById('spW'),em=document.createElement('em');w.textContent='';
  if(who){w.appendChild(document.createTextNode('Welcome,'));w.appendChild(document.createElement('br'));em.textContent=who}else{w.appendChild(document.createTextNode('Welcome to'));w.appendChild(document.createElement('br'));em.textContent='the studio'}
  w.appendChild(em);
  var bg=document.getElementById('spBg'),k,f;if(!rm){for(k=0;k<14;k++){f=document.createElement('span');f.className='sp-ff';f.style.left=(6+Math.random()*88)+'%';f.style.bottom=(4+Math.random()*34)+'%';f.style.animationDelay=(Math.random()*8).toFixed(2)+'s';f.style.animationDuration=(7+Math.random()*6).toFixed(1)+'s';bg.appendChild(f)}}
  el.hidden=false;document.documentElement.style.overflow='hidden';
  var done=false;
  function end(){
    if(done)return;done=true;try{sessionStorage.setItem('nts_splash','1')}catch(e){}
    el.className='out';document.documentElement.style.overflow='';if(after){var fn=after;setTimeout(function(){try{fn()}catch(e){}},350)}
    setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el)},800);
    document.removeEventListener('keydown',end);
  }
  var after=null;
  function go2(fn){after=fn;end()}
  var q=el.querySelectorAll('[data-spgo]'),n;
  for(n=0;n<q.length;n++){(function(b){b.addEventListener('click',function(e){e.stopPropagation();var pg=b.getAttribute('data-spgo');go2(function(){if(typeof go==='function')go(pg)})})})(q[n])}
  var g2=document.getElementById('spGo2');if(g2)g2.addEventListener('click',function(e){e.stopPropagation();end()});
  var gc=document.getElementById('spCn');if(gc)gc.addEventListener('click',function(e){e.stopPropagation();go2(function(){if(typeof rqConnectModal==='function')rqConnectModal()})});
  el.addEventListener('click',end);document.addEventListener('keydown',end);
  setTimeout(end,rm?900:4400);
})();
