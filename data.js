var RM=false;try{RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(err){}
var G=window.gsap||null;
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ico(n){return '<i class="ph ph-'+n+'" aria-hidden="true"></i>'}
function sl(s){s=String(s||'');return s.charAt(0)+s.slice(1).toLowerCase()}

/* ---------- config and data layer ---------- */
/* ===== BACKEND CONFIG: the only place the Apps Script URL lives. Change it here (or via Connect sheet). ===== */
var SHEETS_ON=false; /* Google Sheet sync is paused: everything is stored on this device. Set true and paste the URL below to switch it back on. */
var GOOGLE_SHEETS_API='';
var CFG={SCRIPT_URL:SHEETS_ON?GOOGLE_SHEETS_API:''};try{var _sv=localStorage.getItem('nts_script');if(SHEETS_ON&&!CFG.SCRIPT_URL&&_sv)CFG.SCRIPT_URL=_sv;if(!SHEETS_ON){localStorage.removeItem('nts_script');localStorage.removeItem('nts_q')}}catch(err){} /* paste your Google Apps Script web app URL between the quotes */
var PEOPLE=['Nikhil','Monish','Pranav'];
var ROLES={Nikhil:['Founder and Strategic Head','Strategy'],Monish:['Creative Head','Creative'],Pranav:['Operations and Marketing Lead','Operations and growth']};
var TARGET={n:100,label:'30 Nov 2026',date:new Date(2026,10,30)};
var IDB=null;
function idbOpen(cb){if(IDB)return cb(IDB);try{var r=indexedDB.open('nts',1);r.onupgradeneeded=function(){r.result.createObjectStore('f')};r.onsuccess=function(){IDB=r.result;cb(IDB)};r.onerror=function(){cb(null)}}catch(err){cb(null)}}
function idbPut(k,v,cb){idbOpen(function(db){if(!db){cb&&cb(false);return}try{var tx=db.transaction('f','readwrite');tx.objectStore('f').put(v,k);tx.oncomplete=function(){cb&&cb(true)};tx.onerror=function(){cb&&cb(false)}}catch(err){cb&&cb(false)}})}
function idbGet(k,cb){idbOpen(function(db){if(!db){cb(null);return}try{var q=db.transaction('f','readonly').objectStore('f').get(k);q.onsuccess=function(){cb(q.result||null)};q.onerror=function(){cb(null)}}catch(err){cb(null)}})}
var blobUrls={};
function isLocal(u){return (u.detail||'').indexOf('local:')===0}
var MIMES={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gif:'image/gif',webp:'image/webp',svg:'image/svg+xml',avif:'image/avif',mp4:'video/mp4',m4v:'video/mp4',mov:'video/quicktime',webm:'video/webm',mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',ogg:'audio/ogg',pdf:'application/pdf',txt:'text/plain',md:'text/plain',csv:'text/csv',json:'application/json'};
function mimeFor(n){var m=String(n||'').toLowerCase().match(/\.([a-z0-9]+)$/);return (m&&MIMES[m[1]])||'application/octet-stream'}
function idbBlob(k,name,cb){idbGet(k,function(v){if(!v){cb(null);return}var b=null;try{if(typeof Blob!=='undefined'&&v instanceof Blob){b=v.type?v:new Blob([v],{type:mimeFor(name)})}else if(v&&v.buf){b=new Blob([v.buf],{type:v.type||mimeFor(v.name||name)})}}catch(err){b=null}cb(b)})}
function blobUrl(k,b){return blobUrls[k]||(blobUrls[k]=URL.createObjectURL(b))}
function fileName(it){var n=it.to;if(n&&/\.[A-Za-z0-9]{1,6}$/.test(n))return n;var m=(it.notes||'').match(/File: (.+)$/);if(m)return m[1];return it.title||'file'}
function openFile(k,it,dl){
  var name=fileName(it);
  idbBlob(k,name,function(b){
    if(!b||!b.size){toast('This file could not be read from browser storage. Please upload it again.');return}
    var u=blobUrl(k,b),t=b.type||mimeFor(name),kind=t.split('/')[0],body;
    if(dl){var a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);toast('Downloading '+name);return}
    if(kind==='image')body='<img src="'+u+'" alt="'+esc(it.title)+'">';
    else if(kind==='video')body='<video src="'+u+'" controls playsinline></video>';
    else if(kind==='audio')body='<audio src="'+u+'" controls></audio>';
    else if(t==='application/pdf')body='<iframe src="'+u+'" title="'+esc(it.title)+'"></iframe>';
    else if(kind==='text'||t==='application/json')body='<pre id="vwTxt">Loading...</pre>';
    else body='<div class="nop">No preview for this file type.<br>Use Download to open it on your device.</div>';
    openMod('<div class="vwh"><h3>'+esc(it.title)+'</h3><span class="mu sm">'+esc(name)+', '+sizeLabel(b.size)+'</span></div><div class="vwb">'+body+'</div><div class="row" style="justify-content:flex-end;gap:10px;margin-top:16px"><a class="btn" href="'+u+'" download="'+esc(name)+'">'+ico('download-simple')+'Download</a><button class="btn g" data-x="1">Close</button></div>');
    $('mod').style.maxWidth='min(920px,94vw)';
    if($('vwTxt')){var fr=new FileReader();fr.onload=function(){var e=$('vwTxt');if(e)e.textContent=String(fr.result).slice(0,200000)};fr.readAsText(b)}
  });
}

/* ===== Google Sheets service: every backend call goes through here ===== */
var GoogleSheets=(function(){
  function base(){return CFG.SCRIPT_URL}
  function fail(msg,server){var e=new Error(msg);e.server=!!server;return e}
  function call(action,body){
    var o={action:action},k;for(k in body){o[k]=body[k]}
    return fetch(base(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(o)})
      .then(function(r){return r.json()})
      .then(function(d){if(!d||d.ok===false)throw fail((d&&d.error)||'The sheet rejected the request',true);return d})
  }
  function getAll(){
    return fetch(base()).then(function(r){return r.json()}).then(function(d){
      if(!(d instanceof Array))throw fail((d&&d.error)||'Unexpected reply from the web app',true);return d})
  }
  function ofType(list,type){if(!type)return list;var r=[],i;for(i=0;i<list.length;i++){if(list[i].type===type)r.push(list[i])}return r}
  return {
    configured:function(){return !!base()},
    getRecords:function(type){return getAll().then(function(l){return ofType(l,type)})},
    createRecord:function(item){return call('add',{item:item})},
    updateRecord:function(id,fields){var it={id:id},k;for(k in fields){it[k]=fields[k]}return call('update',{item:it})},
    deleteRecord:function(id){return call('delete',{item:{id:id}})},
    searchRecords:function(q,type){q=String(q||'').toLowerCase();return getAll().then(function(l){l=ofType(l,type);if(!q)return l;var r=[],i,j,f=['title','detail','from','to','notes','status'];
      for(i=0;i<l.length;i++){for(j=0;j<f.length;j++){if(String(l[i][f[j]]||'').toLowerCase().indexOf(q)>-1){r.push(l[i]);break}}}return r})},
    ping:function(){return getAll().then(function(l){return l.length})}
  };
})();
/* write queue: failed writes are kept and retried, nothing is lost while offline */
var queue=[];try{queue=JSON.parse(localStorage.getItem('nts_q')||'[]')}catch(err){queue=[]}
var sync={s:'idle',m:'',warned:false},flushing=false;
function saveQ(){try{localStorage.setItem('nts_q',JSON.stringify(queue))}catch(err){}}
function syncText(){
  if(!CFG.SCRIPT_URL)return 'Saved on this device';
  if(sync.s==='saving')return 'Saving to Google sheet...';
  if(sync.s==='error')return 'Not synced: '+sync.m+(queue.length?' ('+queue.length+' waiting)':'');
  return 'Synced to Google sheet';
}
function setSync(st,m){sync.s=st;sync.m=m||'';var e=document.getElementById('sync');if(e)e.textContent=syncText()}
function errMsg(err){return err&&err.server?String(err.message):'cannot reach the web app. Check it is deployed with access set to Anyone'}
function send(a,item){lastWrite=Date.now();if(!CFG.SCRIPT_URL)return;queue.push({a:a,item:item,n:0});saveQ();flush()}
function flush(){
  if(flushing||!queue.length||!CFG.SCRIPT_URL)return;flushing=true;setSync('saving');
  var op=queue[0],p=op.a==='add'?GoogleSheets.createRecord(op.item):op.a==='delete'?GoogleSheets.deleteRecord(op.item.id):GoogleSheets.updateRecord(op.item.id,op.item);
  p.then(function(){queue.shift();saveQ();flushing=false;sync.warned=false;if(queue.length)flush();else setSync('ok')})
   .catch(function(err){flushing=false;op.n=(op.n||0)+1;
     if(err&&err.server&&op.n>=3){queue.shift();saveQ();toast('The sheet rejected a change: '+err.message)}
     setSync('error',errMsg(err));if(!sync.warned){sync.warned=true;toast('Could not save to the sheet. Your change is kept and will retry.')}});
}
var items=[],lastWrite=0;
try{items=JSON.parse(localStorage.getItem('nts_items')||'[]')}catch(err){items=[]}
function cache(){try{localStorage.setItem('nts_items',JSON.stringify(items))}catch(err){}}
function uid(){return 'N'+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36)}
function iso(d){var m=d.getMonth()+1,x=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(x<10?'0':'')+x}
function dueFor(k){var d=new Date();if(k==='tomorrow')d.setDate(d.getDate()+1);else if(k==='week')d.setDate(d.getDate()+6);return iso(d)}
function post(action,item){send(action,item)}
function addItem(o){var now=new Date().toISOString();var it={id:uid(),type:o.type,title:o.title,detail:o.detail||'',from:o.from||'',to:o.to||'',priority:o.priority||'Normal',status:o.status||'',due:o.due||'',created:now,updated:now,notes:o.notes||''};items.unshift(it);cache();send('add',it);state.fresh=it.id;return it}
function setStatus(id,st){var i;for(i=0;i<items.length;i++){if(items[i].id===id){items[i].status=st;items[i].updated=new Date().toISOString();cache();send('update',items[i]);return}}}
function editItem(id,f){var it=getItem(id),k;if(!it)return;for(k in f){it[k]=f[k]}it.updated=new Date().toISOString();cache();send('update',it)}
function deleteItem(id){var i;for(i=0;i<items.length;i++){if(items[i].id===id){items.splice(i,1);break}}cache();send('delete',{id:id})}
function getItem(id){var i;for(i=0;i<items.length;i++){if(items[i].id===id)return items[i]}return null}
function loadItems(cb){
  if(!CFG.SCRIPT_URL||Date.now()-lastWrite<8000)return;
  if(queue.length){flush();return}
  GoogleSheets.getRecords().then(function(d){
    var lc=[],q;for(q=0;q<items.length;q++){if(isLocal(items[q]))lc.push(items[q])}d=d.concat(lc);
    d.sort(function(a,b){return a.created<b.created?1:-1});
    if(JSON.stringify(d)!==JSON.stringify(items)){items=d;cache();cb()}
    if(sync.s!=='saving')setSync('ok');
  }).catch(function(err){setSync('error',errMsg(err))});
}
function byType(t){var r=[],i;for(i=0;i<items.length;i++){if(items[i].type===t)r.push(items[i])}return r}
function T(){return byType('task')}
function R(){return byType('request')}
function isOverdue(t){return t.status!=='COMPLETED'&&t.due&&t.due<iso(new Date())}
function cnt(list,fn){var n=0,i;for(i=0;i<list.length;i++){if(fn(list[i]))n++}return n}
function pendCount(){return cnt(T(),function(t){return t.status!=='COMPLETED'})}
function openCount(){return cnt(R(),function(t){return t.status!=='COMPLETED'})}
function publishedCount(){return cnt(byType('content'),function(c){return c.status==='PUBLISHED'})}
function daysLeft(){return Math.max(0,Math.ceil((TARGET.date.getTime()-Date.now())/864e5))}
function wc(s){var t=String(s).trim();return t?t.split(/\s+/).length:0}
function dueLabel(d){if(!d)return 'No date';var t=iso(new Date());if(d===t)return 'Due today';if(d<t)return 'Overdue, '+d;return 'Due '+d}
function fmt(s){var d=new Date(s);return isNaN(d.getTime())?'':d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
function stCls(s){
  if(s==='COMPLETED'||s==='ACTIVE'||s==='UPLOADED'||s==='WON'||s==='PUBLISHED'||s==='READY')return 'ok';
  if(s==='PENDING'||s==='HOLD'||s==='TESTING'||s==='FOLLOW-UP')return 'warn';
  if(s==='LOST')return 'bad';
  if(s==='ARCHIVED')return 'mt';
  return 'ac';
}
