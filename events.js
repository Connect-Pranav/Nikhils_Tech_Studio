/* ---------- events ---------- */
document.addEventListener('click',function(e){
  var t=e.target,n;
  n=t.closest('[data-g]');if(n){var gi=+n.getAttribute('data-g');go(state.last[gi]||GROUPS[gi][2][0]);return}
  n=t.closest('[data-p]');if(n){var p=n.getAttribute('data-p');if(p==='more'){$('sheet').className='sheet on'}else go(p);return}
  n=t.closest('[data-cb]');if(n){state.cb=n.getAttribute('data-cb');render(true);return}
  n=t.closest('[data-tab]');if(n){state.taskTab=n.getAttribute('data-tab');render(true);return}
  n=t.closest('[data-tog]');if(n){var it=getItem(n.getAttribute('data-tog'));if(it){setStatus(it.id,it.status==='COMPLETED'?'PENDING':'COMPLETED');render(true)}return}
  n=t.closest('[data-cyc]');if(n){var it2=getItem(n.getAttribute('data-cyc'));if(it2){var nx={'PENDING':'IN PROGRESS','IN PROGRESS':'COMPLETED','COMPLETED':'PENDING'};setStatus(it2.id,nx[it2.status]||'PENDING');render(true)}return}
  n=t.closest('[data-st]');if(n){var pr=n.getAttribute('data-st').split('|');setStatus(pr[0],pr[1]);render(true);toast('Status set to '+sl(pr[1]));return}
  n=t.closest('[data-rt]');if(n){state.reqTab=n.getAttribute('data-rt');render(true);return}
  n=t.closest('[data-exp]');if(n){var ex=n.getAttribute('data-exp');state.open[ex]=!state.open[ex];render(true);return}
  n=t.closest('[data-vp]');if(n){var vp=n.getAttribute('data-vp').split('|');voice.pitch=+vp[0];voice.fx=vp[1];if(voice.buf)runVoice();else render(true);return}
  n=t.closest('[data-ut]');if(n){state.upTab=n.getAttribute('data-ut');render(true);return}
  n=t.closest('[data-ct]');if(n){state.crTab=n.getAttribute('data-ct');render(true);return}
  n=t.closest('[data-i]');if(n){run(+n.getAttribute('data-i'));return}
  if(t.closest('#goBtn')){state.owner=$('fo_owner').value;state.status=$('fo_status').value;state.when=$('fo_when').value;state.taskTab='pending';go('tasks');return}
  if(t.closest('#clrF')){state.owner='All';state.status='All';state.when='any';render(true);return}
  if(t.closest('#newTask')){modalTask();return}
  if(t.closest('[data-x]')){closeMod();return}
  if(t.closest('#ms')){var v=$('mt').value.trim(),dsc=$('mdesc').value.trim();if(wc(dsc)>2000){toast('Description is over 2,000 words. Please shorten it.');return}if(v){addItem({type:'task',title:v,detail:dsc,from:'Nikhil',to:$('mo').value,due:dueFor($('md').value),status:'PENDING'});closeMod();state.page='tasks';state.taskTab='pending';render();toast('Task assigned')}else{$('mt').focus()}return}
  if(t.closest('#mms')){closeMod();toast('Meeting created');return}
  if(t.closest('#asgBtn')){var at=$('as_t').value.trim();if(!at){$('as_t').focus();return}addItem({type:'task',title:at,from:'Nikhil',to:$('as_o').value,due:dueFor($('as_d').value),status:'PENDING'});render(true);toast('Assigned to '+$('as_o').value);return}
  if(t.closest('#reqBtn')){var rt=$('rq_title').value.trim();if(!rt){$('rq_title').focus();return}addItem({type:'request',title:rt,detail:$('rq_detail').value.trim(),from:$('rq_from').value,to:$('rq_to').value,priority:$('rq_pri').value,status:'RAISED'});state.reqTab='ALL';render(true);toast('Request raised');return}
  if(t.closest('#ctBtn')){var ctt=$('ct_title').value.trim();if(!ctt){$('ct_title').focus();return}addItem({type:'content',title:ctt,from:$('ct_owner').value,to:$('ct_owner').value,priority:$('ct_plat').value,status:'IDEA',due:$('ct_due').value});render(true);toast('Idea added');return}
  if(t.closest('#ldBtn')){var ln=$('ld_name').value.trim();if(!ln){$('ld_name').focus();return}addItem({type:'lead',title:ln,from:$('ld_co').value.trim(),to:$('ld_owner').value,priority:$('ld_val').value.trim()||'0',status:'NEW',notes:$('ld_next').value.trim()});render(true);toast('Lead added');return}
  if(t.closest('#linkBtn')){var lk=$('up_link').value.trim();if(!/^https?:\/\//.test(lk)){toast('Paste a full link starting with https://');return}addItem({type:'upload',title:$('up_note').value.trim()||lk,detail:lk,from:$('up_by').value,to:'Link',priority:'Link',status:'UPLOADED',due:iso(new Date())});render(true);toast('Link added');return}
  if(t.closest('#mlinkBtn')){var ml=$('m_link').value.trim();if(!/^https?:\/\//.test(ml)){toast('Paste a full link starting with https://');return}var mo=modelOpts();addItem({type:'model',title:mo.note||ml,detail:ml,from:mo.by,to:mo.tag,priority:mo.ver+' · Link',status:'TESTING',notes:mo.notes,due:iso(new Date())});render(true);toast('Model added');return}
  if(t.closest('#recBtn')){toggleRec();return}
  if(t.closest('#vApply')){voice.pitch=+$('vPitch').value;voice.fx=$('vFx').value;runVoice();return}
  if(t.closest('#vSave')){if(!voice.blob)return;var nm='voice-'+voice.pitch+'st-'+voice.fx+'.wav';sendFiles([new File([voice.blob],nm,{type:'audio/wav'})],{by:$('v_by').value,note:'Voice: '+voice.name+' ('+voice.fx+', '+voice.pitch+' st)',noRender:true});return}
  if(t.closest('#kBtn')){openPal();return}
  n=t.closest('[data-open],[data-dl]');if(n){var dlf=n.hasAttribute('data-dl'),ok=n.getAttribute(dlf?'data-dl':'data-open'),cd=n.closest('[data-id]'),oi=cd?getItem(cd.getAttribute('data-id')):null;openFile(ok,oi||{title:'File',to:'',notes:''},dlf);return}
  if(t.closest('#cnBtn')){modalConnect();return}
  if(t.closest('#cnTest')){var tu=$('cn_url').value.trim(),rs=$('cnRes');if(!tu){rs.className='cnres bad';rs.textContent='Paste the URL first.';return}
    var keep=CFG.SCRIPT_URL;CFG.SCRIPT_URL=tu;rs.className='cnres';rs.textContent='Testing...';
    GoogleSheets.ping().then(function(n){CFG.SCRIPT_URL=keep;rs.className='cnres ok';rs.textContent='Connected. The sheet returned '+n+' record'+(n===1?'':'s')+'.'}).catch(function(err){CFG.SCRIPT_URL=keep;rs.className='cnres bad';rs.textContent='Failed: '+errMsg(err)+'.'});return}
  n=t.closest('[data-edit]');if(n){modalEdit(n.getAttribute('data-edit'));return}
  n=t.closest('[data-del]');if(n){var di=n.getAttribute('data-del'),dt=getItem(di);if(dt&&window.confirm('Delete "'+(dt.title||'this record')+'"? This also removes it from the Google sheet.')){deleteItem(di);toast('Deleted');render(true)}return}
  if(t.closest('#edSave')){var box=t.closest('[data-eid]'),eid=box.getAttribute('data-eid'),eit=getItem(eid),ef=EDITF[eit.type],fv={},q;
    for(q=0;q<ef.length;q++){fv[ef[q][0]]=$('ed_'+ef[q][0]).value.trim()}
    if(!fv.title){toast('Title cannot be empty');return}
    if(eit.type==='task'&&fv.detail&&fv.detail.split(/\s+/).length>2000){toast('Description is over 2,000 words');return}
    editItem(eid,fv);closeMod();toast('Saved');render(true);return}
  if(t.closest('#cnSave')){var cu=$('cn_url').value.trim();if(cu&&!/^https:\/\/script\.google\.com\/macros\/s\/[-\w]+\/exec$/.test(cu)){toast('That does not look like a Web app URL ending in /exec');return}try{if(cu)localStorage.setItem('nts_script',cu);else localStorage.removeItem('nts_script')}catch(err){}CFG.SCRIPT_URL=cu;ig.data=null;closeMod();toast(cu?'Connected. Syncing...':'Disconnected, using this device only');lastWrite=0;loadItems(function(){render(true)});render(true);return}
  if(t.closest('#igRef')){igRefresh();return}
  if(t.closest('#fvBtn')){state.founder=!state.founder;state.page='command';render();return}
  if(t.closest('#thBtn')){var cur=document.documentElement.getAttribute('data-theme')==='light'?'dark':'light';document.documentElement.setAttribute('data-theme',cur);try{localStorage.setItem('nts_theme',cur)}catch(err){}themeIcon();if(state.page==='voice')render(true);return}
  if(t===$('ov'))closePal();if(t===$('mov'))closeMod();
  if(!t.closest('#sheet'))$('sheet').className='sheet';
});
function themeIcon(){var l=document.documentElement.getAttribute('data-theme')==='light';$('thIco').className='ph '+(l?'ph-sun':'ph-moon')}
document.addEventListener('keydown',function(e){
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPal();return}
  if(e.key==='Escape'){closePal();closeMod();return}
  if($('ov').className.indexOf('on')>-1){
    if(e.key==='ArrowDown'){e.preventDefault();sel=(sel+1)%Math.max(shown.length,1);paint($('pin').value)}
    else if(e.key==='ArrowUp'){e.preventDefault();sel=(sel-1+shown.length)%Math.max(shown.length,1);paint($('pin').value)}
    else if(e.key==='Enter'){run(sel)}
  }
});
document.addEventListener('change',function(e){var t=e.target;if(!t)return;
  if(t.id==='fileIn'){sendFiles(t.files);t.value=''}
  else if(t.id==='mFile'){sendFiles(t.files,modelOpts());t.value=''}
  else if(t.id==='vFile'){if(t.files[0]){decodeBlob(t.files[0],t.files[0].name)}t.value=''}
  else if(t.id==='vFx'){voice.fx=t.value}
  else if(t.getAttribute&&t.getAttribute('data-mv')){setStatus(t.getAttribute('data-mv'),t.value);render(true);toast('Moved to '+sl(t.value))}});
document.addEventListener('input',function(e){var t=e.target;if(!t)return;
  if(t.id==='mdesc'){var n=wc(t.value),w=$('mwc');w.textContent=n+' / 2000 words';w.className='wc'+(n>2000?' bad':'')}
  else if(t.id==='vPitch'){voice.pitch=+t.value;var lb=document.querySelector('label[for="vPitch"]');if(lb)lb.textContent='Pitch, '+stLabel(voice.pitch)}});
document.addEventListener('dragover',function(e){var d=e.target.closest&&e.target.closest('.drop');if(d){e.preventDefault();d.classList.add('hot')}});
document.addEventListener('dragleave',function(e){var d=e.target.closest&&e.target.closest('.drop');if(d)d.classList.remove('hot')});
document.addEventListener('drop',function(e){var d=e.target.closest&&e.target.closest('.drop');if(d){e.preventDefault();d.classList.remove('hot');sendFiles(e.dataTransfer.files,dropOpts(d))}});
$('pin').addEventListener('input',function(){sel=0;paint(this.value)});
