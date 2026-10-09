/* ---------- Requests page: shared across devices, mandatory Estimated Cost, comments, audit trail, cost summary ---------- */
var RV={tab:'ALL',scope:'all',q:'',cat:'',view:'list',draft:null,sending:false,dop:null,cop:null};
/* old pages (home, dashboard, Dal Abba) read requests through R(); feed them from the shared list, never from device storage */
function R(){
  var o=[],i,r;
  for(i=0;i<RQ.reqs.length;i++){r=RQ.reqs[i];o.push({id:r.id,type:'request',title:r.title,detail:r.description,from:r.raisedBy,to:r.assignedTo,priority:r.priority,status:r.status,due:r.due,created:r.created,updated:r.updated,estCost:r.estCost})}
  return o;
}
function openCount(){return cnt(R(),function(t){return t.status!=='COMPLETED'&&t.status!=='REJECTED'})}
function rqLocalOld(){var l=byType('request'),o=[],i;for(i=0;i<l.length;i++){if(!l[i].migrated)o.push(l[i])}return o}
function rqStChip(s){var c=s==='COMPLETED'||s==='APPROVED'?'ok':s==='REJECTED'?'bad':s==='HOLD'?'warn':'ac';return '<span class="tg '+c+'">'+sl(s)+'</span>'}
function rqWhen(t){var d=new Date(t);return isNaN(d.getTime())?'':d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})+', '+d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
function rqMoney(n){return n===null||n===undefined?'<span class="mu">Not provided</span>':rqInr(n)}
function rqParseAmt(s){s=String(s==null?'':s).replace(/[\u20B9,\s]|Rs\.?/gi,'');if(s==='')return {e:'Enter the estimated cost. Type 0 only if it is free.'};if(!/^\d+(\.\d{1,2})?$/.test(s))return {e:/^-/.test(s)?'The amount cannot be negative.':'Enter numbers only, for example 12500.'};return {v:Number(s)}}
function rqFe(id,msg){var f=$(id),m;if(!f)return;f.className=(f.className||'')+' bad';f.setAttribute('aria-invalid','true');if(f.parentNode&&!f.parentNode.querySelector('.fe')){m=document.createElement('div');m.className='fe';m.setAttribute('data-dyn','1');m.setAttribute('role','alert');m.textContent=msg;f.parentNode.appendChild(m)}}
function rqClrFe(){var l=document.querySelectorAll('#mod .fe[data-dyn]'),i;for(i=l.length-1;i>=0;i--)l[i].parentNode.removeChild(l[i]);l=document.querySelectorAll('#mod .bad');for(i=0;i<l.length;i++){l[i].className=l[i].className.replace(/\bbad\b/,'').trim();l[i].removeAttribute('aria-invalid')}}
function rqSyncBar(){
  var c=RQ.state==='error'||RQ.state==='offline'?'bad':RQ.state==='ok'?'ok':'warn';
  return '<div class="rqbar" role="status"><span class="tg '+c+'" id="rqSyncTxt">'+esc(rqSyncText())+'</span>'+(RQ.err&&RQ.state!=='ok'?'<span class="mu sm"> '+esc(RQ.err)+'</span>':'')+(RQ.fromCache?'<span class="mu sm"> Showing the last saved copy until the server answers.</span>':'')+(rqReady()?'<button class="btn sm g" data-rq="refresh">'+ico('arrows-clockwise')+'Refresh</button>':'')+'<button class="btn sm g" data-rq="connect">'+ico('link')+(rqReady()?'Connection':'Connect')+'</button></div>';
}
function rqConnectCard(){
  return '<div class="card" data-a><div class="h3">Start using requests</div><div class="mu mt8" style="line-height:1.6">Pick who you are on this device. In <b>this-device mode</b> everything works right away (estimated cost, comments, notifications), but the data stays only in this browser, so your phone and laptop will not see each other\'s requests.</div><div class="frow mt16" style="align-items:end">'+fld('I am','rql_who0',tsel('rql_who0',PEOPLE,'Pranav'))+'<button class="btn" data-rq="uselocal0">'+ico('check-square')+'Use on this device</button></div><div class="mu sm mt16">To share one list across devices, connect the Google Sheet backend instead:</div><div class="mt8"><button class="btn g" data-rq="connect">'+ico('link')+'Connect shared backend</button></div></div>';
}
function rqVisible(){
  var o=[],i,r,q=RV.q.toLowerCase();
  for(i=0;i<RQ.reqs.length;i++){r=RQ.reqs[i];
    if(RV.tab!=='ALL'&&r.status!==RV.tab)continue;
    if(RV.scope==='me'&&r.assignedTo!==RQ.cfg.who)continue;
    if(RV.scope==='mine'&&r.raisedBy!==RQ.cfg.who)continue;
    if(RV.cat&&r.category!==RV.cat)continue;
    if(q&&(r.title+' '+r.id+' '+r.description+' '+r.raisedBy+' '+r.assignedTo).toLowerCase().indexOf(q)<0)continue;
    o.push(r)}
  o.sort(function(a,b){return a.created<b.created?1:-1});return o;
}
function rqCard(r){
  return '<div class="card rqc" data-id="'+esc(r.id)+'" style="margin-bottom:12px"><button class="rqo" data-rqo="'+esc(r.id)+'" aria-label="Open '+esc(r.id)+' '+esc(r.title)+'"></button><div class="row" style="align-items:flex-start;flex-wrap:wrap;gap:10px"><div style="flex:1 1 240px;min-width:0"><div class="lbl"><span class="mono">'+esc(r.id)+'</span> \u00B7 '+esc(r.raisedBy)+' to '+esc(r.assignedTo)+' \u00B7 '+rqWhen(r.created)+(r.visibility==='private'?' \u00B7 Private':'')+'</div><div class="h3 mt8" style="overflow-wrap:anywhere">'+esc(r.title)+'</div></div><div class="rqtags">'+rqStChip(r.status)+'<span class="tg '+(r.priority==='Urgent'?'bad':r.priority==='High'?'warn':'mt')+'">'+esc(r.priority)+'</span></div></div><div class="kv rqkv"><div><small>Estimated</small><b>'+rqMoney(r.estCost)+'</b></div><div><small>Approved</small><b>'+rqMoney(r.approvedCost)+'</b></div><div><small>Actual</small><b>'+rqMoney(r.actualCost)+'</b></div><div><small>Category</small><b>'+esc(r.category||'Other')+'</b></div>'+(r.due?'<div><small>Due</small><b>'+esc(r.due)+'</b></div>':'')+'</div></div>';
}
function vRequests(){
  var h=pageHead('Requests','One shared list for the whole team. Every request carries an estimated cost.',rqSyncBar()),i;
  if(!rqReady())return h+rqConnectCard()+rqLegacyCard();
  var tabs=['ALL'].concat(RQ_ST),tb='<div class="tabs" style="margin-bottom:12px" data-a>',c,j;
  for(i=0;i<tabs.length;i++){c=0;for(j=0;j<RQ.reqs.length;j++){if(tabs[i]==='ALL'||RQ.reqs[j].status===tabs[i])c++}tb+='<button class="tb'+(RV.tab===tabs[i]?' on':'')+'" data-rq="tab|'+tabs[i]+'">'+(tabs[i]==='ALL'?'All':sl(tabs[i]))+' '+c+'</button>'}
  tb+='</div>';
  var top='<div class="rqtop" data-a><button class="btn" data-rq="new">'+ico('plus')+'New request</button><div class="tabs"><button class="tb'+(RV.view==='list'?' on':'')+'" data-rq="view|list">List</button><button class="tb'+(RV.view==='cost'?' on':'')+'" data-rq="view|cost">Cost summary</button></div></div>';
  if(RV.view==='cost')return h+top+rqCostView()+rqLegacyCard();
  var f='<div class="frow rqf" data-a>'+fld('Search','rqf_q','<input id="rqf_q" type="search" placeholder="Title, ID or person" value="'+esc(RV.q)+'" autocomplete="off">')+fld('Show','rqf_scope',tsel('rqf_scope',[['all','Everyone'],['me','Assigned to me'],['mine','Raised by me']],RV.scope))+fld('Category','rqf_cat',tsel('rqf_cat',[['','All categories']].concat(RQ_CATS.map(function(x){return [x,x]})),RV.cat))+'</div>';
  var l=rqVisible(),lst='';
  for(i=0;i<l.length;i++)lst+=rqCard(l[i]);
  if(!l.length)lst='<div class="card"><div class="empty">'+(RQ.state==='loading'?'Loading requests...':RQ.reqs.length?'No requests match these filters.':'No requests yet. Raise the first one.')+'</div></div>';
  return h+top+tb+f+lst+rqLegacyCard();
}
function rqLegacyCard(){
  var l=rqLocalOld();if(!l.length)return '';
  return '<div class="card mt16" data-a><div class="h3">'+l.length+' older request'+(l.length>1?'s':'')+' saved only on this device</div><div class="mu mt8" style="line-height:1.6">These were raised before shared requests existed, so other devices cannot see them. No cost was recorded and none is invented: they will show "Not provided" until someone enters an estimate.</div>'+(rqReady()?'<div class="mt16"><button class="btn" data-rq="migrate">'+ico('upload-simple')+'Move them to the shared list</button></div>':'<div class="mu sm mt8">Connect this device first.</div>')+'</div>';
}

/* ---- cost summary: estimates, approvals and actuals stay in separate columns; an estimate is never counted as spend ---- */
function rqGroup(keyFn){
  var m={},k,i,r,o;
  for(i=0;i<RQ.reqs.length;i++){r=RQ.reqs[i];k=keyFn(r);if(!m[k])m[k]={k:k,n:0,est:0,estN:0,app:0,act:0};o=m[k];o.n++;if(r.estCost!==null){o.est+=r.estCost;o.estN++}if(r.approvedCost!==null)o.app+=r.approvedCost;if(r.actualCost!==null)o.act+=r.actualCost}
  var a=[];for(k in m)a.push(m[k]);a.sort(function(x,y){return x.k<y.k?-1:1});return a;
}
function rqCostTable(title,rows,keyLabel){
  var rs=[],i;for(i=0;i<rows.length;i++){rs.push({c:[esc(rows[i].k),String(rows[i].n),rqInr(rows[i].est)+(rows[i].estN<rows[i].n?' <span class="mu sm">('+(rows[i].n-rows[i].estN)+' not provided)</span>':''),rqInr(rows[i].app),rqInr(rows[i].act)]})}
  return '<div class="card mt16" data-a><div class="h3" style="margin-bottom:12px">'+title+'</div>'+ivTbl([keyLabel,'#Requests','#Estimated','#Approved','#Actual spend'],rs,'No requests yet.')+'</div>';
}
function rqCostView(){
  var t=rqGroup(function(){return 'All'})[0]||{n:0,est:0,estN:0,app:0,act:0};
  var h='<div class="bento mt16"><div class="card c4" data-a><div class="lbl">Estimated (not spent)</div><div class="num" style="font-size:28px">'+rqInr(t.est)+'</div><div class="mu sm mt8">'+t.estN+' of '+t.n+' requests have an estimate</div></div><div class="card c4" data-a><div class="lbl">Approved budget</div><div class="num" style="font-size:28px">'+rqInr(t.app)+'</div><div class="mu sm mt8">Set by '+RQ_APPROVER+'</div></div><div class="card c4" data-a><div class="lbl">Actual spend recorded</div><div class="num" style="font-size:28px">'+rqInr(t.act)+'</div><div class="mu sm mt8">Only what the assignee has recorded</div></div></div>';
  h+=rqCostTable('By status',rqGroup(function(r){return sl(r.status)}),'Status');
  h+=rqCostTable('By category',rqGroup(function(r){return r.category||'Other'}),'Category');
  h+=rqCostTable('By employee (assigned to)',rqGroup(function(r){return r.assignedTo}),'Employee');
  h+=rqCostTable('By department',rqGroup(function(r){return (ROLES[r.assignedTo]||['','Other'])[1]}),'Department');
  h+=rqCostTable('By month raised',rqGroup(function(r){var d=new Date(r.created);return isNaN(d.getTime())?'Unknown':d.getFullYear()+'-'+(d.getMonth()<9?'0':'')+(d.getMonth()+1)}),'Month');
  return h+'<div class="mu sm mt16">Estimates are forecasts. They are not payments and are never added to "Actual spend".</div>';
}

/* ---- create ---- */
function rqOpenForm(pre){
  if(!rqReady()){rqConnectModal();return}
  pre=pre||{};RV.draft={cid:rqRand('cid'),sending:false};
  if(state.page!=='requests')go('requests');
  var who=RQ.cfg.who,def=who==='Nikhil'?'Monish':'Nikhil',to=[],i;for(i=0;i<PEOPLE.length;i++)to.push(PEOPLE[i]);
  openMod('<div class="h3" style="margin-bottom:16px">New request</div><div class="stack" id="rqForm">'+
   fld('Title','rqn_title',tin('rqn_title','For example: Wide-angle lens for shoots','text',pre.title))+
   fld('Description','rqn_desc','<textarea id="rqn_desc" rows="3" placeholder="What is needed and why"></textarea>')+
   '<div class="frow">'+fld('Estimated cost (\u20B9) *','rqn_est','<input id="rqn_est" type="text" inputmode="decimal" placeholder="12500" autocomplete="off" aria-describedby="rqn_esth">')+fld('Category','rqn_cat',tsel('rqn_cat',RQ_CATS,'Other'))+'</div>'+
   '<div class="mu sm" id="rqn_esth" style="margin-top:-6px">Required. Enter 0 only if this costs nothing. An estimate is a forecast, not an expense.</div>'+
   '<div class="frow">'+fld('Assign to','rqn_to',tsel('rqn_to',to,def))+fld('Priority','rqn_pri',tsel('rqn_pri',['Normal','High','Urgent'],'Normal'))+'</div>'+
   '<div class="frow">'+fld('Due date','rqn_due',tin('rqn_due','','date'))+fld('Visible to','rqn_vis',tsel('rqn_vis',[['team','Whole team'],['private','Only me, assignee and '+RQ_APPROVER]],'team'))+'</div>'+
   fld('Reference link (optional)','rqn_link',tin('rqn_link','https://','url'))+
   '<div class="mu sm">Raised by <b>'+esc(who)+'</b>. The request is only shown as raised after the server has saved it.</div><div id="rqn_err" class="fe" role="alert" style="display:none"></div>'+
   '<div class="row" style="gap:10px;justify-content:flex-end"><button class="btn g" data-x>Cancel</button><button class="btn" id="rqn_go" data-rq="create">'+ico('paper-plane-tilt')+'Raise request</button></div></div>');
  setTimeout(function(){var e=$('rqn_title');if(e)e.focus()},60);
}
function rqCreate(){
  if(RV.draft&&RV.draft.sending)return;
  rqClrFe();var er=$('rqn_err');er.style.display='none';
  var title=$('rqn_title').value.trim(),a=rqParseAmt($('rqn_est').value),lk=$('rqn_link').value.trim(),bad=0;
  if(!title){rqFe('rqn_title','Enter a title.');bad++}else if(title.length>200){rqFe('rqn_title','Keep the title under 200 characters.');bad++}
  if(a.e){rqFe('rqn_est',a.e);bad++}
  if(lk&&!/^https:\/\/\S+$/.test(lk)){rqFe('rqn_link','Use a full link starting with https://');bad++}
  if(bad){var f=document.querySelector('#mod .bad');if(f)f.focus();return}
  var b=$('rqn_go');RV.draft.sending=true;b.disabled=true;b.textContent='Saving...';
  var q={cid:RV.draft.cid,title:title,description:$('rqn_desc').value.trim(),category:$('rqn_cat').value,assignedTo:$('rqn_to').value,priority:$('rqn_pri').value,due:$('rqn_due').value,estCost:a.v,visibility:$('rqn_vis').value,attachments:lk?[{name:lk,url:lk}]:[]};
  rqWrite('rq_create',{req:q}).then(function(r){
    RV.draft.sending=false;b.disabled=false;b.innerHTML=ico('paper-plane-tilt')+'Raise request';
    if(r.ok){closeMod();RV.tab='ALL';RV.view='list';rqLog(true,'Raised '+r.request.id);toast((r.duplicate?'Already saved: ':'Saved on the server: ')+r.request.id);render(true);rqSync();return}
    er.textContent=rqErrText(r.error);er.style.display='block';rqLog(false,'Could not save request: '+rqErrText(r.error));rqEmit();
  }).catch(function(e){
    RV.draft.sending=false;b.disabled=false;b.innerHTML=ico('arrows-clockwise')+'Retry';
    er.textContent=((e&&e.msg)||'No connection.')+' Nothing was saved yet. Press Retry: the same request key is reused, so it cannot be created twice.';er.style.display='block';rqLog(false,'Request not saved (network)');rqEmit();
  });
}

/* ---- detail ---- */
function rqCan(r,what){
  var w=RQ.cfg.who,ap=w===RQ_APPROVER,raiser=w===r.raisedBy,asg=w===r.assignedTo;
  if(what==='est')return raiser||ap||r.estCost===null&&(asg);
  if(what==='app')return ap;if(what==='act')return asg||ap;if(what==='status')return raiser||asg||ap;if(what==='assign')return raiser||ap||asg;return false;
}
function rqOpen(id){
  var r=rqFind(id);if(!r){toast('That request is not available (it may be private or removed).');return false}
  RV.dop=RV.dop&&RV.dop.id===id?RV.dop:{id:id,opId:null};
  var ap=RQ.cfg.who===RQ_APPROVER,i,act=[],h;
  for(i=0;i<RQ.act.length;i++){if(RQ.act[i].reqId===id)act.push(RQ.act[i])}
  act.sort(function(a,b){return a.ts<b.ts?1:-1});
  var stOpts=[],s;for(i=0;i<RQ_ST.length;i++){s=RQ_ST[i];if((s==='APPROVED'||s==='REJECTED')&&!ap&&r.status!==s)continue;stOpts.push([s,sl(s)])}
  var cost=function(label,key,val,can){return '<div class="rqcost"><small>'+label+'</small><b>'+rqMoney(val)+'</b>'+(can?'<button class="btn sm g" data-rq="editcost|'+key+'">'+(val===null?'Add':'Edit')+'</button>':'')+'</div>'};
  h='<div class="row" style="gap:10px;align-items:flex-start;flex-wrap:wrap"><div style="flex:1 1 220px;min-width:0"><div class="lbl"><span class="mono">'+esc(r.id)+'</span> \u00B7 '+esc(r.category||'Other')+(r.visibility==='private'?' \u00B7 Private':'')+'</div><div class="h3 mt8" style="overflow-wrap:anywhere">'+esc(r.title)+'</div></div><div class="rqtags">'+rqStChip(r.status)+'<span class="tg mt">'+esc(r.priority)+'</span></div></div>'+
   (r.description?'<div class="mu mt8" style="line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere">'+esc(r.description)+'</div>':'')+
   '<div class="kv rqkv"><div><small>Raised by</small><b>'+esc(r.raisedBy)+'</b></div><div><small>Assigned to</small><b>'+esc(r.assignedTo)+'</b></div><div><small>Raised</small><b>'+rqWhen(r.created)+'</b></div><div><small>Due</small><b>'+(r.due?esc(r.due):'No date')+'</b></div></div>'+
   '<div class="rqcosts">'+cost('Estimated cost','estCost',r.estCost,rqCan(r,'est'))+cost('Approved cost','approvedCost',r.approvedCost,rqCan(r,'app'))+cost('Actual cost','actualCost',r.actualCost,rqCan(r,'act'))+'</div><div id="rqCostEdit"></div>';
  if(r.attachments&&r.attachments.length){h+='<div class="mt16 lbl">Reference</div>';for(i=0;i<r.attachments.length;i++){h+='<div><a href="'+esc(r.attachments[i].url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.attachments[i].name)+'</a></div>'}}
  h+='<div class="frow mt16">'+(rqCan(r,'status')?fld('Status','rqd_st',tsel('rqd_st',stOpts,r.status)):'')+(rqCan(r,'assign')?fld('Assigned to','rqd_to',tsel('rqd_to',PEOPLE,r.assignedTo)):'')+'</div><div id="rqd_err" class="fe" role="alert" style="display:none"></div>';
  h+='<div class="h3 mt16" style="font-size:15px">Comments and activity</div><div class="rqact">';
  if(!act.length)h+='<div class="mu sm">No activity yet.</div>';
  for(i=0;i<act.length;i++){h+='<div class="rqa '+esc(act[i].kind)+'"><b>'+esc(act[i].actor)+'</b> <span class="mu sm">'+rqWhen(act[i].ts)+'</span><div style="overflow-wrap:anywhere;white-space:pre-wrap">'+esc(act[i].text)+'</div></div>'}
  h+='</div><div class="stack mt16">'+fld('Add a comment (use @Name to mention)','rqd_cm','<textarea id="rqd_cm" rows="2" maxlength="2000"></textarea>')+'<div class="row" style="gap:10px;justify-content:flex-end"><button class="btn g" data-x>Close</button><button class="btn" data-rq="comment">'+ico('chat-circle')+'Post comment</button></div></div>';
  openMod(h);$('mod').setAttribute('data-rq',id);RQ.openId=id;return true;
}
function rqRefreshOpen(){
  var id=RQ.openId;if(!id||$('mov').className.indexOf('on')<0||$('mod').getAttribute('data-rq')!==id||!rqFind(id))return;
  var a=document.activeElement;if(a&&(a.tagName==='TEXTAREA'||a.tagName==='INPUT'))return;
  if($('rqCostEdit')&&$('rqCostEdit').innerHTML)return;
  var sc=$('mod').scrollTop;rqOpen(id);$('mod').scrollTop=sc;
}
function rqReopen(id){if($('mov').className.indexOf('on')>-1&&$('mod').getAttribute('data-rq')===id)rqOpen(id)}
function rqPatch(id,patch,done){
  var r=rqFind(id);if(!r)return;
  if(!RV.dop||RV.dop.id!==id)RV.dop={id:id,opId:null};
  if(!RV.dop.opId)RV.dop.opId=rqRand('op');
  var er=$('rqd_err')||$('rqc_err');
  rqWrite('rq_update',{id:id,opId:RV.dop.opId,patch:patch,expectedVersion:r.version}).then(function(x){
    if(x.ok){RV.dop.opId=null;rqLog(true,'Updated '+id);toast('Saved on the server');if(done)done();rqSync().then(function(){rqReopen(id);if(state.page==='requests'&&$('mov').className.indexOf('on')<0)render(true)});return}
    if(x.error==='conflict'){RV.dop.opId=null;toast(rqErrText('conflict'))}
    rqLog(false,'Update of '+id+' refused: '+rqErrText(x.error));if(er){er.textContent=rqErrText(x.error);er.style.display='block'}rqEmit();
    if(x.error==='conflict'){setTimeout(function(){rqReopen(id)},50)}
  }).catch(function(e){if(er){er.textContent=((e&&e.msg)||'No connection.')+' Nothing was changed. Try the same action again; it is safe to repeat.';er.style.display='block'}rqLog(false,'Update of '+id+' not saved (network)');rqEmit()});
}
function rqEditCost(key){
  var id=RQ.openId,r=rqFind(id),nm={estCost:'Estimated cost',approvedCost:'Approved cost',actualCost:'Actual cost'}[key],cur=r[key];
  $('rqCostEdit').innerHTML='<div class="rqce mt16"><div class="frow">'+fld(nm+' (\u20B9)','rqc_v','<input id="rqc_v" type="text" inputmode="decimal" value="'+(cur===null?'':cur)+'" autocomplete="off">')+'<div class="row" style="gap:8px"><button class="btn sm" data-rq="savecost|'+key+'">Save</button><button class="btn sm g" data-rq="cancelcost">Cancel</button></div></div><div id="rqc_err" class="fe" role="alert" style="display:none"></div><div class="mu sm">'+(key==='estCost'?'This change is recorded in the activity history and the approver is notified.':key==='actualCost'?'Record what was really spent. Estimates never count as spend.':'Budget the approver agrees to.')+'</div></div>';
  var e=$('rqc_v');if(e)e.focus();
}
function rqSaveCost(key){
  var a=rqParseAmt($('rqc_v').value);rqClrFe();
  if(a.e){rqFe('rqc_v',a.e.replace('the estimated cost','an amount'));return}
  var p={};p[key]=a.v;rqPatch(RQ.openId,p);
}
function rqComment(){
  var id=RQ.openId,t=$('rqd_cm').value.trim(),er=$('rqd_err');if(!t){$('rqd_cm').focus();return}
  if(!RV.cop||RV.cop.id!==id||RV.cop.t!==t)RV.cop={id:id,t:t,opId:rqRand('op')};
  rqWrite('rq_comment',{id:id,opId:RV.cop.opId,text:t}).then(function(x){
    if(x.ok){RV.cop=null;toast('Comment saved');rqSync().then(function(){rqReopen(id)});return}
    er.textContent=rqErrText(x.error);er.style.display='block';
  }).catch(function(e){er.textContent=((e&&e.msg)||'No connection.')+' Your comment was not saved. Press Post again to retry safely.';er.style.display='block'});
}

/* ---- connect this device ---- */
function rqConnectModal(){
  openMod('<div class="h3" style="margin-bottom:6px">Requests connection</div><div class="card" style="margin-bottom:16px;padding:14px"><div class="lbl">This device only</div><div class="frow mt8" style="align-items:end">'+fld('I am','rql_who',tsel('rql_who',PEOPLE,RQ.cfg.who||'Pranav'))+'<button class="btn sm" data-rq="uselocal">'+(RQ.cfg.local&&!rqShared()?'Switch person':'Use on this device')+'</button></div><div class="mu sm mt8">Data stays in this browser only.</div></div><div class="lbl" style="margin-bottom:6px">Or share across devices (Google Sheet)</div><div class="mu sm" style="line-height:1.6;margin-bottom:16px">Paste the Apps Script web-app URL and the team key you set in Script properties. They are stored only in this browser. The team key is never part of the website files.</div><div class="stack">'+
   fld('Web-app URL','rqk_url',tin('rqk_url','https://script.google.com/macros/s/.../exec','url',RQ.cfg.url))+
   fld('Team key','rqk_key','<input id="rqk_key" type="password" autocomplete="off" value="'+esc(RQ.cfg.key)+'">')+
   fld('Who is using this device?','rqk_who',tsel('rqk_who',[['','Choose...']].concat(PEOPLE.map(function(p){return [p,p]})),RQ.cfg.who))+
   '<div id="rqk_err" class="fe" role="alert" style="display:none"></div><div class="row" style="gap:10px;justify-content:flex-end">'+(rqReady()?'<button class="btn g" data-rq="disconnect">Disconnect</button>':'')+'<button class="btn g" data-x>Cancel</button><button class="btn" id="rqk_go" data-rq="saveconn">Test and save</button></div></div>');
}
function rqSaveConn(){
  var u=$('rqk_url').value.trim(),k=$('rqk_key').value.trim(),w=$('rqk_who').value,er=$('rqk_err');rqClrFe();er.style.display='none';
  if(!/^https:\/\/script\.google\.com\/\S+\/exec$/.test(u)&&!/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)){rqFe('rqk_url','Paste the full web-app URL ending in /exec.');return}
  if(!k){rqFe('rqk_key','Enter the team key.');return}
  if(!w){rqFe('rqk_who','Choose who you are.');return}
  var old={u:RQ.cfg.url,k:RQ.cfg.key,w:RQ.cfg.who};RQ.cfg.url=u;RQ.cfg.key=k;RQ.cfg.who=w;
  var b=$('rqk_go');b.disabled=true;b.textContent='Testing...';
  rqCall('rq_sync',{}).then(function(r){
    b.disabled=false;b.textContent='Test and save';
    if(r&&r.ok){RQ.cfg.local=false;rqSaveCfg();RQ.reqs=r.requests;RQ.act=r.activity;RQ.nts=r.notifications;RQ.last=Date.now();RQ.state='ok';RQ.err='';RQ.fromCache=false;rqSaveCache();closeMod();toast('Connected as '+w);rqStart();render(true);return}
    RQ.cfg.url=old.u;RQ.cfg.key=old.k;RQ.cfg.who=old.w;er.textContent=rqErrText(r&&r.error);er.style.display='block';
  }).catch(function(e){b.disabled=false;b.textContent='Test and save';RQ.cfg.url=old.u;RQ.cfg.key=old.k;RQ.cfg.who=old.w;er.textContent=((e&&e.msg)||'Could not reach the URL.')+' Checking why...';er.style.display='block';
    fetch(u+(u.indexOf('?')>-1?'&':'?')+'probe=1').then(function(r){return r.text()}).then(function(){er.textContent='The URL can be read from this page, but the save request was refused or the script errored. Paste the latest Code.gs into Apps Script, then Deploy > Manage deployments > pencil > New version > Deploy, and try again.'}).catch(function(x){er.textContent='This page cannot read that URL at all ('+((x&&x.message)||'blocked')+'). Check the URL is complete, ends in /exec, and the deployment access is Anyone.'});
  });
}
function rqMigrate(){
  var l=rqLocalOld(),i=0,ok=0,fail=0;
  function next(){
    if(i>=l.length){if(ok){toast(ok+' moved to the shared list'+(fail?', '+fail+' failed':''));}else if(fail){toast('Could not move them: '+fail+' failed')}rqSync().then(function(){render(true)});return}
    var o=l[i++],to=PEOPLE.indexOf(o.to)>-1?o.to:RQ_APPROVER;
    rqWrite('rq_create',{req:{cid:'legacy-'+o.id,legacy:true,title:o.title,description:o.detail||'',category:'Other',assignedTo:to,priority:o.priority,status:RQ_ST.indexOf(o.status)>-1?o.status:'RAISED',due:o.due||'',estCost:'',legacyCreated:o.created}}).then(function(r){
      if(r.ok){ok++;o.migrated=true;cache()}else fail++;next();
    }).catch(function(){fail++;next()});
  }
  next();
}

/* ---- events ---- */
document.addEventListener('click',function(e){
  var t=e.target,n;if(!t||!t.closest)return;
  n=t.closest('[data-rqo]');if(n){rqOpen(n.getAttribute('data-rqo'));return}
  n=t.closest('[data-rq]');if(!n)return;
  var p=n.getAttribute('data-rq').split('|'),a=p[0];
  if(a==='new')rqOpenForm();else if(a==='create')rqCreate();
  else if(a==='tab'){RV.tab=p[1];render(true)}else if(a==='view'){RV.view=p[1];render(true)}
  else if(a==='refresh'){rqSync().then(function(){render(true)})}
  else if(a==='connect')rqConnectModal();else if(a==='saveconn')rqSaveConn();
  else if(a==='uselocal'||a==='uselocal0'){var w=$(a==='uselocal'?'rql_who':'rql_who0').value;RQ.cfg.local=true;RQ.cfg.who=w;rqSaveCfg();RQ.reqs=[];RQ.act=[];RQ.nts=[];RQ.state='loading';closeMod();rqStart();toast('Using requests on this device as '+w);render(true)}
  else if(a==='disconnect'){RQ.cfg.url=RQ.cfg.key='';RQ.cfg.who='';RQ.cfg.local=false;rqSaveCfg();RQ.reqs=[];RQ.act=[];RQ.nts=[];rqSaveCache();RQ.state='off';rqStart();closeMod();render(true);toast('Disconnected')}
  else if(a==='editcost')rqEditCost(p[1]);else if(a==='cancelcost'){$('rqCostEdit').innerHTML=''}
  else if(a==='savecost')rqSaveCost(p[1]);else if(a==='comment')rqComment();else if(a==='migrate')rqMigrate();
});
document.addEventListener('change',function(e){
  var t=e.target;if(!t||!t.id)return;
  if(t.id==='rqf_scope'){RV.scope=t.value;render(true)}else if(t.id==='rqf_cat'){RV.cat=t.value;render(true)}
  else if(t.id==='rqd_st'&&RQ.openId){rqPatch(RQ.openId,{status:t.value})}
  else if(t.id==='rqd_to'&&RQ.openId){rqPatch(RQ.openId,{assignedTo:t.value})}
});
(function(){var tm=null;document.addEventListener('input',function(e){var t=e.target;if(t&&t.id==='rqf_q'){RV.q=t.value;clearTimeout(tm);tm=setTimeout(function(){render(true);var q=$('rqf_q');if(q){q.focus();try{q.setSelectionRange(q.value.length,q.value.length)}catch(x){}}},250)}})})();
/* a modal that is not the request detail must never be replaced by a background refresh */
var rq_om=openMod;openMod=function(h){$('mod').removeAttribute('data-rq');RQ.openId=null;rq_om(h)};
var rq_cm=closeMod;closeMod=function(){RQ.openId=null;$('mod').removeAttribute('data-rq');rq_cm()};
VIEWS.requests=vRequests;
/* leaving and returning to Requests always fetches fresh data */
var rq_go0=go;go=function(p){rq_go0(p);if(p==='requests')rqSync().then(function(){if(state.page==='requests')render(true)})};
/* sync results refresh whatever is on screen without disturbing typing */
rqOn(function(){
  var a=document.activeElement,typing=a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT');
  var sig=JSON.stringify([RQ.reqs,RQ.act])+'|'+RQ.state+'|'+RQ.err+'|'+RQ.out.length;
  if(state.page==='requests'&&sig!==RV.sig&&!typing&&$('mov').className.indexOf('on')<0){RV.sig=sig;var y=window.pageYOffset;render(true);window.scrollTo(0,y)}
  else if(state.page==='requests'){var s=$('rqSyncTxt');if(s)s.textContent=rqSyncText()}
  rqRefreshOpen();
});
