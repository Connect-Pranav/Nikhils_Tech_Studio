/* Mobile navigation drawer, accordion, scroll lock, keyboard handling. Loaded after events.js and inventory.js. */
var DRW={open:false,last:null};
function drawerOpen(){
  var s=$('side');if(!s||DRW.open)return;
  DRW.open=true;DRW.last=document.activeElement;
  s.className=s.className.replace(/\s*\bdopen\b/,'')+' dopen';
  $('scrim').className='scrim on';document.body.className+=' lock';
  $('mMenu').setAttribute('aria-expanded','true');
  setTimeout(function(){var c=$('dClose');if(c)c.focus()},60);
}
function drawerClose(back){
  var s=$('side');if(!s||!DRW.open)return;
  DRW.open=false;
  s.className=s.className.replace(/\s*\bdopen\b/g,'');
  $('scrim').className='scrim';document.body.className=document.body.className.replace(/\s*\block\b/g,'');
  $('mMenu').setAttribute('aria-expanded','false');
  if(back!==false&&DRW.last&&DRW.last.focus){try{DRW.last.focus()}catch(e){}}
}
function isMobile(){return window.innerWidth<=820}
document.addEventListener('click',function(e){
  var t=e.target;if(!t||!t.closest)return;
  if(t.closest('#mMenu')){drawerOpen();return}
  if(t.closest('#dClose')||t===$('scrim')){drawerClose();return}
  var bm=t.closest('[data-p="more"]');if(bm){$('sheet').className='sheet';drawerOpen();return}
  if(t.closest('#mSrch')){if($('kBtn'))$('kBtn').click();return}
  if(t.closest('#mTheme')){if($('thBtn'))$('thBtn').click();return}
  var dg=t.closest('[data-dg]');
  if(dg){var i=+dg.getAttribute('data-dg'),sub=dg.nextElementSibling,o=!(sub&&sub.className.indexOf('open')>-1);
    state.dopen=state.dopen||{};state.dopen[i]=o;dg.setAttribute('aria-expanded',o?'true':'false');
    if(sub)sub.className='dsub'+(o?' open':'');return}
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&DRW.open){drawerClose();return}
  if(e.key==='Tab'&&DRW.open){
    var f=$('side').querySelectorAll('button,[href],input,select,textarea'),vis=[],i;
    for(i=0;i<f.length;i++){if(f[i].offsetParent!==null)vis.push(f[i])}
    if(!vis.length)return;
    var a=vis[0],z=vis[vis.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
    else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
  }
});
window.addEventListener('resize',function(){if(DRW.open&&!isMobile())drawerClose(false)});
/* keep the focused field visible above the on-screen keyboard */
document.addEventListener('focusin',function(e){
  var t=e.target;if(!isMobile()||!t||!/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName))return;
  setTimeout(function(){try{t.scrollIntoView({block:'center',behavior:'smooth'})}catch(err){t.scrollIntoView()}},320);
});
/* close the drawer after any navigation choice (capture phase: the clicked node is replaced when the view re-renders) */
document.addEventListener('click',function(e){
  var t=e.target;if(!DRW.open||!t||!t.closest)return;
  if(t.closest('#side')&&t.closest('[data-p],[data-iv],#kBtn,#fvBtn,[data-who]')&&!t.closest('[data-p="more"]'))setTimeout(function(){drawerClose(false)},0);
},true);
