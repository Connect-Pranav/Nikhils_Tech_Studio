/* Welcome splash manager: session-aware, auto-close, keyboard/tap skip */

(function(){
  var SPLASH_SHOWN_KEY='splash_shown_session';
  var AUTO_CLOSE_DELAY=4400;
  var FADE_OUT_DELAY=400;

  function $(id){return document.getElementById(id)}
  function splashRendered(){return $('splash')}

  function initSplash(){
    /* Check if splash was already shown this session */
    if(sessionStorage.getItem(SPLASH_SHOWN_KEY)){
      removeSplash();
      return
    }

    /* Mark session as shown */
    sessionStorage.setItem(SPLASH_SHOWN_KEY,'1');

    var splash=$('splash');
    if(!splash)return;

    /* Populate greeting with connected user name */
    var greeting=$('splashGreeting');
    var userName='Guest';
    try{
      if(window.CFG&&window.CFG.who){
        userName=window.CFG.who;
      }else if(window.nts_rq_cfg&&window.nts_rq_cfg.who){
        userName=window.nts_rq_cfg.who;
      }
    }catch(e){}
    if(greeting){
      greeting.textContent='Welcome, '+userName;
    }

    /* Wire up buttons */
    var enterBtn=$('splashEnter');
    var settingsBtn=$('splashSettings');
    if(enterBtn){
      enterBtn.addEventListener('click',function(e){
        e.preventDefault();
        closeSplash();
      },false);
    }
    if(settingsBtn){
      settingsBtn.addEventListener('click',function(e){
        e.preventDefault();
        closeSplash();
        if(window.go){window.go('settings');}
      },false);
    }

    /* Auto-close after delay */
    var autoCloseTimer=setTimeout(function(){
      closeSplash();
    },AUTO_CLOSE_DELAY);

    /* Skip on key press */
    function onKeyDown(e){
      clearTimeout(autoCloseTimer);
      closeSplash()
    }

    /* Skip on tap/click anywhere on splash */
    function onClick(e){
      if(e.target===splash||splash.contains(e.target)){
        if(e.target.tagName!=='BUTTON'){
          clearTimeout(autoCloseTimer);
          closeSplash();
        }
      }
    }

    document.addEventListener('keydown',onKeyDown,false);
    document.addEventListener('click',onClick,false);

    function cleanup(){
      document.removeEventListener('keydown',onKeyDown,false);
      document.removeEventListener('click',onClick,false);
      clearTimeout(autoCloseTimer)
    }

    /* Store cleanup for later */
    splash._splashCleanup=cleanup
  }

  function closeSplash(){
    var splash=$('splash');
    if(!splash)return;

    /* Trigger exit animation */
    splash.classList.add('exit');

    /* Remove from DOM after animation completes */
    setTimeout(function(){
      if(splash.parentNode){
        splash.parentNode.removeChild(splash)
      }
      if(splash._splashCleanup){
        splash._splashCleanup()
      }
    },FADE_OUT_DELAY);
  }

  function removeSplash(){
    var splash=$('splash');
    if(splash&&splash.parentNode){
      splash.parentNode.removeChild(splash)
    }
  }

  /* Initialize on DOM ready */
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',initSplash,false);
  }else{
    initSplash();
  }

  /* Expose for external control if needed */
  window.closeSplash=closeSplash;
  window.removeSplash=removeSplash;
})();
