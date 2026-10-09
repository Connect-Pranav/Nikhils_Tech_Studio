/* ---------- Notification centre: bell + red dot (from synced data), panel, Dal Abba "A message for you!" ---------- */
var NT={open:false,filter:'all',bubble:null,bubTimer:null,focusBack:null};
var NT_FILTERS=[['all','All'],['unread','Unread'],['assigned','Assigned to me'],['mine','Raised by me'],['comments','Comments & mentions'],['status','Status changes'],['approvals','Approvals'],['due','Due reminders'],['cost','Cost changes'],['actions','This device']];
var NT_ICON={assigned:'user',raised:'paper-plane-tilt',approval:'check-square',status:'arrows-clockwise',comment:'chat',mention:'chat-circle',cost:'currency-inr',due:'clock'};
var NT_LABEL={assigned:'Assigned',raised:'New request',approval:'Approval',status:'Status',comment:'Comment',mention:'Mention',cost:'Cost',due:'Due'};

function ntSeen(){var o=rqLs('nts_rq_seen')||{};return o[RQ.cfg.who]||[]}
function ntSeenAdd(ids){var o=rqLs('nts_rq_seen')||{},a=o[RQ.cfg.who]||[],i;for(i=0;i<ids.length;i++){if(a.indexOf(ids[i])<0)a.push(ids[i])}o[RQ.cfg.who]=a.slice(-500);rqLs('nts_rq_seen',o)}
/* the red dot and count are derived from the synced notification list, never from component state */
function ntBadge(){
  var n=rqReady()?rqUnread().length:0,ids=['bellH','mBell','nBtn'],i,b,d,c;
  for(i=0;i<ids.length;i++){b=$(ids[i]);if(!b)continue;d=b.querySelector('.bd,.bdot2');c=b.querySelector('.bcnt');
    if(d){d.style.display=n?'block':'none'}
    if(c){c.textContent=n>9?'9+':String(n);c.style.display=n?'grid':'none'}
    b.setAttribute('aria-label','Notifications'+(n?', '+n+' unread':''))}
  var tt=document.title.replace(/^\(\d+\)\s*/,'');document.title=(n?'('+n+') ':'')+tt;
}
function ntMatch(x,f){
  var r;
  if(f==='all')return true;if(f==='unread')return !x.readAt&&!RQ.localRead[x.id];
  if(f==='assigned')return x.type==='assigned';
  if(f==='mine'){r=rqFind(x.reqId);return !!r&&r.raisedBy===RQ.cfg.who}
  if(f==='comments')return x.type==='comment'||x.type==='mention';
  if(f==='status')return x.type==='status';if(f==='approvals')return x.type==='approval';
  if(f==='due')return x.type==='due';if(f==='cost')return x.type==='cost';return true;
}
function ntItem(x){
  var un=!x.readAt&&!RQ.localRead[x.id],st=x.status?rqStChip(x.status):'';
  return '<button class="nti'+(un?' un':'')+'" data-nt="'+esc(x.id)+'" data-ntr="'+esc(x.reqId)+'"><span class="nti-i">'+ico(NT_ICON[x.type]||'bell')+'</span><span class="nti-b"><span class="nti-t"><b>'+esc(x.actor)+'</b> '+esc(x.text)+'</span><span class="nti-r"><span class="mono">'+esc(x.reqId)+'</span> · '+esc(x.title)+'</span><span class="nti-m"><span class="tg mt">'+esc(NT_LABEL[x.type]||x.type)+'</span>'+st+(x.estCost!==null&&x.estCost!==undefined?'<span class="tg mt">Est. '+rqInr(x.estCost)+'</span>':'')+'<span class="mu sm" title="'+esc(x.ts)+'">'+rqWhen(x.ts)+' · for '+esc(x.recipient)+'</span></span></span>'+(un?'<span class="nti-d" aria-label="Unread"></span>':'')+'</button>';
}
function ntRender(){
  var p=$('ntp');if(!p)return;
  var i,h='',l=[],f=NT.filter,u=rqUnread().length;
  if(f==='actions'){for(i=0;i<RQ.acts.length;i++){h+='<div class="nti act"><span class="nti-i">'+ico(RQ.acts[i].ok?'check-square':'info')+'</span><span class="nti-b"><span class="nti-t">'+esc(RQ.acts[i].text)+'</span><span class="nti-m"><span class="tg '+(RQ.acts[i].ok?'ok':'bad')+'">'+(RQ.acts[i].ok?'Completed':'Failed')+'</span><span class="mu sm">'+rqWhen(RQ.acts[i].ts)+'</span></span></span></div>'}if(!h)h='<div class="empty" style="padding:24px 16px">Nothing has been saved or failed on this device in this session.</div>'}
  else{for(i=0;i<RQ.nts.length;i++){if(ntMatch(RQ.nts[i],f))l.push(RQ.nts[i])}
    for(i=0;i<l.length;i++)h+=ntItem(l[i]);
    if(!h)h='<div class="empty" style="padding:24px 16px">'+(!rqReady()?'Connect this device to receive notifications.':f==='unread'?'You are all caught up.':'No notifications here yet.')+'</div>'}
  var chips='';for(i=0;i<NT_FILTERS.length;i++){chips+='<button class="tb'+(f===NT_FILTERS[i][0]?' on':'')+'" data-ntf="'+NT_FILTERS[i][0]+'">'+NT_FILTERS[i][1]+(NT_FILTERS[i][0]==='unread'&&u?' '+u:'')+'</button>'}
  p.innerHTML='<div class="ntp-h"><b>Notifications</b><span class="mu sm">'+(rqReady()?'for '+esc(RQ.cfg.who):'')+'</span><span class="sp"></span><button class="btn sm g" data-ntall'+(u?'':' disabled')+'>Mark all read</button><button class="nj-ib" data-ntx aria-label="Close notifications">'+ico('x')+'</button></div><div class="ntp-f" role="toolbar" aria-label="Filter notifications">'+chips+'</div><div class="ntp-l" role="list">'+h+'</div><div class="ntp-s mu sm" id="ntSync">'+esc(rqSyncText())+'</div>';
}
function ntEnsure(){
  if($('ntp'))return;
  var p=document.createElement('div');p.id='ntp';p.setAttribute('role','dialog');p.setAttribute('aria-label','Notifications');p.hidden=true;document.body.appendChild(p);
}
function ntOpen(filter){
  ntEnsure();NT.focusBack=document.activeElement;NT.open=true;if(filter)NT.filter=filter;ntRender();$('ntp').hidden=false;ntHideBubble();
  var bs=['bellH','mBell'],i;for(i=0;i<bs.length;i++){if($(bs[i]))$(bs[i]).setAttribute('aria-expanded','true')}
  var c=$('ntp').querySelector('[data-ntx]');if(c)c.focus();if(rqReady())rqSync();
}
function ntClose(back){
  if(!NT.open)return;NT.open=false;$('ntp').hidden=true;
  var bs=['bellH','mBell'],i;for(i=0;i<bs.length;i++){if($(bs[i]))$(bs[i]).setAttribute('aria-expanded','false')}
  if(back!==false&&NT.focusBack&&NT.focusBack.focus){try{NT.focusBack.focus()}catch(e){}}
}
function ntToggle(){if(NT.open)ntClose();else ntOpen()}
function ntGoto(id,reqId){
  if(id&&RQ.nts.length){var i,un=false;for(i=0;i<RQ.nts.length;i++){if(RQ.nts[i].id===id&&!RQ.nts[i].readAt&&!RQ.localRead[id])un=true}if(un)rqQueueRead([id],false)}
  ntClose(false);ntHideBubble();
  var show=function(){if(!rqOpen(reqId)){/* toast already shown */}};
  if(state.page!=='requests')go('requests');
  if(rqFind(reqId))setTimeout(show,60);else rqSync().then(function(){setTimeout(show,60)});
}

/* ---- Dal Abba ---- */
function ntAnchor(){var e=$('njStage'),f=$('njFlat'),r;if(e&&e.offsetWidth){r=e.getBoundingClientRect();r={top:r.top,right:r.right,gap:-10}}else if(f&&f.offsetWidth){r=f.getBoundingClientRect();r={top:r.top,right:r.right,gap:12}}return r||null}
function ntPlace(){
  var b=$('ntBub');if(!b||b.hidden)return;var r=ntAnchor();
  var right=r?Math.max(10,window.innerWidth-r.right+8):14,bottom=r?Math.max(10,window.innerHeight-r.top+r.gap):210;
  b.style.right=right+'px';b.style.bottom=bottom+'px';
}
function ntShowBubble(list){
  var b=$('ntBub');
  if(!b){b=document.createElement('div');b.id='ntBub';b.setAttribute('role','status');b.setAttribute('aria-live','polite');b.hidden=true;document.body.appendChild(b)}
  NT.bubble=list;
  b.innerHTML='<button class="ntb-m" data-ntbub>A message for you!'+(list.length>1?'<span class="ntb-c">'+list.length+' new</span>':'')+'</button><button class="ntb-x" data-ntbx aria-label="Dismiss message">'+ico('x')+'</button>';
  b.hidden=false;ntPlace();
  b.className='';void b.offsetWidth;b.className=RM?'in':'in pop';
  clearTimeout(NT.bubTimer);NT.bubTimer=setTimeout(ntHideBubble,11000);
  /* gentle bounce, twice only; skipped for reduced motion */
  var nj=$('nj');
  if(nj&&!RM){nj.classList.remove('nt-bounce');void nj.offsetWidth;nj.classList.add('nt-bounce');setTimeout(function(){nj.classList.remove('nt-bounce')},2000)}
  try{if(typeof NJ!=='undefined'&&!NJ.busy&&!NJ.open&&typeof njState==='function'){njState('EXCITED',1500)}if(typeof sfx==='function')sfx('boing')}catch(e){}
}
function ntHideBubble(){var b=$('ntBub');clearTimeout(NT.bubTimer);if(b){b.hidden=true;b.className=''}NT.bubble=null}
/* each notification is announced once per device; a refresh never repeats it */
function ntAnnounce(){
  if(RQ.state!=='ok'||!rqReady()||document.hidden||NT.open)return;
  if($('mov')&&$('mov').className.indexOf('on')>-1)return;
  if(typeof NJ!=='undefined'&&NJ.open)return;
  var seen=ntSeen(),un=rqUnread(),fresh=[],i;
  for(i=0;i<un.length;i++){if(seen.indexOf(un[i].id)<0)fresh.push(un[i])}
  if(!fresh.length)return;
  var ids=[];for(i=0;i<fresh.length;i++)ids.push(fresh[i].id);
  ntSeenAdd(ids);ntShowBubble(fresh);
}
function ntBubbleOpen(){
  var l=NT.bubble||[];ntHideBubble();
  if(l.length===1)ntGoto(l[0].id,l[0].reqId);else ntOpen('unread');
}

document.addEventListener('click',function(e){
  var t=e.target;if(!t||!t.closest)return;
  if(NT.bubble&&t.closest('#njStage,#njFlat,#nj .nj-hit')){e.preventDefault();e.stopPropagation();ntBubbleOpen();return}
},true);
document.addEventListener('click',function(e){
  var t=e.target,n;if(!t||!t.closest)return;
  if(t.closest('#bellH,#mBell,#nBtn')){e.stopPropagation();ntToggle();return}
  if(t.closest('[data-ntbub]')){ntBubbleOpen();return}
  if(t.closest('[data-ntbx]')){ntHideBubble();return}
  if(t.closest('[data-ntx]')){ntClose();return}
  if(t.closest('[data-ntall]')){rqQueueRead([],true);ntRender();return}
  n=t.closest('[data-ntf]');if(n){NT.filter=n.getAttribute('data-ntf');ntRender();return}
  n=t.closest('[data-nt]');if(n){ntGoto(n.getAttribute('data-nt'),n.getAttribute('data-ntr'));return}
  if(NT.open&&!t.closest('#ntp'))ntClose(false);
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(NT.open){ntClose();e.stopPropagation()}else if(NT.bubble)ntHideBubble()}});
window.addEventListener('resize',ntPlace);
rqOn(function(){ntBadge();if(NT.open){var l=$('ntp').querySelector('.ntp-l'),y=l?l.scrollTop:0;ntRender();l=$('ntp').querySelector('.ntp-l');if(l)l.scrollTop=y}ntAnnounce()});
ntBadge();
setTimeout(rqStart,0);
