/* Welcome splash: shows once per browser session, then fades into the app. Tap, click or any key skips it. */
(function(){
  var el=document.getElementById('splash');if(!el)return;
  var shown=false;try{shown=sessionStorage.getItem('nts_splash')==='1'}catch(e){}
  if(shown){el.parentNode.removeChild(el);return}
  var rm=false;try{rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
  var who='',h=new Date().getHours(),g=h<5?'Welcome':h<12?'Good morning':h<17?'Good afternoon':h<22?'Good evening':'Welcome';
  try{var c=JSON.parse(localStorage.getItem('nts_rq_cfg')||'null');if(c&&c.who)who=String(c.who)}catch(e){}
  try{var lg=localStorage.getItem('nts_logo');if(lg&&/^(data:image\/|https?:\/\/|[\w.\/-]+$)/.test(lg))document.getElementById('spImg').src=lg}catch(e){}
  var w=document.getElementById('spW');w.textContent=who?'Welcome, '+who:'Welcome to the studio';
  el.hidden=false;document.documentElement.style.overflow='hidden';
  var done=false;
  function end(){
    if(done)return;done=true;try{sessionStorage.setItem('nts_splash','1')}catch(e){}
    el.className='out';document.documentElement.style.overflow='';
    setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el)},800);
    document.removeEventListener('keydown',end);
  }
  el.addEventListener('click',end);document.addEventListener('keydown',end);
  setTimeout(end,rm?900:3000);
})();
