/* ---------- views ---------- */
function vCommand(){
  var ts=T(),rs=R(),today=iso(new Date()),pl=[],cl=[],td=0,tdDone=0,over=0,i;
  for(i=0;i<ts.length;i++){var t=ts[i];
    if(t.status==='COMPLETED')cl.push(t);else{pl.push(t);if(isOverdue(t))over++}
    if(t.due===today){td++;if(t.status==='COMPLETED')tdDone++}}
  pl.sort(function(a,b){return (a.due||'9')<(b.due||'9')?-1:1});
  cl.sort(function(a,b){return a.updated<b.updated?1:-1});
  var openReq=openCount(),pub=publishedCount(),left=daysLeft(),pct=td?Math.round(tdDone*100/td):0;
  var pace=pub>=TARGET.n?'Target reached.':(left>0?((TARGET.n-pub)/left).toFixed(1)+' videos a day needed for '+left+' days.':'Deadline passed.');
  var sum=[];
  if(pl.length)sum.push(pl.length+(pl.length===1?' task pending':' tasks pending'));
  if(over)sum.push(over+' overdue');
  if(openReq)sum.push(openReq+(openReq===1?' request open':' requests open'));
  var line=sum.length?sum.join(', ')+'.':'Nothing pending. Assign the first piece of work below.';
  var h='<section class="hero" data-a><div><h1>Hi<span>'+esc(line)+'</span></h1></div></section>';
  /* command bar */
  var cbh='<div class="card" data-a><div class="row" style="flex-wrap:wrap;margin-bottom:18px"><div class="tabs"><button class="tb'+(state.cb==='assign'?' on':'')+'" data-cb="assign">Assign work</button><button class="tb'+(state.cb==='find'?' on':'')+'" data-cb="find">Find work</button></div></div>';
  if(state.cb==='assign'){
    cbh+='<div class="frow" style="grid-template-columns:2fr 1fr 1fr auto">'+fld('Task','as_t',tin('as_t','What needs to get done today?'))+fld('Assign to','as_o',tsel('as_o',PEOPLE,'Monish'))+fld('Due','as_d',tsel('as_d',dueOpts(),'today'))+'<button class="btn" id="asgBtn">'+ico('plus')+'Assign task</button></div>';
  }else{
    cbh+='<div class="frow" style="grid-template-columns:1fr 1fr 1fr auto">'+fld('Owner','fo_owner',tsel('fo_owner',['All'].concat(PEOPLE),state.owner))+fld('Status','fo_status',tsel('fo_status',['All','Pending','In progress','Completed'],state.status))+fld('Due','fo_when',tsel('fo_when',[['any','Any time'],['today','Today'],['overdue','Overdue']],state.when))+'<button class="btn" id="goBtn">Open control room'+ico('arrow-up-right')+'</button></div>';
  }
  cbh+='</div>';
  h+=cbh;
  var recent='',n=0;
  for(i=0;i<rs.length&&n<3;i++){if(rs[i].status==='COMPLETED')continue;n++;recent+='<div class="ri"><div class="tkm"><div class="tkt" style="font-size:13px">'+esc(rs[i].title)+'</div><div class="mu sm">'+esc(rs[i].from)+' to '+esc(rs[i].to)+'</div></div><span class="tg '+stCls(rs[i].status)+'">'+sl(rs[i].status)+'</span></div>'}
  var ph='',ch='';
  for(i=0;i<pl.length&&i<6;i++){ph+=taskRow(pl[i])}
  for(i=0;i<cl.length&&i<5;i++){ch+=taskRow(cl[i])}
  h+='<div class="bento mt16 m">'+
  '<div class="card c4" data-a><div class="lbl">Done today</div><div class="row mt16" style="margin-top:20px"><div><div class="num"><span data-count="'+tdDone+'">0</span><small> of '+td+'</small></div><div class="mu sm">'+pl.length+' pending overall</div></div><div class="ring" data-pct="'+pct+'"><b>'+pct+'%</b></div></div></div>'+
  '<div class="card c4" data-a><div class="row"><div class="lbl">Open requests</div><button class="tg ac" data-p="requests">View all</button></div><div class="num"><span data-count="'+openReq+'">0</span></div><div class="list">'+(recent||'<div class="empty" style="padding:6px 0">No open requests.</div>')+'</div></div>'+
  '<div class="card tint c4" data-a><div class="lbl">100 video target</div><div class="num"><span data-count="'+pub+'">0</span><small> of '+TARGET.n+'</small></div><div class="mu sm">'+pace+'</div><div class="bar"><i data-w="'+Math.min(100,pub)+'"></i></div><div class="mu sm mt8">Deadline '+TARGET.label+'</div></div>'+
  '</div>'+
  '<div class="bento mt16"><div class="card c7" data-a><div class="row" style="margin-bottom:12px"><div class="h3">Pending work</div><button class="tg ac" data-p="tasks">All tasks</button></div><div class="list">'+(ph||'<div class="empty">Nothing pending.</div>')+'</div></div>'+
  '<div class="card c5" data-a><div class="h3" style="margin-bottom:12px">Completed</div><div class="list">'+(ch||'<div class="empty">Completed work shows up here.</div>')+'</div></div></div>';
  return h;
}
function greet(){var h=new Date().getHours();return h<12?'Good morning':h<17?'Good afternoon':'Good evening'}
function filteredTasks(){
  var r=[],ts=T(),today=iso(new Date()),i,k=state.taskTab;
  for(i=0;i<ts.length;i++){var t=ts[i],ok=true;
    if(k==='today')ok=t.due===today;else if(k==='pending')ok=t.status!=='COMPLETED';else if(k==='completed')ok=t.status==='COMPLETED';else if(k==='overdue')ok=isOverdue(t);else if(k==='mine')ok=t.to==='Nikhil';
    if(ok&&state.owner!=='All'&&t.to!==state.owner)ok=false;
    if(ok&&state.status!=='All'&&t.status!==state.status.toUpperCase())ok=false;
    if(ok&&state.when==='today'&&t.due!==today)ok=false;
    if(ok&&state.when==='overdue'&&!isOverdue(t))ok=false;
    if(ok)r.push(t)}
  return r;
}
function vTasks(){
  var tb=[['pending','Pending'],['today','Today'],['completed','Completed'],['overdue','Overdue'],['mine','My tasks']],h=pageHead('Tasks','Assigned daily, tracked to done.'),i;
  h+='<div class="row" style="flex-wrap:wrap;margin-bottom:20px" data-a><div class="tabs">';
  for(i=0;i<tb.length;i++){h+='<button class="tb'+(state.taskTab===tb[i][0]?' on':'')+'" data-tab="'+tb[i][0]+'">'+tb[i][1]+'</button>'}
  h+='</div><button class="btn" id="newTask">'+ico('plus')+'Assign task</button></div>';
  if(state.owner!=='All'||state.status!=='All'||state.when!=='any'){h+='<div class="gap mu" style="margin-bottom:14px" data-a>Filtered by '+state.owner+', '+state.status+', '+state.when+'<button class="tg ac" id="clrF">Clear filters</button></div>'}
  var f=filteredTasks();
  h+='<div class="card" data-a><div class="list">'+(f.length?'':'<div class="empty">Nothing here yet.</div>');
  for(i=0;i<f.length;i++){h+=taskRow(f[i])}
  return h+'</div></div>';
}
function vRequests(){
  var rs=R(),tabs=['ALL','RAISED','IN PROGRESS','HOLD','COMPLETED'],i,j,n=0;
  var form='<div class="card stick" data-a><div class="h3" style="margin-bottom:18px">Raise a request</div><div class="stack">'+fld('Request','rq_title',tin('rq_title','For example: XYZ supply'))+fld('Details','rq_detail','<textarea id="rq_detail" rows="3" placeholder="Quantity, deadline, anything that helps"></textarea>')+'<div class="frow">'+fld('From','rq_from',tsel('rq_from',PEOPLE,'Pranav'))+fld('To','rq_to',tsel('rq_to',PEOPLE,'Nikhil'))+'</div>'+fld('Priority','rq_pri',tsel('rq_pri',['Normal','High','Urgent'],'Normal'))+'<button class="btn" id="reqBtn">'+ico('paper-plane-tilt')+'Raise request</button></div></div>';
  var tb='<div class="tabs" style="margin-bottom:16px" data-a>';
  for(i=0;i<tabs.length;i++){var c=0;for(j=0;j<rs.length;j++){if(tabs[i]==='ALL'||rs[j].status===tabs[i])c++}tb+='<button class="tb'+(state.reqTab===tabs[i]?' on':'')+'" data-rt="'+tabs[i]+'">'+(tabs[i]==='ALL'?'All':sl(tabs[i]))+' '+c+'</button>'}
  tb+='</div>';
  var lst='';
  for(i=0;i<rs.length;i++){if(state.reqTab==='ALL'||rs[i].status===state.reqTab){n++;lst+=reqRow(rs[i])}}
  if(!n)lst='<div class="card"><div class="empty" style="padding:6px 0">No requests here yet.</div></div>';
  return pageHead('Requests','Raise a demand. Follow it from raised to completed.',syncNote())+'<div class="two">'+form+'<div>'+tb+lst+'</div></div>';
}
function vObjectives(){
  var pub=publishedCount(),left=daysLeft(),pct=Math.min(100,Math.round(pub*100/TARGET.n)),need=pub>=TARGET.n?0:(left>0?((TARGET.n-pub)/left).toFixed(1):'0');
  return pageHead('Objectives','What are we building toward?')+
  '<div class="card tint" data-a><div class="row" style="flex-wrap:wrap;gap:24px"><div style="flex:1 1 320px"><div class="lbl">Primary objective</div><div class="h3 mt8" style="font-size:21.5px">100 video campaign</div><div class="mu mt8">50 SQL, 30 Claude, 20 Grok. Counted from content moved to Published.</div></div><div><div class="num"><span data-count="'+pub+'">0</span><small> of '+TARGET.n+'</small></div></div></div><div class="bar"><i data-w="'+pct+'"></i></div><div class="kv"><div><small>Deadline</small><b>'+TARGET.label+'</b></div><div><small>Days left</small><b>'+left+'</b></div><div><small>Videos a day needed</small><b>'+need+'</b></div></div></div>'+
  '<div class="bento mt16"><div class="card c6" data-a><div class="h3">Build audience</div><div class="mu mt8">Instagram, LinkedIn, YouTube and X.</div><div class="mt16"><span class="tg warn">Target not set</span></div></div><div class="card c6" data-a><div class="h3">Monetization</div><div class="mu mt8">Revenue, lead and conversion targets.</div><div class="mt16"><span class="tg warn">Selling not started</span></div></div></div>';
}
function vProjects(){
  var P=[['Content engine','Nikhil and Monish','30 Nov 2026'],['Distribution engine','Pranav','15 Nov 2026'],['Monetization system','Pranav and Nikhil','10 Jan 2027'],['Brand and creative kit','Monish','25 Oct 2026']],h=pageHead('Projects','Four engines moving the studio forward.',sampleNote())+'<div class="card" data-a><div class="list">',i;
  for(i=0;i<P.length;i++){h+='<div class="ri"><div class="tkm"><div class="tkt" style="font-size:15.5px">'+P[i][0]+'</div><div class="mu sm">Owner: '+P[i][1]+'</div></div><span class="due">Deadline '+P[i][2]+'</span></div>'}
  return h+'</div></div>';
}
var STAGES=['IDEA','SCRIPT','RAW','VIDEO','CREATIVE','REVIEW','READY','PUBLISHED'];
function stageSel(list,cur,id){var h='<select class="mv" data-mv="'+id+'" aria-label="Move to stage">',i;for(i=0;i<list.length;i++){h+='<option value="'+list[i]+'"'+(list[i]===cur?' selected':'')+'>'+sl(list[i])+'</option>'}return h+'</select>'}
function vContent(){
  var cs=byType('content'),h=pageHead('Content studio','From raw idea to published content.'),i,j;
  h+='<div class="card" data-a><div class="frow" style="grid-template-columns:2fr 1fr 1fr 1fr auto">'+fld('Title','ct_title',tin('ct_title','For example: 5 AI tools you should know'))+fld('Platform','ct_plat',tsel('ct_plat',['Instagram','YouTube','LinkedIn','X'],'Instagram'))+fld('Owner','ct_owner',tsel('ct_owner',PEOPLE,'Monish'))+fld('Deadline','ct_due',tin('ct_due','','date'))+'<button class="btn" id="ctBtn">'+ico('plus')+'Add idea</button></div></div>';
  h+='<div class="board mt16" data-a>';
  for(i=0;i<STAGES.length;i++){var c='',n=0;
    for(j=0;j<cs.length;j++){if(cs[j].status!==STAGES[i])continue;n++;c+='<div class="bc" data-id="'+cs[j].id+'"><b>'+esc(cs[j].title)+'</b><div class="mu sm">'+esc(cs[j].priority)+', '+esc(cs[j].to)+(cs[j].due?', '+cs[j].due:'')+'</div>'+stageSel(STAGES,cs[j].status,cs[j].id)+recActs(cs[j].id)+'</div>'}
    h+='<div class="col"><h4><span>'+sl(STAGES[i])+'</span><span class="mono">'+n+'</span></h4>'+(c||'<div class="mu sm" style="padding:8px 4px">Empty</div>')+'</div>'}
  return h+'</div>';
}
function upKind(u){return (u.priority||'').split(' | ')[0].split(' · ')[0]||'File'}
function upSize(u){var p=(u.priority||'').split(' · ');return p[1]||''}
function upCard(u){
  var kind=upKind(u),size=upSize(u),url=/^https?:\/\//.test(u.detail||'')?u.detail:'',id='',icn=kind==='Video'?'video':kind==='Image'?'image':kind==='Audio'?'waveform':kind==='Link'?'link':'file';
  var loc=isLocal(u)?u.detail.substring(6):'';
  if(url.indexOf('drive.google.com')>-1){var m=url.match(/[-\w]{25,}/);if(m)id=m[0]}
  return '<div class="card tile" data-id="'+u.id+'"><div class="th"'+(loc?' data-local="'+esc(loc)+'" data-k="'+kind+'" data-n="'+esc(u.to||'')+'"':'')+'>'+ico(icn)+(kind==='Image'&&id?'<img src="https://drive.google.com/thumbnail?id='+id+'&sz=w600" alt="" loading="lazy">':'')+'</div><h5>'+esc(u.title)+'</h5><div class="mu sm">'+esc(u.from)+', '+esc(u.due||'')+(size?', '+size:'')+'</div><div class="row mt16" style="margin-top:14px">'+recActs(u.id)+'<span class="tg ok">'+(loc?'Saved here':'Uploaded')+'</span>'+(loc?'<button class="tg ac" data-open="'+esc(loc)+'">Open'+ico('arrow-up-right')+'</button><button class="tg" data-dl="'+esc(loc)+'" aria-label="Download" title="Download">'+ico('download-simple')+'</button>':'')+(url?'<a class="tg ac" href="'+esc(url)+'" target="_blank" rel="noopener">Open'+ico('arrow-up-right')+'</a>'+(id?'<a class="tg" href="https://drive.google.com/uc?export=download&id='+id+'" aria-label="Download" title="Download">'+ico('download-simple')+'</a>':''):'')+'</div></div>';
}
function vCreative(){
  var us=byType('upload'),tabs=['ALL','Video','Image','Audio','Document','Link'],h=pageHead('Creative','Everything the studio has made, in one place.'),i,j,n=0,mon=cnt(T(),function(t){return t.to==='Monish'&&t.status!=='COMPLETED'});
  h+='<div class="row" style="flex-wrap:wrap;margin-bottom:20px" data-a><div class="tabs">';
  for(i=0;i<tabs.length;i++){h+='<button class="tb'+(state.crTab===tabs[i]?' on':'')+'" data-ct="'+tabs[i]+'">'+(tabs[i]==='ALL'?'All':tabs[i])+'</button>'}
  h+='</div><div class="mu">Monish has <b style="color:var(--tx)">'+mon+'</b> pending '+(mon===1?'task':'tasks')+'</div></div><div class="grid3" data-a>';
  for(j=0;j<us.length;j++){var k=upKind(us[j]);if(state.crTab==='ALL'||k===state.crTab){n++;h+=upCard(us[j])}}
  h+='</div>';
  if(!n)h+='<div class="card" data-a><div class="empty" style="padding:6px 0">No creative work yet. Add files on the Uploads page.</div></div>';
  return h;
}
function vUploads(){
  var us=byType('upload'),today=iso(new Date()),tabs=['ALL','TODAY','VIDEO','IMAGE','OTHER'],i,j,n=0,h=pageHead('Daily uploads','Drop the day\'s work. Images, videos, any format.',syncNote('files'));
  h+='<div class="card" data-a><div class="frow">'+fld('Uploaded by','up_by',tsel('up_by',PEOPLE,'Monish'))+fld('Title','up_note',tin('up_note','Optional, defaults to the file name'))+'</div>'+
  '<div class="mt16"><label class="drop" for="fileIn">'+ico('cloud-arrow-up')+'<b>Drop files here or click to choose</b><span class="mu">JPG, PNG, MP4, MOV, PDF or any format</span><div id="upMsg" class="mu mt8" role="status"></div></label><input type="file" id="fileIn" multiple hidden></div>'+
  '<div class="frow mt16" style="grid-template-columns:1fr auto">'+fld('Or add a link','up_link',tin('up_link','Drive, YouTube or Canva link, best for large videos','url'))+'<button class="btn g" id="linkBtn">'+ico('link')+'Add link</button></div></div>';
  h+='<div class="tabs mt24" style="margin-bottom:16px" data-a>';
  for(i=0;i<tabs.length;i++){h+='<button class="tb'+(state.upTab===tabs[i]?' on':'')+'" data-ut="'+tabs[i]+'">'+(tabs[i]==='ALL'?'All':sl(tabs[i]))+'</button>'}
  h+='</div><div class="grid3" data-a>';
  for(j=0;j<us.length;j++){var u=us[j],k=upKind(u),ok=true,t=state.upTab;
    if(t==='TODAY')ok=u.due===today;else if(t==='VIDEO')ok=k==='Video';else if(t==='IMAGE')ok=k==='Image';else if(t==='OTHER')ok=(k!=='Video'&&k!=='Image');
    if(ok){n++;h+=upCard(u)}}
  h+='</div>';
  if(!n)h+='<div class="card" data-a><div class="empty" style="padding:6px 0">Nothing uploaded yet. Drop the first file above.</div></div>';
  return h;
}
var upMax=25*1024*1024;
function kindOf(f){var m=f.type||'',n=f.name.toLowerCase();if(m.indexOf('video')===0)return 'Video';if(m.indexOf('image')===0)return 'Image';if(m.indexOf('audio')===0)return 'Audio';if(/\.(pdf|docx?|xlsx?|pptx?|txt|csv)$/.test(n))return 'Document';return 'File'}
function sizeLabel(b){return b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB'}
function upMsg(t){var e=$('upMsg');if(e)e.textContent=t}
function sendFiles(files,o){
  o=o||{};
  var q=[],i,type=o.type||'upload',by=o.by||($('up_by')?$('up_by').value:'Monish'),note=(o.note!==undefined?o.note:($('up_note')?$('up_note').value.trim():''));
  for(i=0;i<files.length;i++){q.push(files[i])}
  function next(){
    if(!q.length){upMsg('');if(!o.noRender)render(true);return}
    var f=q.shift();
    if(CFG.SCRIPT_URL&&f.size>upMax){toast(f.name+' is over 25 MB. Add it as a link instead.');next();return}
    if(!CFG.SCRIPT_URL){
      var key='f_'+uid(),mdl0=(type==='model');
      upMsg('Saving '+f.name+' ('+sizeLabel(f.size)+')');
      var finish=function(ok){
        if(!ok){toast('This browser blocked file storage. Use Add link instead.');next();return}
        addItem({type:type,title:note||f.name,detail:'local:'+key,from:by,to:(mdl0?(o.tag||'Other'):f.name),priority:(mdl0?((o.ver||'v1')+' · '):(kindOf(f)+' · '))+sizeLabel(f.size),status:(mdl0?'TESTING':'UPLOADED'),due:iso(new Date()),notes:(mdl0?((o.notes?o.notes+'. ':'')+'File: '+f.name):'')});
        toast('Saved '+f.name);next()};
      var mt=f.type||mimeFor(f.name);
      if(f.size>200*1048576||!window.FileReader){idbPut(key,f,finish)}
      else{var fr0=new FileReader();fr0.onload=function(){idbPut(key,{buf:fr0.result,type:mt,name:f.name},finish)};fr0.onerror=function(){idbPut(key,f,finish)};fr0.readAsArrayBuffer(f)}
      return;
    }
    upMsg('Uploading '+f.name+' ('+sizeLabel(f.size)+')');
    var rd=new FileReader();
    rd.onload=function(){
      var b64=String(rd.result).split(',')[1]||'',now=new Date().toISOString(),mdl=(type==='model');
      var it={id:uid(),type:type,title:note||f.name,detail:'',from:by,to:(mdl?(o.tag||'Other'):f.name),priority:(mdl?((o.ver||'v1')+' · '):(kindOf(f)+' · '))+sizeLabel(f.size),status:(mdl?'TESTING':'UPLOADED'),due:iso(new Date()),notes:(mdl?((o.notes?o.notes+'. ':'')+'File: '+f.name):''),created:now,updated:now};
      lastWrite=Date.now();
      fetch(CFG.SCRIPT_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'upload',item:it,file:{name:f.name,mime:f.type||'application/octet-stream',data:b64}})})
      .then(function(r){return r.json()})
      .then(function(d){if(d&&d.url){it.detail=d.url;items.unshift(it);state.fresh=it.id;cache();toast('Uploaded '+f.name)}else{toast('Upload failed: '+((d&&d.error)||'unknown error'))}next()})
      .catch(function(){toast('Sent, but could not confirm. Check the sheet.');next()});
    };
    rd.readAsDataURL(f);
  }
  next();
}
function modelOpts(){return {type:'model',by:$('m_by').value,note:$('m_name').value.trim(),tag:$('m_type').value,ver:$('m_ver').value.trim()||'v1',notes:$('m_notes').value.trim()}}
function dropOpts(el){return el.getAttribute('data-kind')==='model'?modelOpts():null}
function mdCard(m){
  var p=(m.priority||'').split(' · '),ver=p[0]||'',size=p[1]||'',url=/^https?:\/\//.test(m.detail||'')?m.detail:'',sts=['TESTING','ACTIVE','ARCHIVED'],cl=['warn','ok','mt'],h='',i;
  for(i=0;i<sts.length;i++){h+='<button class="'+(m.status===sts[i]?'on':'')+'" style="--c:var(--'+cl[i]+')" data-st="'+m.id+'|'+sts[i]+'" aria-pressed="'+(m.status===sts[i])+'">'+sl(sts[i])+'</button>'}
  return '<div class="card" data-id="'+m.id+'"><div class="row"><span class="lbl">'+esc(m.to)+' model, '+esc(ver)+'</span><span class="tg mt">'+esc(size)+'</span></div><div class="h3 mt8">'+esc(m.title)+'</div>'+(m.notes?'<div class="mu mt8" style="line-height:1.55;white-space:pre-wrap">'+esc(m.notes)+'</div>':'')+'<div class="mu sm mt8">'+esc(m.from)+', '+esc(m.due||'')+'</div>'+recActs(m.id)+'<div class="segb">'+h+(isLocal(m)?'<button class="tg ac" data-open="'+esc(m.detail.substring(6))+'" style="padding:8px 14px">Open'+ico('arrow-up-right')+'</button><button class="tg" data-dl="'+esc(m.detail.substring(6))+'" style="padding:8px 14px" aria-label="Download">'+ico('download-simple')+'</button>':'')+(url?'<a class="tg ac" href="'+esc(url)+'" target="_blank" rel="noopener" style="padding:8px 14px">Open'+ico('arrow-up-right')+'</a>':'')+'</div></div>';
}
function vModels(){
  var ms=byType('model'),i,lst='';
  for(i=0;i<ms.length;i++){lst+='<div style="margin-bottom:14px">'+mdCard(ms[i])+'</div>'}
  if(!ms.length)lst='<div class="card"><div class="empty" style="padding:6px 0">No models registered yet.</div></div>';
  var form='<div class="card stick" data-a><div class="h3" style="margin-bottom:18px">Register a model</div><div class="stack">'+fld('Model name','m_name',tin('m_name','For example: Studio voice A'))+'<div class="frow">'+fld('Version','m_ver',tin('m_ver','v1.0'))+fld('Type','m_type',tsel('m_type',['Voice','LLM','Image','Audio','Other'],'Voice'))+'</div>'+fld('Uploaded by','m_by',tsel('m_by',PEOPLE,'Monish'))+fld('Notes','m_notes',tin('m_notes','What it does, training data, settings'))+
  '<label class="drop" for="mFile" data-kind="model" style="padding:26px 16px">'+ico('cloud-arrow-up')+'<b style="font-size:14px">Drop model files or click</b><span class="mu sm">.pth, .onnx, .gguf, .safetensors, .zip, up to 25 MB</span><div id="upMsg" class="mu sm mt8" role="status"></div></label><input type="file" id="mFile" multiple hidden>'+
  fld('Or add a link','m_link',tin('m_link','Drive or Hugging Face link, best for large models','url'))+'<button class="btn g" id="mlinkBtn">'+ico('link')+'Add link</button></div></div>';
  return pageHead('AI models','Your model repository for voice, language and image models.','<div class="note">'+ico('info')+'<span>This stores and tracks models. Running them needs a separate server.</span></div>'+syncNote('files'))+'<div class="two">'+form+'<div data-a>'+lst+'</div></div>';
}

/* ---------- Instagram (daily fetch via Apps Script) ---------- */
var ig={data:null,loading:false,err:''};
function loadIG(cb){
  if(!CFG.SCRIPT_URL||ig.loading)return;ig.loading=true;
  fetch(CFG.SCRIPT_URL+(CFG.SCRIPT_URL.indexOf('?')>-1?'&':'?')+'what=instagram').then(function(r){return r.json()}).then(function(d){ig.loading=false;ig.err='';ig.data=d;if(cb)cb()}).catch(function(){ig.loading=false;ig.err='Could not reach the sheet. Redeploy Code.gs as a new version, then try again.';if(cb)cb()});
}
function igRefresh(){
  if(!CFG.SCRIPT_URL)return;toast('Fetching from Instagram...');
  fetch(CFG.SCRIPT_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'ig_refresh'})}).then(function(r){return r.json()}).then(function(d){
    if(d&&d.ok){toast('Instagram updated')}else{toast((d&&d.error)||'Instagram fetch failed')}
    ig.loading=false;loadIG(function(){if(state.page==='instagram')render(true)})}).catch(function(){toast('Could not reach the sheet')});
}
function fmtN(n){n=Number(n)||0;return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'K':String(n)}
function igSteps(){
  return '<ol class="steps"><li><span>Make sure the Instagram account is <b>Professional</b> (Business or Creator). Settings, Account type and tools.</span></li>'+
  '<li><span>Open <b>developers.facebook.com</b>, create an app, add the <b>Instagram</b> product and choose <b>API setup with Instagram login</b>. Add your account as a tester if asked.</span></li>'+
  '<li><span>Click <b>Generate token</b> for your account and copy the long token.</span></li>'+
  '<li><span>Open your Apps Script project, Project Settings, Script properties, add <code>IG_TOKEN</code> with that token. Then paste the new <code>Code.gs</code>, and Deploy, Manage deployments, Edit, New version.</span></li>'+
  '<li><span>In the editor pick <code>installDailyTrigger</code> and press Run once. It fetches now and then every morning at 7.</span></li></ol>';
}
function vInsta(){
  var h=pageHead('Instagram','Daily updates from the studio account.'),d=ig.data,i;
  if(!CFG.SCRIPT_URL){return h+'<div class="card" data-a><div class="h3">Instagram sync is paused</div><p class="mu mt8" style="line-height:1.55">Daily Instagram updates need the Google backend, which is switched off for now. Everything else works fully on this device. You can still upload Instagram posts and reels on the Uploads page and they will show here on the site.</p><button class="btn mt16" data-p="uploads">Go to Uploads</button></div>'}
  if(!d){if(!ig.loading&&!ig.err)loadIG(function(){if(state.page==='instagram')render(true)});return h+'<div class="card" data-a><div class="empty" style="padding:6px 0">'+(ig.err?esc(ig.err):'Loading from your sheet...')+'</div></div>'}
  if(!d.connected){return h+'<div class="card" data-a><div class="h3">One-time setup, about 10 minutes</div><p class="mu mt8" style="line-height:1.55">Instagram only shares data through its official API, so a token is needed once. It stays inside your Apps Script, never in this page.</p>'+igSteps()+'</div>'}
  if(!d.profile){return h+'<div class="card" data-a><div class="h3">Connected, waiting for the first fetch</div>'+(d.error?'<p class="mu mt8" style="color:var(--bad)">'+esc(d.error)+'</p>':'<p class="mu mt8">The daily job has not run yet.</p>')+'<button class="btn mt16" id="igRef">Fetch now</button></div>'}
  var p=d.profile,cap=String(p.caption||''),at=cap.lastIndexOf(' | @'),bio=at>-1?cap.substring(0,at):cap,un=at>-1?cap.substring(at+4):'',posts=d.posts||[],sn=d.snaps||[];
  sn.sort(function(a,b){return a.date<b.date?-1:1});sn=sn.slice(-7);
  var tl=0,tc=0,best=null;for(i=0;i<Math.min(10,posts.length);i++){tl+=Number(posts[i].likes)||0;tc+=Number(posts[i].comments)||0;if(!best||(Number(posts[i].likes)||0)>(Number(best.likes)||0))best=posts[i]}
  var np=Math.min(10,posts.length),fol=Number(p.followers)||0,prev=sn.length>1?Number(sn[sn.length-2].followers):null;
  h+='<div class="card" data-a><div class="ig-hero">'+(/^https:/.test(p.media_url)?'<img class="ig-av" src="'+esc(p.media_url)+'" alt="" referrerpolicy="no-referrer">':'<div class="ig-av"></div>')+
  '<div style="flex:1;min-width:220px"><div class="h3">@'+esc(un)+'</div><p class="mu mt8" style="line-height:1.5;max-width:60ch">'+esc(bio||'No bio')+'</p></div>'+
  '<div class="ig-st"><div><b>'+fmtN(fol)+'</b><span>Followers'+(prev!==null?' ('+(fol-prev>=0?'+':'')+(fol-prev)+' today)':'')+'</span></div><div><b>'+fmtN(p.media_count)+'</b><span>Posts</span></div><div><b>'+fmtN(p.likes)+'</b><span>Following</span></div></div>'+
  '<button class="btn g" id="igRef">'+ico('arrows-clockwise')+'Fetch now</button></div><div class="mu sm mt16">Last fetched '+esc(String(p.ts||'').substring(0,16).replace('T',' '))+(d.error?' <span style="color:var(--bad)">Last error: '+esc(d.error)+'</span>':'')+'</div></div>';
  /* followers over time and averages, real data only */
  h+='<div class="bento mt16"><div class="card c7" data-a><div class="lbl">Followers, last '+sn.length+' day'+(sn.length===1?'':'s')+'</div>';
  if(sn.length<2){h+='<div class="empty mt16" style="padding:6px 0">The trend appears after two daily fetches.</div>'}
  else{var mx=0,mn=1e12;for(i=0;i<sn.length;i++){var v=Number(sn[i].followers)||0;if(v>mx)mx=v;if(v<mn)mn=v}var rg=Math.max(1,mx-mn);h+='<div class="cols mt16" style="display:flex;gap:10px;align-items:flex-end;height:120px;padding-top:0">';
    for(i=0;i<sn.length;i++){var vv=Number(sn[i].followers)||0;h+='<div style="flex:1;text-align:center;display:flex;flex-direction:column;justify-content:flex-end"><div style="height:'+(18+Math.round((vv-mn)/rg*70))+'px;background:var(--ac);border-radius:8px 8px 4px 4px"></div><div class="mu sm" style="margin-top:6px">'+vv+'</div></div>'}h+='</div>'}
  h+='</div><div class="card c5" data-a><div class="lbl">Last '+np+' posts</div><div class="kv" style="margin-top:14px"><div><small>Avg likes</small><b>'+(np?Math.round(tl/np):0)+'</b></div><div><small>Avg comments</small><b>'+(np?Math.round(tc/np):0)+'</b></div></div>'+(best?'<div class="mu sm mt16">Top post: '+(Number(best.likes)||0)+' likes, '+esc(best.date)+'</div>':'')+'</div></div>';
  h+='<div class="grid3 mt16" data-a>';
  for(i=0;i<posts.length;i++){var po=posts[i];h+='<div class="card ig-post flat">'+(/^https:/.test(po.media_url)?'<img class="im" loading="lazy" referrerpolicy="no-referrer" src="'+esc(po.media_url)+'" alt="">':'<div class="im"></div>')+'<div class="bd2"><p>'+esc(po.caption||'No caption')+'</p><div class="ig-m"><span>'+ico('heart')+(Number(po.likes)||0)+'</span><span>'+ico('chat-circle')+(Number(po.comments)||0)+'</span><span>'+esc(po.date)+'</span>'+(/^https:/.test(po.permalink)?'<a class="tg ac" href="'+esc(po.permalink)+'" target="_blank" rel="noopener">Open</a>':'')+'</div></div></div>'}
  h+='</div>';
  if(!posts.length)h+='<div class="card" data-a><div class="empty" style="padding:6px 0">No posts returned yet.</div></div>';
  return h;
}
/* voice studio */
var voice={buf:null,out:null,name:'',url:'',blob:null,pitch:0,fx:'none',rec:null,chunks:[]};
function stLabel(n){return (n>0?'+':'')+n+' semitones'}
function vVoice(){
  var pre=[['Deep',-4,'none'],['Giant',-8,'reverb'],['Chipmunk',7,'none'],['Robot',0,'robot'],['Radio',0,'radio'],['Echo',0,'echo']],i,ph='';
  for(i=0;i<pre.length;i++){ph+='<button class="tb" data-vp="'+pre[i][1]+'|'+pre[i][2]+'">'+pre[i][0]+'</button>'}
  var fxs=[['none','No effect'],['robot','Robot'],['echo','Echo'],['reverb','Reverb and cave'],['radio','Radio']];
  var left='<div class="card stick" data-a><div class="h3" style="margin-bottom:18px">Source</div><div class="gap"><label class="btn g" for="vFile" style="cursor:pointer">'+ico('file-audio')+'Choose audio or video</label><input type="file" id="vFile" accept="audio/*,video/*" hidden><button class="btn g" id="recBtn">'+(voice.rec?ico('stop')+'Stop recording':ico('microphone')+'Record mic')+'</button></div><div class="mu sm mt8" id="vSrc">'+(voice.buf?esc(voice.name)+', '+voice.buf.duration.toFixed(1)+' s':'No audio loaded yet')+'</div>'+
  '<div class="h3" style="margin:28px 0 14px">Voice</div><div class="tabs">'+ph+'</div><div class="stack mt16">'+fld('Pitch, '+stLabel(voice.pitch),'vPitch','<input type="range" id="vPitch" min="-12" max="12" step="1" value="'+voice.pitch+'">')+fld('Effect','vFx',tsel('vFx',fxs,voice.fx))+'<button class="btn" id="vApply">'+ico('lightning')+'Apply and preview</button></div><div class="mu sm mt8" id="vMsg" role="status"></div></div>';
  var right='<div data-a><div class="card"><div class="lbl">Original</div><canvas class="wv mt8" id="wvIn" aria-label="Original waveform"></canvas></div>';
  if(voice.url){right+='<div class="card mt16"><div class="lbl">Result</div><canvas class="wv mt8" id="wvOut" aria-label="Result waveform"></canvas><audio controls src="'+voice.url+'" style="width:100%;margin-top:16px"></audio><div class="frow mt16" style="grid-template-columns:auto 1fr auto"><a class="btn" href="'+voice.url+'" download="voice-modulated.wav">'+ico('download-simple')+'Download WAV</a>'+fld('Save as','v_by',tsel('v_by',PEOPLE,'Monish'))+'<button class="btn g" id="vSave">'+ico('cloud-arrow-up')+'Save to Drive</button></div></div>'}
  right+='</div>';
  return pageHead('AI voice studio','Reshape a voice with pitch and character. Runs free in your browser.','<div class="note">'+ico('info')+'<span>Pitch and effects, not voice cloning. Cloning needs a GPU server.</span></div>')+'<div class="two">'+left+right+'</div>';
}
function vMsg(t){var e=$('vMsg');if(e)e.textContent=t}
function AC(){return window.AudioContext||window.webkitAudioContext}
function drawWave(id,buf){
  var c=$(id);if(!c||!buf)return;
  var w=c.width=(c.clientWidth||600)*2,h=c.height=128,x=c.getContext('2d'),d=buf.getChannelData(0),step=Math.max(1,Math.floor(d.length/w)),i,j,mn,mx,v,col=(getComputedStyle(document.documentElement).getPropertyValue('--act')||'#7aa8ff').trim();
  x.clearRect(0,0,w,h);x.fillStyle=col;
  for(i=0;i<w;i++){mn=1;mx=-1;for(j=0;j<step;j+=Math.max(1,Math.floor(step/16))){v=d[i*step+j]||0;if(v<mn)mn=v;if(v>mx)mx=v}x.fillRect(i,(1+mn)*h/2,1,Math.max(1,(mx-mn)*h/2))}
}
function decodeBlob(file,name){
  var rd=new FileReader();vMsg('Reading audio');
  rd.onload=function(){var c=new (AC())();c.decodeAudioData(rd.result,function(b){voice.buf=b;voice.out=null;voice.name=name;voice.url='';render(true)},function(){toast('Could not read that audio. Try MP3, WAV or MP4.')})};
  rd.readAsArrayBuffer(file);
}
function wsola(x,sf){
  var W=1536,Hs=W/2,delta=384,Ha=Hs/sf,n=x.length,outLen=Math.floor(n*sf),out=new Float32Array(outLen+W),nm=new Float32Array(outLen+W),win=new Float32Array(W),i,k,prev=0;
  for(i=0;i<W;i++){win[i]=0.5-0.5*Math.cos(2*Math.PI*i/W)}
  for(k=0;k*Hs<outLen;k++){
    var nom=Math.round(k*Ha),best=nom;
    if(nom+W>=n)break;
    if(k>0){
      var tg=prev+Hs;if(tg+W>=n)break;
      var lo=Math.max(0,nom-delta),hi=Math.min(n-W-1,nom+delta),bc=-1e30,c,sum;
      for(c=lo;c<=hi;c+=4){sum=0;for(i=0;i<W;i+=8){sum+=x[c+i]*x[tg+i]}if(sum>bc){bc=sum;best=c}}
    }
    var o=k*Hs;
    for(i=0;i<W;i++){out[o+i]+=x[best+i]*win[i];nm[o+i]+=win[i]}
    prev=best;
  }
  for(i=0;i<outLen;i++){if(nm[i]>0.001)out[i]/=nm[i]}
  return out.subarray(0,outLen);
}
function shiftChannel(x,st){
  if(!st)return x;
  var r=Math.pow(2,st/12),n=Math.floor(x.length/r),y=new Float32Array(n),j,p,i0,f;
  for(j=0;j<n;j++){p=j*r;i0=Math.floor(p);f=p-i0;y[j]=x[i0]*(1-f)+(x[i0+1]||0)*f}
  return wsola(y,r);
}
function processVoice(buf,st,fx,done){
  var ch=Math.min(buf.numberOfChannels,2),sr=buf.sampleRate,pc=[],c;
  for(c=0;c<ch;c++){pc.push(shiftChannel(buf.getChannelData(c),st))}
  var len=pc[0].length,tail=(fx==='echo'||fx==='reverb')?Math.floor(sr*2.5):0;
  var OC=window.OfflineAudioContext||window.webkitOfflineAudioContext,oc=new OC(ch,len+tail,sr),ab=oc.createBuffer(ch,len,sr);
  for(c=0;c<ch;c++){ab.getChannelData(c).set(pc[c])}
  var src=oc.createBufferSource();src.buffer=ab;
  if(fx==='robot'){var g=oc.createGain();g.gain.value=0;var os=oc.createOscillator();os.type='sine';os.frequency.value=55;os.connect(g.gain);var og=oc.createGain();og.gain.value=2.2;src.connect(g);g.connect(og);og.connect(oc.destination);os.start()}
  else if(fx==='echo'){var d=oc.createDelay(1);d.delayTime.value=0.28;var fb=oc.createGain();fb.gain.value=0.38;var wet=oc.createGain();wet.gain.value=0.6;src.connect(oc.destination);src.connect(d);d.connect(fb);fb.connect(d);d.connect(wet);wet.connect(oc.destination)}
  else if(fx==='reverb'){var cv=oc.createConvolver(),il=Math.floor(sr*2.2),imp=oc.createBuffer(2,il,sr),q,m;for(q=0;q<2;q++){var dd=imp.getChannelData(q);for(m=0;m<il;m++){dd[m]=(Math.random()*2-1)*Math.pow(1-m/il,2.5)}}cv.buffer=imp;var dr=oc.createGain();dr.gain.value=0.8;var wt=oc.createGain();wt.gain.value=0.5;src.connect(dr);dr.connect(oc.destination);src.connect(cv);cv.connect(wt);wt.connect(oc.destination)}
  else if(fx==='radio'){var hp=oc.createBiquadFilter();hp.type='highpass';hp.frequency.value=500;var lp=oc.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;var rg=oc.createGain();rg.gain.value=1.4;src.connect(hp);hp.connect(lp);lp.connect(rg);rg.connect(oc.destination)}
  else{src.connect(oc.destination)}
  src.start();
  oc.startRendering().then(done);
}
function toWav(buf){
  var ch=buf.numberOfChannels,n=buf.length,sr=buf.sampleRate,bytes=44+n*ch*2,ab=new ArrayBuffer(bytes),v=new DataView(ab),i,c,o=44;
  function ws(off,t){var k;for(k=0;k<t.length;k++){v.setUint8(off+k,t.charCodeAt(k))}}
  ws(0,'RIFF');v.setUint32(4,bytes-8,true);ws(8,'WAVE');ws(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,sr,true);v.setUint32(28,sr*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);ws(36,'data');v.setUint32(40,n*ch*2,true);
  var d=[];for(c=0;c<ch;c++){d.push(buf.getChannelData(c))}
  for(i=0;i<n;i++){for(c=0;c<ch;c++){var x=Math.max(-1,Math.min(1,d[c][i]));v.setInt16(o,x<0?x*32768:x*32767,true);o+=2}}
  return new Blob([ab],{type:'audio/wav'});
}
function runVoice(){
  if(!voice.buf){toast('Load or record audio first');return}
  if(voice.buf.duration>300){toast('Please use audio under 5 minutes');return}
  render(true);vMsg('Processing. This takes a few seconds.');
  setTimeout(function(){
    try{processVoice(voice.buf,voice.pitch,voice.fx,function(out){
      if(voice.url){try{URL.revokeObjectURL(voice.url)}catch(err){}}
      voice.out=out;voice.blob=toWav(out);voice.url=URL.createObjectURL(voice.blob);render(true);toast('Voice ready');
    })}catch(err){vMsg('Could not process this audio in your browser')}
  },60);
}
function toggleRec(){
  if(voice.rec){voice.rec.stop();return}
  if(!navigator.mediaDevices||!window.MediaRecorder){toast('Recording is not supported in this browser');return}
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
    voice.chunks=[];var mr=new MediaRecorder(stream);voice.rec=mr;
    mr.ondataavailable=function(e){if(e.data&&e.data.size)voice.chunks.push(e.data)};
    mr.onstop=function(){stream.getTracks().forEach(function(t){t.stop()});voice.rec=null;var b=new Blob(voice.chunks,{type:mr.mimeType||'audio/webm'});decodeBlob(b,'recording')};
    mr.start();render(true);
  }).catch(function(){toast('Microphone permission was denied')});
}
function chanRows(rows,head){
  var h='<div class="card" data-a><div class="list">',i;
  for(i=0;i<rows.length;i++){h+='<div class="ri"><div class="tkm"><div class="tkt" style="font-size:15.5px">'+rows[i][0]+'</div><div class="mu sm">'+rows[i][1]+'</div></div><div class="due mono" style="font-size:13px;color:var(--tx)">'+rows[i][2]+'</div></div>'}
  return h+'</div></div>';
}
function vMarketing(){
  return pageHead('Marketing','Every channel, one clear picture.','<div class="note">'+ico('info')+'<span>No channel data yet. Figures appear once posting and tracking begin.</span></div>')+
  chanRows([['Instagram','Reach, followers, leads','No data'],['LinkedIn','Reach, leads, conversion','No data'],['YouTube','Views, subscribers','No data'],['X','Impressions, engagement, leads','No data']]);
}
var CRMSTAGES=['NEW','QUALIFIED','DISCUSSION','FOLLOW-UP','PROPOSAL','WON','LOST'];
function vCrm(){
  var ls=byType('lead'),h=pageHead('CRM','A clean pipeline from first hello to won.'),i,j;
  h+='<div class="card" data-a><div class="frow" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">'+fld('Name','ld_name',tin('ld_name','Lead name'))+fld('Company','ld_co',tin('ld_co','Company'))+fld('Potential value','ld_val',tin('ld_val','For example: 85K'))+fld('Owner','ld_owner',tsel('ld_owner',PEOPLE,'Pranav'))+fld('Next action','ld_next',tin('ld_next','Send intro deck'))+'<button class="btn" id="ldBtn">'+ico('plus')+'Add lead</button></div></div>';
  h+='<div class="board mt16" data-a>';
  for(i=0;i<CRMSTAGES.length;i++){var c='',n=0;
    for(j=0;j<ls.length;j++){if(ls[j].status!==CRMSTAGES[i])continue;n++;c+='<div class="bc" data-id="'+ls[j].id+'"><div class="row"><b>'+esc(ls[j].title)+'</b><span class="mono sm" style="color:var(--act)">'+esc(ls[j].priority)+'</span></div><div class="mu sm">'+esc(ls[j].from)+'</div>'+(ls[j].notes?'<div class="mu sm mt8">Next: '+esc(ls[j].notes)+'</div>':'')+'<div class="mu sm">Owner: '+esc(ls[j].to)+'</div>'+stageSel(CRMSTAGES,ls[j].status,ls[j].id)+recActs(ls[j].id)+'</div>'}
    h+='<div class="col"><h4><span>'+sl(CRMSTAGES[i])+'</span><span class="mono">'+n+'</span></h4>'+(c||'<div class="mu sm" style="padding:8px 4px">No leads</div>')+'</div>'}
  return h+'</div>';
}
function vMoney(){
  var won=cnt(byType('lead'),function(l){return l.status==='WON'});
  return pageHead('Turn attention<br>into revenue.','Selling has not started. Every channel begins at zero.')+
  '<div class="bento" data-a><div class="card tint c5"><div class="lbl">Revenue to date</div><div class="num">&#8377;<span data-count="0">0</span></div><span class="tg warn">Not started</span><div class="kv"><div><small>Leads</small><b>'+byType('lead').length+'</b></div><div><small>Won</small><b>'+won+'</b></div></div></div><div class="c7">'+chanRows([['YouTube','Revenue, leads, conversion','0'],['LinkedIn','Revenue, leads, conversion','0'],['Instagram','Revenue, leads, conversion','0'],['X','Revenue, leads, conversion','0'],['Website','Revenue, leads, conversion','0'],['Direct business','Revenue, leads, conversion','0']])+'</div></div>';
}
function days7(){var r=[],i;for(i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);r.push([iso(d),d.toLocaleDateString('en-IN',{weekday:'short'})])}return r}
function barChart(vals,labels){
  var mx=1,i,h='<div class="cols">';for(i=0;i<vals.length;i++){if(vals[i]>mx)mx=vals[i]}
  for(i=0;i<vals.length;i++){h+='<div title="'+vals[i]+'"><span class="mono">'+vals[i]+'</span><i data-h="'+Math.round(vals[i]*100/mx*0.8)+'"></i><span>'+labels[i]+'</span></div>'}
  return h+'</div>';
}
function vAnalytics(){
  var d=days7(),a=[],b=[],ts=T(),us=byType('upload'),i,j;
  for(i=0;i<d.length;i++){var x=0,y=0;
    for(j=0;j<ts.length;j++){if(ts[j].status==='COMPLETED'&&iso(new Date(ts[j].updated))===d[i][0])x++}
    for(j=0;j<us.length;j++){if(us[j].due===d[i][0])y++}
    a.push(x);b.push(y)}
  var lb=[];for(i=0;i<d.length;i++){lb.push(d[i][1])}
  return pageHead('Analytics','The shape of the last seven days.')+'<div class="bento"><div class="card c6" data-a><div class="h3">Tasks completed</div>'+barChart(a,lb)+'</div><div class="card c6" data-a><div class="h3">Files uploaded</div>'+barChart(b,lb)+'</div></div>';
}
function insights(){
  var out=[],ts=T(),over=[],i,pub=publishedCount(),left=daysLeft(),today=iso(new Date());
  for(i=0;i<ts.length;i++){if(isOverdue(ts[i]))over.push(ts[i])}
  if(pub>=TARGET.n)out.push(['Pace','ok','The 100 video target is reached.']);
  else out.push(['Pace',pub>=Math.round(TARGET.n*(1-left/80))?'ok':'warn',pub+' of '+TARGET.n+' videos are published. '+(left>0?((TARGET.n-pub)/left).toFixed(1)+' videos a day are needed over the next '+left+' days.':'The deadline has passed.')]);
  out.push(over.length?['Risk','bad',over.length+(over.length===1?' task is':' tasks are')+' overdue. Oldest: '+over[over.length-1].title+'.']:['Risk','ok','No overdue tasks.']);
  var held=cnt(R(),function(r){return r.status==='HOLD'}),raised=cnt(R(),function(r){return r.status==='RAISED'});
  out.push(['Requests',held||raised?'warn':'ok',raised+' waiting for a response and '+held+' on hold.']);
  var up=cnt(byType('upload'),function(u){return u.due===today});
  out.push(['Uploads',up?'ok':'warn',up?up+' files uploaded today.':'No work uploaded today yet.']);
  out.push(['Next move','ac',byType('lead').length?'Follow up the leads in your pipeline.':'Selling has not started. Add the first lead in CRM.']);
  return out;
}
function vAI(){
  var ins=insights(),h=pageHead('NTS Intelligence','Your studio\'s operating intelligence, computed from your real work.'),i;
  h+='<div class="bento">';
  for(i=0;i<ins.length;i++){h+='<div class="card '+(i===0?'c12':'c6')+'" data-a><span class="tg '+ins[i][1]+'">'+ins[i][0]+'</span><p style="font-size:clamp(15.5px,2vw,20px);line-height:1.35;letter-spacing:-.02em;margin-top:16px;font-weight:500;max-width:46ch">'+esc(ins[i][2])+'</p></div>'}
  return h+'</div>';
}
function vTeam(){
  var h=pageHead('Team','Three people, one studio.')+'<div class="card" data-a><div class="three">',i;
  for(i=0;i<PEOPLE.length;i++){var p=PEOPLE[i],ts=T(),pend=cnt(ts,function(t){return t.to===p&&t.status!=='COMPLETED'}),done=cnt(ts,function(t){return t.to===p&&t.status==='COMPLETED'}),rq=cnt(R(),function(r){return r.to===p&&r.status!=='COMPLETED'}),up=cnt(byType('upload'),function(u){return u.from===p});
    h+='<div><div class="av" style="width:56px;height:56px;font-size:17px">'+p.charAt(0)+'</div><div class="h3 mt16" style="font-size:20px">'+p+'</div><div class="mu">'+ROLES[p][0]+'</div><span class="tg ac mt16" style="margin-top:16px">'+ROLES[p][1]+'</span><div class="kv"><div><small>Pending</small><b>'+pend+'</b></div><div><small>Done</small><b>'+done+'</b></div><div><small>Requests</small><b>'+rq+'</b></div><div><small>Uploads</small><b>'+up+'</b></div></div></div>'}
  return h+'</div></div>';
}
function vFounder(){
  var rs=R(),ts=T(),urg=cnt(rs,function(r){return r.status!=='COMPLETED'&&r.priority==='Urgent'}),rai=cnt(rs,function(r){return r.status==='RAISED'}),ov=cnt(ts,isOverdue),i,lst='',n=0;
  for(i=0;i<rs.length&&n<5;i++){if(rs[i].status==='RAISED'||(rs[i].status!=='COMPLETED'&&rs[i].priority==='Urgent')){n++;lst+='<div class="ri"><div class="tkm"><div class="tkt" style="font-size:14px">'+esc(rs[i].title)+'</div><div class="mu sm">'+esc(rs[i].from)+' to '+esc(rs[i].to)+'</div></div><span class="tg '+(rs[i].priority==='Urgent'?'bad':'ac')+'">'+esc(rs[i].priority)+'</span></div>'}}
  return '<section class="hero" data-a><div><h1>Command<br>the studio.</h1></div></section>'+
  '<div class="bento"><div class="card c4" data-a><div class="lbl">Urgent requests</div><div class="num"><span data-count="'+urg+'">0</span></div><div class="mu sm">Open and marked urgent</div></div><div class="card c4" data-a><div class="lbl">Waiting for a response</div><div class="num"><span data-count="'+rai+'">0</span></div><div class="mu sm">Raised, not yet picked up</div></div><div class="card c4" data-a><div class="lbl">Overdue tasks</div><div class="num"><span data-count="'+ov+'">0</span></div><div class="mu sm">Past their due date</div></div></div>'+
  '<div class="bento mt16"><div class="card c7" data-a><div class="row" style="margin-bottom:12px"><div class="h3">Needs your attention</div><button class="tg ac" data-p="requests">All requests</button></div><div class="list">'+(lst||'<div class="empty">Nothing needs a decision right now.</div>')+'</div></div><div class="card tint c5" data-a><div class="lbl">Revenue</div><div class="num">&#8377;0</div><span class="tg warn">Not started</span><div class="kv"><div><small>Pending tasks</small><b>'+pendCount()+'</b></div><div><small>Open requests</small><b>'+openCount()+'</b></div></div></div></div>';
}
var VIEWS={command:vCommand,objectives:vObjectives,projects:vProjects,tasks:vTasks,requests:vRequests,uploads:vUploads,models:vModels,voice:vVoice,content:vContent,creative:vCreative,marketing:vMarketing,instagram:vInsta,crm:vCrm,monetization:vMoney,analytics:vAnalytics,ai:vAI,team:vTeam};

function render(keep){
  var v=$('view'),fn=state.founder&&state.page==='command'?vFounder:VIEWS[state.page];
  v.innerHTML=fn();
  renderNav();renderSide();
  $('sync').textContent=syncText();$('cnBtn').textContent=CFG.SCRIPT_URL?'Change connection':'Connect sheet';
  var fb=$('fvBtn');fb.className='fvb'+(state.founder?' on':'');fb.setAttribute('aria-pressed',state.founder?'true':'false');
  $('bdot').style.display=(openCount()||cnt(T(),isOverdue))?'block':'none';
  playIn(v,!keep);hydrateLocal(v);
  if(state.page==='voice'){drawWave('wvIn',voice.buf);drawWave('wvOut',voice.out)}
  if(state.fresh){var f=v.querySelector('[data-id="'+state.fresh+'"]');if(f&&G&&!RM){G.from(f,{opacity:0,y:-10,duration:.5,ease:'power3.out',clearProps:'transform,opacity'})}state.fresh=null}
  if(!keep)window.scrollTo(0,0);
}
function renderSide(){
  var h='',i,n,pend,pr={Nikhil:'Founder and Strategic Head',Monish:'Creative Head',Pranav:'Operations and Marketing Lead'};
  for(i=0;i<PEOPLE.length;i++){n=PEOPLE[i];pend=cnt(T(),function(t){return t.to===n&&t.status!=='COMPLETED'});
    h+='<button class="pp" data-who="'+n+'"><span class="av" aria-hidden="true">'+n.charAt(0)+'</span><span><b>'+n+'</b><span>'+pr[n]+'</span></span><span class="ct">'+pend+'<small>pending</small></span></button>'}
  $('ppl').innerHTML=h;
}
function hydrateLocal(root){
  var els=root.querySelectorAll('[data-local]'),i;
  for(i=0;i<els.length;i++){(function(el){var k=el.getAttribute('data-local'),kd=el.getAttribute('data-k'),nm=el.getAttribute('data-n')||'';
    if(kd!=='Image'&&kd!=='Video')return;
    idbBlob(k,nm,function(b){
      if(!b||!b.size){el.className+=' bad';return}
      var u=blobUrl(k,b);
      if(kd==='Image'){var im=document.createElement('img');im.alt='';im.onerror=function(){if(im.parentNode)im.parentNode.removeChild(im);el.className+=' bad'};im.src=u;el.appendChild(im)}
      else{var v=document.createElement('video');v.muted=true;v.preload='metadata';v.playsInline=true;v.setAttribute('playsinline','');v.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
        v.onloadedmetadata=function(){try{v.currentTime=Math.min(.6,(v.duration||1)/2)}catch(err){}};v.onerror=function(){if(v.parentNode)v.parentNode.removeChild(v)};v.src=u;el.appendChild(v)}})})(els[i])}
}
function go(p){var cn=$('coin');if(cn&&!RM){cn.className='coin';void cn.offsetWidth;cn.className='coin spin'}state.page=p;state.last[groupOf(p)]=p;if(p!=='command')state.founder=false;$('sheet').className='sheet';render()}
