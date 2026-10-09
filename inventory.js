/* ---------- Inventory module: purchases, sales, stock ledger, assets, expiry, vendors, reports ----------
   Data lives on this device (localStorage key nts_inv, attachments in IndexedDB as inv:<purchase id>).
   Stock is never stored: it is always computed from the movement ledger, so it cannot drift. */
var IV_KEY='nts_inv';
var IV_IN={OPEN:1,PURCHASE:1,RETURN:1,ADJ_IN:1};
var IV_LBL={OPEN:'Opening balance',PURCHASE:'Purchase',RETURN:'Accepted return',ADJ_IN:'Adjustment in',SALE:'Sale',ISSUE:'Internal issue',ADJ_OUT:'Adjustment out'};
var IV_CATS=['Raw material','Consumable','Packaging','Spare part','Electronics','Equipment','Software / licence','Stationery','Other'];
var IV_UOM=['pcs','box','kg','g','litre','ml','m','set','pack','licence'];
var IV_MODES=['Cash','UPI','Bank Transfer','Card','Credit','Other'];
var IV_PAY=['Paid','Partially Paid','Pending'];
var IV_CLASS=[['stock','Stock item'],['asset','Asset / equipment'],['service','Service / licence']];
var IV_TABS=[['overview','Overview'],['purchases','Purchases'],['sales','Sales'],['stock','Current Stock'],['moves','Stock Movements'],['assets','Assets & Equipment'],['expiry','Expiry & Validity'],['vendors','Vendors'],['reports','Reports']];
var IVS={tab:'overview',q:'',pf:'ALL',ef:'ALL'};

function ivLoad(){
  var d=null;try{d=JSON.parse(localStorage.getItem(IV_KEY)||'null')}catch(e){d=null}
  d=d||{};
  d.purchases=d.purchases||[];d.sales=d.sales||[];d.issues=d.issues||[];d.mv=d.mv||[];
  d.items=d.items||{};d.vendors=d.vendors||{};d.assets=d.assets||{};d.log=d.log||[];d.seq=d.seq||{};
  return d;
}
var INV=ivLoad();
function ivSave(){try{localStorage.setItem(IV_KEY,JSON.stringify(INV));return true}catch(e){toast('Could not save: browser storage is full or blocked.');return false}}

/* ---------- helpers ---------- */
function ivInr(n){n=Number(n)||0;var f=Math.round(n*100)%100!==0;return '₹'+n.toLocaleString('en-IN',{minimumFractionDigits:f?2:0,maximumFractionDigits:2})}
function ivQty(n){n=Math.round((Number(n)||0)*1000)/1000;return n.toLocaleString('en-IN',{maximumFractionDigits:3})}
function ivR2(n){return Math.round((Number(n)||0)*100)/100}
function ivToday(){var d=new Date(),m=d.getMonth()+1,x=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(x<10?'0':'')+x}
function ivDays(s){if(!s)return null;var a=Date.parse(s+'T00:00:00'),b=Date.parse(ivToday()+'T00:00:00');return isNaN(a)?null:Math.round((a-b)/864e5)}
function ivDate(s){if(!s)return '<span class="mu">-</span>';var d=new Date(s+'T00:00:00');return isNaN(d.getTime())?esc(s):d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
function ivId(p){INV.seq[p]=(INV.seq[p]||0)+1;var n=String(INV.seq[p]);while(n.length<4)n='0'+n;return p+'-'+n}
function ivKey(name,sku){return String(sku||name||'').trim().toLowerCase()}
function ivUser(){var u='';try{u=localStorage.getItem('nts_inv_user')||''}catch(e){}return u||'Pranav'}
function ivLog(action,ref,detail){INV.log.unshift({ts:new Date().toISOString(),user:ivUser(),action:action,ref:ref||'',detail:detail||''});if(INV.log.length>500)INV.log.length=500}
function ivChip(t,c){return '<span class="tg '+(c||'mt')+'">'+esc(t)+'</span>'}
function ivMv(kind,key,qty,ref,reason,date,demo){
  var e={id:ivId('MV'),ts:new Date().toISOString(),date:date||ivToday(),key:key,kind:kind,qty:qty,ref:ref||'',by:ivUser(),reason:reason||''};
  if(demo)e.demo=true;INV.mv.push(e);return e;
}
function ivStock(){var m={},i,e;for(i=0;i<INV.mv.length;i++){e=INV.mv[i];m[e.key]=ivR2((m[e.key]||0)+(IV_IN[e.kind]?e.qty:-e.qty)*1)}return m}
function ivStock1(k){return ivStock()[k]||0}
function ivAvgCost(){var c={},q={},m={},i,p;for(i=0;i<INV.purchases.length;i++){p=INV.purchases[i];if(p.cls!=='stock')continue;c[p.key]=(c[p.key]||0)+p.total;q[p.key]=(q[p.key]||0)+p.qty}
  for(i in c){if(q[i]>0)m[i]=c[i]/q[i]}return m}
function ivItemName(k){var it=INV.items[k];return it?it.name:k}
function ivStockKeys(){var k,a=[];for(k in INV.items){if(INV.items[k].cls!=='asset'&&INV.items[k].cls!=='service')a.push(k)}a.sort(function(x,y){return ivItemName(x).toLowerCase()<ivItemName(y).toLowerCase()?-1:1});return a}
function ivCalc(qty,price,disc,tax){var base=qty*price,after=Math.max(0,base-disc),t=after*tax/100;return {base:base,after:after,tax:t,total:ivR2(after+t)}}
function ivMatch(q,arr){if(!q)return true;return arr.join(' ').toLowerCase().indexOf(q.toLowerCase())>-1}
function ivMonth(s){return String(s||'').slice(0,7)}
function ivDue(p){return ivR2(p.total-p.paid)}

/* status of a date: kind exp|valid|warr */
function ivDateStat(d,kind){
  var n=ivDays(d);if(n===null)return null;
  if(kind==='warr'){
    if(n<0)return ['Warranty expired','bad',n];
    if(n<=30)return ['Warranty ending soon','warn',n];
    return ['In warranty','ok',n];
  }
  if(n<0)return [kind==='valid'?'Validity ended':'Expired','bad',n];
  if(n<=7)return ['Within 7 days','bad',n];
  if(n<=15)return ['Within 15 days','warn',n];
  if(n<=30)return ['Within 30 days','warn',n];
  return ['Valid','ok',n];
}
function ivExpiryRows(){
  var rows=[],i,p,s;
  for(i=0;i<INV.purchases.length;i++){p=INV.purchases[i];
    if(p.exp){s=ivDateStat(p.exp,'exp');rows.push({p:p,kind:'Expiry',date:p.exp,st:s})}
    if(p.vtill){s=ivDateStat(p.vtill,'valid');rows.push({p:p,kind:'Validity',date:p.vtill,from:p.vfrom,st:s})}
    if(p.wend){s=ivDateStat(p.wend,'warr');rows.push({p:p,kind:'Warranty',date:p.wend,from:p.wstart,st:s})}}
  rows.sort(function(a,b){return a.st[2]-b.st[2]});
  return rows;
}
function ivCsv(name,head,rows){
  function q(v){v=String(v==null?'':v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
  var s=[head.map(q).join(',')],i;for(i=0;i<rows.length;i++)s.push(rows[i].map(q).join(','));
  var b=new Blob(['﻿'+s.join('\n')],{type:'text/csv'}),u=URL.createObjectURL(b),a=document.createElement('a');
  a.href=u;a.download=name+'-'+ivToday()+'.csv';document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(u)},4000);toast('Exported '+name+'.csv');
}
function ivTbl(head,rows,empty){
  var h='<div class="ivt"><table><thead><tr>',i,j,n;
  for(i=0;i<head.length;i++){n=head[i].charAt(0)==='#';h+='<th'+(n?' class="r"':'')+'>'+esc(n?head[i].slice(1):head[i])+'</th>'}
  h+='</tr></thead><tbody>';
  if(!rows.length)h+='<tr><td colspan="'+head.length+'" class="ivem">'+empty+'</td></tr>';
  for(i=0;i<rows.length;i++){h+='<tr'+(rows[i].tr?' '+rows[i].tr:'')+'>';for(j=0;j<head.length;j++){h+='<td'+(head[j].charAt(0)==='#'?' class="r"':'')+'>'+rows[i].c[j]+'</td>'}h+='</tr>'}
  return h+'</tbody></table></div>';
}
function ivBtn(label,act,cls){return '<button class="btn sm '+(cls||'g')+'" data-iv="'+act+'">'+label+'</button>'}
function ivTool(addLabel,addAct,extra){
  return '<div class="ivtool"><input id="iv_q" class="ivq" type="search" placeholder="Search this table" value="'+esc(IVS.q)+'" aria-label="Search this table">'+(extra||'')+'<span class="grow"></span>'+(addLabel?'<button class="btn sm" data-iv="'+addAct+'">'+ico('plus')+addLabel+'</button>':'')+'</div>';
}

/* ---------- tab bodies ---------- */
function ivOverview(){
  var st=ivStock(),avg=ivAvgCost(),keys=ivStockKeys(),i,k,val=0,low=[],mo=ivMonth(ivToday()),pur=0,sal=0,dues=0,p,exp=[],rows,h,mvs;
  for(i=0;i<keys.length;i++){k=keys[i];val+=Math.max(0,st[k]||0)*(avg[k]||0);
    if((INV.items[k].reorder||0)>0&&(st[k]||0)<=INV.items[k].reorder)low.push(k);else if((st[k]||0)<=0&&INV.items[k]&&(avg[k]!==undefined))low.push(k)}
  for(i=0;i<INV.purchases.length;i++){p=INV.purchases[i];if(ivMonth(p.date)===mo)pur+=p.total;if(p.pstatus!=='Paid')dues+=ivDue(p)}
  for(i=0;i<INV.sales.length;i++){if(ivMonth(INV.sales[i].date)===mo)sal+=INV.sales[i].total}
  rows=ivExpiryRows();for(i=0;i<rows.length;i++){if(rows[i].st[2]<=30)exp.push(rows[i])}
  h='<div class="ivk" data-a>'+
   ivK('Stock value',ivInr(val),keys.length+' items tracked')+
   ivK('Low or out of stock',String(low.length),low.length?'Needs reorder':'All stocked')+
   ivK('Purchases this month',ivInr(pur),'Spend incl. GST')+
   ivK('Sales this month',ivInr(sal),'Internal issues excluded')+
   ivK('Expiring or ending in 30 days',String(exp.length),exp.length?'Check Expiry tab':'Nothing due')+
   ivK('Payments pending',ivInr(dues),'Owed to vendors')+'</div>';
  h+='<div class="ivg">';
  h+='<div class="card" data-a><div class="row"><div class="h3">Needs attention</div></div><div class="list">';
  var n=0;
  for(i=0;i<low.length&&n<5;i++,n++){h+='<div class="ri"><div class="grow"><b>'+esc(ivItemName(low[i]))+'</b><div class="mu sm">Stock '+ivQty(st[low[i]]||0)+' '+esc(INV.items[low[i]].uom||'')+(INV.items[low[i]].reorder?' | reorder at '+ivQty(INV.items[low[i]].reorder):'')+'</div></div>'+ivChip((st[low[i]]||0)<=0?'Out of stock':'Low','bad')+'</div>'}
  for(i=0;i<exp.length&&n<9;i++,n++){h+='<div class="ri"><div class="grow"><b>'+esc(exp[i].p.item)+'</b><div class="mu sm">'+exp[i].kind+' | '+ivDate(exp[i].date)+'</div></div>'+ivChip(exp[i].st[0],exp[i].st[1])+'</div>'}
  if(!n)h+='<div class="empty">Nothing needs attention right now.</div>';
  h+='</div></div>';
  mvs=INV.mv.slice(-6).reverse();
  h+='<div class="card" data-a><div class="row"><div class="h3">Recent movements</div><button class="tg ac" data-iv="tab|moves">All movements</button></div><div class="list">';
  for(i=0;i<mvs.length;i++){h+='<div class="ri"><div class="grow"><b>'+esc(ivItemName(mvs[i].key))+'</b><div class="mu sm">'+IV_LBL[mvs[i].kind]+' | '+ivDate(mvs[i].date)+' | '+esc(mvs[i].by)+'</div></div><b class="mono '+(IV_IN[mvs[i].kind]?'ivin':'ivout')+'">'+(IV_IN[mvs[i].kind]?'+':'-')+ivQty(mvs[i].qty)+'</b></div>'}
  if(!mvs.length)h+='<div class="empty">No stock movements yet. Record a purchase to begin.</div>';
  h+='</div></div></div>';
  h+='<div class="gap mt16" data-a><button class="btn" data-iv="newPur">'+ico('plus')+'Add purchase</button><button class="btn g" data-iv="newSale">Record sale</button><button class="btn g" data-iv="newIssue">Issue internally</button><button class="btn g" data-iv="newAdj">Adjust stock</button></div>';
  if(!INV.purchases.length&&!INV.sales.length)h+='<div class="card mt16" data-a><div class="h3">Start fresh or look around</div><p class="mu" style="margin:6px 0 12px;line-height:1.5">Your inventory is empty. Add a real purchase, or load a few clearly labelled demo records to see how the tabs work. Demo records can be cleared in one click.</p>'+ivBtn('Load demo data','demo')+'</div>';
  return h;
}
function ivK(l,v,s){return '<div class="card ivkc"><div class="lbl">'+l+'</div><div class="num ivnum">'+v+'</div><div class="mu sm">'+s+'</div></div>'}

function ivPurchases(){
  var rows=[],i,p,list=INV.purchases.slice().reverse(),pc;
  for(i=0;i<list.length;i++){p=list[i];
    if(IVS.pf!=='ALL'&&p.pstatus!==IVS.pf)continue;
    if(!ivMatch(IVS.q,[p.id,p.item,p.sku,p.cat,p.vendor,p.inv,p.by,p.notes]))continue;
    pc=p.pstatus==='Paid'?'ok':p.pstatus==='Pending'?'bad':'warn';
    rows.push({c:[esc(p.id)+(p.demo?' <span class="tg warn">Demo</span>':''),ivDate(p.date),'<b>'+esc(p.item)+'</b><div class="mu sm">'+esc(p.sku||'')+(p.sku?' | ':'')+esc(p.cat||'')+'</div>',ivQty(p.qty)+' '+esc(p.uom),ivInr(p.price),ivInr(p.total),ivChip(p.pstatus,pc)+(p.pstatus==='Partially Paid'?'<div class="mu sm">Due '+ivInr(ivDue(p))+'</div>':'')+'<div class="mu sm">'+esc(p.mode)+'</div>',p.vendor?'<button class="lnk" data-iv="vendor|'+esc(p.vendor)+'">'+esc(p.vendor)+'</button>':'<span class="mu">-</span>',esc(p.by),(p.attName?'<button class="tg ac" data-iv="att|'+p.id+'">File</button> ':'')+'<button class="ibtn" data-iv="del|pur|'+p.id+'" aria-label="Delete purchase">'+ico('trash')+'</button>']});
  }
  var pf='<select id="iv_pf" class="ivq" aria-label="Payment status"><option value="ALL">All payments</option>',j;for(j=0;j<IV_PAY.length;j++)pf+='<option'+(IVS.pf===IV_PAY[j]?' selected':'')+'>'+IV_PAY[j]+'</option>';pf+='</select>';
  return '<div class="card" data-a>'+ivTool('Add purchase','newPur',pf+ivBtn('Export CSV','csv|pur'))+ivTbl(['ID','Date','Item','#Qty','#Unit price','#Total','Payment','Purchased from','By',''],rows,'No purchases match. Use Add purchase to record one.')+'</div>';
}
function ivSales(){
  var rows=[],i,s,list=INV.sales.slice().reverse(),rev=0,r2=[],iss=INV.issues.slice().reverse(),pc;
  for(i=0;i<list.length;i++){s=list[i];rev+=s.total;
    if(!ivMatch(IVS.q,[s.id,s.item,s.customer,s.by,s.notes]))continue;
    pc=s.pstatus==='Paid'?'ok':s.pstatus==='Pending'?'bad':'warn';
    rows.push({c:[esc(s.id)+(s.demo?' <span class="tg warn">Demo</span>':''),ivDate(s.date),'<b>'+esc(s.item)+'</b>',ivQty(s.qty)+' '+esc(s.uom||''),ivInr(s.price),ivInr(s.total),ivChip(s.pstatus,pc)+'<div class="mu sm">'+esc(s.mode)+'</div>',esc(s.customer||'-'),esc(s.by),'<button class="ibtn" data-iv="del|sale|'+s.id+'" aria-label="Delete sale">'+ico('trash')+'</button>']});}
  for(i=0;i<iss.length;i++){s=iss[i];
    if(!ivMatch(IVS.q,[s.id,s.item,s.to,s.purpose,s.by]))continue;
    r2.push({c:[esc(s.id)+(s.demo?' <span class="tg warn">Demo</span>':''),ivDate(s.date),'<b>'+esc(s.item)+'</b>',ivQty(s.qty)+' '+esc(s.uom||''),esc(s.to),esc(s.purpose||'-'),esc(s.by),'<button class="ibtn" data-iv="del|iss|'+s.id+'" aria-label="Delete issue">'+ico('trash')+'</button>']});}
  return '<div class="card" data-a><div class="row" style="margin-bottom:8px"><div class="h3">Sales register</div><span class="mu sm">Revenue to date <b class="mono">'+ivInr(rev)+'</b></span></div>'+ivTool('Record sale','newSale',ivBtn('Export CSV','csv|sale'))+ivTbl(['ID','Date','Item','#Qty','#Unit price','#Total','Payment','Customer','By',''],rows,'No sales recorded yet.')+'</div>'+
   '<div class="card mt16" data-a><div class="row" style="margin-bottom:8px"><div><div class="h3">Internal issues</div><div class="mu sm">Stock used inside the studio. Reduces stock, never counted as revenue.</div></div><button class="btn sm" data-iv="newIssue">'+ico('plus')+'Issue stock</button></div>'+ivTbl(['ID','Date','Item','#Qty','Issued to','Purpose','By',''],r2,'No internal issues yet.')+'</div>';
}
function ivStockTab(){
  var st=ivStock(),avg=ivAvgCost(),keys=ivStockKeys(),rows=[],i,k,it,q,s,tot=0;
  for(i=0;i<keys.length;i++){k=keys[i];it=INV.items[k];q=st[k]||0;
    if(!ivMatch(IVS.q,[it.name,it.sku,it.cat,it.loc]))continue;
    s=q<=0?['Out of stock','bad']:(it.reorder>0&&q<=it.reorder)?['Low','warn']:['In stock','ok'];tot+=Math.max(0,q)*(avg[k]||0);
    rows.push({c:['<b>'+esc(it.name)+'</b>'+(it.demo?' <span class="tg warn">Demo</span>':''),esc(it.sku||'-'),esc(it.cat||'-'),esc(it.loc||'-'),'<b class="mono">'+ivQty(q)+'</b> '+esc(it.uom||''),it.reorder?ivQty(it.reorder):'<span class="mu">-</span>',avg[k]!==undefined?ivInr(avg[k]):'-',ivInr(Math.max(0,q)*(avg[k]||0)),ivChip(s[0],s[1]),'<button class="tg ac" data-iv="adjItem|'+esc(k)+'">Adjust</button> <button class="tg" data-iv="reorder|'+esc(k)+'">Reorder level</button>']})}
  return '<div class="card" data-a><div class="row" style="margin-bottom:8px"><div class="mu sm">Available = Opening + Purchases + Accepted returns + Adjustments in - Sales - Internal issues - Adjustments out</div><span class="mu sm">Value <b class="mono">'+ivInr(tot)+'</b></span></div>'+ivTool('Adjust stock','newAdj',ivBtn('Export CSV','csv|stock'))+ivTbl(['Item','SKU','Category','Location','#Available','#Reorder at','#Avg cost','#Value','Status',''],rows,'No stock items yet. A stock-item purchase or an opening balance creates one.')+'</div>';
}
function ivMoves(){
  var rows=[],i,e,list=INV.mv.slice().reverse(),lg=[];
  for(i=0;i<list.length;i++){e=list[i];
    if(!ivMatch(IVS.q,[ivItemName(e.key),e.ref,IV_LBL[e.kind],e.by,e.reason]))continue;
    rows.push({c:[ivDate(e.date),'<b>'+esc(ivItemName(e.key))+'</b>',ivChip(IV_LBL[e.kind],IV_IN[e.kind]?'ok':'warn'),'<b class="mono '+(IV_IN[e.kind]?'ivin':'ivout')+'">'+(IV_IN[e.kind]?'+':'-')+ivQty(e.qty)+'</b>',esc(e.ref||'-'),esc(e.by),esc(e.reason||'-'),'<span class="mu sm">'+esc(new Date(e.ts).toLocaleString('en-IN'))+'</span>']})}
  for(i=0;i<Math.min(INV.log.length,40);i++){lg.push({c:['<span class="mu sm">'+esc(new Date(INV.log[i].ts).toLocaleString('en-IN'))+'</span>',esc(INV.log[i].user),esc(INV.log[i].action),esc(INV.log[i].ref),esc(INV.log[i].detail)]})}
  return '<div class="card" data-a>'+ivTool('Adjust stock','newAdj',ivBtn('Export CSV','csv|mv'))+ivTbl(['Date','Item','Type','#Qty','Reference','By','Reason','Logged at'],rows,'No movements yet.')+'</div>'+
   '<div class="card mt16" data-a><div class="h3" style="margin-bottom:8px">Audit log</div>'+ivTbl(['When','User','Action','Reference','Detail'],lg,'Nothing logged yet.')+'</div>';
}
function ivAssets(){
  var rows=[],i,p,m,ws,list=INV.purchases.slice().reverse();
  for(i=0;i<list.length;i++){p=list[i];if(p.cls!=='asset')continue;
    if(!ivMatch(IVS.q,[p.item,p.sku,p.vendor,p.loc,(INV.assets[p.id]||{}).assigned]))continue;
    m=INV.assets[p.id]||{};ws=p.wend?ivDateStat(p.wend,'warr'):null;
    rows.push({c:[esc(p.id),'<b>'+esc(p.item)+'</b><div class="mu sm">'+esc(p.sku||'')+'</div>',ivDate(p.date),ivInr(p.total),esc(m.assigned||'Unassigned'),esc(m.cond||'Good'),esc(p.loc||'-'),p.wend?ivDate(p.wend):'<span class="mu">No warranty</span>',ws?ivChip(ws[0],ws[1]):'<span class="mu">-</span>','<button class="tg ac" data-iv="asset|'+p.id+'">Update</button>']})}
  return '<div class="card" data-a>'+ivTool('Add asset','newAsset')+ivTbl(['ID','Asset','Bought','#Cost','Assigned to','Condition','Location','Warranty till','Warranty status',''],rows,'No assets yet. Record a purchase with type Asset / equipment.')+'</div>';
}
function ivExpiry(){
  var rows=[],all=ivExpiryRows(),i,r,f=IVS.ef,ok,chips='',opts=[['ALL','All'],['EXPIRED','Expired'],['7','Within 7 days'],['15','Within 15 days'],['30','Within 30 days'],['VALID','Valid'],['WARR','Warranty']];
  for(i=0;i<all.length;i++){r=all[i];
    if(!ivMatch(IVS.q,[r.p.item,r.p.sku,r.p.vendor,r.kind]))continue;
    ok=f==='ALL'||(f==='EXPIRED'&&r.st[2]<0&&r.kind!=='Warranty')||(f==='7'&&r.st[2]>=0&&r.st[2]<=7)||(f==='15'&&r.st[2]>=0&&r.st[2]<=15)||(f==='30'&&r.st[2]>=0&&r.st[2]<=30)||(f==='VALID'&&r.st[2]>30&&r.kind!=='Warranty')||(f==='WARR'&&r.kind==='Warranty');
    if(!ok)continue;
    rows.push({c:['<b>'+esc(r.p.item)+'</b><div class="mu sm">'+esc(r.p.id)+' | '+esc(r.p.vendor||'')+'</div>',r.kind,r.from?ivDate(r.from):'<span class="mu">-</span>',ivDate(r.date),'<b class="mono">'+(r.st[2]<0?Math.abs(r.st[2])+' d ago':r.st[2]+' d')+'</b>',ivChip(r.st[0],r.st[1])]})}
  for(i=0;i<opts.length;i++)chips+='<button class="tb'+(f===opts[i][0]?' on':'')+'" data-iv="ef|'+opts[i][0]+'">'+opts[i][1]+'</button>';
  return '<div class="card" data-a><div class="tabs" style="margin-bottom:12px">'+chips+'</div>'+ivTool('','')+ivTbl(['Item','Type','#Valid from','#Date','#Days','Status'],rows,'Nothing to show. Dates are optional and only appear when you enter them on a purchase.')+'</div>';
}
function ivVendorList(){
  var m={},k,i,p,rows=[],v;
  for(k in INV.vendors)m[k]={name:INV.vendors[k].name,n:0,spend:0,due:0,last:''};
  for(i=0;i<INV.purchases.length;i++){p=INV.purchases[i];if(!p.vendor)continue;k=p.vendor.toLowerCase();
    if(!m[k])m[k]={name:p.vendor,n:0,spend:0,due:0,last:''};
    m[k].n++;m[k].spend+=p.total;m[k].due+=ivDue(p);if(p.date>m[k].last)m[k].last=p.date}
  for(k in m){v=m[k];if(!ivMatch(IVS.q,[v.name,(INV.vendors[k]||{}).phone,(INV.vendors[k]||{}).gst]))continue;
    rows.push({c:['<button class="lnk" data-iv="vendor|'+esc(v.name)+'"><b>'+esc(v.name)+'</b></button>'+((INV.vendors[k]||{}).demo?' <span class="tg warn">Demo</span>':''),esc((INV.vendors[k]||{}).phone||'-'),esc((INV.vendors[k]||{}).gst||'-'),String(v.n),ivInr(v.spend),v.due>0?'<b class="mono ivout">'+ivInr(v.due)+'</b>':ivInr(0),v.last?ivDate(v.last):'-']})}
  return rows;
}
function ivVendors(){
  return '<div class="card" data-a>'+ivTool('Add vendor','newVendor')+ivTbl(['Vendor','Phone','GSTIN','#Purchases','#Total spend','#Dues','Last purchase'],ivVendorList(),'No vendors yet. They appear when you record a purchase, or add one here.')+'</div>';
}
function ivReports(){
  var cat={},ven={},mon={},i,p,s,k,r1=[],r2=[],r3=[],av=ivAvgCost(),st=ivStock(),keys=ivStockKeys(),val=0,sal=0,pur=0,dues=0;
  for(i=0;i<INV.purchases.length;i++){p=INV.purchases[i];pur+=p.total;dues+=ivDue(p);cat[p.cat||'Other']=(cat[p.cat||'Other']||0)+p.total;ven[p.vendor||'(no vendor)']=(ven[p.vendor||'(no vendor)']||0)+p.total;mon[ivMonth(p.date)]=mon[ivMonth(p.date)]||{p:0,s:0};mon[ivMonth(p.date)].p+=p.total}
  for(i=0;i<INV.sales.length;i++){s=INV.sales[i];sal+=s.total;mon[ivMonth(s.date)]=mon[ivMonth(s.date)]||{p:0,s:0};mon[ivMonth(s.date)].s+=s.total}
  for(i=0;i<keys.length;i++)val+=Math.max(0,st[keys[i]]||0)*(av[keys[i]]||0);
  for(k in cat)r1.push({c:[esc(k),ivInr(cat[k])]});
  var vs=[];for(k in ven)vs.push([k,ven[k]]);vs.sort(function(a,b){return b[1]-a[1]});for(i=0;i<vs.length&&i<8;i++)r2.push({c:[esc(vs[i][0]),ivInr(vs[i][1])]});
  var ms=[];for(k in mon)ms.push(k);ms.sort().reverse();for(i=0;i<ms.length&&i<12;i++)r3.push({c:[esc(ms[i]),ivInr(mon[ms[i]].p),ivInr(mon[ms[i]].s),ivInr(mon[ms[i]].s-mon[ms[i]].p)]});
  return '<div class="ivk" data-a>'+ivK('Total purchased',ivInr(pur),INV.purchases.length+' purchases')+ivK('Total sales',ivInr(sal),INV.sales.length+' sales')+ivK('Stock value',ivInr(val),'At average cost')+ivK('Vendor dues',ivInr(dues),'Unpaid portion')+'</div>'+
   '<div class="ivg"><div class="card" data-a><div class="h3" style="margin-bottom:8px">Spend by category</div>'+ivTbl(['Category','#Spend'],r1,'No data yet.')+'</div><div class="card" data-a><div class="h3" style="margin-bottom:8px">Top vendors</div>'+ivTbl(['Vendor','#Spend'],r2,'No data yet.')+'</div></div>'+
   '<div class="card mt16" data-a><div class="h3" style="margin-bottom:8px">Month by month</div>'+ivTbl(['Month','#Purchases','#Sales','#Net'],r3,'No data yet.')+'</div>'+
   '<div class="gap mt16" data-a>'+ivBtn('Export purchases','csv|pur')+ivBtn('Export sales','csv|sale')+ivBtn('Export stock','csv|stock')+ivBtn('Export movements','csv|mv')+'</div>';
}

function vInventory(){
  var h=pageHead('Inventory','Purchases, stock, sales, assets, expiry and vendors in one ledger.'),i,t='',us='',a=ivUser(),body;
  for(i=0;i<IV_TABS.length;i++)t+='<button class="tb'+(IVS.tab===IV_TABS[i][0]?' on':'')+'" data-iv="tab|'+IV_TABS[i][0]+'">'+IV_TABS[i][1]+'</button>';
  for(i=0;i<PEOPLE.length;i++)us+='<option'+(PEOPLE[i]===a?' selected':'')+'>'+PEOPLE[i]+'</option>';
  h+='<div class="row ivhd" data-a><div class="tabs ivtabs" role="tablist">'+t+'</div><label class="ivwho">Acting as <select id="iv_user" aria-label="Acting as">'+us+'</select></label></div>';
  var hasDemo=false;for(i=0;i<INV.purchases.length;i++){if(INV.purchases[i].demo)hasDemo=true}
  if(hasDemo)h+='<div class="ivdemo" data-a><span>Demo data is loaded. These records are examples only.</span>'+ivBtn('Clear demo data','cleardemo')+'</div>';
  h+='<div class="ivnote mu sm" data-a>Saved on this device only. Use Export CSV for a backup.</div>';
  body={overview:ivOverview,purchases:ivPurchases,sales:ivSales,stock:ivStockTab,moves:ivMoves,assets:ivAssets,expiry:ivExpiry,vendors:ivVendors,reports:ivReports}[IVS.tab]||ivOverview;
  return h+body();
}

/* ---------- forms ---------- */
function ivOpts(list,sel){var h='',i;for(i=0;i<list.length;i++){var v=list[i] instanceof Array?list[i][0]:list[i],l=list[i] instanceof Array?list[i][1]:list[i];h+='<option value="'+esc(v)+'"'+(v===sel?' selected':'')+'>'+esc(l)+'</option>'}return h}
function ivDl(id,list){var h='<datalist id="'+id+'">',i;for(i=0;i<list.length;i++)h+='<option value="'+esc(list[i])+'">';return h+'</datalist>'}
function ivNames(){var a=[],k;for(k in INV.items)a.push(INV.items[k].name);return a}
function ivVendNames(){var a=[],k,s={},i;for(k in INV.vendors){a.push(INV.vendors[k].name);s[k]=1}for(i=0;i<INV.purchases.length;i++){k=INV.purchases[i].vendor;if(k&&!s[k.toLowerCase()]){s[k.toLowerCase()]=1;a.push(k)}}return a}
function ivFi(label,id,type,val,ph,extra){return fld(label,id,'<input id="'+id+'" type="'+type+'" value="'+esc(val||'')+'" placeholder="'+esc(ph||'')+'" autocomplete="off"'+(extra||'')+'>')}
function ivFs(label,id,list,sel){return fld(label,id,'<select id="'+id+'">'+ivOpts(list,sel)+'</select>')}
function ivErr(list){var e=$('iv_err');if(e){e.innerHTML=list.length?'<b>Please fix:</b><ul><li>'+list.map(esc).join('</li><li>')+'</li></ul>':'';e.style.display=list.length?'block':'none';if(list.length&&e.scrollIntoView)e.scrollIntoView({block:'nearest'})}return list.length===0}
function ivV(id){var e=$(id);return e?String(e.value).trim():''}
function ivN(id){var v=parseFloat(ivV(id));return isNaN(v)?0:v}
function ivModal(title,body,saveAct,saveLabel,wide){
  openMod('<h3>'+title+'</h3><div class="stack ivform">'+body+'<div class="iverr" id="iv_err" role="alert" style="display:none"></div><div class="gap" style="justify-content:flex-end"><button class="btn g" data-x="1">Cancel</button><button class="btn" data-iv="'+saveAct+'">'+saveLabel+'</button></div></div>');
  $('mod').style.maxWidth=wide?'780px':'';
}
function ivPurForm(cls){
  var c=cls||'stock';
  ivModal('Add purchase',
   '<div class="ivfr">'+ivFi('Purchase date','iv_date','date',ivToday())+fld('Item name','iv_item','<input id="iv_item" list="iv_dl_items" placeholder="What did you buy" autocomplete="off">')+ivDl('iv_dl_items',ivNames())+ivFi('SKU / code (optional)','iv_sku','text','','Optional')+ivFs('Category','iv_cat',IV_CATS,'Consumable')+ivFs('Type','iv_cls',IV_CLASS,c)+'</div>'+
   fld('Description','iv_desc','<textarea id="iv_desc" style="min-height:60px" placeholder="Model, size, colour, specification"></textarea>')+
   '<div class="ivfr">'+ivFi('Quantity','iv_qty','number','','0','min="0" step="any" inputmode="decimal"')+ivFs('Unit of measure','iv_uom',IV_UOM,'pcs')+ivFi('Unit price (₹)','iv_price','number','','0.00','min="0" step="any" inputmode="decimal"')+ivFi('GST / tax %','iv_tax','number','0','0','min="0" max="100" step="any" inputmode="decimal"')+ivFi('Discount (₹)','iv_disc','number','0','0','min="0" step="any" inputmode="decimal"')+'<div class="fld"><label>Total payable</label><div class="ivtotal mono" id="iv_total">₹0</div></div></div>'+
   '<div class="ivfr">'+ivFs('Payment mode','iv_mode',IV_MODES,'UPI')+ivFs('Payment status','iv_pay',IV_PAY,'Paid')+ivFi('Amount paid (₹)','iv_paid','number','','Only if partially paid','min="0" step="any" inputmode="decimal"')+ivFs('Purchased by','iv_by',PEOPLE,ivUser())+fld('Purchased from (vendor)','iv_vendor','<input id="iv_vendor" list="iv_dl_vend" placeholder="Vendor name" autocomplete="off">')+ivDl('iv_dl_vend',ivVendNames())+ivFi('Vendor invoice no.','iv_inv','text','','Invoice / bill number')+'</div>'+
   fld('Invoice or bill (optional)','iv_file','<input id="iv_file" type="file" accept="image/*,.pdf">')+
   '<details class="ivdet"><summary>Validity, expiry and warranty (optional)</summary><div class="ivfr">'+ivFi('Valid from','iv_vfrom','date')+ivFi('Valid till','iv_vtill','date')+ivFi('Expiry date','iv_exp','date')+ivFi('Warranty start','iv_ws','date')+ivFi('Warranty end','iv_we','date')+'</div><div class="mu sm">Only fill the dates that apply. Ordinary items need none of them.</div></details>'+
   '<div class="ivfr">'+ivFi('Storage location','iv_loc','text','','Shelf, room or cabinet')+'</div>'+
   fld('Notes','iv_notes','<textarea id="iv_notes" style="min-height:60px"></textarea>'),
   'savePur','Save purchase',true);
  ivCalcPv();setTimeout(function(){$('iv_item').focus()},30);
}
function ivCalcPv(){var e=$('iv_total');if(!e)return;e.textContent=ivInr(ivCalc(ivN('iv_qty'),ivN('iv_price'),ivN('iv_disc'),ivN('iv_tax')).total)}
function ivSavePur(){
  var er=[],date=ivV('iv_date'),item=ivV('iv_item'),sku=ivV('iv_sku'),cls=ivV('iv_cls'),qty=ivN('iv_qty'),price=ivN('iv_price'),tax=ivN('iv_tax'),disc=ivN('iv_disc'),c,pay=ivV('iv_pay'),paid=ivN('iv_paid'),vf=ivV('iv_vfrom'),vt=ivV('iv_vtill'),ex=ivV('iv_exp'),ws=ivV('iv_ws'),we=ivV('iv_we');
  if(!date)er.push('Purchase date is required.');
  if(!item)er.push('Item name is required.');
  if(!(qty>0))er.push('Quantity must be greater than zero.');
  if(price<0||ivV('iv_price')==='')er.push('Enter a unit price (0 is allowed for free items).');
  if(tax<0||tax>100)er.push('GST must be between 0 and 100.');
  if(disc<0)er.push('Discount cannot be negative.');
  c=ivCalc(qty,price,disc,tax);
  if(disc>c.base&&c.base>=0&&qty>0)er.push('Discount is more than the item total.');
  if(pay==='Partially Paid'&&!(paid>0&&paid<c.total))er.push('For a partial payment, enter an amount paid that is above 0 and below the total ('+ivInr(c.total)+').');
  if(vf&&vt&&vt<vf)er.push('Valid till is before Valid from.');
  if(ws&&we&&we<ws)er.push('Warranty end is before warranty start.');
  if(ex&&date&&ex<date)er.push('Expiry date is before the purchase date.');
  if(!ivErr(er))return;
  var id=ivId('PUR'),key=ivKey(item,sku),f=$('iv_file').files[0],vend=ivV('iv_vendor'),it=INV.items[key];
  var p={id:id,date:date,item:item,sku:sku,cat:ivV('iv_cat'),desc:ivV('iv_desc'),cls:cls,key:key,qty:qty,uom:ivV('iv_uom'),price:price,tax:tax,disc:disc,total:c.total,mode:ivV('iv_mode'),pstatus:pay,paid:pay==='Paid'?c.total:pay==='Pending'?0:paid,by:ivV('iv_by'),vendor:vend,inv:ivV('iv_inv'),vfrom:vf,vtill:vt,exp:ex,wstart:ws,wend:we,loc:ivV('iv_loc'),notes:ivV('iv_notes'),created:new Date().toISOString()};
  if(f){p.attName=f.name;if(f.size>5*1048576){toast('Attachment is over 5 MB and was not saved.');p.attName=''}}
  INV.purchases.push(p);
  if(!it)INV.items[key]={name:item,sku:sku,cat:p.cat,uom:p.uom,cls:cls,reorder:0,loc:p.loc};
  else{if(!it.loc&&p.loc)it.loc=p.loc;it.cls=cls}
  if(cls==='stock')ivMv('PURCHASE',key,qty,id,'Purchase '+(p.inv||''),date);
  if(vend&&!INV.vendors[vend.toLowerCase()])INV.vendors[vend.toLowerCase()]={name:vend,phone:'',gst:'',notes:''};
  ivLog('Purchase added',id,item+' x '+qty+' = '+ivInr(c.total));
  if(!ivSave()){INV.purchases.pop();return}
  if(f&&p.attName){var fr=new FileReader();fr.onload=function(){idbPut('inv:'+id,{buf:fr.result,type:f.type||mimeFor(f.name),name:f.name},function(ok){if(!ok)toast('Purchase saved, but the attachment could not be stored.')})};fr.readAsArrayBuffer(f)}
  closeMod();toast('Purchase '+id+' saved');IVS.tab='purchases';IVS.q='';render(true);
}
function ivItemSel(id,keysOnly,sel){var ks=ivStockKeys(),st=ivStock(),h='<select id="'+id+'">',i;
  if(!ks.length)return '<select id="'+id+'"><option value="">No stock items yet</option></select>';
  for(i=0;i<ks.length;i++)h+='<option value="'+esc(ks[i])+'"'+(ks[i]===sel?' selected':'')+'>'+esc(ivItemName(ks[i]))+' ('+ivQty(st[ks[i]]||0)+' '+esc(INV.items[ks[i]].uom||'')+')</option>';
  return h+'</select>'}
function ivSaleForm(){
  ivModal('Record sale','<div class="ivfr">'+ivFi('Sale date','iv_date','date',ivToday())+fld('Item','iv_item',ivItemSel('iv_item'))+ivFi('Quantity','iv_qty','number','','0','min="0" step="any" inputmode="decimal"')+ivFi('Unit price (₹)','iv_price','number','','0.00','min="0" step="any" inputmode="decimal"')+ivFi('GST %','iv_tax','number','0','0','min="0" max="100" step="any"')+ivFi('Discount (₹)','iv_disc','number','0','0','min="0" step="any"')+'<div class="fld"><label>Total</label><div class="ivtotal mono" id="iv_total">₹0</div></div></div><div class="ivfr">'+ivFi('Customer','iv_cust','text','','Customer or client')+ivFs('Payment mode','iv_mode',IV_MODES,'UPI')+ivFs('Payment status','iv_pay',IV_PAY,'Paid')+ivFs('Sold by','iv_by',PEOPLE,ivUser())+'</div>'+fld('Notes','iv_notes','<textarea id="iv_notes" style="min-height:60px"></textarea>'),'saveSale','Save sale',true);
}
function ivSaveSale(){
  var er=[],k=ivV('iv_item'),qty=ivN('iv_qty'),price=ivN('iv_price'),tax=ivN('iv_tax'),disc=ivN('iv_disc'),date=ivV('iv_date'),av=k?ivStock1(k):0,c,pay=ivV('iv_pay');
  if(!k)er.push('Choose an item. Only stock items can be sold.');
  if(!date)er.push('Sale date is required.');
  if(!(qty>0))er.push('Quantity must be greater than zero.');
  if(k&&qty>av)er.push('Only '+ivQty(av)+' available. Stock cannot go negative; record a purchase or an authorised adjustment first.');
  if(ivV('iv_price')==='')er.push('Enter a unit price.');
  c=ivCalc(qty,price,disc,tax);
  if(!ivErr(er))return;
  var id=ivId('SAL'),s={id:id,date:date,key:k,item:ivItemName(k),uom:INV.items[k].uom,qty:qty,price:price,tax:tax,disc:disc,total:c.total,customer:ivV('iv_cust'),mode:ivV('iv_mode'),pstatus:pay,by:ivV('iv_by'),notes:ivV('iv_notes')};
  INV.sales.push(s);ivMv('SALE',k,qty,id,'Sale to '+(s.customer||'customer'),date);ivLog('Sale added',id,s.item+' x '+qty+' = '+ivInr(c.total));
  if(!ivSave()){INV.sales.pop();INV.mv.pop();return}
  closeMod();toast('Sale '+id+' saved');IVS.tab='sales';IVS.q='';render(true);
}
function ivIssueForm(){
  ivModal('Issue stock internally','<p class="mu sm" style="margin:0">Use this when stock is used inside the studio. It reduces stock but is not revenue.</p><div class="ivfr">'+ivFi('Date','iv_date','date',ivToday())+fld('Item','iv_item',ivItemSel('iv_item'))+ivFi('Quantity','iv_qty','number','','0','min="0" step="any" inputmode="decimal"')+ivFs('Issued to','iv_to',PEOPLE,ivUser())+ivFi('Purpose / project','iv_purpose','text','','Shoot, client project, repair')+ivFs('Issued by','iv_by',PEOPLE,ivUser())+'</div>','saveIssue','Issue stock');
}
function ivSaveIssue(){
  var er=[],k=ivV('iv_item'),qty=ivN('iv_qty'),date=ivV('iv_date'),av=k?ivStock1(k):0;
  if(!k)er.push('Choose an item.');
  if(!date)er.push('Date is required.');
  if(!(qty>0))er.push('Quantity must be greater than zero.');
  if(k&&qty>av)er.push('Only '+ivQty(av)+' available. Stock cannot go negative.');
  if(!ivV('iv_purpose'))er.push('Add a purpose or project so the issue can be traced.');
  if(!ivErr(er))return;
  var id=ivId('ISS'),s={id:id,date:date,key:k,item:ivItemName(k),uom:INV.items[k].uom,qty:qty,to:ivV('iv_to'),purpose:ivV('iv_purpose'),by:ivV('iv_by')};
  INV.issues.push(s);ivMv('ISSUE',k,qty,id,s.purpose,date);ivLog('Internal issue',id,s.item+' x '+qty+' to '+s.to);
  if(!ivSave()){INV.issues.pop();INV.mv.pop();return}
  closeMod();toast('Issued '+ivQty(qty)+' '+s.item);IVS.tab='sales';IVS.q='';render(true);
}
function ivAdjForm(key){
  var kinds=[['OPEN','Opening balance'],['ADJ_IN','Adjustment in'],['ADJ_OUT','Adjustment out'],['RETURN','Accepted return']],it=key?INV.items[key]:null;
  ivModal('Adjust stock','<div class="ivfr">'+ivFi('Date','iv_date','date',ivToday())+fld('Item','iv_item','<input id="iv_item" list="iv_dl_items" value="'+esc(it?it.name:'')+'" placeholder="Existing or new item" autocomplete="off">')+ivDl('iv_dl_items',ivNames())+ivFs('Type','iv_kind',kinds,'ADJ_IN')+ivFi('Quantity','iv_qty','number','','0','min="0" step="any" inputmode="decimal"')+ivFs('Unit (new items)','iv_uom',IV_UOM,it?it.uom:'pcs')+ivFs('Adjusted by','iv_by',PEOPLE,ivUser())+'</div>'+fld('Reason (required)','iv_reason','<textarea id="iv_reason" style="min-height:60px" placeholder="Why is this change needed? Stock count, damage, return, correction"></textarea>')+'<label class="ivchk"><input type="checkbox" id="iv_auth"> I authorise this adjustment to take stock below zero</label>','saveAdj','Save adjustment');
}
function ivSaveAdj(){
  var er=[],name=ivV('iv_item'),kind=ivV('iv_kind'),qty=ivN('iv_qty'),date=ivV('iv_date'),reason=ivV('iv_reason'),k=ivKey(name,''),found=null,kk,cur,auth=$('iv_auth')&&$('iv_auth').checked;
  for(kk in INV.items){if(INV.items[kk].name.toLowerCase()===name.toLowerCase()||kk===name.toLowerCase())found=kk}
  if(found)k=found;
  if(!name)er.push('Item name is required.');
  if(!date)er.push('Date is required.');
  if(!(qty>0))er.push('Quantity must be greater than zero.');
  if(!reason)er.push('A reason is required for every adjustment.');
  cur=found?ivStock1(found):0;
  if(kind==='ADJ_OUT'&&qty>cur&&!auth)er.push('This would take stock below zero ('+ivQty(cur)+' available). Tick the authorisation box if that is intended.');
  if(kind==='OPEN'&&found&&ivHasMv(found,'OPEN'))er.push('This item already has an opening balance. Use Adjustment in or out instead.');
  if(!ivErr(er))return;
  if(!found)INV.items[k]={name:name,sku:'',cat:'Other',uom:ivV('iv_uom'),cls:'stock',reorder:0,loc:''};
  var m=ivMv(kind,k,qty,'',reason+(auth&&kind==='ADJ_OUT'&&qty>cur?' (authorised negative)':''),date);
  ivLog('Stock '+IV_LBL[kind].toLowerCase(),m.id,name+' x '+qty+': '+reason);
  if(!ivSave()){INV.mv.pop();return}
  closeMod();toast('Stock updated');IVS.tab='moves';IVS.q='';render(true);
}
function ivHasMv(k,kind){var i;for(i=0;i<INV.mv.length;i++){if(INV.mv[i].key===k&&INV.mv[i].kind===kind)return true}return false}
function ivVendorForm(){
  ivModal('Add vendor','<div class="ivfr">'+ivFi('Vendor name','iv_vn','text','','Company or person')+ivFi('Phone','iv_vp','tel')+ivFi('GSTIN','iv_vg','text')+'</div>'+fld('Notes','iv_notes','<textarea id="iv_notes" style="min-height:60px"></textarea>'),'saveVendor','Save vendor');
}
function ivSaveVendor(){
  var n=ivV('iv_vn'),er=[];if(!n)er.push('Vendor name is required.');
  if(n&&INV.vendors[n.toLowerCase()])er.push('A vendor with this name already exists.');
  if(!ivErr(er))return;
  INV.vendors[n.toLowerCase()]={name:n,phone:ivV('iv_vp'),gst:ivV('iv_vg'),notes:ivV('iv_notes')};ivLog('Vendor added',n,'');
  if(!ivSave())return;closeMod();toast('Vendor saved');render(true);
}
function ivShowVendor(name){
  var k=name.toLowerCase(),v=INV.vendors[k]||{name:name},rows=[],i,p,sp=0,due=0,n=0;
  for(i=INV.purchases.length-1;i>=0;i--){p=INV.purchases[i];if((p.vendor||'').toLowerCase()!==k)continue;n++;sp+=p.total;due+=ivDue(p);
    rows.push({c:[esc(p.id),ivDate(p.date),'<b>'+esc(p.item)+'</b>',ivQty(p.qty)+' '+esc(p.uom),ivInr(p.total),ivChip(p.pstatus,p.pstatus==='Paid'?'ok':p.pstatus==='Pending'?'bad':'warn'),esc(p.inv||'-')]})}
  openMod('<h3>'+esc(v.name)+'</h3><div class="mu sm" style="margin:2px 0 12px">'+esc(v.phone||'No phone')+' | GSTIN '+esc(v.gst||'-')+'</div><div class="ivk" style="margin-bottom:12px">'+ivK('Purchases',String(n),'All time')+ivK('Total spend',ivInr(sp),'Incl. GST')+ivK('Dues',ivInr(due),'Unpaid')+'</div>'+ivTbl(['ID','Date','Item','#Qty','#Total','Payment','Invoice'],rows,'No purchases from this vendor yet.')+'<div class="gap" style="justify-content:flex-end;margin-top:14px"><button class="btn g" data-x="1">Close</button></div>');
  $('mod').style.maxWidth='820px';
}
function ivAssetForm(id){
  var p=null,i,m=INV.assets[id]||{};for(i=0;i<INV.purchases.length;i++){if(INV.purchases[i].id===id)p=INV.purchases[i]}if(!p)return;
  ivModal('Update '+esc(p.item),'<div class="ivfr">'+ivFs('Assigned to','iv_as',['Unassigned'].concat(PEOPLE),m.assigned||'Unassigned')+ivFs('Condition','iv_cond',['Good','Needs repair','Under repair','Retired'],m.cond||'Good')+'</div><input type="hidden" id="iv_aid" value="'+esc(id)+'">','saveAsset','Save');
}
function ivReorderForm(k){
  var it=INV.items[k];if(!it)return;
  ivModal('Reorder level: '+esc(it.name),'<p class="mu sm" style="margin:0">You will be warned when stock falls to this number or below.</p>'+ivFi('Reorder at ('+esc(it.uom||'units')+')','iv_ro','number',String(it.reorder||0),'0','min="0" step="any"')+'<input type="hidden" id="iv_rk" value="'+esc(k)+'">','saveRo','Save');
}

/* ---------- demo data ---------- */
function ivDemo(){
  var t=ivToday(),d=function(n){var x=new Date();x.setDate(x.getDate()+n);var m=x.getMonth()+1,dd=x.getDate();return x.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(dd<10?'0':'')+dd},id,rows=[
    ['LED panel light','LP-100','Equipment','pcs',2,4500,18,'asset','Sharma Electricals','Paid',d(-40),'','','',d(-40),d(325)],
    ['Gaffer tape','GT-20','Consumable','pcs',20,180,18,'stock','Sharma Electricals','Partially Paid',d(-20),'','','','',''],
    ['Makeup foundation','MK-11','Consumable','pcs',12,420,12,'stock','Glow Wholesale','Pending',d(-8),d(12),'','','',''],
    ['Editing software licence','ADB-1','Software / licence','licence',1,1800,18,'service','Adobe Reseller','Paid',d(-60),'',d(-60),d(20),'','']],i,r,c,key;
  for(i=0;i<rows.length;i++){r=rows[i];c=ivCalc(r[4],r[5],0,r[6]);key=ivKey(r[0],r[1]);id=ivId('PUR');
    INV.purchases.push({id:id,date:r[10],item:r[0],sku:r[1],cat:r[2],desc:'',cls:r[7],key:key,qty:r[4],uom:r[3],price:r[5],tax:r[6],disc:0,total:c.total,mode:'UPI',pstatus:r[9],paid:r[9]==='Paid'?c.total:r[9]==='Pending'?0:ivR2(c.total/2),by:'Pranav',vendor:r[8],inv:'DEMO-'+(i+1),vfrom:r[12],vtill:r[13],exp:r[11],wstart:r[14],wend:r[15],loc:'Store room',notes:'Demo record',created:new Date().toISOString(),demo:true});
    INV.items[key]={name:r[0],sku:r[1],cat:r[2],uom:r[3],cls:r[7],reorder:i===1?10:0,loc:'Store room',demo:true};
    if(r[7]==='stock')ivMv('PURCHASE',key,r[4],id,'Demo purchase',r[10],true);
    if(!INV.vendors[r[8].toLowerCase()])INV.vendors[r[8].toLowerCase()]={name:r[8],phone:'',gst:'',notes:'',demo:true}}
  c=ivCalc(3,250,0,18);id=ivId('SAL');
  INV.sales.push({id:id,date:t,key:'gt-20',item:'Gaffer tape',uom:'pcs',qty:3,price:250,tax:18,disc:0,total:c.total,customer:'Demo client',mode:'UPI',pstatus:'Paid',by:'Pranav',notes:'Demo record',demo:true});ivMv('SALE','gt-20',3,id,'Demo sale',t,true);
  id=ivId('ISS');INV.issues.push({id:id,date:t,key:'gt-20',item:'Gaffer tape',uom:'pcs',qty:4,to:'Monish',purpose:'Demo shoot',by:'Pranav',demo:true});ivMv('ISSUE','gt-20',4,id,'Demo shoot',t,true);
  ivLog('Demo data loaded','','Example records, safe to clear');ivSave();
}
function ivClearDemo(){
  function nd(a){var o=[],i;for(i=0;i<a.length;i++){if(!a[i].demo)o.push(a[i])}return o}
  var k;INV.purchases=nd(INV.purchases);INV.sales=nd(INV.sales);INV.issues=nd(INV.issues);INV.mv=nd(INV.mv);
  for(k in INV.items){if(INV.items[k].demo)delete INV.items[k]}
  for(k in INV.vendors){if(INV.vendors[k].demo)delete INV.vendors[k]}
  ivLog('Demo data cleared','','');ivSave();
}

/* ---------- actions ---------- */
function ivDelete(kind,id){
  var arr=kind==='pur'?INV.purchases:kind==='sale'?INV.sales:INV.issues,i,rec=null,idx=-1;
  for(i=0;i<arr.length;i++){if(arr[i].id===id){rec=arr[i];idx=i}}
  if(!rec)return;
  if(kind==='pur'&&rec.cls==='stock'&&ivStock1(rec.key)-rec.qty<0){toast('Cannot delete: that stock has already been sold or issued. Use an adjustment instead.');return}
  if(!window.confirm('Delete '+id+' ('+rec.item+')? Its stock movement is removed too, and this is written to the audit log.'))return;
  arr.splice(idx,1);
  INV.mv=INV.mv.filter(function(m){return m.ref!==id});
  ivLog('Deleted '+id,id,rec.item+' x '+rec.qty);
  if(kind==='pur'&&rec.attName){try{idbPut('inv:'+id,null)}catch(e){}}
  ivSave();toast(id+' deleted');render(true);
}
function ivAct(a){
  var p=a.split('|'),x=p[0],i;
  if(x==='tab'){IVS.tab=p[1];IVS.q='';render(true);window.scrollTo(0,0)}
  else if(x==='newPur')ivPurForm('stock');
  else if(x==='newAsset')ivPurForm('asset');
  else if(x==='savePur')ivSavePur();
  else if(x==='newSale')ivSaleForm();
  else if(x==='saveSale')ivSaveSale();
  else if(x==='newIssue')ivIssueForm();
  else if(x==='saveIssue')ivSaveIssue();
  else if(x==='newAdj')ivAdjForm('');
  else if(x==='adjItem')ivAdjForm(p[1]);
  else if(x==='saveAdj')ivSaveAdj();
  else if(x==='newVendor')ivVendorForm();
  else if(x==='saveVendor')ivSaveVendor();
  else if(x==='vendor')ivShowVendor(p.slice(1).join('|'));
  else if(x==='asset')ivAssetForm(p[1]);
  else if(x==='saveAsset'){INV.assets[ivV('iv_aid')]={assigned:ivV('iv_as')==='Unassigned'?'':ivV('iv_as'),cond:ivV('iv_cond')};ivLog('Asset updated',ivV('iv_aid'),ivV('iv_as')+' / '+ivV('iv_cond'));ivSave();closeMod();toast('Asset updated');render(true)}
  else if(x==='reorder')ivReorderForm(p[1]);
  else if(x==='saveRo'){var v=ivN('iv_ro');if(v<0){ivErr(['Reorder level cannot be negative.']);return}INV.items[ivV('iv_rk')].reorder=v;ivLog('Reorder level',ivV('iv_rk'),String(v));ivSave();closeMod();toast('Reorder level saved');render(true)}
  else if(x==='del')ivDelete(p[1],p[2]);
  else if(x==='ef'){IVS.ef=p[1];render(true)}
  else if(x==='demo'){ivDemo();toast('Demo data loaded. Clear it any time.');render(true)}
  else if(x==='cleardemo'){ivClearDemo();toast('Demo data cleared');render(true)}
  else if(x==='att'){var pr=null;for(i=0;i<INV.purchases.length;i++){if(INV.purchases[i].id===p[1])pr=INV.purchases[i]}if(pr)openFile('inv:'+pr.id,{title:pr.item,to:pr.attName,notes:''},false)}
  else if(x==='csv')ivExport(p[1]);
}
function ivExport(w){
  var i,r=[],p,s,e,k,st,av;
  if(w==='pur'){for(i=0;i<INV.purchases.length;i++){p=INV.purchases[i];r.push([p.id,p.date,p.item,p.sku,p.cat,p.cls,p.qty,p.uom,p.price,p.tax,p.disc,p.total,p.mode,p.pstatus,p.paid,p.by,p.vendor,p.inv,p.vfrom,p.vtill,p.exp,p.wstart,p.wend,p.loc,p.notes])}
    ivCsv('purchases',['ID','Date','Item','SKU','Category','Type','Qty','UoM','Unit price','GST %','Discount','Total','Mode','Payment status','Paid','Purchased by','Vendor','Invoice','Valid from','Valid till','Expiry','Warranty start','Warranty end','Location','Notes'],r)}
  else if(w==='sale'){for(i=0;i<INV.sales.length;i++){s=INV.sales[i];r.push([s.id,s.date,s.item,s.qty,s.price,s.tax,s.disc,s.total,s.customer,s.mode,s.pstatus,s.by,s.notes])}
    ivCsv('sales',['ID','Date','Item','Qty','Unit price','GST %','Discount','Total','Customer','Mode','Payment status','Sold by','Notes'],r)}
  else if(w==='stock'){st=ivStock();av=ivAvgCost();var ks=ivStockKeys();for(i=0;i<ks.length;i++){k=ks[i];r.push([INV.items[k].name,INV.items[k].sku,INV.items[k].cat,INV.items[k].uom,st[k]||0,INV.items[k].reorder||0,ivR2(av[k]||0),ivR2((st[k]||0)*(av[k]||0))])}
    ivCsv('stock',['Item','SKU','Category','UoM','Available','Reorder at','Avg cost','Value'],r)}
  else{for(i=0;i<INV.mv.length;i++){e=INV.mv[i];r.push([e.id,e.date,ivItemName(e.key),IV_LBL[e.kind],e.qty,e.ref,e.by,e.reason,e.ts])}
    ivCsv('movements',['ID','Date','Item','Type','Qty','Reference','By','Reason','Logged at'],r)}
}

/* ---------- wiring (own delegated handlers, so no other file needs to know the module) ---------- */
document.addEventListener('click',function(e){
  var n=e.target.closest&&e.target.closest('[data-iv]');if(!n)return;
  e.preventDefault();ivAct(n.getAttribute('data-iv'));
});
document.addEventListener('input',function(e){
  var t=e.target;if(!t||!t.id)return;
  if(t.id==='iv_q'){IVS.q=t.value;var pos=t.selectionStart;render(true);var q=$('iv_q');if(q){q.focus();try{q.setSelectionRange(pos,pos)}catch(err){}}}
  else if(t.id==='iv_qty'||t.id==='iv_price'||t.id==='iv_tax'||t.id==='iv_disc')ivCalcPv();
});
document.addEventListener('change',function(e){
  var t=e.target;if(!t||!t.id)return;
  if(t.id==='iv_pf'){IVS.pf=t.value;render(true)}
  else if(t.id==='iv_user'){try{localStorage.setItem('nts_inv_user',t.value)}catch(err){}toast('Actions are now logged as '+t.value)}
  else if(t.id==='iv_item'&&t.tagName==='INPUT'){var k,nm=t.value.trim().toLowerCase();for(k in INV.items){if(INV.items[k].name.toLowerCase()===nm){var it=INV.items[k];if($('iv_sku')&&!$('iv_sku').value)$('iv_sku').value=it.sku||'';if($('iv_cat'))$('iv_cat').value=it.cat||'Other';if($('iv_uom'))$('iv_uom').value=it.uom||'pcs';if($('iv_loc')&&!$('iv_loc').value)$('iv_loc').value=it.loc||''}}}
});

/* ---------- register ---------- */
PAGES.inventory=['Inventory','cube'];
GROUPS.splice(4,0,['Inventory','cube',['inventory']]);
VIEWS.inventory=vInventory;
COMMANDS.push(['Open inventory','Navigate',function(){IVS.tab='overview';go('inventory')}]);
COMMANDS.push(['Add purchase','Create',function(){IVS.tab='purchases';go('inventory');setTimeout(ivPurForm,350)}]);
COMMANDS.push(['Show expiring items','Inventory',function(){IVS.tab='expiry';IVS.ef='30';go('inventory')}]);
COMMANDS.push(['Show current stock','Inventory',function(){IVS.tab='stock';go('inventory')}]);
