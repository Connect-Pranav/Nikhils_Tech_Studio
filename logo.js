/* logo: built in (always loads). Click it to set your own, saved in this browser. */
(function(){var img=$('logoImg'),fb=$('logoFb'),box=$('logoBox'),inp=$('logoIn'),DEF="logo.jpg";
function show(ok){img.style.display=ok?'block':'none';fb.style.display=ok?'none':'block';box.className='logo'+(ok?' has':'')}
function setSrc(u){img.src=u;try{window.dispatchEvent(new Event('nts-logo'))}catch(err){}}
img.onload=function(){show(true);try{window.dispatchEvent(new Event('nts-logo'))}catch(err){}};img.onerror=function(){if(img.src!==DEF&&img.getAttribute('data-def')!=='1'){img.setAttribute('data-def','1');img.src=DEF}else show(false)};
var saved=null;try{saved=localStorage.getItem('nts_logo')}catch(err){}
if(saved){img.src=saved}else{img.src=DEF;idbGet('logo',function(v){if(v&&typeof v==='string')img.src=v})}
box.addEventListener('click',function(){inp.click()});
inp.addEventListener('change',function(){var f=inp.files[0];if(!f)return;
  var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){
    var c=document.createElement('canvas'),n=360,sx=Math.min(im.width,im.height),g=c.getContext('2d');c.width=c.height=n;
    g.drawImage(im,(im.width-sx)/2,(im.height-sx)/2,sx,sx,0,0,n,n);var u=c.toDataURL('image/jpeg',.9);
    try{localStorage.setItem('nts_logo',u)}catch(err){}idbPut('logo',u);setSrc(u);toast('Logo saved on this device. Replace the LOGO line in index.html to make it permanent for everyone.')};
    im.onerror=function(){toast('That file is not a readable image')};im.src=r.result};r.readAsDataURL(f)});
window.NTS_LOGO_DEFAULT=DEF})();
