/* ---------- Local mode: the same request / comment / notification rules as Code.gs, stored in this browser only ---------- */
/* Used when no shared backend is connected. Data never leaves this device, so other devices cannot see it. */
var LS_TEAM=['Nikhil','Monish','Pranav'],LS_APPROVER='Nikhil',LS_PRI=['Normal','High','Urgent'];
function lsLoad(){var d=rqLs('nts_rq_local')||{};d.reqs=d.reqs||[];d.act=d.act||[];d.nts=d.nts||[];d.seq=d.seq||{};return d}
function lsSave(d){rqLs('nts_rq_local',d)}
function lsId(d,p){d.seq[p]=(d.seq[p]||0)+1;var t=String(d.seq[p]);while(t.length<4)t='0'+t;return p+'-'+t}
function lsNum(v){if(v===null||v===undefined||v==='')return null;var n=Number(v);return isFinite(n)?n:null}
function lsSee(r,w){return (r.visibility||'team')!=='private'||w===r.raisedBy||w===r.assignedTo||w===LS_APPROVER}
function lsUniq(a){var o={},r=[],i;for(i=0;i<a.length;i++){if(a[i]&&!o[a[i]]){o[a[i]]=1;r.push(a[i])}}return r}
function lsFind(d,id){var i;for(i=0;i<d.reqs.length;i++){if(d.reqs[i].id===id)return d.reqs[i]}return null}
function lsClone(o){return JSON.parse(JSON.stringify(o))}
function lsLog(d,reqId,actor,kind,text,meta){d.act.push({id:lsId(d,'ACT'),reqId:reqId,ts:new Date().toISOString(),actor:actor,kind:kind,text:text,meta:meta||{}})}
function lsNotify(d,recips,type,key,req,actor,text){
  var i,r,ev,j,dup;
  for(i=0;i<recips.length;i++){r=recips[i];
    if(!r||r===actor||LS_TEAM.indexOf(r)<0||!lsSee(req,r))continue;
    ev=key+':'+r;dup=false;for(j=0;j<d.nts.length;j++){if(d.nts[j].eventId===ev){dup=true;break}}
    if(dup)continue;
    d.nts.push({id:lsId(d,'NTF'),eventId:ev,recipient:r,type:type,reqId:req.id,actor:actor,ts:new Date().toISOString(),readAt:'',title:req.title,status:req.status,estCost:req.estCost,text:text})}
}
function lsOpSeen(d,opId){var i;for(i=0;i<d.act.length;i++){if(d.act[i].meta&&d.act[i].meta.opId===opId)return true}return false}
function lsToday(off){var t=new Date(Date.now()+330*60000+(off||0)*86400000);return t.toISOString().substring(0,10)}
function lsRemind(d){
  var t=lsToday(0),tm=lsToday(1),i,r,st;
  for(i=0;i<d.reqs.length;i++){r=d.reqs[i];
    if(!r.due||r.status==='COMPLETED'||r.status==='REJECTED'||r.due>tm)continue;
    st=r.due<t?'overdue':r.due===t?'today':'tomorrow';
    lsNotify(d,[r.assignedTo],'due','due:'+r.id+':'+r.due+':'+st,r,'System',st==='overdue'?'is overdue':st==='today'?'is due today':'is due tomorrow')}
}
function LocalSrv(o){
  var who=o.who,d=lsLoad(),a=o.action,out;
  if(LS_TEAM.indexOf(who)<0)return {ok:false,error:'unknown_user'};
  try{
    if(a==='rq_sync'){lsRemind(d);lsSave(d);return lsSyncOut(d,who)}
    if(a==='rq_create')out=lsCreate(d,o);
    else if(a==='rq_update')out=lsUpdate(d,o);
    else if(a==='rq_comment')out=lsComment(d,o);
    else if(a==='nt_read')out=lsRead(d,o);
    else return {ok:false,error:'unknown action'};
    lsSave(d);return out;
  }catch(err){return {ok:false,error:String(err&&err.message||err)}}
}
function lsSyncOut(d,who){
  var reqs=[],ok={},i,r,act=[],nt=[],a;
  for(i=0;i<d.reqs.length;i++){r=d.reqs[i];if(lsSee(r,who)){reqs.push(lsClone(r));ok[r.id]=1}}
  for(i=0;i<d.act.length;i++){a=d.act[i];if(ok[a.reqId])act.push({id:a.id,reqId:a.reqId,ts:a.ts,actor:a.actor,kind:a.kind,text:a.text})}
  for(i=0;i<d.nts.length;i++){if(d.nts[i].recipient===who)nt.push(lsClone(d.nts[i]))}
  nt.sort(function(x,y){return x.ts<y.ts?1:-1});
  return {ok:true,now:new Date().toISOString(),requests:reqs,activity:act,notifications:nt.slice(0,200)};
}
function lsCreate(d,o){
  var q=o.req||{},who=o.who,cid=String(q.cid||''),i;
  if(!cid||cid.length<8)return {ok:false,error:'Missing request key. Reload the page and try again.'};
  for(i=0;i<d.reqs.length;i++){if(d.reqs[i].cid===cid)return {ok:true,duplicate:true,request:lsClone(d.reqs[i])}}
  var title=String(q.title||'').replace(/^\s+|\s+$/g,''),est=(q.estCost===''||q.estCost===undefined)?null:lsNum(q.estCost);
  if(!title)return {ok:false,error:'Request title is required.'};
  if(title.length>200)return {ok:false,error:'Title is too long (200 characters).'};
  if(est===null&&!q.legacy)return {ok:false,error:'Estimated cost is required. Enter 0 only if the request is free.'};
  if(est!==null&&est<0)return {ok:false,error:'Estimated cost cannot be negative.'};
  var to=String(q.assignedTo||'');if(LS_TEAM.indexOf(to)<0)return {ok:false,error:'Choose who the request is assigned to.'};
  var att=[],al=q.attachments||[];
  for(i=0;i<al.length&&i<5;i++){if(al[i]&&/^https:\/\//.test(String(al[i].url||'')))att.push({name:String(al[i].name||al[i].url).substring(0,120),url:String(al[i].url).substring(0,500)})}
  var now=new Date().toISOString();
  var r={id:lsId(d,'REQ'),cid:cid,title:title,description:String(q.description||'').substring(0,4000),category:String(q.category||'Other').substring(0,60),raisedBy:who,assignedTo:to,created:q.legacyCreated||now,updated:now,priority:LS_PRI.indexOf(q.priority)>-1?q.priority:'Normal',estCost:est,approvedCost:null,actualCost:null,status:(q.legacy&&RQ_ST.indexOf(q.status)>-1)?q.status:'RAISED',due:String(q.due||''),visibility:q.visibility==='private'?'private':'team',attachments:att,version:1};
  d.reqs.push(r);
  lsLog(d,r.id,who,'created','Raised this request'+(est!==null?' with an estimate of Rs '+est:''),{cid:cid});
  lsNotify(d,[to],'assigned','created:'+r.id,r,who,'assigned you a new request');
  lsNotify(d,[LS_APPROVER],'raised','raised:'+r.id,r,who,'raised a new request for approval');
  return {ok:true,request:lsClone(r)};
}
function lsUpdate(d,o){
  var who=o.who,id=String(o.id||''),p=o.patch||{},opId=String(o.opId||'');
  if(!opId||opId.length<8)return {ok:false,error:'Missing operation key.'};
  var r=lsFind(d,id);if(!r)return {ok:false,error:'Request not found.'};
  var isR=who===r.raisedBy,isA=who===r.assignedTo,isP=who===LS_APPROVER;
  if(!(isR||isA||isP))return {ok:false,error:'forbidden'};
  if(lsOpSeen(d,opId))return {ok:true,duplicate:true,request:lsClone(r)};
  if(o.expectedVersion!==undefined&&o.expectedVersion!==null&&Number(o.expectedVersion)!==r.version)return {ok:false,error:'conflict',request:lsClone(r)};
  var ch=[],k,nv,ov,i;
  for(k in p){nv=p[k];ov=r[k];
    if(k==='status'){
      if(RQ_ST.indexOf(nv)<0)return {ok:false,error:'Unknown status.'};
      if((nv==='APPROVED'||nv==='REJECTED')&&!isP)return {ok:false,error:'Only '+LS_APPROVER+' can approve or reject.'};
    }else if(k==='assignedTo'){if(LS_TEAM.indexOf(nv)<0)return {ok:false,error:'Unknown assignee.'}}
    else if(k==='estCost'||k==='approvedCost'||k==='actualCost'){
      nv=(nv===''||nv===null)?null:lsNum(nv);
      if(nv===null||nv<0)return {ok:false,error:'Enter a valid amount (0 or more).'};
      if(k==='approvedCost'&&!isP)return {ok:false,error:'Only '+LS_APPROVER+' can set the approved cost.'};
      if(k==='actualCost'&&!(isA||isP))return {ok:false,error:'Only the assignee or '+LS_APPROVER+' can record the actual cost.'};
      if(k==='estCost'&&!(isR||isP||r.estCost===null))return {ok:false,error:'Only the requester or '+LS_APPROVER+' can change the estimate.'};
    }else if(k==='priority'){if(LS_PRI.indexOf(nv)<0)return {ok:false,error:'Unknown priority.'}}
    else if(k==='title'||k==='description'||k==='category'||k==='due'||k==='visibility'){
      nv=String(nv||'').substring(0,k==='description'?4000:200);if(k==='title'&&!nv.replace(/\s/g,''))return {ok:false,error:'Title is required.'}
    }else continue;
    if(String(nv===null?'':nv)!==String(ov===null?'':ov))ch.push({f:k,from:ov,to:nv});
  }
  if(!ch.length)return {ok:true,request:lsClone(r),noChange:true};
  for(i=0;i<ch.length;i++)r[ch[i].f]=ch[i].to;
  r.updated=new Date().toISOString();r.version=r.version+1;
  var parts=lsUniq([r.raisedBy,r.assignedTo]),c,kind,text;
  for(i=0;i<ch.length;i++){c=ch[i];
    kind=c.f==='status'?'status':c.f==='assignedTo'?'assign':/Cost$/.test(c.f)?'cost':'edit';
    text=c.f==='status'?'Status changed from '+c.from+' to '+c.to:c.f==='assignedTo'?'Reassigned from '+c.from+' to '+c.to:/Cost$/.test(c.f)?c.f.replace('Cost',' cost')+' changed from '+(c.from===null?'not provided':'Rs '+c.from)+' to Rs '+c.to:'Changed '+c.f;
    lsLog(d,id,who,kind,text,{opId:opId,field:c.f,from:c.from,to:c.to});
    if(c.f==='assignedTo')lsNotify(d,[c.to],'assigned','assign:'+opId,r,who,'assigned you this request');
    else if(c.f==='status'&&(c.to==='APPROVED'||c.to==='REJECTED'))lsNotify(d,[r.raisedBy],'approval','appr:'+opId,r,who,(c.to==='APPROVED'?'approved':'rejected')+' your request');
    else if(c.f==='status')lsNotify(d,parts,'status','stat:'+opId,r,who,'changed the status to '+c.to);
    else if(c.f==='estCost')lsNotify(d,[r.raisedBy,LS_APPROVER],'cost','est:'+opId,r,who,'changed the estimated cost to Rs '+c.to);
    else if(c.f==='approvedCost')lsNotify(d,[r.raisedBy],'cost','apc:'+opId,r,who,'set the approved cost to Rs '+c.to);
  }
  return {ok:true,request:lsClone(r)};
}
function lsComment(d,o){
  var who=o.who,id=String(o.id||''),text=String(o.text||'').replace(/^\s+|\s+$/g,''),opId=String(o.opId||'');
  if(!text)return {ok:false,error:'Write a comment first.'};
  if(text.length>2000)return {ok:false,error:'Comment is too long (2000 characters).'};
  if(!opId||opId.length<8)return {ok:false,error:'Missing operation key.'};
  var r=lsFind(d,id);if(!r)return {ok:false,error:'Request not found.'};
  if(!lsSee(r,who))return {ok:false,error:'forbidden'};
  if(lsOpSeen(d,opId))return {ok:true,duplicate:true};
  lsLog(d,id,who,'comment',text,{opId:opId});
  var men=[],m,re=/@(Nikhil|Monish|Pranav)/gi;
  while((m=re.exec(text)))men.push(m[1].charAt(0).toUpperCase()+m[1].slice(1).toLowerCase());
  men=lsUniq(men);
  lsNotify(d,men,'mention','men:'+opId,r,who,'mentioned you in a comment');
  lsNotify(d,lsUniq([r.raisedBy,r.assignedTo]).filter(function(n){return men.indexOf(n)<0}),'comment','com:'+opId,r,who,'commented on this request');
  return {ok:true};
}
function lsRead(d,o){
  var ids={},i,n=0,now=new Date().toISOString(),a=o.ids||[];
  for(i=0;i<a.length;i++)ids[a[i]]=1;
  for(i=0;i<d.nts.length;i++){if(d.nts[i].recipient===o.who&&!d.nts[i].readAt&&(o.all||ids[d.nts[i].id])){d.nts[i].readAt=now;n++}}
  return {ok:true,updated:n};
}
