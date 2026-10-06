/* ===================== AI NINJA ===================== */
/* Layers kept apart on purpose: KB (knowledge) | AI (server call) | CHAT (ui) | CHAR (3d model) | ANIM (state machine).
   To swap in a GLB/VRM later, replace buildNinja() so it returns the same handles (see HANDLES comment). */
var KB={
  studio:'NIKHILs TECH STUDIO',tagline:'Learn. Practice. Simulate. Grow.',
  assistant:'Dal_Abba, the studio assistant',
  team:[{name:'Nikhil',role:'Founder and Strategic Head',focus:'Strategy, assigns daily work'},{name:'Monish',role:'Creative Head',focus:'Creative and content production'},{name:'Pranav',role:'Operations and Marketing Lead',focus:'Operations, growth and marketing'}],
  studioOS:'An internal operating system for the three-person team: assign and track daily tasks, raise requests (Raised, In progress, Hold, Completed), daily uploads of images and videos, AI model repository, AI voice modulation studio, content pipeline, CRM, objectives, projects, analytics, Instagram updates, and a Founder view. Data syncs to a Google Sheet and Drive.',
  goals:['Publish 100 videos by 30 November 2026'],
  status:{selling:'Selling and monetisation have not started yet',revenue:'No revenue yet'},
  channels:['Instagram'],
  contact:'No public contact details have been added yet',
  services:'No formal service list has been published yet',
  projects:'No public project list has been published yet',
  philosophy:'Learn. Practice. Simulate. Grow.',
  note:'Only answer studio questions from this data. If a detail is not here, say it has not been added yet.'
};

/* ---------- memory (saved on this device) ---------- */
var NJM={name:'',facts:{},notes:[],hist:[],visits:0,last:0};
(function(){try{var s=JSON.parse(localStorage.getItem('nts_nj')||'null');if(s&&typeof s==='object'){NJM.name=s.name||'';NJM.facts=s.facts||{};NJM.notes=s.notes||[];NJM.hist=s.hist||[];NJM.visits=s.visits||0;NJM.last=s.last||0}}catch(err){}})();
function njmSave(){try{NJM.last=Date.now();if(NJM.hist.length>40)NJM.hist=NJM.hist.slice(-40);localStorage.setItem('nts_nj',JSON.stringify(NJM))}catch(err){}}
function njmPush(role,text){NJM.hist.push({r:role==='user'?'u':'a',t:String(text).slice(0,1200),at:Date.now()});njmSave()}
