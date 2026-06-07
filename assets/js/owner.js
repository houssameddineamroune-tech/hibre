(function(){
  'use strict';

  const DEFAULT_PERMS = {
    manage_users: 'إدارة المستخدمين',
    manage_content: 'إدارة المحتوى',
    view_reports: 'عرض التقارير',
    backup: 'النسخ الاحتياطي',
    manage_branding: 'تعديل الهوية'
  };

  const DEFAULT_ROLES = {
    owner: Object.keys(DEFAULT_PERMS),
    manager: ['manage_users','manage_content','view_reports'],
    creator: ['manage_content'],
    coach: ['view_reports'],
    mentor: [],
    org: []
  };

  function getRoles(){
    try{return JSON.parse(localStorage.getItem('hibr_roles'))||DEFAULT_ROLES;}catch(e){return DEFAULT_ROLES}
  }
  function saveRoles(r){ localStorage.setItem('hibr_roles',JSON.stringify(r)); }

  function getBranding(){ try{return JSON.parse(localStorage.getItem('hibr_branding'))||{siteName:'حِبر',logo:null}; }catch(e){return {siteName:'حِبر',logo:null}} }
  function saveBranding(b){ localStorage.setItem('hibr_branding',JSON.stringify(b)); }

  // Users helpers
  function getUsers(){ try{return JSON.parse(localStorage.getItem('hibr_users'))||[];}catch(e){return []} }
  function saveUsers(u){ localStorage.setItem('hibr_users',JSON.stringify(u)); window.dispatchEvent(new Event('hibr:data-changed')); }

  function renderUsersTable(){
    const container=document.getElementById('usersTable'); if(!container) return;
    const users = getUsers();
    let html = `
      <div style="margin-bottom:12px;padding:8px;border:1px dashed var(--muted);">
        <h4 style="margin:0 0 8px">إضافة مستخدم يدوي</h4>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input id="newName" placeholder="الاسم" style="flex:1;min-width:160px" />
          <input id="newEmail" placeholder="البريد الإلكتروني" style="flex:1;min-width:200px" />
          <select id="newRole">
            <option value="creator">مبدع</option>
            <option value="coach">مدرب</option>
            <option value="mentor">مرشد</option>
            <option value="manager">مدير</option>
            <option value="owner">مالك</option>
            <option value="org">مؤسسة</option>
          </select>
          <input id="newTasks" placeholder="مهام (مفصولة بفواصل)" style="flex:1;min-width:200px" />
          <button class="btn" id="addUserBtn">إضافة</button>
        </div>
      </div>
      <div style="overflow:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="text-align:right"><th>id</th><th>الاسم</th><th>البريد</th><th>الدور</th><th>مهام</th><th>إجراءات</th></tr></thead>
          <tbody>
    `;
    users.forEach(u=>{
      const tasksText = (u.tasks||[]).join(', ');
      const exp = u.experimental ? ' <small class="muted">(تجريبي)</small>' : '';
      html += `<tr style="border-top:1px solid var(--muted);"><td style="padding:8px">${u.id}</td><td style="padding:8px">${escapeHtml(u.name||'')}</td><td style="padding:8px">${escapeHtml(u.email||'')}</td><td style="padding:8px">${escapeHtml(u.role||'')}</td><td style="padding:8px">${escapeHtml(tasksText) || '<span class=\"muted\">لا مهام</span>'}${exp}</td><td style="padding:8px;text-align:left;white-space:nowrap"><button class="btn-small" data-action="edit" data-id="${u.id}">تحرير المهام</button> <button class="btn-ghost" data-action="delete" data-id="${u.id}">حذف</button></td></tr>`;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;

    document.getElementById('addUserBtn').addEventListener('click',()=>{
      const name = (document.getElementById('newName').value||'').trim();
      const email = (document.getElementById('newEmail').value||'').trim();
      const role = (document.getElementById('newRole').value||'creator');
      const tasksRaw = (document.getElementById('newTasks').value||'').trim();
      if(!name || !email){ DashAuth.showToast('الاسم والبريد مطلوبان'); return; }
      const users = getUsers();
      const maxId = users.reduce((m,u)=>Math.max(m,u.id||0),0);
      const newUser = { id: maxId+1, name, email, password: 'password', role, tasks: tasksRaw? tasksRaw.split(',').map(s=>s.trim()).filter(Boolean): [] };
      users.push(newUser); saveUsers(users); renderUsersTable(); DashAuth.showToast('تم إضافة المستخدم');
    });

    container.querySelectorAll('button[data-action]').forEach(b=>{
      b.addEventListener('click',(e)=>{
        const id = Number(b.dataset.id);
        const action = b.dataset.action;
        if(action==='delete'){
          if(!confirm('هل تريد حذف المستخدم؟')) return;
          const updated = getUsers().filter(u=>u.id!==id); saveUsers(updated); renderUsersTable(); DashAuth.showToast('تم حذف المستخدم');
        } else if(action==='edit'){
          const users = getUsers(); const user = users.find(x=>x.id===id); if(!user) return;
          const current = (user.tasks||[]).join(', ');
          const edited = prompt('حرّر المهام (مفصولة بفواصل):', current);
          if(edited!==null){ user.tasks = edited.split(',').map(s=>s.trim()).filter(Boolean); saveUsers(users); renderUsersTable(); DashAuth.showToast('تم تحديث المهام'); }
        }
      });
    });
  }

  function renderRoles(){
    const container=document.getElementById('rolesContainer'); if(!container) return;
    const roles=getRoles();
    let html='';
    Object.keys(roles).forEach(role=>{
      html+=`<div class="card" style="margin-bottom:10px"><h4 style="margin:0 0 6px">${role}</h4><div class="muted">صلاحيات الدور</div><div style="margin-top:8px" data-role="${role}">`;
      Object.keys(DEFAULT_PERMS).forEach(p=>{
        const checked = (roles[role]||[]).includes(p) ? 'checked' : '';
        html+=`<label style="display:inline-flex;align-items:center;margin:6px 8px"><input type="checkbox" data-perm="${p}" ${checked}/> <span style="margin-inline-start:8px">${DEFAULT_PERMS[p]}</span></label>`;
      });
      html+=`</div><div style="margin-top:8px;text-align:left"><button class="btn" data-action="save-role" data-role="${role}">حفظ</button></div></div>`;
    });
    container.innerHTML=html;
    container.querySelectorAll('[data-action="save-role"]').forEach(b=>{
      b.addEventListener('click',()=>{
        const role=b.dataset.role; const parent = container.querySelector(`[data-role="${role}"]`);
        const picks = Array.from(parent.querySelectorAll('input[type="checkbox"]')).filter(i=>i.checked).map(i=>i.dataset.perm);
        const current = getRoles(); current[role]=picks; saveRoles(current);
        DashAuth.showToast('تم حفظ صلاحيات الدور');
      });
    });
  }

  function renderBranding(){
    const container=document.getElementById('brandingContainer'); if(!container) return;
    const b = getBranding();
    const logoPreview = b.logo ? `<img src="${b.logo}" style="height:60px;object-fit:contain;border-radius:4px"/>` : '<div class="muted">لا يوجد شعار</div>';
    container.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div style="min-width:180px">${logoPreview}<div style="margin-top:8px"><label class="btn-ghost" style="cursor:pointer;padding:6px 10px">تحميل شعار<input id="brandingLogo" type="file" accept="image/*" style="display:none"/></label></div></div>
        <div style="flex:1">
          <div><label>اسم الموقع</label><input id="brandingName" value="${escapeHtml(b.siteName||'حِبر')}" style="width:100%"/></div>
          <div style="margin-top:12px;text-align:left"><button class="btn" id="saveBranding">حفظ الهوية</button></div>
        </div>
      </div>
    `;

    const logoInput = document.getElementById('brandingLogo');
    logoInput.addEventListener('change',(e)=>{
      const f = e.target.files[0]; if(!f) return;
      const reader=new FileReader();
      reader.onload=(ev)=>{
        const data=ev.target.result;
        // preview
        const previewArea = container.querySelector('div');
        // update preview img
        const imgTag = container.querySelector('img');
        if(imgTag) imgTag.src = data; else container.querySelector('div').innerHTML = `<img src="${data}" style="height:60px;object-fit:contain;border-radius:4px"/>`;
        // save immediately to branding object
        const branding = getBranding(); branding.logo = data; saveBranding(branding);
        // update logo in sidebar if exists
        const logoEl = document.getElementById('logo_hibre'); if(logoEl) logoEl.src = data;
        DashAuth.showToast('تم تحميل الشعار');
      };
      reader.readAsDataURL(f);
    });

    document.getElementById('saveBranding').addEventListener('click',()=>{
      const name = (document.getElementById('brandingName').value||'').trim() || 'حِبر';
      const branding = getBranding(); branding.siteName = name; saveBranding(branding);
      // update sidebar text
      const brandText = document.querySelector('.dash-sidebar .brand div'); if(brandText) brandText.textContent = `${name} — مالك`;
      DashAuth.showToast('تم حفظ الهوية');
    });
  }

  function applyBrandingOnLoad(){
    const b = getBranding();
    if(b.logo){ const logoEl = document.getElementById('logo_hibre'); if(logoEl) logoEl.src = b.logo; }
    if(b.siteName){ const brandText = document.querySelector('.dash-sidebar .brand div'); if(brandText) brandText.textContent = `${b.siteName} — مالك`; }
  }

  // Overview chart (donut) rendering
  function getCounts(){
    const users = JSON.parse(localStorage.getItem('hibr_users')||'[]').length;
    const courses = JSON.parse(localStorage.getItem('hibr_courses')||'[]').length;
    const businesses = JSON.parse(localStorage.getItem('hibr_businesses')||'[]').length;
    const opportunities = JSON.parse(localStorage.getItem('hibr_opportunities')||'[]').length;
    return { users, courses, businesses, opportunities };
  }

  function renderOverviewChart(){
    const container = document.getElementById('overviewChart'); if(!container) return;
    const keyContainer = document.getElementById('overviewKey'); if(!keyContainer) return;
    const counts = getCounts();
    const entries = [
      {key:'users',label:'مستخدمون',value:counts.users, color:'#4f46e5'},
      {key:'courses',label:'دورات',value:counts.courses, color:'#06b6d4'},
      {key:'businesses',label:'أعمال',value:counts.businesses, color:'#f59e0b'},
      {key:'opportunities',label:'فرص',value:counts.opportunities, color:'#ef4444'}
    ];
    const realTotal = entries.reduce((s,e)=>s+e.value,0);
    let total = realTotal || 0;
    const isPlaceholder = total === 0;
    if(isPlaceholder){
      // show placeholder equal wedges so colors are visible
      entries.forEach(e=>e._placeholder = true);
      entries.forEach(e=>e.value = 1);
      total = entries.length;
    }
    const size = 180; const r = 72; const cx = size/2; const cy = size/2;
    const svgns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgns,'svg'); svg.setAttribute('viewBox',`0 0 ${size} ${size}`); svg.setAttribute('width','100%'); svg.setAttribute('height','100%'); svg.setAttribute('preserveAspectRatio','xMidYMid meet'); svg.style.display='block'; svg.style.margin='0 auto';
    // draw slices (filled wedges)
    let startAngle = -Math.PI/2; // start at top
    entries.forEach(ent=>{
      const frac = ent.value/total;
      const angle = frac * Math.PI * 2;
      const endAngle = startAngle + angle;
      if(frac>0){
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const large = angle > Math.PI ? 1 : 0;
        const path = document.createElementNS(svgns,'path');
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        path.setAttribute('d',d);
        path.setAttribute('fill',ent.color);
        path.setAttribute('stroke','none');
        svg.appendChild(path);
      }
      startAngle = endAngle;
    });
    // center hole to make it look like a filled disc with triangular wedges (optional)
    const hole = document.createElementNS(svgns,'circle'); hole.setAttribute('cx',cx); hole.setAttribute('cy',cy); hole.setAttribute('r',r*0.35); hole.setAttribute('fill','#ffffff'); svg.appendChild(hole);
    // center text
    const g = document.createElementNS(svgns,'g');
    const totalText = document.createElementNS(svgns,'text'); totalText.setAttribute('x',cx); totalText.setAttribute('y',cy-6); totalText.setAttribute('text-anchor','middle'); totalText.setAttribute('font-size','18'); totalText.setAttribute('fill','#111827'); totalText.setAttribute('font-weight','700'); totalText.textContent = isPlaceholder ? '0' : String(realTotal);
    const labelText = document.createElementNS(svgns,'text'); labelText.setAttribute('x',cx); labelText.setAttribute('y',cy+16); labelText.setAttribute('text-anchor','middle'); labelText.setAttribute('font-size','12'); labelText.setAttribute('fill','#6b7280'); labelText.textContent = isPlaceholder ? 'لا بيانات' : 'إجمالي';
    g.appendChild(totalText); g.appendChild(labelText); svg.appendChild(g);

    // build key / breakdown on the right
    keyContainer.innerHTML = '';
    entries.forEach(ent=>{
      const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.gap='12px'; row.style.padding='6px 8px';
      const left = document.createElement('div'); left.style.display='flex'; left.style.alignItems='center'; left.style.gap='10px';
      const sw = document.createElement('span'); sw.style.width='14px'; sw.style.height='14px'; sw.style.background=ent.color; sw.style.display='inline-block'; sw.style.borderRadius='3px';
      const lab = document.createElement('div'); lab.textContent = ent.label; lab.style.color='#111827'; lab.style.fontSize='14px';
      left.appendChild(sw); left.appendChild(lab);
      const right = document.createElement('div'); right.style.textAlign='right'; right.style.minWidth='90px';
      const pct = Math.round(((isPlaceholder?0:entries.find(x=>x.key===ent.key).value)/ (isPlaceholder?1:realTotal))*100);
      right.innerHTML = `<div style="font-weight:700">${isPlaceholder?0:entries.find(x=>x.key===ent.key).value}</div><div style="color:#6b7280;font-size:12px">${isPlaceholder?'-':pct+'%'}</div>`;
      row.appendChild(left); row.appendChild(right);
      keyContainer.appendChild(row);
    });

    // clear and append
    container.innerHTML = ''; container.appendChild(svg);
    // update small total users card
    const usersEl = document.getElementById('total-users'); if(usersEl) usersEl.textContent = counts.users;
  }

  // listen for updates
  window.addEventListener('hibr:data-changed',()=>{ renderOverviewChart(); renderUsersTable && renderUsersTable(); });
  window.addEventListener('storage',()=>{ renderOverviewChart(); renderUsersTable && renderUsersTable(); });

  function escapeHtml(s){ return String(s).replace(/[&<>\"]/g, (c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]||c)); }

  document.addEventListener('DOMContentLoaded',()=>{
    if(!DashAuth.ensureRole(['owner'])) return;
    applyBrandingOnLoad();
    renderRoles();
    renderBranding();

    // Section switching logic: show only the active section
    const main = document.querySelector('.dash-main');
    function showSection(id){
      // sections: overview (.dash-cards), and other section.card with ids
      const overview = document.querySelector('.dash-cards');
      const allSections = Array.from(main.querySelectorAll('section.card'));
      // handle overview
      if(id==='overview'){
        if(overview) overview.style.display='grid';
      } else {
        if(overview) overview.style.display='none';
      }
      // toggle others
      allSections.forEach(s=>{
        if(s.id && s.id===id) s.style.display='block'; else s.style.display='none';
      });
      // update nav active state
      document.querySelectorAll('.dash-sidebar .nav a').forEach(a=>{
        const href = a.getAttribute('href')||'';
        let target = '';
        if(href.startsWith('#')) target = href.slice(1);
        else if(href.endsWith('owner.html')) target = 'overview';
        a.classList.toggle('active', target===id);
      });
    }

    // wire sidebar links
    document.querySelectorAll('.dash-sidebar .nav a').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        const href = a.getAttribute('href')||'';
        let target = '';
        if(href.startsWith('#')) target = href.slice(1);
        else if(href.endsWith('owner.html')) target = 'overview';
        if(target){
          showSection(target);
          // update URL without reload
          if(href.startsWith('#')) history.pushState(null,'',href);
          else history.pushState(null,'',href);
        }
      });
    });

    // on load, show based on hash or default overview
    const initial = (location.hash && location.hash.length>1) ? location.hash.slice(1) : 'overview';
    showSection(initial);
    renderOverviewChart();
    renderUsersTable();
  });

})();
