/* optional on-device LLM (free, no server): WebLLM via WebGPU */
NJ.llm={ready:false,tried:false,eng:null,loading:false};
function njLlmChip(){
  if($('njLlm')||NJ.llm.ready)return;var b=document.createElement('button');b.id='njLlm';b.className='nj-llm';b.textContent='Enable smarter AI (about 400 MB, once)';
  b.onclick=njEnableLLM;$('njSug').parentNode.insertBefore(b,$('njSug'));
}
function njEnableLLM(){
  var b=$('njLlm');if(NJ.llm.loading)return;NJ.llm.tried=true;
  if(!navigator.gpu){if(b)b.textContent='This browser has no WebGPU. Use Chrome or Edge on desktop.';njAdd('assistant','The on-device AI needs WebGPU, which this browser does not offer. I will keep using my local brain. Chrome or Edge on a laptop usually works.','e');return}
  NJ.llm.loading=true;if(b)b.textContent='Loading AI... 0%';njAdd('assistant','Downloading the on-device AI. It happens once, then it is cached in your browser.');
  var imp=new Function('u','return import(u)');
  imp('https://esm.run/@mlc-ai/web-llm').then(function(w){
    return w.CreateMLCEngine('Qwen2.5-0.5B-Instruct-q4f16_1-MLC',{initProgressCallback:function(p){var pc=Math.round((p.progress||0)*100);var bb=$('njLlm');if(bb)bb.textContent='Loading AI... '+pc+'%'}});
  }).then(function(e){NJ.llm.eng=e;NJ.llm.ready=true;NJ.llm.loading=false;var bb=$('njLlm');if(bb)bb.parentNode.removeChild(bb);njStat();njAdd('assistant','On-device AI is ready. Ask me anything now.');njState('HAPPY',1600)})
  .catch(function(){NJ.llm.loading=false;var bb=$('njLlm');if(bb)bb.textContent='Could not load. Tap to retry';njAdd('assistant','I could not download the on-device AI. Check your internet and try again. My local brain still works.','e')});
}
function njLLM(text){
  njState('THINKING');njTyping(true);
  var sys='You are Dal_Abba, the playful AI Ninja assistant of NIKHILs TECH STUDIO, a three-person studio (Nikhil founder, Monish creative head, Pranav operations and marketing). Answer briefly and kindly. Studio facts: '+JSON.stringify(KB)+'. Live state: '+njPage()+'.'+(NJM.name?' The user is '+NJM.name+'.':'')+(NJM.notes.length?' Things the user asked you to remember: '+NJM.notes.join('; ')+'.':'');
  var msgs=[{role:'system',content:sys}],h=NJ.hist.slice(-8),i;for(i=0;i<h.length;i++)msgs.push({role:h[i].role==='user'?'user':'assistant',content:h[i].text});
  NJ.llm.eng.chat.completions.create({messages:msgs,max_tokens:300,temperature:.6}).then(function(r){
    var t=r&&r.choices&&r.choices[0]&&r.choices[0].message?r.choices[0].message.content:'';
    if(!NJ.busy)return;if(t)njAnswer(t,text);else njAnswer('I could not think of an answer. Try asking differently.',text);
  }).catch(function(){if(NJ.busy)njErr('The on-device AI hit a problem. Try again.')});
}
