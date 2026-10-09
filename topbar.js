/* Top bar interactions: dropdowns, user menu, connection status */

(function(){
  function $(id){return document.getElementById(id)}
  function $$(sel,ctx){return (ctx||document).querySelectorAll(sel)}

  /* Initialize top bar */
  function initTopBar(){
    updateConnectionStatus();
    updateUserInfo();
    updateHelloSection();
    initNavDropdowns();
    initSearch();
    initNotifications();
    initConnectionBtn();
  }

  /* Navigation dropdown menus */
  function initNavDropdowns(){
    var navContainer=$('nav');
    if(!navContainer)return;

    var navButtons=$$('.gb',navContainer);

    navButtons.forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.preventDefault();
        e.stopPropagation();

        var section=this.getAttribute('data-section')||this.textContent.trim();

        /* Close other dropdowns */
        $$('.gb.on').forEach(function(b){
          if(b!==btn)b.classList.remove('on');
        });
        $$('.dropdown.active').forEach(function(dd){
          dd.classList.remove('active');
        });

        /* Toggle this button and dropdown */
        this.classList.toggle('on');

        /* Create or show dropdown */
        var dropdownId='dropdown-'+section.toLowerCase();
        var dropdown=document.getElementById(dropdownId);

        if(!dropdown){
          dropdown=document.createElement('div');
          dropdown.id=dropdownId;
          dropdown.className='dropdown';
          dropdown.innerHTML=getDropdownContent(section);
          this.parentNode.appendChild(dropdown);
        }

        if(this.classList.contains('on')){
          dropdown.classList.add('active');
        }else{
          dropdown.classList.remove('active');
        }
      });
    });

    /* Close dropdown on clicking elsewhere */
    document.addEventListener('click',function(e){
      if(!e.target.closest('.gb')&&!e.target.closest('.dropdown')){
        $$('.gb.on').forEach(function(btn){
          btn.classList.remove('on');
        });
        $$('.dropdown.active').forEach(function(dd){
          dd.classList.remove('active');
        });
      }
    });
  }

  /* Get dropdown content based on section */
  function getDropdownContent(section){
    var items={
      'Home':['Dashboard','Overview','Settings'],
      'Work':['My Tasks','Team Tasks','Deadlines'],
      'Studio':['Projects','Assets','Templates'],
      'Growth':['Analytics','Reports','Insights'],
      'Inventory':['Overview','Stock','Vendors'],
      'Intelligence':['AI Tools','Chat','Analysis'],
      'Team':['Members','Roles','Permissions']
    };

    var content='<div class="dropdown-item section-title">'+section+'</div>';
    var sectionItems=items[section]||[];

    sectionItems.forEach(function(item){
      content+='<div class="dropdown-item"><i class="ph ph-arrow-right" aria-hidden="true"></i>'+item+'</div>';
    });

    return content;
  }

  /* Connection status */
  function updateConnectionStatus(){
    var connStatus=$('connStatus');
    if(!connStatus)return;

    try{
      if(window.CFG&&window.CFG.SCRIPT_URL){
        connStatus.classList.add('connected');
        connStatus.innerHTML='<i class="ph ph-cloud-check" aria-hidden="true"></i>Connected';
      }else{
        connStatus.classList.remove('connected');
        connStatus.innerHTML='<i class="ph ph-cloud-slash" aria-hidden="true"></i>Connection Missing';
      }
    }catch(e){
      connStatus.classList.remove('connected');
      connStatus.innerHTML='<i class="ph ph-cloud-slash" aria-hidden="true"></i>Connection Missing';
    }
  }

  /* Connection button - show modal to connect */
  function initConnectionBtn(){
    var connStatus=$('connStatus');
    if(!connStatus)return;

    connStatus.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();

      /* Show connection modal */
      showConnectionModal();
    });
  }

  /* Connection modal */
  function showConnectionModal(){
    var existing=document.getElementById('connModal');
    if(existing)existing.remove();

    var modal=document.createElement('div');
    modal.id='connModal';
    modal.style.cssText='position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.5);display:grid;place-items:center;backdrop-filter:blur(4px)';

    modal.innerHTML='<div style="background:linear-gradient(145deg,rgba(38,50,70,.95),rgba(24,32,46,.97));border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:32px;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,.4)"><h3 style="font-size:18px;font-weight:700;margin-bottom:16px;color:var(--tx)">Connect to Backend</h3><p style="font-size:13px;color:var(--mu);margin-bottom:20px;line-height:1.6">Enter your Apps Script URL to connect to the shared backend for data sync.</p><input type="text" id="scriptUrlInput" placeholder="https://script.google.com/..." style="width:100%;padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.11);border-radius:8px;color:var(--tx);font-size:12px;margin-bottom:16px;font-family:monospace;box-sizing:border-box"><div style="display:flex;gap:10px"><button id="connSave" style="flex:1;padding:10px;background:linear-gradient(180deg,#5b9bf0,#3f7fdb);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:12px">Connect</button><button id="connCancel" style="flex:1;padding:10px;background:rgba(255,255,255,.08);color:var(--tx);border:1px solid rgba(255,255,255,.1);border-radius:8px;font-weight:600;cursor:pointer;font-size:12px">Cancel</button></div></div>';

    document.body.appendChild(modal);

    $('connSave').addEventListener('click',function(){
      var url=$('scriptUrlInput').value.trim();
      if(url){
        window.CFG=window.CFG||{};
        window.CFG.SCRIPT_URL=url;
        sessionStorage.setItem('SCRIPT_URL',url);
        updateConnectionStatus();
        modal.remove();
        alert('Backend connected! Refresh page to sync.');
      }
    });

    $('connCancel').addEventListener('click',function(){
      modal.remove();
    });

    modal.addEventListener('click',function(e){
      if(e.target===this)this.remove();
    });
  }

  /* User info */
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

  /* Hello section */
  function updateHelloSection(){
    var helloGreeting=$('helloGreeting');
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
    helloGreeting.textContent=greeting+', '+name;

    var helloConnection=$('helloConnection');
    if(helloConnection){
      if(isConnected){
        helloConnection.className='hello-connection connected';
        helloConnection.innerHTML='<i class="ph ph-cloud-check" aria-hidden="true"></i>Connected';
      }else{
        helloConnection.className='hello-connection';
        helloConnection.innerHTML='<i class="ph ph-cloud-slash" aria-hidden="true"></i>Connection Missing';
      }
    }

    var helloUserName=$('helloUserName');
    if(helloUserName)helloUserName.textContent=name;

    var helloLastSync=$('helloLastSync');
    if(helloLastSync){
      helloLastSync.textContent=isConnected?'Just now':'Local mode';
    }
  }

  /* Time-based greeting */
  function getGreeting(){
    var hour=new Date().getHours();
    if(hour<12)return'Good morning';
    if(hour<17)return'Good afternoon';
    return'Good evening';
  }

  /* Search */
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

  /* Notifications */
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

  /* Initialize */
  function init(){
    initTopBar();
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
