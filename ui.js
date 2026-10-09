/* ---------- form helpers (visible labels above every control) ---------- */
function fld(label,id,ctl,cls){return '<div class="fld'+(cls?' '+cls:'')+'"><label for="'+id+'">'+label+'</label>'+ctl+'</div>'}
function tin(id,ph,type,val){return '<input id="'+id+'" type="'+(type||'text')+'" placeholder="'+esc(ph||'')+'" value="'+esc(val||'')+'" autocomplete="off">'}
function tsel(id,list,sel){var h='<select id="'+id+'">',i;for(i=0;i<list.length;i++){var v=list[i] instanceof Array?list[i][0]:list[i],l=list[i] instanceof Array?list[i][1]:list[i];h+='<option value="'+esc(v)+'"'+(v===sel?' selected':'')+'>'+esc(l)+'</option>'}return h+'</select>'}
function dueOpts(){return [['today','Today'],['tomorrow','Tomorrow'],['week','This week']]}

/* ---------- navigation ---------- */
var PAGES={command:['Command center','squares-four'],tasks:['Tasks','check-square'],requests:['Requests','paper-plane-tilt'],objectives:['Objectives','target'],projects:['Projects','kanban'],content:['Content','film-strip'],creative:['Creative','palette'],uploads:['Uploads','upload-simple'],models:['AI models','cube'],voice:['AI voice','waveform'],marketing:['Marketing','megaphone'],instagram:['Instagram','instagram-logo'],crm:['CRM','users-three'],monetization:['Monetization','currency-inr'],analytics:['Analytics','chart-line-up'],ai:['Intelligence','sparkle'],team:['Team','users']};
var GROUPS=[['Home','house',['command']],['Work','check-square',['tasks','requests','objectives','projects']],['Studio','film-strip',['content','creative','uploads','models','voice']],['Growth','chart-line-up',['marketing','instagram','crm','monetization','analytics']],['Intelligence','sparkle',['ai']],['Team','users',['team']]];
var state={page:'command',founder:false,cb:'assign',taskTab:'pending',owner:'All',status:'All',when:'any',reqTab:'ALL',upTab:'ALL',crTab:'ALL',open:{},fresh:null,last:{}};
function groupOf(p){var i;for(i=0;i<GROUPS.length;i++){if(GROUPS[i][2].indexOf(p)>-1)return i}return 0}
var SNC=[['#86bbff','#4f8fe8'],['#74d9c6','#3aa795'],['#aea0f6','#7a68db'],['#f4b887','#df8a4c'],['#86dc98','#44a860'],['#f299b8','#d65e8a'],['#85c9ee','#4a9bc9']];
function tabsetFor(p){
  if(p==='inventory'&&typeof IV_TABS!=='undefined')return {t:IV_TABS,c:IVS.tab,a:'data-iv',ic:{overview:'squares-four',purchases:'files',sales:'currency-inr',stock:'cube',moves:'arrows-clockwise',assets:'stack',expiry:'clock',vendors:'users',reports:'chart-line-up'}};
  if(p==='social'&&typeof SOC_TABS!=='undefined')return {t:SOC_TABS,c:SS.tab,a:'data-sc',ic:{overview:'squares-four',accounts:'users',content:'film-strip',audience:'chart-line-up',insights:'sparkle',research:'magnifying-glass',leads:'users-three',reports:'files',settings:'command'}};
  return null;
}
function renderNav(){
  var gi=groupOf(state.page),h='<div class="seg1">',i,pg;
  for(i=0;i<GROUPS.length;i++){h+='<button class="gb'+(i===gi?' on':'')+'" data-g="'+i+'"><span class="it" style="--h1:'+SNC[i%SNC.length][0]+';--h2:'+SNC[i%SNC.length][1]+'">'+ico(GROUPS[i][1])+'</span><span>'+GROUPS[i][0]+'</span></button>'}
  h+='</div>';pg=GROUPS[gi][2];
  if(pg.length>1){h+='<div class="seg2">';for(i=0;i<pg.length;i++){h+='<button class="sb'+(state.page===pg[i]?' on':'')+'" data-p="'+pg[i]+'">'+PAGES[pg[i]][0]+'</button>'}h+='</div>'}
  $('nav').innerHTML=h;
  var sn='<div class="sl">'+GROUPS[gi][0]+'</div>',c=SNC[gi%SNC.length],st='style="--h1:'+c[0]+';--h2:'+c[1]+'"',IC={overview:'squares-four',purchases:'files',sales:'currency-inr',stock:'cube',moves:'arrows-clockwise',assets:'stack',expiry:'clock',vendors:'users',reports:'chart-line-up'},j;
  var ts=pg.length===1?tabsetFor(pg[0]):null;
  if(ts){for(j=0;j<ts.t.length;j++){sn+='<button class="sn'+(ts.c===ts.t[j][0]?' on':'')+'" '+ts.a+'="tab|'+ts.t[j][0]+'"><span class="it" '+st+'>'+ico(ts.ic[ts.t[j][0]]||'cube')+'</span><span>'+ts.t[j][1]+'</span></button>'}}
  else{for(j=0;j<pg.length;j++){sn+='<button class="sn'+(state.page===pg[j]?' on':'')+'" data-p="'+pg[j]+'"><span class="it" '+st+'>'+ico(PAGES[pg[j]][1])+'</span><span>'+PAGES[pg[j]][0]+'</span></button>'}}
  var sv=$('snav');if(sv){sv.innerHTML=sn;var on=sv.querySelector('.on');if(on&&sv.clientHeight&&(on.offsetTop+on.offsetHeight>sv.scrollTop+sv.clientHeight||on.offsetTop<sv.scrollTop))sv.scrollTop=Math.max(0,on.offsetTop-sv.clientHeight/2)}
  var dn='',d,dg,k2;
  for(d=0;d<GROUPS.length;d++){dg=GROUPS[d];var op=(state.dopen&&state.dopen[d]!==undefined)?state.dopen[d]:(d===gi),cc=SNC[d%SNC.length],sty='style="--h1:'+cc[0]+';--h2:'+cc[1]+'"',dts=dg[2].length===1?tabsetFor(dg[2][0]):null,one=dg[2].length===1&&!dts;
    if(one){dn+='<button class="dg dn'+(state.page===dg[2][0]?' on':'')+'" data-p="'+dg[2][0]+'"><span class="it" '+sty+'>'+ico(dg[1])+'</span><span class="dl">'+dg[0]+'</span></button>';continue}
    dn+='<button class="dg'+(d===gi?' cur':'')+'" data-dg="'+d+'" aria-expanded="'+(op?'true':'false')+'"><span class="it" '+sty+'>'+ico(dg[1])+'</span><span class="dl">'+dg[0]+'</span><i class="ph ph-caret-down car" aria-hidden="true"></i></button><div class="dsub'+(op?' open':'')+'">';
    if(dts){for(k2=0;k2<dts.t.length;k2++){dn+='<button class="dn'+(state.page===dg[2][0]&&dts.c===dts.t[k2][0]?' on':'')+'" '+dts.a+'="tab|'+dts.t[k2][0]+'">'+dts.t[k2][1]+'</button>'}}
    else{for(k2=0;k2<dg[2].length;k2++){dn+='<button class="dn'+(state.page===dg[2][k2]?' on':'')+'" data-p="'+dg[2][k2]+'">'+PAGES[dg[2][k2]][0]+'</button>'}}
    dn+='</div>'}
  if($('dnav'))$('dnav').innerHTML=dn;
  if($('mTtl'))$('mTtl').textContent=(PAGES[state.page]||['NIKHILs TECH STUDIO'])[0];
  var bm=[['command','Home','house'],['tasks','Tasks','check-square'],['requests','Requests','paper-plane-tilt'],['uploads','Uploads','upload-simple'],['more','More','dots-three']],b='';
  for(i=0;i<bm.length;i++){b+='<button data-p="'+bm[i][0]+'" class="'+(state.page===bm[i][0]?'on':'')+'">'+ico(bm[i][2])+'<span>'+bm[i][1]+'</span></button>'}
  $('bnav').innerHTML=b;
  var s='',k;for(k in PAGES){s+='<button data-p="'+k+'">'+ico(PAGES[k][1])+PAGES[k][0]+'</button>'}
  $('sheet').innerHTML=s;
}

/* ---------- motion (GSAP, only where it carries meaning) ---------- */
function countUp(el){
  var to=parseFloat(el.getAttribute('data-count'))||0,pre=el.getAttribute('data-pre')||'',suf=el.getAttribute('data-suf')||'';
  if(!G||RM||to===0){el.textContent=pre+to+suf;return}
  var o={v:0};G.to(o,{v:to,duration:.9,ease:'power3.out',onUpdate:function(){el.textContent=pre+Math.round(o.v)+suf}});
}
function playIn(root,intro){
  var nums=root.querySelectorAll('[data-count]'),bars=root.querySelectorAll('[data-w]'),rings=root.querySelectorAll('[data-pct]'),hs=root.querySelectorAll('[data-h]'),i;
  for(i=0;i<nums.length;i++){if(intro)countUp(nums[i]);else nums[i].textContent=(nums[i].getAttribute('data-pre')||'')+nums[i].getAttribute('data-count')+(nums[i].getAttribute('data-suf')||'')}
  function setAll(){
    for(i=0;i<bars.length;i++){bars[i].style.width=bars[i].getAttribute('data-w')+'%'}
    for(i=0;i<hs.length;i++){hs[i].style.height=hs[i].getAttribute('data-h')+'%'}
    for(i=0;i<rings.length;i++){rings[i].style.setProperty('--p',rings[i].getAttribute('data-pct')+'%')}
  }
  if(!G||RM||!intro){setAll();return}
  var j;
  for(j=0;j<bars.length;j++){G.fromTo(bars[j],{width:'0%'},{width:bars[j].getAttribute('data-w')+'%',duration:1,ease:'power3.out',delay:.15})}
  for(j=0;j<hs.length;j++){G.fromTo(hs[j],{height:'0%'},{height:hs[j].getAttribute('data-h')+'%',duration:.9,ease:'power3.out',delay:.15})}
  for(j=0;j<rings.length;j++){G.fromTo(rings[j],{'--p':'0%'},{'--p':rings[j].getAttribute("data-pct")+'%',duration:1,ease:'power3.out',delay:.1})}
  var els=root.querySelectorAll('[data-a]');
  if(els.length)G.fromTo(els,{y:14,opacity:0},{y:0,opacity:1,duration:.55,ease:'power3.out',stagger:.05,clearProps:'transform,opacity'});
}
function toast(m){
  var t=$('toast');t.textContent=m;
  if(!G||RM){t.style.opacity=1;setTimeout(function(){t.style.opacity=0},2200);return}
  G.killTweensOf(t);G.fromTo(t,{opacity:0,y:12},{opacity:1,y:0,duration:.3,ease:'power3.out'});
  G.to(t,{opacity:0,y:8,duration:.3,delay:2.1,ease:'power2.in'});
}

/* ---------- shared view pieces ---------- */
function pageHead(t,s,extra){return '<div class="ph1" data-a><h2>'+t+'</h2><p>'+s+'</p>'+(extra||'')+'</div>'}
function syncNote(kind){return '<div class="note">'+ico(CFG.SCRIPT_URL?'cloud-check':'cloud-slash')+'<span>'+(CFG.SCRIPT_URL?(kind==='files'?'Saving to Google Drive and your sheet':'Synced to your Google sheet'):(kind==='files'?'Files are saved on this device and show here.':'All data is saved on this device.'))+'</span></div>'}
function sampleNote(){return '<div class="note">'+ico('info')+'<span>Plan from your brief. Numbers fill in as you add real work.</span></div>'}
function recActs(id){return '<span class="ra"><button data-edit="'+id+'" aria-label="Edit" title="Edit"><i class="ph ph-pencil-simple" aria-hidden="true"></i></button><button data-del="'+id+'" aria-label="Delete" title="Delete"><i class="ph ph-trash" aria-hidden="true"></i></button></span>'}
function taskRow(t){
  var dn=t.status==='COMPLETED',op=state.open[t.id],od=isOverdue(t);
  return '<div class="ri'+(dn?' dn':'')+'" data-id="'+t.id+'"><button class="ck'+(dn?' d':'')+'" data-tog="'+t.id+'" aria-label="'+(dn?'Mark as pending':'Mark as complete')+'" aria-pressed="'+dn+'"></button><div class="tkm"><div class="tkt">'+esc(t.title)+'</div><div class="mu sm">'+esc(t.to)+', assigned by '+esc(t.from)+'</div>'+(t.detail?'<div class="dsc'+(op?' op':'')+'" data-exp="'+t.id+'" title="Click to expand">'+esc(t.detail)+'</div>':'')+'</div><span class="due'+(od?' bad':'')+'">'+(dn?'Done':dueLabel(t.due))+'</span><button class="tg '+(od?'bad':stCls(t.status))+'" data-cyc="'+t.id+'" title="Change status">'+sl(t.status)+'</button>'+recActs(t.id)+'</div>';
}
function reqRow(r){
  var sts=['RAISED','IN PROGRESS','HOLD','COMPLETED'],cl=['ac','ac','warn','ok'],h='',i;
  for(i=0;i<sts.length;i++){h+='<button class="'+(r.status===sts[i]?'on ':'')+cl[i]+'" style="--c:var(--'+(cl[i]==='ac'?'act':cl[i])+')" data-st="'+r.id+'|'+sts[i]+'" aria-pressed="'+(r.status===sts[i])+'">'+sl(sts[i])+'</button>'}
  return '<div class="card" data-id="'+r.id+'" style="margin-bottom:14px"><div class="row" style="align-items:flex-start;flex-wrap:wrap"><div style="flex:1 1 280px"><div class="lbl">'+esc(r.from)+' to '+esc(r.to)+', '+fmt(r.created)+'</div><div class="h3 mt8">'+esc(r.title)+'</div>'+(r.detail?'<div class="mu mt8" style="line-height:1.55;white-space:pre-wrap">'+esc(r.detail)+'</div>':'')+'</div><span class="tg '+(r.priority==='Urgent'?'bad':r.priority==='High'?'warn':'mt')+'">'+esc(r.priority)+'</span>'+recActs(r.id)+'</div><div class="segb">'+h+'</div></div>';
}
