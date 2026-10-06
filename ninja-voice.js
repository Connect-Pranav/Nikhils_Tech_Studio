/* voice out */
function njVoice(){
  var v=window.speechSynthesis?window.speechSynthesis.getVoices():[],i,best=null,sc=-1;
  for(i=0;i<v.length;i++){var n=(v[i].name+' '+v[i].lang).toLowerCase(),s=0;
    if(/en[-_]in/.test(n))s+=5;if(/en[-_](gb|us|au)/.test(n))s+=1;if(/male|ravi|prabhat|rishi|hemant|google uk english male|daniel|david|james|aaron/.test(n))s+=3;if(/female|heera|zira|samantha|kalpana|natural/.test(n)&&!/male/.test(n.replace('female','')))s-=1;
    if(s>sc){sc=s;best=v[i]}}
  return best;
}
function njSpeak(text){
  if(!window.speechSynthesis)return;
  try{window.speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(text.replace(/[*_`#]/g,'')),v=njVoice();if(v){u.voice=v;u.lang=v.lang}else u.lang='en-IN';u.rate=.93;u.pitch=.8;
    u.onstart=function(){NJ.speaking=true;njState('TALKING')};u.onend=u.onerror=function(){NJ.speaking=false};
    window.speechSynthesis.speak(u)}catch(err){}
}
if(window.speechSynthesis){window.speechSynthesis.onvoiceschanged=function(){}}
/* voice in */
function njMic(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){toast('Voice input is not supported in this browser. You can still type.');return}
  if(NJ.rec){try{NJ.rec.stop()}catch(err){}return}
  var r=new SR(),fin='';r.lang='en-IN';r.interimResults=true;r.continuous=false;NJ.rec=r;
  $('njMic').className='nj-ib rec';njState('LISTENING');
  r.onresult=function(e){var s='',i;for(i=0;i<e.results.length;i++){s+=e.results[i][0].transcript;if(e.results[i].isFinal)fin=s}$('njIn').value=s};
  r.onerror=function(e){if(e.error==='not-allowed'||e.error==='service-not-allowed')njAdd('assistant','Microphone access isn\'t available. You can still chat with me using text.','e')};
  r.onend=function(){NJ.rec=null;$('njMic').className='nj-ib';var t=$('njIn').value;if(t&&!NJ.busy){NJ.voiceOnce=true;njSend(t)}else if(!NJ.busy)njState('IDLE')};
  try{r.start()}catch(err){NJ.rec=null;$('njMic').className='nj-ib'}
}
