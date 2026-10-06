
function tick(){var d=new Date();$('clock').textContent=d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})+', '+d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
tick();setInterval(tick,30000);
themeIcon();
render();
function poll(){flush();if(state.page==='voice'||$('mov').className.indexOf('on')>-1)return;var a=document.activeElement;if(a&&(a.tagName==='INPUT'||a.tagName==='SELECT'||a.tagName==='TEXTAREA'))return;loadItems(function(){render(true)});if(state.page==='instagram'&&CFG.SCRIPT_URL){ig.loading=false;loadIG(function(){if(state.page==='instagram')render(true)})}}
