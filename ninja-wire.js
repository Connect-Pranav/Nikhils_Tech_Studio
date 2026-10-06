/* ---------- wiring ---------- */
function njAttention(){njPoke();setTimeout(function(){njOpen()},700)}
$('njStage').addEventListener('click',function(){if(NJ.open){njPoke()}else{njAttention()}});
$('njStage').addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();NJ.open?njPoke():njAttention()}});
$('njFlat').addEventListener('click',function(){NJ.open?njClose():njOpen()});
$('njX').addEventListener('click',njClose);
$('njClr').addEventListener('click',function(){njStopAll();NJ.hist=[];NJM.hist=[];njmSave();njGreet();njState('IDLE')});
$('njSpk').addEventListener('click',function(){NJ.voice=!NJ.voice;this.setAttribute('aria-pressed',NJ.voice?'true':'false');this.className='nj-ib'+(NJ.voice?' on':'');this.setAttribute('aria-label',NJ.voice?'Turn voice replies off':'Turn voice replies on');$('njSpkI').className='ph ph-speaker-'+(NJ.voice?'high':'slash');if(!NJ.voice){try{window.speechSynthesis.cancel()}catch(err){}NJ.speaking=false}});
$('njSfx').addEventListener('click',function(){SFX.on=!SFX.on;try{localStorage.setItem('nts_sfx',SFX.on?'1':'0')}catch(err){}this.className='nj-ib '+(SFX.on?'on':'off');this.setAttribute('aria-pressed',SFX.on?'true':'false');if(SFX.on)sfx('boing')});
$('njMic').addEventListener('click',njMic);
$('njGo').addEventListener('click',function(){if(NJ.busy){njStopAll();njState('IDLE');return}njSend($('njIn').value)});
$('njIn').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();njSend(this.value)}if(e.key==='Escape')njClose()});
$('njIn').addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(110,this.scrollHeight)+'px'});
$('njSug').addEventListener('click',function(e){var b=e.target.closest('[data-nsg]');if(!b)return;var l=JSON.parse(this.getAttribute('data-l'));njSend(l[+b.getAttribute('data-nsg')])});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&NJ.open&&$('mov').className.indexOf('on')<0)njClose()});
document.addEventListener('mousedown',function(e){if(NJ.open&&window.innerWidth<=820&&!e.target.closest('#nj'))njClose()});
window.addEventListener('nts-logo',njSetLogo);
