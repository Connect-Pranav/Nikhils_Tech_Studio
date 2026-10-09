/* ---------- shared requests: sync engine (server is the source of truth, localStorage is only a display cache) ---------- */
/* Paste your Apps Script web-app URL here once (it is not a secret) so every device picks it up. The team key is NEVER put in this file. */
var SHARED_BACKEND_URL='';
var RQ={mode:'',cfg:{url:'',key:'',who:'',local:false},reqs:[],act:[],nts:[],last:0,state:'off',err:'',busy:false,fromCache:false,localRead:{},acts:[],out:[],listeners:[]};
var RQ_ST=['RAISED','APPROVED','REJECTED','IN PROGRESS','HOLD','COMPLETED'];
var RQ_CATS=['Equipment','Software','Travel','Marketing','Production','Office','Other'];
var RQ_APPROVER='Nikhil';
function rqLs(k,v){try{if(v===undefined){var s=localStorage.getItem(k);return s?JSON.parse(s):null}localStorage.setItem(k,JSON.stringify(v))}catch(err){}return null}
(function(){var c=rqLs('nts_rq_cfg');if(c){RQ.cfg.url=c.url||'';RQ.cfg.key=c.key||'';RQ.cfg.who=c.who||'';RQ.cfg.local=!!c.local}
  if(!RQ.cfg.url&&SHARED_BACKEND_URL)RQ.cfg.url=SHARED_BACKEND_URL;
  var ch=rqLs('nts_rq_cache');if(ch&&ch.who===RQ.cfg.who){RQ.reqs=ch.reqs||[];RQ.act=ch.act||[];RQ.nts=ch.nts||[];RQ.last=ch.last||0;RQ.fromCache=RQ.reqs.length>0}
  RQ.out=rqLs('nts_rq_out')||[];RQ.state=rqReady()?'loading':'off'})();
function rqShared(){return !!(RQ.cfg.url&&RQ.cfg.key)}
function rqReady(){return !!(RQ.cfg.who&&(RQ.cfg.local||rqShared()))}
function rqSaveCfg(){rqLs('nts_rq_cfg',{url:RQ.cfg.url,key:RQ.cfg.key,who:RQ.cfg.who,local:RQ.cfg.local})}
function rqSaveCache(){rqLs('nts_rq_cache',{who:RQ.cfg.who,reqs:RQ.reqs,act:RQ.act,nts:RQ.nts,last:RQ.last})}
function rqRand(p){var s=p+'-',a='abcdefghijklmnopqrstuvwxyz0123456789',i;try{var u=new Uint8Array(12);(window.crypto||window.msCrypto).getRandomValues(u);for(i=0;i<12;i++)s+=a.charAt(u[i]%36)}catch(err){for(i=0;i<12;i++)s+=a.charAt(Math.floor(Math.random()*36))}return s+Date.now().toString(36)}
function rqInr(n){if(n===null||n===undefined||n==='')return 'Not provided';n=Number(n);if(!isFinite(n))return 'Not provided';return '₹'+n.toLocaleString('en-IN',{maximumFractionDigits:2})}
/* Transport 1: fetch POST (text/plain avoids a CORS preflight). Transport 2 (fallback when the browser blocks cross-site fetch): the same message loaded as a <script> (JSONP). Both carry the same ids, so a retry across transports can never duplicate anything. */
var rqJp=0;
function rqJsonp(o){
  return new Promise(function(resolve,reject){
    var name='__rqcb'+(++rqJp)+'_'+Date.now().toString(36),sc=document.createElement('script'),done=false,tm;
    var url=RQ.cfg.url+(RQ.cfg.url.indexOf('?')>-1?'&':'?')+'cb='+name+'&d='+encodeURIComponent(JSON.stringify(o));
    if(url.length>7500){reject({net:true,msg:'This text is too long to send on this connection. Shorten the description.'});return}
    function fin(){done=true;clearTimeout(tm);try{delete window[name]}catch(e){window[name]=undefined}if(sc.parentNode)sc.parentNode.removeChild(sc)}
    window[name]=function(r){if(done)return;fin();resolve(r)};
    sc.onerror=function(){if(done)return;fin();reject({net:true,msg:'No connection to the server.'})};
    tm=setTimeout(function(){if(done)return;fin();reject({net:true,msg:'The server took too long to answer.'})},25000);
    sc.async=true;sc.src=url;document.head.appendChild(sc);
  });
}
function rqFetch(o){
  return new Promise(function(resolve,reject){
    var done=false,ac=null,tm;
    try{ac=new AbortController()}catch(err){}
    tm=setTimeout(function(){if(done)return;done=true;try{if(ac)ac.abort()}catch(e){}reject({net:true,msg:'The server took too long to answer.'})},25000);
    fetch(RQ.cfg.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(o),signal:ac?ac.signal:undefined}).then(function(r){
      if(!r.ok)throw {net:true,msg:'Server error ('+r.status+').'};
      return r.json().catch(function(){throw {net:true,msg:'The server sent an unreadable answer. Check the web-app deployment.'}});
    }).then(function(j){if(done)return;done=true;clearTimeout(tm);resolve(j)}).catch(function(e){if(done)return;done=true;clearTimeout(tm);reject(e&&e.net?e:{net:true,msg:'No connection to the server.',blocked:true})});
  });
}
function rqCall(action,body){
  var o={action:action,key:RQ.cfg.key,who:RQ.cfg.who},k;
  for(k in body)o[k]=body[k];
  if(RQ.cfg.local&&!rqShared()){var res;try{res=LocalSrv(JSON.parse(JSON.stringify(o)))}catch(e){res={ok:false,error:'Local storage problem: '+e}}return Promise.resolve(res)}
  if(RQ.mode==='jsonp')return rqJsonp(o);
  return rqFetch(o).catch(function(e){
    if(e&&e.blocked){return rqJsonp(o).then(function(r){RQ.mode='jsonp';return r})}
    throw e;
  });
}
function rqErrText(code){
  var m={setup_required:'The backend has no TEAM_KEY yet. Add it in Apps Script > Project Settings > Script properties.',unauthorized:'The team key is wrong. Open Connect and enter it again.',unknown_user:'This name is not on the team list.',forbidden:'You do not have permission for this request.',conflict:'Someone else changed this request first. It has been refreshed, please review and try again.'};
  return m[code]||code||'Something went wrong.';
}
function rqOn(fn){RQ.listeners.push(fn)}
function rqEmit(){var i;for(i=0;i<RQ.listeners.length;i++){try{RQ.listeners[i]()}catch(err){}}}
function rqFind(id){var i;for(i=0;i<RQ.reqs.length;i++){if(RQ.reqs[i].id===id)return RQ.reqs[i]}return null}
function rqUnread(){var i,n=[];for(i=0;i<RQ.nts.length;i++){if(!RQ.nts[i].readAt&&!RQ.localRead[RQ.nts[i].id])n.push(RQ.nts[i])}return n}
function rqLog(ok,text){RQ.acts.unshift({ts:new Date().toISOString(),ok:ok,text:text});RQ.acts=RQ.acts.slice(0,30)}

/* mark-as-read is queued so it survives a dropped connection */
function rqQueueRead(ids,all){var i;for(i=0;i<ids.length;i++)RQ.localRead[ids[i]]=1;if(all){for(i=0;i<RQ.nts.length;i++)RQ.localRead[RQ.nts[i].id]=1}RQ.out.push({k:'read',ids:ids,all:!!all});rqLs('nts_rq_out',RQ.out);rqEmit();rqFlushOut().then(function(){rqSync()})}
function rqFlushOut(){
  if(!rqReady()||!RQ.out.length)return Promise.resolve();
  var job=RQ.out[0];
  return rqCall('nt_read',{ids:job.ids,all:job.all}).then(function(r){
    if(r&&r.ok!==false||(r&&r.error&&r.error!=='unauthorized')){RQ.out.shift();rqLs('nts_rq_out',RQ.out);return rqFlushOut()}
  }).catch(function(){/* stays queued, retried on the next sync */});
}

var rqTimer=null,rqSyncing=false;
function rqSync(opts){
  opts=opts||{};
  if(!rqReady()){RQ.state='off';rqEmit();return Promise.resolve(false)}
  if(rqSyncing)return Promise.resolve(false);
  rqSyncing=true;RQ.busy=true;if(RQ.state!=='ok')RQ.state=RQ.reqs.length?'syncing':'loading';rqEmit();
  return rqFlushOut().then(function(){return rqCall('rq_sync',{})}).then(function(r){
    rqSyncing=false;RQ.busy=false;
    if(!r||!r.ok){RQ.state='error';RQ.err=rqErrText(r&&r.error);rqEmit();return false}
    var old={},i,fresh=[];for(i=0;i<RQ.nts.length;i++)old[RQ.nts[i].id]=1;
    RQ.reqs=r.requests||[];RQ.act=r.activity||[];RQ.nts=r.notifications||[];RQ.last=Date.now();RQ.state='ok';RQ.err='';RQ.fromCache=false;
    for(i=0;i<RQ.nts.length;i++){if(RQ.localRead[RQ.nts[i].id]&&RQ.nts[i].readAt)delete RQ.localRead[RQ.nts[i].id]}
    rqSaveCache();rqEmit();return true;
  }).catch(function(e){rqSyncing=false;RQ.busy=false;RQ.state='error';RQ.err=(e&&e.msg)||'Could not reach the server.';rqEmit();return false});
}
function rqStart(){
  if(rqTimer)clearInterval(rqTimer);
  if(!rqReady()){RQ.state='off';rqEmit();return}
  rqSync();rqTimer=setInterval(function(){if(!document.hidden)rqSync()},15000);
}
document.addEventListener('visibilitychange',function(){if(!document.hidden)rqSync()});
window.addEventListener('focus',function(){rqSync()});
window.addEventListener('online',function(){rqSync()});
window.addEventListener('offline',function(){RQ.state='offline';RQ.err='You are offline. Showing the last saved copy.';rqEmit()});

/* writes: each one carries its own key so a retry can never create a second record */
function rqWrite(action,body){
  return rqCall(action,body).then(function(r){
    if(r&&r.ok){if(r.request){var i,f=false;for(i=0;i<RQ.reqs.length;i++){if(RQ.reqs[i].id===r.request.id){RQ.reqs[i]=r.request;f=true}}if(!f)RQ.reqs.unshift(r.request)}return r}
    if(r&&r.error==='conflict'&&r.request){var j;for(j=0;j<RQ.reqs.length;j++){if(RQ.reqs[j].id===r.request.id)RQ.reqs[j]=r.request}}
    return r||{ok:false,error:'Empty answer'};
  });
}
function rqSyncText(){
  if(RQ.cfg.local&&!rqShared()&&RQ.state==='ok')return 'This device only (not shared)';
  var q=RQ.out.length?' · '+RQ.out.length+' change'+(RQ.out.length>1?'s':'')+' waiting':'';
  if(RQ.state==='off')return 'Not connected';
  if(RQ.state==='loading')return 'Loading requests...';
  if(RQ.state==='syncing')return 'Syncing...';
  if(RQ.state==='offline')return 'Offline · last synced '+rqAgo(RQ.last)+q;
  if(RQ.state==='error')return 'Sync problem · last synced '+(RQ.last?rqAgo(RQ.last):'never')+q;
  return 'Synced '+rqAgo(RQ.last)+q;
}
function rqAgo(t){if(!t)return 'never';var s=Math.round((Date.now()-t)/1000);if(s<10)return 'just now';if(s<60)return s+'s ago';var m=Math.round(s/60);if(m<60)return m+' min ago';return new Date(t).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
setInterval(function(){var e=document.getElementById('rqSyncTxt');if(e)e.textContent=rqSyncText()},5000);
window.addEventListener('storage',function(e){if(e.key==='nts_rq_local'&&RQ.cfg.local)rqSync()});
