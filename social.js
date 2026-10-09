/* ---------- Social Media Intelligence ----------
   Honest scope: this is a static frontend. Real OAuth, token storage and scheduled syncs need a secure backend
   (not deployed yet), so accounts here are "Manual tracking" only: you enter dated snapshots and posts, and every chart,
   growth figure and insight is computed from what was entered. Nothing is shown as connected unless a backend returns data.
   Stored on this device: localStorage key nts_soc. No passwords, tokens or secrets are ever stored. */
var SOC_KEY='nts_soc';
var SOC_TABS=[['overview','Overview'],['accounts','Connected Accounts'],['content','Content Performance'],['audience','Audience & Growth'],['insights','AI Insights'],['research','Public Trend Research'],['leads','Social Leads'],['reports','Reports'],['settings','Integration Settings']];
var SOC_PLAT=['Instagram','Facebook Page','YouTube','LinkedIn','Other'];
var SOC_FMT=['Reel','Short video','Video','Image','Carousel','Story','Text post','Article'];
var SOC_MET=[['reach','Reach'],['impressions','Impressions'],['views','Views'],['watch','Watch time (hours)'],['likes','Likes'],['comments','Comments'],['shares','Shares'],['saves','Saves'],['visits','Profile visits'],['clicks','Link clicks']];
var SOC_API={
  'Instagram':{api:'Instagram Graph API (Meta app)',scopes:'instagram_basic, instagram_manage_insights, pages_show_list, pages_read_engagement',need:'Business or Creator account linked to a Facebook Page. Meta App Review for advanced access. Long-lived tokens must be refreshed.',doc:'developers.facebook.com/docs/instagram-platform'},
  'Facebook Page':{api:'Graph API Pages (Meta app)',scopes:'pages_show_list, pages_read_engagement, read_insights',need:'You must be an admin of the Page. Meta App Review for advanced access.',doc:'developers.facebook.com/docs/pages-api'},
  'YouTube':{api:'YouTube Data API v3 and YouTube Analytics API (Google Cloud project)',scopes:'youtube.readonly, yt-analytics.readonly',need:'OAuth consent screen. Daily API quota applies. Channel owner must authorise.',doc:'developers.google.com/youtube'},
  'LinkedIn':{api:'LinkedIn Community Management / Pages APIs',scopes:'r_organization_social, r_organization_followers (organisation pages)',need:'Requires LinkedIn developer app approval for the relevant product. Personal profile analytics are generally not available through the API.',doc:'learn.microsoft.com/linkedin'},
  'Other':{api:'Platform official API, where one exists',scopes:'Varies',need:'Use only the platform\'s documented, approved access.',doc:''}
};
var SS={tab:'overview',plat:'ALL',acc:'ALL',range:'30',q:''};
function socLoad(){var d=null;try{d=JSON.parse(localStorage.getItem(SOC_KEY)||'null')}catch(e){d=null}d=d||{};d.accounts=d.accounts||[];d.snaps=d.snaps||[];d.posts=d.posts||[];d.research=d.research||[];d.reports=d.reports||[];d.backend=d.backend||'';d.seq=d.seq||0;return d}
var SOC=socLoad();
function socSave(){try{localStorage.setItem(SOC_KEY,JSON.stringify(SOC));return true}catch(e){toast('Could not save: browser storage is full or blocked.');return false}}
function socId(p){SOC.seq=(SOC.seq||0)+1;return p+'-'+SOC.seq}
function socAcc(id){var i;for(i=0;i<SOC.accounts.length;i++){if(SOC.accounts[i].id===id)return SOC.accounts[i]}return null}
function socAccName(id){var a=socAcc(id);return a?a.name+' ('+a.platform+')':'Unknown account'}
function socNum(id){var v=ivV(id);if(v==='')return null;var n=parseFloat(v);return isNaN(n)?null:n}
function socFmtN(n){return n===null||n===undefined?'<span class="mu">Not available</span>':Number(n).toLocaleString('en-IN',{maximumFractionDigits:2})}
function socAccs(){var r=[],i,a;for(i=0;i<SOC.accounts.length;i++){a=SOC.accounts[i];if(SS.plat!=='ALL'&&a.platform!==SS.plat)continue;if(SS.acc!=='ALL'&&a.id!==SS.acc)continue;r.push(a)}return r}
function socSnaps(id){var r=[],i;for(i=0;i<SOC.snaps.length;i++){if(SOC.snaps[i].acc===id)r.push(SOC.snaps[i])}r.sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0});return r}
function socAddDays(s,n){var d=new Date(s+'T00:00:00');d.setDate(d.getDate()+n);var m=d.getMonth()+1,x=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(x<10?'0':'')+x}
/* follower growth over N days, using only real entries; says so when history is shorter than the window */
function socGrowth(id,days){
  var s=socSnaps(id),f=[],i,last,base=null,startDate;
  for(i=0;i<s.length;i++){if(s[i].m.followers!==null&&s[i].m.followers!==undefined)f.push(s[i])}
  if(f.length<2)return null;
  last=f[f.length-1];startDate=socAddDays(last.date,-days);
  for(i=f.length-2;i>=0;i--){if(f[i].date<=startDate){base=f[i];break}}
  var partial=false;if(!base){base=f[0];partial=true}
  var span=Math.round((Date.parse(last.date)-Date.parse(base.date))/864e5);
  if(span<=0)return null;
  return {delta:last.m.followers-base.m.followers,pct:base.m.followers?((last.m.followers-base.m.followers)/base.m.followers*100):null,span:span,partial:partial,last:last.m.followers};
}
function socLatest(id,key){var s=socSnaps(id),i;for(i=s.length-1;i>=0;i--){if(s[i].m[key]!==null&&s[i].m[key]!==undefined)return {v:s[i].m[key],date:s[i].date}}return null}
function socPostER(p){
  var m=p.m||{},t=0,n=0,k,den=null,i;
  for(i=0;i<4;i++){k=['likes','comments','shares','saves'][i];if(m[k]!==null&&m[k]!==undefined){t+=m[k];n++}}
  if(!n)return null;
  if(m.reach)den=m.reach;else{var lf=socLatest(p.acc,'followers');if(lf&&lf.v)den=lf.v}
  return den?{er:t/den*100,basis:m.reach?'reach':'followers'}:null;
}
function socMedian(a){if(!a.length)return null;a=a.slice().sort(function(x,y){return x-y});var h=Math.floor(a.length/2);return a.length%2?a[h]:(a[h-1]+a[h])/2}
function socPostsFiltered(){var r=[],i,p,a;for(i=0;i<SOC.posts.length;i++){p=SOC.posts[i];a=socAcc(p.acc);if(!a)continue;if(SS.plat!=='ALL'&&a.platform!==SS.plat)continue;if(SS.acc!=='ALL'&&a.id!==SS.acc)continue;if(SS.range!=='all'&&p.date<socAddDays(ivToday(),-parseInt(SS.range,10)))continue;r.push(p)}return r}

/* ---------- inline SVG line chart (responsive, labelled, no libraries) ---------- */
function socChart(series,title){
  var W=640,H=220,L=46,R=12,T=14,B=26,i,j,xs=[],ys=[],p;
  for(i=0;i<series.length;i++){for(j=0;j<series[i].pts.length;j++){xs.push(series[i].pts[j][0]);ys.push(series[i].pts[j][1])}}
  if(!xs.length)return '<div class="ivem">Not enough dated entries to draw a trend yet. Add at least two snapshots for an account.</div>';
  var x0=Math.min.apply(null,xs),x1=Math.max.apply(null,xs),y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys);
  if(x1===x0)x1=x0+864e5;if(y1===y0){y1=y0+1;y0=y0-1}
  var pad=(y1-y0)*.1;y0-=pad;y1+=pad;
  function X(v){return L+(v-x0)/(x1-x0)*(W-L-R)}function Y(v){return T+(1-(v-y0)/(y1-y0))*(H-T-B)}
  var g='',lg='',cols=['#6fb6ee','#74d9c6','#aea0f6','#f4b887','#86dc98','#f299b8'];
  for(i=0;i<=3;i++){var yv=y0+(y1-y0)*i/3;g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(yv)+'" y2="'+Y(yv)+'" stroke="currentColor" stroke-opacity=".12"/><text x="'+(L-6)+'" y="'+(Y(yv)+4)+'" text-anchor="end" font-size="10" fill="currentColor" fill-opacity=".7">'+Math.round(yv).toLocaleString('en-IN')+'</text>'}
  var d0=new Date(x0).toLocaleDateString('en-IN',{day:'numeric',month:'short'}),d1=new Date(x1).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  g+='<text x="'+L+'" y="'+(H-6)+'" font-size="10" fill="currentColor" fill-opacity=".7">'+d0+'</text><text x="'+(W-R)+'" y="'+(H-6)+'" text-anchor="end" font-size="10" fill="currentColor" fill-opacity=".7">'+d1+'</text>';
  for(i=0;i<series.length;i++){
    var c=cols[i%cols.length],d='',dots='';
    for(j=0;j<series[i].pts.length;j++){p=series[i].pts[j];d+=(j?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)+' ';dots+='<circle cx="'+X(p[0]).toFixed(1)+'" cy="'+Y(p[1]).toFixed(1)+'" r="3.2" fill="'+c+'"><title>'+esc(series[i].name)+': '+Math.round(p[1]).toLocaleString('en-IN')+' on '+new Date(p[0]).toLocaleDateString('en-IN')+'</title></circle>'}
    g+='<path d="'+d+'" fill="none" stroke="'+c+'" stroke-width="2.2" stroke-linejoin="round"/>'+dots;
    lg+='<span class="socleg"><i style="background:'+c+'"></i>'+esc(series[i].name)+'</span>'}
  return '<div class="socch"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(title)+'" preserveAspectRatio="xMidYMid meet">'+g+'</svg></div><div class="soclegs">'+lg+'</div>';
}
function socFilters(opts){
  var h='<div class="ivtool socf">',i,a,pl='<option value="ALL">All platforms</option>',ac='<option value="ALL">All accounts</option>';
  for(i=0;i<SOC_PLAT.length;i++)pl+='<option'+(SS.plat===SOC_PLAT[i]?' selected':'')+'>'+SOC_PLAT[i]+'</option>';
  for(i=0;i<SOC.accounts.length;i++){a=SOC.accounts[i];if(SS.plat!=='ALL'&&a.platform!==SS.plat)continue;ac+='<option value="'+esc(a.id)+'"'+(SS.acc===a.id?' selected':'')+'>'+esc(a.name)+'</option>'}
  h+='<select class="ivq" id="scf_plat" aria-label="Platform">'+pl+'</select><select class="ivq" id="scf_acc" aria-label="Account">'+ac+'</select>';
  h+='<select class="ivq" id="scf_range" aria-label="Date range"><option value="7"'+(SS.range==='7'?' selected':'')+'>Last 7 days</option><option value="30"'+(SS.range==='30'?' selected':'')+'>Last 30 days</option><option value="90"'+(SS.range==='90'?' selected':'')+'>Last 90 days</option><option value="all"'+(SS.range==='all'?' selected':'')+'>All time</option></select>';
  return h+(opts||'')+'</div>';
}
function socBtn(l,a,c){return '<button class="btn sm '+(c||'g')+'" data-sc="'+a+'">'+l+'</button>'}
function socEmpty(){
  return '<div class="card" data-a><div class="h3">No social accounts yet</div><p class="mu" style="margin:6px 0 12px;line-height:1.55">Real connections need a secure backend that is not deployed yet (see Integration Settings), so nothing here is connected. You can already track an account manually: add it, then log dated follower and post numbers and the dashboard will compute growth and trends from them.</p><div class="gap"><button class="btn" data-sc="newAcc">'+ico('plus')+'Add account to track</button>'+socBtn('Load demo data','demo')+'</div></div>';
}

/* ---------- tabs ---------- */
function socOverview(){
  if(!SOC.accounts.length)return socEmpty();
  var accs=socAccs(),h=socFilters(),i,a,g7,g30,g90,lf,cards='',series=[],s,j,pts,days=SS.range==='all'?100000:parseInt(SS.range,10),from=socAddDays(ivToday(),-days);
  for(i=0;i<accs.length;i++){a=accs[i];lf=socLatest(a.id,'followers');g7=socGrowth(a.id,7);g30=socGrowth(a.id,30);g90=socGrowth(a.id,90);
    cards+='<div class="card ivkc" data-a><div class="lbl">'+esc(a.platform)+(a.demo?' <span class="tg warn">Demo</span>':'')+'</div><div class="h3" style="margin:2px 0">'+esc(a.name)+'</div><div class="num ivnum">'+(lf?lf.v.toLocaleString('en-IN'):'<span class="mu" style="font-size:14px">No follower entry</span>')+'</div><div class="mu sm">'+(a.platform==='YouTube'?'Subscribers':'Followers')+(lf?' | as of '+ivDate(lf.date):'')+'</div><div class="socgr">'+socGrowChip('7d',g7)+socGrowChip('30d',g30)+socGrowChip('90d',g90)+'</div>'+ivChip(a.status==='manual'?'Manual tracking':'Not connected','warn')+'</div>'}
  h+='<div class="ivk" data-a>'+cards+'</div><p class="mu sm" style="margin:8px 2px">Follower and subscriber counts are shown per platform. They are not added together because the platforms define them differently.</p>';
  for(i=0;i<accs.length;i++){s=socSnaps(accs[i].id);pts=[];for(j=0;j<s.length;j++){if(s[j].date>=from&&s[j].m.followers!==null&&s[j].m.followers!==undefined)pts.push([Date.parse(s[j].date),s[j].m.followers])}if(pts.length)series.push({name:accs[i].name,pts:pts})}
  h+='<div class="card mt16" data-a><div class="row" style="margin-bottom:6px"><div class="h3">Followers over time</div><span class="mu sm">Each line is one account</span></div>'+socChart(series,'Followers over time')+'</div>';
  /* metric availability matrix: which metrics have real entries */
  var mh=['Account'],k,rows=[],c;
  for(k=0;k<SOC_MET.length;k++)mh.push(SOC_MET[k][1]);
  for(i=0;i<accs.length;i++){c=[esc(accs[i].name)];for(k=0;k<SOC_MET.length;k++){var lv=socLatest(accs[i].id,SOC_MET[k][0]);c.push(lv?'<b class="mono">'+lv.v.toLocaleString('en-IN')+'</b>':'<span class="mu">n/a</span>')}rows.push({c:c})}
  h+='<div class="card mt16" data-a><div class="h3" style="margin-bottom:4px">Latest value per metric</div><div class="mu sm" style="margin-bottom:8px">"n/a" means no value has been entered or supplied for that metric. Metrics are never merged across platforms.</div>'+ivTbl(mh,rows,'No accounts match the filters.')+'</div>';
  var ps=socPostsFiltered().slice().sort(function(x,y){var ex=socPostER(x),ey=socPostER(y);return (ey?ey.er:-1)-(ex?ex.er:-1)}).slice(0,3),pl='';
  for(i=0;i<ps.length;i++){var er=socPostER(ps[i]);pl+='<div class="ri"><div class="grow"><b>'+esc((ps[i].caption||ps[i].url||'Post').slice(0,70))+'</b><div class="mu sm">'+esc(socAccName(ps[i].acc))+' | '+esc(ps[i].fmt)+' | '+ivDate(ps[i].date)+'</div></div>'+(er?ivChip(er.er.toFixed(2)+'% ER','ok'):ivChip('No ER data','mt'))+'</div>'}
  h+='<div class="card mt16" data-a><div class="h3" style="margin-bottom:6px">Best-performing posts in range</div><div class="list">'+(pl||'<div class="empty">No posts logged in this range.</div>')+'</div></div>';
  var upd=0,li=0;for(i=0;i<SOC.snaps.length;i++){if(SOC.snaps[i].ts>upd)upd=SOC.snaps[i].ts}
  h+='<div class="mu sm" style="margin:10px 2px">Last data entry: '+(upd?new Date(upd).toLocaleString('en-IN'):'none')+'. Automatic refresh is not active (no backend).</div>';
  return h;
}
function socGrowChip(l,g){
  if(!g)return '<span class="tg mt">'+l+': n/a</span>';
  var up=g.delta>=0;return '<span class="tg '+(g.delta===0?'mt':up?'ok':'bad')+'" title="'+(g.partial?'History is only '+g.span+' days long':'')+'">'+l+': '+(up?'+':'')+g.delta.toLocaleString('en-IN')+(g.pct!==null?' ('+(up?'+':'')+g.pct.toFixed(1)+'%)':'')+(g.partial?' *':'')+'</span>';
}
function socAccounts(){
  var rows=[],i,a,s,last;
  for(i=0;i<SOC.accounts.length;i++){a=SOC.accounts[i];s=socSnaps(a.id);last=s.length?s[s.length-1].date:'';
    rows.push({c:['<b>'+esc(a.name)+'</b>'+(a.demo?' <span class="tg warn">Demo</span>':'')+'<div class="mu sm">'+esc(a.handle||'')+'</div>',esc(a.platform),ivChip(a.status==='manual'?'Manual tracking':'Not connected','warn')+'<div class="mu sm">No official connection</div>',last?ivDate(last)+'<div class="mu sm">manual entry</div>':'<span class="mu">Never</span>','<span class="mu sm">Read-only analytics scopes, once a backend exists</span>','<button class="tg ac" data-sc="newSnap|'+esc(a.id)+'">Log numbers</button> <button class="tg" data-sc="connect|'+esc(a.platform)+'">Connect (setup)</button> <button class="ibtn" data-sc="delAcc|'+esc(a.id)+'" aria-label="Remove account">'+ico('trash')+'</button>']})}
  return '<div class="card" data-a><div class="row" style="margin-bottom:8px"><div class="h3">Accounts</div><button class="btn sm" data-sc="newAcc">'+ico('plus')+'Add account</button></div>'+ivTbl(['Account','Platform','Status','Last successful sync','Permissions','Actions'],rows,'No accounts yet.')+'</div><div class="card mt16" data-a><div class="h3" style="margin-bottom:4px">About connections</div><p class="mu" style="line-height:1.55">Connecting through the platform\'s official OAuth needs a secure server to receive the callback and store tokens. GitHub Pages cannot do that safely, and this site never asks for social media passwords. Until a backend is deployed, accounts are tracked manually. See Integration Settings for what to set up.</p></div>';
}
function socContent(){
  if(!SOC.accounts.length)return socEmpty();
  var ps=socPostsFiltered(),rows=[],i,p,er,base={},by={},med,f,v;
  for(i=0;i<ps.length;i++){er=socPostER(ps[i]);if(er){(base[ps[i].acc]=base[ps[i].acc]||[]).push(er.er)}}
  var sorted=ps.slice().sort(function(a,b){return a.date<b.date?1:-1});
  for(i=0;i<sorted.length;i++){p=sorted[i];if(!ivMatch(SS.q,[p.caption,p.url,p.fmt,p.topic,socAccName(p.acc)]))continue;
    er=socPostER(p);med=base[p.acc]&&base[p.acc].length>=3?socMedian(base[p.acc]):null;
    var vs=er&&med?((er.er/med-1)*100):null,mom=socMomentum(p);
    rows.push({c:[ivDate(p.date),'<b>'+esc((p.caption||'Untitled').slice(0,60))+'</b><div class="mu sm">'+esc(socAccName(p.acc))+(p.url?' | <a class="lnk" href="'+esc(p.url)+'" target="_blank" rel="noopener noreferrer">Open</a>':'')+'</div>',esc(p.fmt),esc(p.topic||'-'),socFmtN((p.m||{}).views),socFmtN((p.m||{}).reach),er?'<b class="mono">'+er.er.toFixed(2)+'%</b><div class="mu sm">of '+er.basis+'</div>':'<span class="mu">n/a</span>',vs!==null?ivChip((vs>=0?'+':'')+vs.toFixed(0)+'% vs own median',vs>=10?'ok':vs<=-10?'bad':'mt'):'<span class="mu sm">Needs 3+ posts</span>',mom?ivChip(mom[0],mom[1]):'<span class="mu sm">-</span>','<button class="tg ac" data-sc="newPM|'+p.id+'">Update metrics</button> <button class="ibtn" data-sc="delPost|'+p.id+'" aria-label="Delete post">'+ico('trash')+'</button>']})}
  /* format performance */
  for(i=0;i<ps.length;i++){er=socPostER(ps[i]);if(!er)continue;(by[ps[i].fmt]=by[ps[i].fmt]||[]).push(er.er)}
  var fr=[];for(f in by){var sum=0,j;for(j=0;j<by[f].length;j++)sum+=by[f][j];fr.push({c:[esc(f),String(by[f].length),'<b class="mono">'+(sum/by[f].length).toFixed(2)+'%</b>']})}
  var h=socFilters('<input id="iv_q" class="ivq" type="search" placeholder="Search posts" value="'+esc(SS.q)+'" aria-label="Search posts"><span class="grow"></span><button class="btn sm" data-sc="newPost">'+ico('plus')+'Add post</button>');
  h+='<div class="card" data-a>'+ivTbl(['Date','Post','Format','Topic','#Views','#Reach','#Engagement','Vs own baseline','Momentum',''],rows,'No posts in this range. Use Add post to log one.')+'</div>';
  h+='<div class="card mt16" data-a><div class="h3" style="margin-bottom:4px">Format performance</div><div class="mu sm" style="margin-bottom:8px">Average engagement rate per format, from posts that have enough data. Small samples are noisy.</div>'+ivTbl(['Format','#Posts','#Avg engagement'],fr,'Not enough post data yet.')+'</div>';
  return h;
}
function socMomentum(p){
  var h=(p.hist||[]).slice().sort(function(a,b){return a.date<b.date?-1:1});if(h.length<2)return null;
  function tot(m){return (m.likes||0)+(m.comments||0)+(m.shares||0)+(m.saves||0)}
  var a=h[h.length-2],b=h[h.length-1],d=tot(b.m)-tot(a.m),days=Math.max(1,Math.round((Date.parse(b.date)-Date.parse(a.date))/864e5)),r=d/days;
  return r>0?['Gaining +'+r.toFixed(1)+'/day','ok']:['Flat','mt'];
}
function socAudience(){
  if(!SOC.accounts.length)return socEmpty();
  var accs=socAccs(),rows=[],i,a,g,h=socFilters(),n,frows=[],ps,wk,cnt;
  for(i=0;i<accs.length;i++){a=accs[i];rows.push({c:['<b>'+esc(a.name)+'</b><div class="mu sm">'+esc(a.platform)+'</div>',socGrowCell(socGrowth(a.id,7)),socGrowCell(socGrowth(a.id,30)),socGrowCell(socGrowth(a.id,90)),socWoW(a.id)]})}
  h+='<div class="card" data-a><div class="h3" style="margin-bottom:4px">Follower growth</div><div class="mu sm" style="margin-bottom:8px">An asterisk (*) means your history is shorter than the window, so the change is measured from your first entry.</div>'+ivTbl(['Account','#7 days','#30 days','#90 days','Week on week'],rows,'No accounts match the filters.')+'</div>';
  ps=socPostsFiltered();
  for(i=0;i<accs.length;i++){cnt=0;var j,firstD='9999',lastD='0000';for(j=0;j<ps.length;j++){if(ps[j].acc===accs[i].id){cnt++;if(ps[j].date<firstD)firstD=ps[j].date;if(ps[j].date>lastD)lastD=ps[j].date}}
    var wks=cnt?Math.max(1,(Date.parse(lastD)-Date.parse(firstD))/864e5/7):0;
    frows.push({c:['<b>'+esc(accs[i].name)+'</b>',String(cnt),cnt?(cnt/Math.max(wks,1)).toFixed(1)+' / week':'<span class="mu">-</span>',socBestDay(ps,accs[i].id)]})}
  h+='<div class="card mt16" data-a><div class="h3" style="margin-bottom:8px">Posting frequency and timing</div>'+ivTbl(['Account','#Posts logged','#Frequency','Most common posting day'],frows,'No posts logged.')+'<div class="mu sm" style="margin-top:8px">Posting time of day is not stored; only dates are logged.</div></div>';
  return h;
}
function socGrowCell(g){if(!g)return '<span class="mu">n/a</span>';var up=g.delta>=0;return '<b class="mono '+(g.delta===0?'':up?'ivin':'ivout')+'">'+(up?'+':'')+g.delta.toLocaleString('en-IN')+'</b>'+(g.pct!==null?'<div class="mu sm">'+(up?'+':'')+g.pct.toFixed(1)+'%'+(g.partial?' *':'')+'</div>':'')}
function socWoW(id){var a=socGrowth(id,7);var b=socGrowthAt(id,14,7);if(!a||b===null)return '<span class="mu">n/a</span>';var d=a.delta-b;return '<span class="mu sm">'+(d>=0?'+':'')+d.toLocaleString('en-IN')+' vs previous week</span>'}
function socGrowthAt(id,fromDays,toDays){
  var s=socSnaps(id),i,last=null,f=[];for(i=0;i<s.length;i++){if(s[i].m.followers!==null&&s[i].m.followers!==undefined)f.push(s[i])}
  if(f.length<3)return null;last=f[f.length-1].date;var d1=socAddDays(last,-toDays),d0=socAddDays(last,-fromDays),a=null,b=null;
  for(i=0;i<f.length;i++){if(f[i].date<=d0)a=f[i];if(f[i].date<=d1)b=f[i]}
  return a&&b&&a!==b?b.m.followers-a.m.followers:null;
}
function socBestDay(ps,acc){var c={},i,d,best='',bn=0,N=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];for(i=0;i<ps.length;i++){if(ps[i].acc!==acc)continue;d=N[new Date(ps[i].date+'T00:00:00').getDay()];c[d]=(c[d]||0)+1;if(c[d]>bn){bn=c[d];best=d}}return best?best+' ('+bn+')':'<span class="mu">-</span>'}

/* ---------- rule-based analyst (no AI model, no invented data) ---------- */
function socBuildReport(kind){
  var days=kind==='weekly'?7:1,accs=SOC.accounts,out=[],i,a,g,evidence=[],hyp=[],actions=[],ideas=[],ps=SOC.posts,gain=[],lose=[];
  out.push('<h4>What changed</h4>');
  for(i=0;i<accs.length;i++){a=accs[i];g=socGrowth(a.id,kind==='weekly'?7:1);
    if(!g){evidence.push(a.name+': not enough follower entries to compare.');continue}
    if(g.delta>0)gain.push(a.name+' (+'+g.delta.toLocaleString('en-IN')+')');else if(g.delta<0)lose.push(a.name+' ('+g.delta.toLocaleString('en-IN')+')');
    evidence.push(a.name+' ('+a.platform+'): '+(g.delta>=0?'+':'')+g.delta+' followers over '+g.span+' day(s)'+(g.partial?', measured from the first entry':'')+'.')}
  out.push('<ul><li>Grew: '+(gain.join(', ')||'none')+'</li><li>Declined: '+(lose.join(', ')||'none')+'</li></ul>');
  out.push('<h4>Evidence from your entries</h4><ul>'+(evidence.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')||'<li>No data entered yet.</li>')+'</ul>');
  var scored=[];for(i=0;i<ps.length;i++){var er=socPostER(ps[i]);if(er)scored.push({p:ps[i],er:er.er})}
  scored.sort(function(x,y){return y.er-x.er});
  if(scored.length){out.push('<h4>Top and underperforming posts</h4><ul><li>Top: '+esc((scored[0].p.caption||scored[0].p.url||'post').slice(0,70))+' ('+scored[0].er.toFixed(2)+'% engagement, '+esc(scored[0].p.fmt)+')</li>'+(scored.length>1?'<li>Lowest: '+esc((scored[scored.length-1].p.caption||scored[scored.length-1].p.url||'post').slice(0,70))+' ('+scored[scored.length-1].er.toFixed(2)+'%, '+esc(scored[scored.length-1].p.fmt)+')</li>':'')+'</ul>')}
  /* anomalies: a change much larger than the account's usual change */
  var an=[];for(i=0;i<accs.length;i++){var s=socSnaps(accs[i].id),ds=[],j;for(j=1;j<s.length;j++){if(s[j].m.followers!=null&&s[j-1].m.followers!=null)ds.push(s[j].m.followers-s[j-1].m.followers)}
    if(ds.length>=4){var last=ds[ds.length-1],mean=0,sd=0;for(j=0;j<ds.length-1;j++)mean+=ds[j];mean/=(ds.length-1);for(j=0;j<ds.length-1;j++)sd+=(ds[j]-mean)*(ds[j]-mean);sd=Math.sqrt(sd/(ds.length-1));if(sd>0&&Math.abs(last-mean)>2*sd)an.push(accs[i].name+': latest change '+last+' versus a usual '+mean.toFixed(1)+' (more than 2 standard deviations).')}}
  out.push('<h4>Significant changes</h4><ul>'+(an.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')||'<li>No unusual change detected (needs at least 5 entries per account).</li>')+'</ul>');
  /* hypotheses */
  var byF={},f,bestF='',bestV=-1,bestT='',byT={},bestTV=-1;
  for(i=0;i<scored.length;i++){f=scored[i].p.fmt;(byF[f]=byF[f]||[]).push(scored[i].er);if(scored[i].p.topic){(byT[scored[i].p.topic]=byT[scored[i].p.topic]||[]).push(scored[i].er)}}
  for(f in byF){var m=socMedian(byF[f]);if(byF[f].length>=2&&m>bestV){bestV=m;bestF=f}}
  for(f in byT){var m2=socMedian(byT[f]);if(byT[f].length>=2&&m2>bestTV){bestTV=m2;bestT=f}}
  if(bestF)hyp.push(bestF+' posts have the highest median engagement ('+bestV.toFixed(2)+'%). This is a pattern in a small sample, not proof that the format causes it.');
  if(bestT)hyp.push('Posts about "'+bestT+'" lead on median engagement ('+bestTV.toFixed(2)+'%). Hypothesis only.');
  out.push('<h4>Possible reasons (hypotheses, not facts)</h4><ul>'+(hyp.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')||'<li>Not enough posts with engagement data to suggest reasons.</li>')+'</ul>');
  if(bestF)actions.push('Publish one more '+bestF+' this week and log its numbers after 24 hours to test the pattern.');
  if(lose.length)actions.push('Review what changed on '+lose.join(', ')+' (posting gap, format change) before drawing conclusions.');
  var stale=[];for(i=0;i<accs.length;i++){var ss=socSnaps(accs[i].id);if(!ss.length||ss[ss.length-1].date<socAddDays(ivToday(),-3))stale.push(accs[i].name)}
  if(stale.length)actions.push('Log fresh numbers for '+stale.join(', ')+' (no entry in the last 3 days).');
  var open=cnt(byType('lead'),function(l){return l.priority&&(l.detail||'').indexOf('soc:')===0&&l.status!=='WON'&&l.status!=='LOST'});
  if(open)actions.push('Follow up '+open+' open social lead'+(open>1?'s':'')+' in CRM.');
  out.push('<h4>Next 24 hours</h4><ul>'+(actions.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')||'<li>Add data to get recommendations.</li>')+'</ul>');
  if(bestF||bestT)ideas.push('Another '+(bestF||'post')+(bestT?' on "'+bestT+'"':'')+' with a clear call to action. Estimate only; results are not guaranteed.');
  if(ideas.length)out.push('<h4>Content ideas (estimates)</h4><ul>'+ideas.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>');
  out.push('<p class="mu sm">Generated '+new Date().toLocaleString('en-IN')+' from data entered on this device. Rule-based analysis; no AI model was called and no data was invented.</p>');
  return out.join('');
}
function socInsights(){
  var h='<div class="card" data-a><div class="row" style="margin-bottom:8px;flex-wrap:wrap;gap:8px"><div><div class="h3">AI Insights</div><div class="mu sm">Rule-based analysis of the numbers you logged. Separates evidence from hypotheses. Estimates are never guarantees.</div></div><div class="gap">'+socBtn('Daily report','rep|daily','')+socBtn('Weekly strategy','rep|weekly')+'</div></div>';
  if(!SOC.accounts.length)h+='<div class="empty">Add an account and log some numbers first.</div>';
  else if(SOC.reports.length)h+='<div class="socrep">'+SOC.reports[0].html+'</div><div class="mu sm" style="margin-top:6px">'+esc(SOC.reports[0].kind)+' report, '+new Date(SOC.reports[0].ts).toLocaleString('en-IN')+'</div>';
  else h+='<div class="empty">Press Daily report or Weekly strategy to generate one.</div>';
  h+='</div>';
  if(SOC.reports.length>1){var r='',i;for(i=1;i<Math.min(SOC.reports.length,8);i++)r+='<div class="ri"><div class="grow"><b>'+esc(SOC.reports[i].kind)+' report</b><div class="mu sm">'+new Date(SOC.reports[i].ts).toLocaleString('en-IN')+'</div></div><button class="tg ac" data-sc="showRep|'+i+'">View</button></div>';h+='<div class="card mt16" data-a><div class="h3" style="margin-bottom:6px">Earlier reports</div><div class="list">'+r+'</div></div>'}
  return h;
}
function socResearch(){
  var rows=[],i,r;for(i=0;i<SOC.research.length;i++){r=SOC.research[i];if(!ivMatch(SS.q,[r.name,r.platform,r.note,r.url]))continue;rows.push({c:['<b>'+esc(r.name)+'</b>'+(r.url?'<div><a class="lnk" href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">Open public profile</a></div>':''),esc(r.platform),r.followers!=null?Number(r.followers).toLocaleString('en-IN'):'<span class="mu">-</span>',ivDate(r.date),esc(r.note||'-'),'<button class="ibtn" data-sc="delRes|'+r.id+'" aria-label="Remove">'+ico('trash')+'</button>']})}
  return '<div class="card" data-a><div class="mu sm" style="margin-bottom:8px">Track public profiles and trends you observe yourself. Only publicly visible information you type in is stored. Nothing is scraped, and no private data is collected.</div><div class="ivtool"><input id="iv_q" class="ivq" type="search" placeholder="Search" value="'+esc(SS.q)+'" aria-label="Search research"><span class="grow"></span><button class="btn sm" data-sc="newRes">'+ico('plus')+'Add profile or trend</button></div>'+ivTbl(['Profile / trend','Platform','#Followers (public)','Observed on','Notes',''],rows,'Nothing tracked yet.')+'</div>';
}
function socLeadItems(){var l=byType('lead'),r=[],i;for(i=0;i<l.length;i++){if((l[i].detail||'').indexOf('soc:')===0)r.push(l[i])}return r}
function socLeads(){
  var ls=socLeadItems(),rows=[],i,l;for(i=0;i<ls.length;i++){l=ls[i];if(!ivMatch(SS.q,[l.title,l.from,l.notes,l.to]))continue;rows.push({c:['<b>'+esc(l.title)+'</b>',esc(l.from),esc(l.to),ivChip(l.status,l.status==='WON'?'ok':l.status==='LOST'?'bad':'warn'),l.due?ivDate(l.due):'<span class="mu">-</span>',esc(l.notes||'-'),'<button class="tg ac" data-p="crm">Open in CRM</button>']})}
  return '<div class="card" data-a><div class="mu sm" style="margin-bottom:8px">Leads you log here are created in the CRM with their social source. Incoming messages are not read automatically: that needs platform-approved access through a backend. Duplicates (same platform, handle and reference) are blocked.</div><div class="ivtool"><input id="iv_q" class="ivq" type="search" placeholder="Search leads" value="'+esc(SS.q)+'" aria-label="Search leads"><span class="grow"></span><button class="btn sm" data-sc="newLead">'+ico('plus')+'Add social lead</button></div>'+ivTbl(['Lead','Source','Owner','Status','Follow-up','Reference',''],rows,'No social leads yet.')+'</div>';
}
function socReports(){
  return '<div class="card" data-a><div class="h3" style="margin-bottom:6px">Export</div><p class="mu sm" style="margin-bottom:10px">Download what you have logged. Files are plain CSV.</p><div class="gap">'+socBtn('Accounts','csv|acc')+socBtn('Follower snapshots','csv|snap')+socBtn('Posts','csv|post')+socBtn('Public research','csv|res')+'</div></div><div class="card mt16" data-a><div class="h3" style="margin-bottom:6px">Generated reports</div>'+(SOC.reports.length?SOC.reports.length+' saved on this device. Open AI Insights to read them.':'<div class="empty">None yet.</div>')+'</div>';
}
function socSettings(){
  var rows=[],k;for(k=0;k<SOC_PLAT.length;k++){var a=SOC_API[SOC_PLAT[k]];rows.push({c:['<b>'+esc(SOC_PLAT[k])+'</b>',esc(a.api),'<span class="mono sm">'+esc(a.scopes)+'</span>',esc(a.need),ivChip('Not connected','warn')]})}
  return '<div class="card" data-a><div class="h3" style="margin-bottom:6px">Backend status</div><div class="gap" style="margin-bottom:8px">'+ivChip(SOC.backend?'Endpoint saved, not verified':'No backend configured','warn')+'</div><p class="mu" style="line-height:1.55;margin-bottom:10px">Needed for real connections: a secure server (for example Apps Script or a small cloud function) that receives the OAuth callback, keeps tokens and secrets private, and runs a daily scheduled sync that writes snapshots. GitHub Pages must stay a static frontend, and secrets must never be placed in this repository or in a public sheet.</p><div class="ivfr">'+ivFi('Backend endpoint URL (optional)','sc_be','url',SOC.backend,'https://...')+'<div class="fld"><label>&nbsp;</label><button class="btn" data-sc="saveBe">Save endpoint</button></div></div><p class="mu sm" style="margin-top:8px">When set, the Sync button calls <span class="mono">GET &lt;endpoint&gt;?action=social_pull</span> and merges returned accounts, snapshots and posts without duplicates. This integration point is not verified against a live backend.</p>'+(SOC.backend?'<div class="gap" style="margin-top:10px">'+socBtn('Sync now','sync','')+'</div>':'')+'</div><div class="card mt16" data-a><div class="h3" style="margin-bottom:4px">Platform requirements</div><div class="mu sm" style="margin-bottom:8px">Summarised for planning. Always confirm current scopes, review rules and quotas in each platform\'s official documentation.</div>'+ivTbl(['Platform','Official API','Typical scopes','Requirements','Status'],rows,'')+'</div>';
}
function vSocial(){
  var h=pageHead('Social Media','Track accounts, content and growth. Honest data only.'),i,t='';
  for(i=0;i<SOC_TABS.length;i++)t+='<button class="tb'+(SS.tab===SOC_TABS[i][0]?' on':'')+'" data-sc="tab|'+SOC_TABS[i][0]+'">'+SOC_TABS[i][1]+'</button>';
  h+='<div class="row ivhd ivtabs-wrap" data-a><div class="tabs ivtabs" role="tablist">'+t+'</div></div>';
  var hasDemo=false;for(i=0;i<SOC.accounts.length;i++){if(SOC.accounts[i].demo)hasDemo=true}
  if(hasDemo)h+='<div class="ivdemo" data-a><span>Demo data is loaded. These numbers are examples only.</span>'+socBtn('Clear demo data','cleardemo')+'</div>';
  h+='<div class="ivnote mu sm" data-a>Manual tracking, saved on this device. No account is connected through an official API yet.</div>';
  return h+({overview:socOverview,accounts:socAccounts,content:socContent,audience:socAudience,insights:socInsights,research:socResearch,leads:socLeads,reports:socReports,settings:socSettings}[SS.tab]||socOverview)();
}

/* ---------- forms ---------- */
function socModal(title,body,act,label,wide){
  openMod('<h3>'+title+'</h3><div class="stack ivform">'+body+'<div class="iverr" id="iv_err" role="alert" style="display:none"></div><div class="gap" style="justify-content:flex-end"><button class="btn g" data-x="1">Cancel</button><button class="btn" data-sc="'+act+'">'+label+'</button></div></div>');
  $('mod').style.maxWidth=wide?'780px':'';
}
function socErr(pairs){
  var old=document.querySelectorAll('#mod .fe,#mod .bad'),i,f,m,e=$('iv_err'),first=null;
  for(i=0;i<old.length;i++){if(old[i].className==='fe')old[i].parentNode.removeChild(old[i]);else old[i].className=old[i].className.replace(/\s*\bbad\b/g,'')}
  if(e){e.innerHTML=pairs.length?'<b>Please fix '+pairs.length+' thing'+(pairs.length>1?'s':'')+' above.</b>':'';e.style.display=pairs.length?'block':'none'}
  for(i=0;i<pairs.length;i++){f=$(pairs[i][0]);if(f&&f.parentNode){f.className+=' bad';f.setAttribute('aria-invalid','true');m=document.createElement('div');m.className='fe';m.setAttribute('role','alert');m.textContent=pairs[i][1];f.parentNode.appendChild(m);if(!first)first=f}}
  if(first){try{first.focus()}catch(x){}}
  return pairs.length===0;
}
function socAccSel(id,sel){var h='<select id="'+id+'">',i;for(i=0;i<SOC.accounts.length;i++)h+='<option value="'+esc(SOC.accounts[i].id)+'"'+(SOC.accounts[i].id===sel?' selected':'')+'>'+esc(SOC.accounts[i].name)+' ('+esc(SOC.accounts[i].platform)+')</option>';return h+'</select>'}
function socMetFields(pre){var h='',i;for(i=0;i<SOC_MET.length;i++)h+=ivFi(SOC_MET[i][1],pre+SOC_MET[i][0],'number','','Leave blank if not available','min="0" step="any" inputmode="decimal"');return h}
function socReadMet(pre){var m={},i,v;for(i=0;i<SOC_MET.length;i++){v=socNum(pre+SOC_MET[i][0]);m[SOC_MET[i][0]]=v}return m}
function socFormAcc(){socModal('Add account to track','<div class="ivfr">'+ivFs('Platform','sc_plat',SOC_PLAT,'Instagram')+ivFi('Account name','sc_name','text','','e.g. NIKHILs Tech Studio')+ivFi('Handle or page URL','sc_handle','text','','@handle or https://...')+'</div>'+fld('Notes','sc_notes','<textarea id="sc_notes" style="min-height:60px"></textarea>')+'<p class="mu sm">Tracked manually. No password or token is requested or stored.</p>','saveAcc','Add account')}
function socSaveAcc(){
  var er=[],n=ivV('sc_name'),i;if(!n)er.push(['sc_name','Account name is required.']);
  for(i=0;i<SOC.accounts.length;i++){if(n&&SOC.accounts[i].name.toLowerCase()===n.toLowerCase()&&SOC.accounts[i].platform===ivV('sc_plat'))er.push(['sc_name','This account is already tracked.'])}
  if(!socErr(er))return;
  SOC.accounts.push({id:socId('ACC'),platform:ivV('sc_plat'),name:n,handle:ivV('sc_handle'),notes:ivV('sc_notes'),status:'manual',created:new Date().toISOString()});
  if(!socSave())return;closeMod();toast('Account added');SS.tab='accounts';render(true);
}
function socFormSnap(id){
  if(!SOC.accounts.length){toast('Add an account first');return}
  socModal('Log account numbers','<div class="ivfr">'+fld('Account','sc_acc',socAccSel('sc_acc',id))+ivFi('Date','sc_date','date',ivToday())+ivFi('Followers / subscribers','sc_fol','number','','Required','min="0" step="1" inputmode="numeric"')+'</div><details class="ivdet" open><summary>Other metrics (only what the platform shows you)</summary><div class="ivfr">'+socMetFields('sc_')+'</div></details>','saveSnap','Save entry',true);
}
function socSaveSnap(){
  var er=[],acc=ivV('sc_acc'),d=ivV('sc_date'),f=socNum('sc_fol'),m,i,s,k;
  if(!d)er.push(['sc_date','Date is required.']);
  if(f===null||f<0)er.push(['sc_fol','Enter the follower or subscriber count (0 or more).']);
  for(i=0;i<SOC_MET.length;i++){k=socNum('sc_'+SOC_MET[i][0]);if(k!==null&&k<0)er.push(['sc_'+SOC_MET[i][0],SOC_MET[i][1]+' cannot be negative.'])}
  if(d>ivToday())er.push(['sc_date','Date cannot be in the future.']);
  if(!socErr(er))return;
  m=socReadMet('sc_');m.followers=f;
  for(i=0;i<SOC.snaps.length;i++){s=SOC.snaps[i];if(s.acc===acc&&s.date===d){s.m=m;s.ts=Date.now();if(!socSave())return;closeMod();toast('Updated the existing entry for '+d);render(true);return}}
  SOC.snaps.push({id:socId('SNP'),acc:acc,date:d,m:m,ts:Date.now()});
  if(!socSave()){SOC.snaps.pop();return}closeMod();toast('Entry saved');render(true);
}
function socFormPost(){
  if(!SOC.accounts.length){toast('Add an account first');return}
  socModal('Add post','<div class="ivfr">'+fld('Account','sc_acc',socAccSel('sc_acc'))+ivFi('Publish date','sc_date','date',ivToday())+ivFs('Format','sc_fmt',SOC_FMT,'Reel')+ivFi('Topic or theme','sc_topic','text','','e.g. behind the scenes')+ivFi('Content URL','sc_url','url','','https://...')+'</div>'+fld('Caption','sc_cap','<textarea id="sc_cap" style="min-height:70px"></textarea>')+'<details class="ivdet" open><summary>Metrics (optional)</summary><div class="ivfr">'+socMetFields('sc_')+'</div></details>','savePost','Save post',true);
}
function socSavePost(){
  var er=[],d=ivV('sc_date'),u=ivV('sc_url'),i,m;
  if(!d)er.push(['sc_date','Publish date is required.']);
  if(!ivV('sc_cap')&&!u)er.push(['sc_cap','Add a caption or a URL so the post can be identified.']);
  if(u&&!/^https?:\/\//.test(u))er.push(['sc_url','URL must start with https://']);
  for(i=0;i<SOC.posts.length;i++){if(u&&SOC.posts[i].url===u)er.push(['sc_url','This URL is already logged.'])}
  if(!socErr(er))return;
  m=socReadMet('sc_');
  SOC.posts.push({id:socId('PST'),acc:ivV('sc_acc'),url:u,date:d,caption:ivV('sc_cap'),fmt:ivV('sc_fmt'),topic:ivV('sc_topic'),m:m,hist:[{date:ivToday(),m:m}]});
  if(!socSave()){SOC.posts.pop();return}closeMod();toast('Post saved');SS.tab='content';render(true);
}
function socFormPM(id){socModal('Update post metrics','<p class="mu sm" style="margin:0">Adds a dated snapshot so momentum can be measured.</p><div class="ivfr">'+ivFi('Date','sc_date','date',ivToday())+socMetFields('sc_')+'</div><input type="hidden" id="sc_pid" value="'+esc(id)+'">','savePM','Save metrics',true)}
function socSavePM(){
  var er=[],id=ivV('sc_pid'),d=ivV('sc_date'),m=socReadMet('sc_'),i,p=null;
  for(i=0;i<SOC.posts.length;i++){if(SOC.posts[i].id===id)p=SOC.posts[i]}
  if(!p)return;if(!d)er.push(['sc_date','Date is required.']);
  if(!socErr(er))return;
  p.hist=p.hist||[];var found=false;for(i=0;i<p.hist.length;i++){if(p.hist[i].date===d){p.hist[i].m=m;found=true}}if(!found)p.hist.push({date:d,m:m});
  p.m=m;if(!socSave())return;closeMod();toast('Metrics updated');render(true);
}
function socFormRes(){socModal('Add public profile or trend','<div class="ivfr">'+ivFi('Name or topic','sc_name','text','','Profile or trend')+ivFs('Platform','sc_plat',SOC_PLAT,'Instagram')+ivFi('Public URL (optional)','sc_url','url')+ivFi('Followers shown publicly (optional)','sc_fol','number','','','min="0" step="1"')+ivFi('Observed on','sc_date','date',ivToday())+'</div>'+fld('What you observed','sc_notes','<textarea id="sc_notes" style="min-height:70px"></textarea>'),'saveRes','Save')}
function socSaveRes(){
  var er=[],u=ivV('sc_url');if(!ivV('sc_name'))er.push(['sc_name','Name or topic is required.']);if(u&&!/^https?:\/\//.test(u))er.push(['sc_url','URL must start with https://']);
  if(!socErr(er))return;
  SOC.research.push({id:socId('RES'),name:ivV('sc_name'),platform:ivV('sc_plat'),url:u,followers:socNum('sc_fol'),date:ivV('sc_date'),note:ivV('sc_notes')});
  if(!socSave())return;closeMod();toast('Saved');render(true);
}
function socFormLead(){
  socModal('Add social lead','<div class="ivfr">'+ivFs('Platform','sc_plat',SOC_PLAT,'Instagram')+ivFi('Name','sc_name','text','','Lead name')+ivFi('Handle','sc_handle','text','','@handle')+ivFi('Campaign (optional)','sc_camp','text')+ivFs('Assign to','sc_to',PEOPLE,ivUser())+ivFi('Follow-up date','sc_due','date')+'</div>'+fld('Conversation reference (link or note)','sc_ref','<input id="sc_ref" placeholder="Link to the comment or conversation" autocomplete="off">')+fld('Notes','sc_notes','<textarea id="sc_notes" style="min-height:60px"></textarea>')+'<p class="mu sm">Only log people who contacted you. Respect platform rules and consent.</p>','saveLead','Create lead in CRM');
}
function socSaveLead(){
  var er=[],n=ivV('sc_name'),h=ivV('sc_handle'),r=ivV('sc_ref'),key,i,ls=socLeadItems();
  if(!n)er.push(['sc_name','Name is required.']);
  if(!h&&!r)er.push(['sc_handle','Add a handle or a conversation reference so duplicates can be detected.']);
  key='soc:'+ivV('sc_plat')+'|'+(h||'').toLowerCase()+'|'+(r||'').toLowerCase();
  for(i=0;i<ls.length;i++){if(ls[i].detail===key)er.push(['sc_name','This lead already exists in CRM ('+ls[i].title+'). Duplicate not created.'])}
  if(!socErr(er))return;
  addItem({type:'lead',title:n,from:ivV('sc_plat')+(h?' '+h:''),to:ivV('sc_to'),priority:ivV('sc_camp')||'Social',status:'NEW',due:ivV('sc_due'),detail:key,notes:(r?'Ref: '+r+'. ':'')+ivV('sc_notes')});
  closeMod();toast('Lead created in CRM');render(true);
}
function socFormConnect(p){
  var a=SOC_API[p]||SOC_API.Other;
  openMod('<h3>Connect '+esc(p)+'</h3><p class="mu" style="margin:6px 0 12px;line-height:1.55">Real connection is not available yet. It needs a secure backend to receive the official OAuth callback and keep tokens private. This site never asks for your password.</p><div class="stack"><div><b>API</b><div class="mu sm">'+esc(a.api)+'</div></div><div><b>Permissions to request</b><div class="mu sm mono">'+esc(a.scopes)+'</div></div><div><b>Requirements</b><div class="mu sm">'+esc(a.need)+'</div></div>'+(a.doc?'<div><b>Documentation</b><div class="mu sm">'+esc(a.doc)+'</div></div>':'')+'<div class="gap" style="justify-content:flex-end"><button class="btn g" data-sc="goSet">Integration settings</button><button class="btn" data-x="1">Close</button></div></div>');
}

/* ---------- demo, actions, wiring ---------- */
function socDemo(){
  var t=ivToday(),A=[['Instagram','Studio Instagram (demo)','@demo_studio',1200,9],['YouTube','Studio YouTube (demo)','Demo channel',340,3]],i,a,id,d,j,v;
  for(i=0;i<A.length;i++){id=socId('ACC');SOC.accounts.push({id:id,platform:A[i][0],name:A[i][1],handle:A[i][2],notes:'Demo',status:'manual',created:new Date().toISOString(),demo:true});
    for(j=0;j<12;j++){d=socAddDays(t,-(11-j)*7);v=A[i][3]+j*A[i][4]*7+((j*37)%11);SOC.snaps.push({id:socId('SNP'),acc:id,date:d,m:{followers:v,reach:A[i][0]==='Instagram'?v*3:null,views:A[i][0]==='YouTube'?v*5:null},ts:Date.now(),demo:true})}
    var F=A[i][0]==='YouTube'?['Video','Short video']:['Reel','Carousel','Image'];
    for(j=0;j<8;j++){var m={likes:20+((j*13)%40)*(F[j%F.length]==='Reel'||F[j%F.length]==='Short video'?3:1),comments:3+j%5,shares:2+j%4,saves:5+j%7,reach:400+j*60,views:900+j*150};
      SOC.posts.push({id:socId('PST'),acc:id,url:'',date:socAddDays(t,-j*8),caption:'Demo post '+(j+1),fmt:F[j%F.length],topic:j%2?'behind the scenes':'tutorial',m:m,hist:[{date:socAddDays(t,-j*8+1),m:{likes:Math.round(m.likes*.6),comments:m.comments,shares:m.shares,saves:m.saves}},{date:socAddDays(t,-j*8+4),m:m}],demo:true})}}
  socSave();
}
function socClearDemo(){function nd(a){var o=[],i;for(i=0;i<a.length;i++){if(!a[i].demo)o.push(a[i])}return o}SOC.accounts=nd(SOC.accounts);SOC.snaps=nd(SOC.snaps);SOC.posts=nd(SOC.posts);SOC.reports=[];socSave()}
function socDel(kind,id){
  var arr=kind==='acc'?SOC.accounts:kind==='post'?SOC.posts:SOC.research,i;
  if(!window.confirm('Remove this '+(kind==='acc'?'account and all its logged numbers and posts':'record')+'?'))return;
  for(i=0;i<arr.length;i++){if(arr[i].id===id){arr.splice(i,1);break}}
  if(kind==='acc'){SOC.snaps=SOC.snaps.filter(function(s){return s.acc!==id});SOC.posts=SOC.posts.filter(function(p){return p.acc!==id})}
  socSave();toast('Removed');render(true);
}
function socSync(){
  var u=SOC.backend;if(!u){toast('No backend endpoint saved');return}
  toast('Contacting backend...');
  fetch(u+(u.indexOf('?')>-1?'&':'?')+'action=social_pull').then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(function(d){
    var n=0,i;function has(a,id){var k;for(k=0;k<a.length;k++){if(a[k].id===id)return true}return false}
    if(d&&d.accounts){for(i=0;i<d.accounts.length;i++){if(d.accounts[i].id&&!has(SOC.accounts,d.accounts[i].id)){d.accounts[i].status='connected';SOC.accounts.push(d.accounts[i]);n++}}}
    if(d&&d.snapshots){for(i=0;i<d.snapshots.length;i++){if(d.snapshots[i].id&&!has(SOC.snaps,d.snapshots[i].id)){SOC.snaps.push(d.snapshots[i]);n++}}}
    if(d&&d.posts){for(i=0;i<d.posts.length;i++){if(d.posts[i].id&&!has(SOC.posts,d.posts[i].id)){SOC.posts.push(d.posts[i]);n++}}}
    socSave();toast('Sync finished: '+n+' new record'+(n===1?'':'s'));render(true)}).catch(function(e){toast('Sync failed: '+e.message)});
}
function socExport(w){
  var r=[],i,x,h;
  if(w==='acc'){for(i=0;i<SOC.accounts.length;i++){x=SOC.accounts[i];r.push([x.id,x.platform,x.name,x.handle,x.status,x.created])}ivCsv('social-accounts',['ID','Platform','Name','Handle','Status','Created'],r)}
  else if(w==='snap'){for(i=0;i<SOC.snaps.length;i++){x=SOC.snaps[i];r.push([x.date,socAccName(x.acc),x.m.followers,x.m.reach,x.m.impressions,x.m.views,x.m.watch,x.m.likes,x.m.comments,x.m.shares,x.m.saves,x.m.visits,x.m.clicks])}ivCsv('social-snapshots',['Date','Account','Followers','Reach','Impressions','Views','Watch hours','Likes','Comments','Shares','Saves','Profile visits','Link clicks'],r)}
  else if(w==='post'){for(i=0;i<SOC.posts.length;i++){x=SOC.posts[i];r.push([x.date,socAccName(x.acc),x.fmt,x.topic,x.url,x.caption,x.m.views,x.m.reach,x.m.likes,x.m.comments,x.m.shares,x.m.saves])}ivCsv('social-posts',['Date','Account','Format','Topic','URL','Caption','Views','Reach','Likes','Comments','Shares','Saves'],r)}
  else{for(i=0;i<SOC.research.length;i++){x=SOC.research[i];r.push([x.date,x.name,x.platform,x.url,x.followers,x.note])}ivCsv('social-research',['Observed','Name','Platform','URL','Followers','Notes'],r)}
}
function socAct(a){
  var p=a.split('|'),x=p[0],i;
  if(x==='tab'){SS.tab=p[1];SS.q='';if(state.page!=='social')go('social');else{render(true);window.scrollTo(0,0)}}
  else if(x==='newAcc')socFormAcc();else if(x==='saveAcc')socSaveAcc();
  else if(x==='newSnap')socFormSnap(p[1]);else if(x==='saveSnap')socSaveSnap();
  else if(x==='newPost')socFormPost();else if(x==='savePost')socSavePost();
  else if(x==='newPM')socFormPM(p[1]);else if(x==='savePM')socSavePM();
  else if(x==='newRes')socFormRes();else if(x==='saveRes')socSaveRes();
  else if(x==='newLead')socFormLead();else if(x==='saveLead')socSaveLead();
  else if(x==='connect')socFormConnect(p[1]);
  else if(x==='goSet'){closeMod();SS.tab='settings';render(true)}
  else if(x==='delAcc')socDel('acc',p[1]);else if(x==='delPost')socDel('post',p[1]);else if(x==='delRes')socDel('res',p[1]);
  else if(x==='demo'){socDemo();toast('Demo data loaded. Clear it any time.');render(true)}
  else if(x==='cleardemo'){socClearDemo();toast('Demo data cleared');render(true)}
  else if(x==='rep'){if(!SOC.accounts.length){toast('Add an account first');return}SOC.reports.unshift({kind:p[1]==='weekly'?'Weekly strategy':'Daily',ts:Date.now(),html:socBuildReport(p[1])});if(SOC.reports.length>20)SOC.reports.length=20;socSave();render(true)}
  else if(x==='showRep'){var r=SOC.reports[+p[1]];if(r)openMod('<h3>'+esc(r.kind)+' report</h3><div class="socrep">'+r.html+'</div><div class="gap" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-x="1">Close</button></div>')}
  else if(x==='saveBe'){var v=ivV('sc_be');if(v&&!/^https:\/\//.test(v)){toast('Endpoint must start with https://');return}SOC.backend=v;socSave();toast(v?'Endpoint saved (not verified)':'Endpoint cleared');render(true)}
  else if(x==='sync')socSync();
  else if(x==='csv')socExport(p[1]);
}
document.addEventListener('click',function(e){var n=e.target.closest&&e.target.closest('[data-sc]');if(!n)return;e.preventDefault();socAct(n.getAttribute('data-sc'))});
document.addEventListener('change',function(e){var t=e.target;if(!t||!t.id)return;
  if(t.id==='scf_plat'){SS.plat=t.value;SS.acc='ALL';render(true)}
  else if(t.id==='scf_acc'){SS.acc=t.value;render(true)}
  else if(t.id==='scf_range'){SS.range=t.value;render(true)}});
document.addEventListener('input',function(e){var t=e.target;if(t&&t.id==='iv_q'&&state.page==='social'){SS.q=t.value;var pos=t.selectionStart;render(true);var q=$('iv_q');if(q){q.focus();try{q.setSelectionRange(pos,pos)}catch(err){}}}});
PAGES.social=['Social Media','megaphone'];
GROUPS.splice(4,0,['Social','megaphone',['social']]);
VIEWS.social=vSocial;
COMMANDS.push(['Open social media','Navigate',function(){SS.tab='overview';go('social')}]);
COMMANDS.push(['Log social numbers','Create',function(){SS.tab='accounts';go('social');setTimeout(function(){socFormSnap('')},350)}]);
