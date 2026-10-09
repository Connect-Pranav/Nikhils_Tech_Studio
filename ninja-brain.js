/* ---------- local brain: works with no server ---------- */
var NJPG={command:/\b(home|command|dashboard|overview)\b/,tasks:/\btasks?\b/,requests:/\brequests?|demand\b/,objectives:/\bobjectives?|goals?\b/,projects:/\bprojects?\b/,content:/\bcontent|videos?\b/,creative:/\bcreative\b/,uploads:/\buploads?|files?\b/,models:/\bmodels?\b/,voice:/\bvoice\b/,marketing:/\bmarketing\b/,instagram:/\binsta(gram)?\b/,crm:/\bcrm|leads?\b/,monetization:/\bmoney|monetisation|monetization|revenue\b/,analytics:/\banalytics|stats\b/,ai:/\bintelligence\b/,team:/\bteam\b/};
function njWho(s){var m=String(s).match(/\b(nikhil|monish|pranav)\b/i);return m?m[1].charAt(0).toUpperCase()+m[1].slice(1).toLowerCase():''}
function njTitle(s){s=String(s).replace(/^\s+|[\s.]+$/g,'');return s.charAt(0).toUpperCase()+s.slice(1)}
function njList(a,f,max){var o=[],i;for(i=0;i<a.length&&i<(max||6);i++)o.push('- '+f(a[i]));return o.join('\n')+(a.length>(max||6)?'\n...and '+(a.length-(max||6))+' more':'')}
function njFind(txt){var q=txt.toLowerCase().replace(/^\s+|\s+$/g,''),i,t=T();for(i=0;i<t.length;i++){if(t[i].status!=='COMPLETED'&&q&&t[i].title.toLowerCase().indexOf(q)>-1)return t[i]}for(i=0;i<t.length;i++){if(t[i].status!=='COMPLETED'&&q&&q.indexOf(t[i].title.toLowerCase())>-1)return t[i]}return null}
function njLocal(raw){
  var q=raw.toLowerCase().replace(/[?!]+$/,'').replace(/^\s+|\s+$/g,''),m,nm=NJM.name,i;
  /* memory: save */
  if((m=raw.match(/\b(?:my name is|call me|i am called|name's)\s+([A-Za-z][A-Za-z .'-]{0,24})/i))||(m=raw.match(/^\s*i(?:'m| am)\s+([A-Z][a-z]{1,20})\s*[.!]?\s*$/))){NJM.name=njTitle(m[1].replace(/\s+(and|but|here|from)\b.*$/i,''));njmSave();return 'Nice to meet you, '+NJM.name+'! I will remember your name, even after you close the site.'}
  if((m=raw.match(/\bmy (?:fav(?:ou?rite)?|favorite)\s+([a-z ]{2,20}?)\s+is\s+(.{1,60})$/i))){NJM.facts['favourite '+m[1].toLowerCase()]=m[2].replace(/[.!\s]+$/,'');njmSave();return 'Saved. Your favourite '+m[1].toLowerCase()+' is '+NJM.facts['favourite '+m[1].toLowerCase()]+'.'}
  if((m=raw.match(/^\s*(?:please\s+)?remember(?:\s+that)?\s+(.{2,300})$/i))){NJM.notes.push(m[1].replace(/[.\s]+$/,''));if(NJM.notes.length>30)NJM.notes.shift();njmSave();return 'Got it, I will remember: '+m[1].replace(/[.\s]+$/,'')+'.'}
  /* memory: recall */
  if(/\b(what('?s| is) my name|who am i|do you (know|remember) (me|my name))\b/.test(q))return nm?'You are '+nm+'. I have it saved on this device.':'I do not know your name yet. Tell me: "My name is ..." and I will remember it.';
  if((m=q.match(/\bwhat('?s| is) my (fav(?:ou?rite)?|favorite) ([a-z ]{2,20})$/))){var fk='favourite '+m[3];return NJM.facts[fk]?'Your '+fk+' is '+NJM.facts[fk]+'.':'You have not told me your '+fk+' yet.'}
  if(/\bwhat do you (remember|know) about me|my memory|what have i told you|show (my )?memory\b/.test(q)){var o=[],k;if(nm)o.push('Name: '+nm);for(k in NJM.facts)o.push(k.charAt(0).toUpperCase()+k.slice(1)+': '+NJM.facts[k]);for(i=0;i<NJM.notes.length;i++)o.push('Note: '+NJM.notes[i]);return o.length?'Here is what I remember:\n'+o.join('\n'):'My memory of you is empty so far. Try "My name is ..." or "Remember that ...".'}
  if(/\b(forget (everything|all|me)|clear (my )?memory|reset memory)\b/.test(q)){NJM.name='';NJM.facts={};NJM.notes=[];NJM.hist=[];njmSave();return 'Done. My memory of you is cleared.'}
  /* actions */
  if((m=raw.match(/^\s*(?:please\s+)?(?:assign|add|create|give)\s+(?:a\s+|the\s+)?(?:new\s+)?(?:task\s+)?(?:called\s+|named\s+)?["']?(.+?)["']?\s+(?:to|for)\s+(nikhil|monish|pranav)\b\s*(today|tomorrow|this week)?/i))){
    var title=m[1],pw=njWho(m[2]),when=(m[3]||'today').toLowerCase();
    var due=when==='tomorrow'?dueFor('tomorrow'):when==='this week'?dueFor('week'):dueFor('today');
    addItem({type:'task',title:njTitle(title),from:'Nikhil',to:pw,due:due,status:'PENDING'});render(true);
    return 'Task assigned to '+pw+': "'+njTitle(title)+'", due '+(when==='this week'?'this week':when)+'. It is on the Tasks page.'}
  if((m=raw.match(/^\s*task\s+for\s+(nikhil|monish|pranav)\s*[:\-]\s*(.+)$/i))){var w2=njWho(m[1]);addItem({type:'task',title:njTitle(m[2]),from:'Nikhil',to:w2,due:dueFor('today'),status:'PENDING'});render(true);return 'Task assigned to '+w2+': "'+njTitle(m[2])+'", due today.'}
  if((m=raw.match(/^\s*(?:please\s+)?(?:raise|new)\s+(?:a\s+)?request\s*(?:for|:|-)?\s*(.{3,200})$/i))||(m=raw.match(/^\s*(?:please\s+)?request\s*[:\-]\s*(.{3,200})$/i))){if(!rqReady())return 'Shared requests are not connected on this device yet. Open Requests and press Connect, then ask me again.';rqOpenForm({title:njTitle(m[1])});return 'I opened the request form for "'+njTitle(m[1])+'". Every request needs an estimated cost, so please fill that in and press Raise request.'}
  if((m=raw.match(/^\s*(?:please\s+)?(?:mark\s+)?(?:complete|completed|finish|finished|done)\s+(?:task\s+)?(.{2,120})$/i))||(m=raw.match(/^\s*mark\s+(.{2,120}?)\s+(?:as\s+)?(?:done|complete|completed)$/i))){var t=njFind(m[1]);if(t){setStatus(t.id,'COMPLETED');render(true);return 'Marked as completed: "'+t.title+'". Nice work!'}return 'I could not find a pending task matching "'+m[1]+'". Say "pending tasks" to see the list.'}
  /* theme */
  if(/\b(dark|light)\s*(mode|theme)\b|\b(switch|toggle|change)\s+(the\s+)?(theme|mode)\b/.test(q)){var cur=document.documentElement.getAttribute('data-theme')==='light'?'light':'dark',want=/\bdark\b/.test(q)?'dark':/\blight\b/.test(q)?'light':(cur==='dark'?'light':'dark');if(want!==cur)$('thBtn').click();return 'Switched to '+want+' theme. My costume changes with it.'}
  /* navigation */
  if((m=q.match(/^(?:please\s+)?(?:open|go to|goto|show|take me to|navigate to|visit)\s+(?:the\s+|me\s+the\s+)?(.+?)(?:\s+page|\s+section|\s+tab)?$/))){var pk;for(pk in NJPG){if(NJPG[pk].test(m[1])&&(pk!=='content'||!/\bpending|open\b/.test(m[1]))){go(pk);return 'Opening '+PAGES[pk][0]+'.'}}}
  /* data */
  if(/\b(pending|open|due|outstanding|todo|to-do)\b.*\btasks?\b|\btasks?\b.*\b(pending|left|due)\b|what('?s| is) pending|my tasks|today'?s? (work|tasks?)/.test(q)){var who=njWho(q);var p=[],all=T();for(i=0;i<all.length;i++){if(all[i].status!=='COMPLETED'&&(!who||all[i].to===who))p.push(all[i])}
    return p.length?(who?who+' has ':'')+p.length+' pending task'+(p.length===1?'':'s')+':\n'+njList(p,function(x){return x.title+(x.to?' ('+x.to+')':'')+(x.due?', due '+x.due:'')}):'No pending tasks'+(who?' for '+who:'')+'. All clear!'}
  if(/\b(completed|done|finished)\s+tasks?|tasks?\s+(completed|done)\b/.test(q)){var dn=cnt(T(),function(x){return x.status==='COMPLETED'});return dn+' task'+(dn===1?'':'s')+' completed so far.'}
  if(/\brequests?\b/.test(q)&&/\b(how many|open|pending|status|list|show|what)\b/.test(q)){var rq=R(),op=[];for(i=0;i<rq.length;i++){if(rq[i].status!=='COMPLETED')op.push(rq[i])}return op.length?op.length+' open request'+(op.length===1?'':'s')+':\n'+njList(op,function(x){return x.title+' ['+x.status+']'}):'No open requests right now.'}
  if(/\b(videos?|content|published|100)\b/.test(q)&&/\b(how many|progress|done|published|left|target|status)\b/.test(q)){var pb=cnt(byType('content'),function(c){return c.status==='PUBLISHED'});return pb+' of 100 videos published. Target: 100 videos by 30 November 2026, so '+(100-pb)+' to go.'}
  if(/\b(uploads?|files?)\b/.test(q)&&/\b(how many|count|list)\b/.test(q)){return byType('upload').length+' upload'+(byType('upload').length===1?'':'s')+' saved on this device.'}
  if(/\b(summary|status|update|overview|how are we doing|how is (the )?studio)\b/.test(q)){return njPage()+'.'}
  /* knowledge */
  if(/\b(who are you|your name|what are you)\b/.test(q))return 'I am Dal_Abba, the AI Ninja of NIKHILs TECH STUDIO. I know the studio, its tasks and requests, and I remember things you tell me.';
  if(/\b(team|who works|members|people)\b/.test(q)){return 'The team:\n'+njList(KB.team,function(x){return x.name+', '+x.role})}
  if(/\bnikhil\b/.test(q)&&/\b(who|role)\b/.test(q))return 'Nikhil is the Founder and Strategic Head. He assigns the daily work.';
  if(/\bmonish\b/.test(q)&&/\b(who|role)\b/.test(q))return 'Monish is the Creative Head, leading creative and content production.';
  if(/\bpranav\b/.test(q)&&/\b(who|role)\b/.test(q))return 'Pranav is the Operations and Marketing Lead.';
  if(/\b(tell me about|about|what is|what does)\b.*\b(studio|nikhils|company)\b|^studio$/.test(q))return 'NIKHILs TECH STUDIO is a three-person team: '+KB.tagline+' We run an AI-focused studio, and we are working towards 100 videos by 30 November 2026. This OS tracks daily tasks, requests, uploads and content.';
  if(/\b(contact|reach|email|phone|whatsapp)\b/.test(q))return KB.contact+'. For now, reach the team through Instagram.';
  if(/\b(sell|selling|revenue|monetis|monetiz|income|earn)\b/.test(q))return 'Selling and monetisation have not started yet, and there is no revenue so far. The Monetization page is ready for when that begins.';
  if(/\b(services?|build|offer|capabilit|what can you do)\b/.test(q)&&!/\bwhat can you do\b/.test(q))return KB.services+'. Ask Nikhil for the latest.';
  if(/\b(goal|target|mission|philosophy|motto|tagline)\b/.test(q))return 'Our line: '+KB.philosophy+' Current goal: publish 100 videos by 30 November 2026.';
  if(/\b(instagram|insta)\b/.test(q))return 'The studio is on Instagram. Daily sync is paused for now, but you can upload posts on the Uploads page.';
  if(/\b(time|what time)\b/.test(q)&&!/\bdue\b/.test(q))return 'It is '+new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})+'.';
  if(/\b(date|today'?s date|what day)\b/.test(q))return 'Today is '+new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'.';
  /* Dal_Abba moods */
  if(/\b(coffee|chai|tea)\b/.test(q)){NJ.act={st:'COFFEE',hold:9000,sfx:['ding','sip']};return 'Here you go'+(nm?', '+nm:'')+', one hot cup! Careful, it is steaming. Dal_Abba makes the best chai in the studio.'}
  if(/\b(sing|song|gaana|gana)\b/.test(q)){NJ.act={st:'SINGING',hold:6500,sfx:['sing']};return 'La la laaa... Dal_Abba is on stage!'}
  if(/\b(dance|naach|party)\b/.test(q)){NJ.act={st:'DANCING',hold:6000,sfx:['whistle']};return 'Dance mode on! Watch these moves.'}
  if(/\b(yawn|bored|stretch)\b/.test(q)){NJ.act={st:'YAWNING',hold:2600,sfx:['yawn']};return 'Haaaaah... sorry, long day of guarding the studio.'}
  if(/\b(wake up|wake)\b/.test(q)){NJ.sleepLock=false;NJ.act={st:'EXCITED',hold:1500,sfx:['wake']};return 'I am up, I am up! What is the plan?'}
  if(/\b(sleep|nap|go to bed|sone)\b/.test(q)){NJ.sleepLock=true;NJ.act={st:'SLEEPING',hold:0,sfx:['snore']};return 'Zzz... wake me by clicking on me.'}
  if(/\b(laugh|haha|lol|hehe)\b/.test(q)){NJ.act={st:'LAUGHING',hold:3200,sfx:['laugh']};return 'Hahaha! Okay, that was funny.'}
  if(/\b(boing|toing|sound|noise|squeak|make me laugh)\b/.test(q)){var pkk=POKES[Math.floor(Math.random()*POKES.length)];NJ.act={st:pkk[1],hold:1800,sfx:[pkk[0]]};return 'Boing! Sound effects are on when the bell button in my header is lit. Click me anytime.'}
  if(/\b(dal ?abba)\b/.test(q)&&!/\b(who|what)\b/.test(q)){NJ.act={st:'EXCITED',hold:1200,sfx:['squeak']};return 'Yes? Dal_Abba here! Ask me anything.'}
  /* small talk */
  if(/^(hi|hello|hey|namaste|yo|hii+|good (morning|afternoon|evening))\b/.test(q))return 'Hey'+(nm?' '+nm:'')+'! What shall we do? I can show pending tasks, assign work, or open any page.';
  if(/\bhow are you\b/.test(q))return 'Sharp and ready'+(nm?', '+nm:'')+'! '+pendCount()+' task'+(pendCount()===1?'':'s')+' pending. Want to see them?';
  if(/\b(thanks|thank you|thx|great|awesome|nice|cool)\b/.test(q))return 'Anytime'+(nm?', '+nm:'')+'!';
  if(/\b(bye|goodbye|see you|good night)\b/.test(q))return 'See you soon'+(nm?', '+nm:'')+'. I will remember everything.';
  if(/\b(joke)\b/.test(q)){NJ.act={st:'LAUGHING',hold:3200,sfx:['laugh']};return 'Why did the ninja bring a laptop? To stay in stealth mode and still ship on time. Ha ha!'}
  if(/\b(help|commands?|what can you do|how do i use)\b/.test(q))return 'I can:\n- Show pending tasks, open requests, video progress\n- Assign work: "Assign edit reel to Monish tomorrow"\n- Raise a request: "Raise request: new camera"\n- Complete a task: "Done edit reel"\n- Open pages: "Open uploads"\n- Switch theme: "Dark mode"\n- Fun: "Chai?", "Sing", "Dance", "Yawn", "Go to sleep", "Boing"\n- Remember you: "My name is ...", "Remember that ..."';
  return null;
}
