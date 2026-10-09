/* ---------- command palette and modals ---------- */
var COMMANDS=[
 ['Open command center','Navigate',function(){go('command')}],
 ['Show overdue tasks','Tasks',function(){state.taskTab='overdue';state.owner='All';state.status='All';state.when='any';go('tasks')}],
 ['Show today\'s priorities','Tasks',function(){state.taskTab='today';state.owner='All';state.status='All';state.when='any';go('tasks')}],
 ['Show Monish tasks','Tasks',function(){state.taskTab='pending';state.owner='Monish';go('tasks')}],
 ['Show Pranav tasks','Tasks',function(){state.taskTab='pending';state.owner='Pranav';go('tasks')}],
 ['Show 100 video objective','Objectives',function(){go('objectives')}],
 ['Open requests','Navigate',function(){go('requests')}],
 ['Raise a request','Create',function(){rqOpenForm()}],
 ['Upload daily work','Create',function(){go('uploads')}],
 ['Open AI models','Navigate',function(){go('models')}],
 ['Open AI voice studio','Navigate',function(){go('voice')}],
 ['Open CRM','Navigate',function(){go('crm')}],
 ['Open content studio','Navigate',function(){go('content')}],
 ['Open creative','Navigate',function(){go('creative')}],
 ['Open marketing','Navigate',function(){go('marketing')}],
 ['Open monetization','Navigate',function(){go('monetization')}],
 ['Open analytics','Navigate',function(){go('analytics')}],
 ['Open NTS intelligence','Navigate',function(){go('ai')}],
 ['Open team','Navigate',function(){go('team')}],
 ['Founder view','View',function(){state.founder=true;state.page='command';render()}],
 ['Assign task','Create',function(){modalTask()}],
 ['Create meeting','Create',function(){modalMeeting()}]
];
var sel=0,shown=[];
function paint(q){
  q=(q||'').toLowerCase();shown=[];var i,h='';
  for(i=0;i<COMMANDS.length;i++){if(!q||COMMANDS[i][0].toLowerCase().indexOf(q)>-1)shown.push(COMMANDS[i])}
  if(sel>=shown.length)sel=0;
  for(i=0;i<shown.length;i++){h+='<div class="pi'+(i===sel?' sel':'')+'" data-i="'+i+'"><span>'+shown[i][0]+'</span><small>'+shown[i][1]+'</small></div>'}
  $('pl').innerHTML=h||'<div class="pi"><span class="mu">No matching command</span></div>';
}
function openPal(){$('ov').className='ov on';$('pin').value='';sel=0;paint('');setTimeout(function(){$('pin').focus()},30)}
function closePal(){$('ov').className='ov'}
function run(i){var c=shown[i];if(!c)return;closePal();c[2]()}
function openMod(h){$('mod').innerHTML=h;$('mov').className='ov on'}
function closeMod(){$('mov').className='ov';$('mod').style.maxWidth='';if($('mod').querySelector('.vwb'))$('mod').innerHTML=''}
function modalTask(){
  openMod('<h3>Assign task</h3><div class="stack">'+fld('Task title','mt',tin('mt','What needs to get done'))+fld('Description','mdesc','<textarea id="mdesc" placeholder="What, why, how and what done looks like. Up to 2,000 words."></textarea>')+'<div class="wc" id="mwc">0 / 2000 words</div><div class="frow">'+fld('Assign to','mo',tsel('mo',PEOPLE,'Monish'))+fld('Due','md',tsel('md',dueOpts(),'today'))+'</div><div class="gap" style="justify-content:flex-end"><button class="btn g" data-x="1">Cancel</button><button class="btn" id="ms">Assign task</button></div></div>');
  setTimeout(function(){$('mt').focus()},30);
}

var EDITF={
  task:[['title','Title','t'],['detail','Description','a'],['to','Assign to','p'],['due','Due date','d'],['priority','Priority','r']],
  request:[['title','Request','t'],['detail','Details','a'],['to','Raised to','p'],['priority','Priority','r']],
  content:[['title','Title','t'],['to','Owner','p'],['due','Deadline','d']],
  lead:[['title','Name','t'],['from','Company','t'],['priority','Potential value','t'],['to','Owner','p'],['notes','Next action','t']],
  upload:[['title','Title','t']],
  model:[['title','Model name','t'],['notes','Notes','a']]
};
function modalEdit(id){
  var it=getItem(id);if(!it||!EDITF[it.type])return;var fs=EDITF[it.type],h='',i,f,v,ctl;
  for(i=0;i<fs.length;i++){f=fs[i];v=it[f[0]]||'';
    ctl=f[2]==='a'?'<textarea id="ed_'+f[0]+'">'+esc(v)+'</textarea>':f[2]==='p'?tsel('ed_'+f[0],PEOPLE,v):f[2]==='r'?tsel('ed_'+f[0],['Normal','High','Urgent'],v||'Normal'):'<input id="ed_'+f[0]+'" type="'+(f[2]==='d'?'date':'text')+'" value="'+esc(v)+'">';
    h+=fld(f[1],'ed_'+f[0],ctl)}
  openMod('<h3>Edit</h3><div class="stack" data-eid="'+id+'">'+h+'<div class="gap" style="justify-content:flex-end"><button class="btn g" data-x="1">Cancel</button><button class="btn" id="edSave">Save changes</button></div></div>');
}
function modalConnect(){
  openMod('<h3>Connect Google sheet</h3><p class="mu" style="margin:6px 0 16px;line-height:1.55">Paste the Web app URL from your Apps Script deployment. It is saved on this device. To make it permanent for everyone, paste it into <code>CFG.SCRIPT_URL</code> in index.html.</p><div class="stack">'+fld('Web app URL','cn_url',tin('cn_url','https://script.google.com/macros/s/.../exec','url'))+'<div class="gap" style="justify-content:flex-end"><div class="cnres" id="cnRes" role="status"></div><div class="gap" style="justify-content:flex-end"><button class="btn g" data-x="1">Cancel</button><button class="btn g" id="cnTest">Test connection</button><button class="btn" id="cnSave">Save</button></div></div>');
  $('cn_url').value=CFG.SCRIPT_URL||'';setTimeout(function(){$('cn_url').focus()},30);
}
function modalMeeting(){
  openMod('<h3>Create meeting</h3><div class="stack">'+fld('Title','mm',tin('mm','Meeting title'))+fld('When','mw',tin('mw','For example: Tomorrow 11:00'))+'<div class="gap" style="justify-content:flex-end"><button class="btn g" data-x="1">Cancel</button><button class="btn" id="mms">Create meeting</button></div></div>');
}
