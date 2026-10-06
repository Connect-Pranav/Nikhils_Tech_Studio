/* ---------- CHAT ---------- */
function hm(d){return d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
function njAdd(role,text,cls){
  var m=document.createElement('div');m.className='nj-m '+(role==='user'?'u':'a')+(cls?' '+cls:'');
  var b=document.createElement('div');b.className='nj-b';b.textContent=text;m.appendChild(b);
  var mt=document.createElement('div');mt.className='nj-meta';mt.appendChild(document.createTextNode(hm(new Date())));
  if(role!=='user'&&text){var cb=document.createElement('button');cb.setAttribute('aria-label','Copy response');cb.innerHTML='<i class="ph ph-copy" aria-hidden="true"></i>';cb.onclick=function(){try{navigator.clipboard.writeText(b.textContent);toast('Copied')}catch(err){}};mt.appendChild(cb)}
  m.appendChild(mt);$('njMsgs').appendChild(m);$('njMsgs').scrollTop=1e6;return b;
}
function njTyping(on){
  var o=$('njTyp');if(!on){if(o)o.parentNode.removeChild(o);return}
  if(o)return;var m=document.createElement('div');m.className='nj-m a';m.id='njTyp';m.innerHTML='<div class="nj-b"><span class="nj-dots" aria-label="Thinking"><i></i><i></i><i></i></span> <span class="mu sm">Thinking...</span></div>';$('njMsgs').appendChild(m);$('njMsgs').scrollTop=1e6;
}

function njSuggest(){
  var l=['What is pending today?','How many videos are done?','Open requests','Who is on the team?','What can you do?'],h='',i;
  for(i=0;i<l.length;i++){h+='<button data-nsg="'+i+'">'+esc(l[i])+'</button>'}
  $('njSug').innerHTML=h;$('njSug').style.display='flex';$('njSug').setAttribute('data-l',JSON.stringify(l));
}
function njGreet(){
  $('njMsgs').innerHTML='';var nm=NJM.name,back=NJM.hist.length&&NJM.visits>0,i,h=NJM.hist.slice(-8);
  if(back){for(i=0;i<h.length;i++)njAdd(h[i].r==='u'?'user':'assistant',h[i].t);njAdd('assistant','Welcome back'+(nm?', '+nm:'')+'! I remember our last chat. '+pendCount()+' task'+(pendCount()===1?'':'s')+' pending right now.')}
  else njAdd('assistant','Hey'+(nm?' '+nm:'')+'! I am Dal_Abba, the NIKHILs TECH STUDIO assistant. I can check tasks, assign work, open pages, and I remember what you tell me. Say "help" to see everything, or tell me your name.');
  NJM.visits++;njmSave();njSuggest();
}
function njPage(){var n=PAGES[state.page]?PAGES[state.page][0]:state.page;return n+' (live: '+pendCount()+' pending tasks, '+openCount()+' open requests, '+cnt(byType('content'),function(c){return c.status==='PUBLISHED'})+' videos published of 100)'}
function njOpen(){
  if(NJ.open)return;NJ.open=true;njRoot.className=njRoot.className.replace(/\bopen\b/,'')+' open';
  $('njLogo').src=$('logoImg').src;$('njDot').className='on';njStat();
  if(!$('njMsgs').children.length)njGreet();
  njState('LISTENING');setTimeout(function(){if(NJ.st==='LISTENING'&&!NJ.busy)njState('HAPPY',1600)},500);
  setTimeout(function(){$('njIn').focus()},350);njState(NJ.st);
}
function njStat(){var e=$('njSt');if(!e)return;e.textContent=(NLAB[NJ.st]||(NJ.llm&&NJ.llm.ready?'ON-DEVICE AI':'LOCAL BRAIN'))||(NJ.llm&&NJ.llm.ready?'ON-DEVICE AI':'LOCAL BRAIN, REMEMBERS YOU')}
function njClose(){
  if(!NJ.open)return;njStopAll();NJ.open=false;njRoot.className=njRoot.className.replace(/\s*\bopen\b/,'');
  njState('GOODBYE',1700);$('njStage').focus();
}
function njStopAll(){
  if(NJ.abort){try{NJ.abort.abort()}catch(err){}}NJ.abort=null;if(NJ.rev){clearInterval(NJ.rev);NJ.rev=null}
  try{window.speechSynthesis&&window.speechSynthesis.cancel()}catch(err){}
  if(NJ.rec){try{NJ.rec.stop()}catch(err){}}
  NJ.busy=false;NJ.speaking=false;njTyping(false);njGoUi();
}
function njGoUi(){var b=$('njGo');b.innerHTML='<i class="ph ph-'+(NJ.busy?'stop':'paper-plane-tilt')+'" aria-hidden="true"></i>';b.setAttribute('aria-label',NJ.busy?'Stop response':'Send message');b.title=NJ.busy?'Stop':'Send'}
function njErr(t){NJ.got=true;njTyping(false);NJ.busy=false;njGoUi();njAdd('assistant',t,'e');njState('ERROR',3200)}
function njSend(text){
  text=(text||'').replace(/^\s+|\s+$/g,'');if(!text||NJ.busy)return;
  $('njSug').style.display='none';njAdd('user',text);$('njIn').value='';$('njIn').style.height='';
  NJ.hist.push({role:'user',text:text});if(NJ.hist.length>24)NJ.hist.shift();njmPush('user',text);
  NJ.sleepLock=false;sfx('send');NJ.busy=true;NJ.got=false;njGoUi();njState('LISTENING');
  var rep=null;try{rep=njLocal(text)}catch(err){rep=null}
  if(rep!==null){setTimeout(function(){if(NJ.busy)njAnswer(rep,text)},380);return}
  if(NJ.llm&&NJ.llm.ready){njLLM(text);return}
  setTimeout(function(){if(!NJ.busy)return;var f='I do not have an answer for that yet. I am running on my local brain, so I am best at studio questions. Try "help", or ask about tasks, requests, videos, or the team.';
    if(!NJ.llm||!NJ.llm.tried)f+='\n\nWant me to answer anything? Tap "Enable smarter AI" below. It downloads a small model once and then runs on your device, free.';
    njAnswer(f,text);njLlmChip()},420);
}
function njAnswer(text,q){
  NJ.got=true;njTyping(false);NJ.hist.push({role:'assistant',text:text});njmPush('assistant',text);sfx('blip');
  var b=njAdd('assistant',''),i=0,n=text.length,step=Math.max(2,Math.round(n/90));
  njState('TALKING');
  if(NJ.voice||NJ.voiceOnce)njSpeak(text);
  NJ.voiceOnce=false;
  NJ.rev=setInterval(function(){
    i=Math.min(n,i+step);b.textContent=text.substring(0,i);$('njMsgs').scrollTop=1e6;
    if(i>=n){clearInterval(NJ.rev);NJ.rev=null;NJ.busy=false;njGoUi();
      var m=njMood(q,text);
      var act=NJ.act;NJ.act=null;
      var finish=function(){if(NJ.speaking){setTimeout(finish,300);return}
        if(act){njState(act.st,act.hold);var si;for(si=0;si<act.sfx.length;si++){(function(n,d){setTimeout(function(){sfx(n)},d)})(act.sfx[si],si*1300)}}else njState(m,m==='IDLE'?0:1800)};finish()}
  },30);
}
function njMood(q,a){
  if(/\b(thanks|thank you|great|awesome|nice|cool|love)\b/i.test(q)||/^(hi|hey|hello)\b/i.test(q))return 'HAPPY';
  if(/\b(bye|goodbye|see you)\b/i.test(q))return 'GOODBYE';
  if(/\b(not sure|do not have|don't have|no idea|unclear|could you clarify|not been added)\b/i.test(a))return 'CONFUSED';
  if(/!\s*$/.test(a.replace(/\s+$/,'')))return 'HAPPY';
  return 'IDLE';
}
