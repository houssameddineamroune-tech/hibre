/* Dashboard helper (auth guard, theme, export/import, UI helpers) */
(function(){
  "use strict";
  function getSession(){
    try{return JSON.parse(sessionStorage.getItem('hibr_session')||'null');}catch(e){return null}
  }
  function logout(){
    try{ sessionStorage.removeItem('hibr_session'); }catch(e){}
    // redirect to site homepage
    window.location.href='../../index.html';
  }
  function ensureRole(allowed){
    const s=getSession();
    if(!s){window.location.href='../login.html';return false}
    if(Array.isArray(allowed) && !allowed.includes(s.role)){
      document.body.innerHTML='<div style="padding:40px">تم رفض الوصول — ليس لديك صلاحية لهذه الصفحة. <br><a href="../index.html">العودة للصفحة الرئيسية</a></div>';
      return false;
    }
    // show user name
    const el=document.querySelector('[data-user-name]'); if(el) el.textContent=s.name||s.email;
    return true;
  }

  function initTheme(){
    const root=document.documentElement;
    const stored=localStorage.getItem('hibr_theme')||'light';
    if(stored==='dark') root.setAttribute('data-theme','dark');
    document.querySelectorAll('[data-toggle-theme]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const cur=root.getAttribute('data-theme')||'light';
        const next=cur==='dark'?'light':'dark';
        if(next==='dark') root.setAttribute('data-theme','dark'); else root.removeAttribute('data-theme');
        localStorage.setItem('hibr_theme',next);
      });
    });
  }

  function exportData(){
    const data={
      users:JSON.parse(localStorage.getItem('hibr_users')||'[]'),
      app: {
        roles: JSON.parse(localStorage.getItem('hibr_roles')||'null'),
        branding: JSON.parse(localStorage.getItem('hibr_branding')||'null')
      }
    };
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='hibr-backup.json'; document.body.appendChild(a); a.click(); a.remove();
  }

  function importData(file){
    const reader=new FileReader();
    reader.onload=(e)=>{
      try{
        const data=JSON.parse(e.target.result||'{}');
        if(data.users) localStorage.setItem('hibr_users',JSON.stringify(data.users));
        if(data.app && data.app.roles) localStorage.setItem('hibr_roles',JSON.stringify(data.app.roles));
        if(data.app && data.app.branding) localStorage.setItem('hibr_branding',JSON.stringify(data.app.branding));
        showToast('تم استيراد البيانات بنجاح');
        // refresh the page to reflect new settings
        setTimeout(()=>location.reload(),800);
      }catch(err){alert('ملف غير صالح')}
    };
    reader.readAsText(file);
  }

  // UI helpers: toast and modal
  function showToast(msg,timeout=3000){
    const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t);
    setTimeout(()=>{ t.classList.add('visible'); },50);
    setTimeout(()=>{ t.classList.remove('visible'); setTimeout(()=>t.remove(),300); },timeout);
  }

  function openModal(html){
    let overlay=document.getElementById('hibr-modal-overlay');
    if(!overlay){ overlay=document.createElement('div'); overlay.id='hibr-modal-overlay'; overlay.style.position='fixed'; overlay.style.inset=0; overlay.style.background='rgba(0,0,0,0.4)'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.zIndex=9999; }
    overlay.innerHTML = `<div style="max-width:720px;width:100%;"><div class="card modal-card">${html}</div></div>`;
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    return overlay;
  }

  function closeModal(){ const o=document.getElementById('hibr-modal-overlay'); if(o) o.remove(); }

  // user helpers
  function getUsers(){ return JSON.parse(localStorage.getItem('hibr_users')||'[]'); }
  function saveUsers(users){ localStorage.setItem('hibr_users',JSON.stringify(users)); }

  // IndexedDB helpers for storing large files (blobs)
  function openFileDB(){
    return new Promise((resolve, reject)=>{
      const req = indexedDB.open('hibr_files', 1);
      req.onupgradeneeded = function(e){ const db = e.target.result; if(!db.objectStoreNames.contains('files')) db.createObjectStore('files', {keyPath:'id', autoIncrement:true}); };
      req.onsuccess = function(e){ resolve(e.target.result); };
      req.onerror = function(e){ reject(e.target.error); };
    });
  }

  async function saveFileToDB(file){
    const db = await openFileDB();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction('files','readwrite');
      const store = tx.objectStore('files');
      const entry = { name: file.name, type: file.type, blob: file, created: Date.now() };
      const req = store.add(entry);
      req.onsuccess = function(e){ resolve(e.target.result); };
      req.onerror = function(e){ reject(e.target.error); };
    });
  }

  async function getFileFromDB(id){
    const db = await openFileDB();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction('files','readonly');
      const store = tx.objectStore('files');
      const req = store.get(Number(id));
      req.onsuccess = function(e){ const rec = e.target.result; if(!rec) return resolve(null); resolve(rec.blob); };
      req.onerror = function(e){ reject(e.target.error); };
    });
  }

  async function getFileURL(id){ const blob = await getFileFromDB(id); if(!blob) return null; return URL.createObjectURL(blob); }

  // open file in new tab with fallback to direct blob retrieval
  async function openFileInNewTab(id){
    try{
      let url = await getFileURL(id);
      if(!url){ const blob = await getFileFromDB(id); if(blob) url = URL.createObjectURL(blob); }
      if(!url) return false;
      const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
      return true;
    }catch(e){ return false; }
  }

  async function deleteFileFromDB(id){ const db = await openFileDB(); return new Promise((resolve,reject)=>{ const tx=db.transaction('files','readwrite'); const store=tx.objectStore('files'); const req=store.delete(Number(id)); req.onsuccess=()=>resolve(true); req.onerror=(e)=>reject(e.target.error); }); }

  // expose
  window.DashAuth={getSession,logout,ensureRole,initTheme,exportData,importData,showToast,openModal,closeModal,getUsers,saveUsers,saveFile: saveFileToDB, getFile: getFileFromDB, getFileURL: getFileURL, openFileInNewTab: openFileInNewTab, deleteFile: deleteFileFromDB};
  // auto init theme when loaded
  document.addEventListener('DOMContentLoaded',()=>{
    initTheme();
    // sidebar toggle for small screens
    document.querySelectorAll('#dashToggle').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelector('.dash-shell')?.classList.toggle('sidebar-open');
      });
    });
    // close sidebar when clicking outside
    document.addEventListener('click',(e)=>{
      const shell=document.querySelector('.dash-shell'); if(!shell) return;
      if(!shell.classList.contains('sidebar-open')) return;
      const target=e.target;
      const sidebar= shell.querySelector('.dash-sidebar');
      const toggle= document.querySelector('#dashToggle');
      if(sidebar && !sidebar.contains(target) && toggle && !toggle.contains(target)){
        shell.classList.remove('sidebar-open');
      }
    });
    // ensure sidebar closed on larger screens
    window.addEventListener('resize',()=>{ if(window.innerWidth>900){ document.querySelector('.dash-shell')?.classList.remove('sidebar-open'); } });
  });
})();
