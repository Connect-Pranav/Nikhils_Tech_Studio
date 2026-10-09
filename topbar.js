/* Top bar interactions: dropdowns, user menu, connection status */

(function(){
  function $(id){return document.getElementById(id)}
  function $$(sel,ctx){return (ctx||document).querySelectorAll(sel)}

  /* Initialize top bar dropdowns */
  function initTopBar(){
    var nav=$('nav');
    if(!nav)return;

    var navItems=$$('.gb',nav);

    navItems.forEach(function(item){
      item.addEventListener('click',function(e){
        e.preventDefault();
        e.stopPropagation();

        var section=this.getAttribute('data-section');
        if(!section)return;

        /* Close other dropdowns */
        $$('.dropdown.active').forEach(function(dd){
          dd.classList.remove('active');
        });

        /* Toggle current dropdown */
        var dropdown=document.querySelector('[data-dropdown="'+section+'"]');
        if(dropdown){
          dropdown.classList.toggle('active');
          this.classList.toggle('on');
        }
      });
    });

    /* Close dropdown when clicking elsewhere */
    document.addEventListener('click',function(e){
      if(!e.target.closest('.gb')&&!e.target.closest('.dropdown')){
        $$('.dropdown.active').forEach(function(dd){
          dd.classList.remove('active');
        });
        $$('.gb.on').forEach(function(btn){
          btn.classList.remove('on');
        });
      }
    });
  }

  /* Update connection status */
  function updateConnectionStatus(){
    var connStatus=$('connStatus');
    if(!connStatus)return;

    try{
      if(window.CFG&&window.CFG.SCRIPT_URL){
        connStatus.classList.add('connected');
        connStatus.textContent='Connected';
      }else{
        connStatus.classList.remove('connected');
        connStatus.textContent='Connection Missing';
      }
    }catch(e){
      connStatus.classList.remove('connected');
      connStatus.textContent='Connection Missing';
    }
  }

  /* Update user info in top right */
  function updateUserInfo(){
    var userName=$('topUserName');
    var userAvatar=$('topUserAvatar');

    if(!userName||!userAvatar)return;

    var name='User';
    try{
      if(window.CFG&&window.CFG.who){
        name=window.CFG.who;
      }else if(window.nts_rq_cfg&&window.nts_rq_cfg.who){
        name=window.nts_rq_cfg.who;
      }
    }catch(e){}

    userName.textContent=name;
    userAvatar.textContent=name.charAt(0).toUpperCase();
  }

  /* Update hello section */
  function updateHelloSection(){
    var helloGreeting=$('helloGreeting');
    var helloUserName=$('helloUserName');
    var helloConnection=$('helloConnection');

    if(!helloGreeting)return;

    var name='User';
    var isConnected=false;

    try{
      if(window.CFG&&window.CFG.who){
        name=window.CFG.who;
      }else if(window.nts_rq_cfg&&window.nts_rq_cfg.who){
        name=window.nts_rq_cfg.who;
      }

      if(window.CFG&&window.CFG.SCRIPT_URL){
        isConnected=true;
      }
    }catch(e){}

    var greeting=getGreeting();
    if(helloGreeting){
      helloGreeting.textContent=greeting+', '+name;
    }

    if(helloUserName){
      helloUserName.textContent=name;
    }

    if(helloConnection){
      helloConnection.textContent=isConnected?'Connected':'Connection Missing';
      helloConnection.className='hello-connection'+(isConnected?' connected':'');
    }
  }

  /* Get time-based greeting */
  function getGreeting(){
    var hour=new Date().getHours();
    if(hour<12)return'Good morning';
    if(hour<17)return'Good afternoon';
    return'Good evening';
  }

  /* Search functionality */
  function initSearch(){
    var searchInput=$('topSearch');
    if(!searchInput)return;

    searchInput.addEventListener('keydown',function(e){
      if(e.key==='Enter'){
        e.preventDefault();
        var query=this.value.trim();
        if(query&&window.go){
          window.go('command');
        }
      }
    });
  }

  /* Notification bell */
  function initNotifications(){
    var notifBell=$('topNotifBell');
    if(!notifBell)return;

    notifBell.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      if(window.go){
        window.go('notifications');
      }
    });
  }

  /* Initialize on DOM ready */
  function init(){
    initTopBar();
    updateConnectionStatus();
    updateUserInfo();
    updateHelloSection();
    initSearch();
    initNotifications();

    /* Update every minute for time-based greeting */
    setInterval(updateHelloSection,60000);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,false);
  }else{
    init();
  }

  /* Expose for external updates */
  window.updateTopBar=function(){
    updateConnectionStatus();
    updateUserInfo();
    updateHelloSection();
  };
})();
