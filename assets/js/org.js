/* Simplified org dashboard script
   Sections: Profile, Opportunities (publish), Applications (incoming)
*/
(function(){
  'use strict';
  function sess(){ try{return JSON.parse(sessionStorage.getItem('hibr_session')||'null')}catch(e){return null} }
  function safe(s){ return String(s||'').replace(/[&<>\"]/g,''); }

  const OPPS_KEY = (orgId)=> `hibr_opps_user_${orgId}`;
  const GLOBAL_OPPS_KEY = 'hibr_opportunities';
  const APPS_KEY = (orgId)=> `hibr_opps_apps_user_${orgId}`;
  const PROFILE_KEY = (orgId)=> `hibr_org_profile_${orgId}`;

  function newId(prefix){ return (prefix||'id_') + Math.random().toString(36).slice(2,9); }

  function loadOpps(){ const s=sess(); if(!s) return []; try{ return JSON.parse(localStorage.getItem(OPPS_KEY(s.id))||'[]'); }catch(e){return []} }
  function saveOpps(list){ const s=sess(); if(!s) return; localStorage.setItem(OPPS_KEY(s.id), JSON.stringify(list)); }

  function publishToGlobal(op){ try{ const g = JSON.parse(localStorage.getItem(GLOBAL_OPPS_KEY)||'[]'); const s=sess(); const withOrg = Object.assign({}, op, { orgId: s? s.id : null, orgName: s? s.name : '' }); const filtered = g.filter(x=> !(x.id===withOrg.id && x.orgId==withOrg.orgId)); filtered.unshift(withOrg); localStorage.setItem(GLOBAL_OPPS_KEY, JSON.stringify(filtered)); window.dispatchEvent(new Event('hibr:opps:changed')); }catch(e){} }

  function loadApps(){ const s=sess(); if(!s) return []; try{ return JSON.parse(localStorage.getItem(APPS_KEY(s.id))||'[]'); }catch(e){return []} }
  function saveApps(list){ const s=sess(); if(!s) return; localStorage.setItem(APPS_KEY(s.id), JSON.stringify(list)); }

  function loadProfile(){ const s=sess(); if(!s) return null; try{ return JSON.parse(localStorage.getItem(PROFILE_KEY(s.id))||'null'); }catch(e){return null} }
  function saveProfile(profile){ const s=sess(); if(!s) return; localStorage.setItem(PROFILE_KEY(s.id), JSON.stringify(profile)); }

  function renderProfile(){ const el=document.getElementById('orgProfile'); if(!el) return; const s=sess(); if(!s){ el.innerHTML=''; return; } const p = loadProfile() || { name: s.name||'', email: s.email||'', about: '' };
    el.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px"><label>اسم المؤسسة</label><input id="pf_name" value="${safe(p.name)}" style="padding:8px" /><label>البريد الإلكتروني</label><input id="pf_email" value="${safe(p.email)}" style="padding:8px" /><label>عن المؤسسة</label><textarea id="pf_about" style="padding:8px">${safe(p.about)}</textarea><div style="margin-top:8px"><button id="saveProfile" class="btn">حفظ</button></div></div>`;
    const btn=document.getElementById('saveProfile'); if(btn) btn.addEventListener('click', ()=>{ const profile={ name: document.getElementById('pf_name').value.trim(), email: document.getElementById('pf_email').value.trim(), about: document.getElementById('pf_about').value.trim() }; saveProfile(profile); DashAuth.showToast('تم حفظ الملف'); });
  }

  function renderOpps(){ const el=document.getElementById('oppsList'); if(!el) return; const items = loadOpps(); if(!items || items.length===0){ el.innerHTML = '<div class="muted">لا توجد فرص منشورة</div>'; return; }
    el.innerHTML = items.map(it=>{ return `<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between"><div><strong>${safe(it.title)}</strong><div class="muted">${safe(it.type)} • ${safe(it.location)}</div></div><div><button class="btn-ghost" data-act="edit-opp" data-id="${it.id}">تعديل</button> <button class="btn-ghost" data-act="del-opp" data-id="${it.id}">حذف</button></div></div><p style="margin-top:8px">${safe(it.description)}</p></div>`; }).join(''); }

  function renderOppApps(){ const el=document.getElementById('oppsAppsList'); if(!el) return; const apps = loadApps(); if(!apps || apps.length===0){ el.innerHTML = '<div class="muted">لا توجد طلبات لتقديمات الفرص</div>'; return; }
    el.innerHTML = apps.map(a=>{ const created = new Date(a.created||Date.now()).toLocaleString(); const status = a.status||'pending';
      let actions = `<button class="btn" data-act="view-app" data-id="${a.id}">عرض</button>`;
      if(status==='pending'){
        actions += ` <button class="btn-ghost" data-act="accept-app" data-id="${a.id}">قبول</button> <button class="btn-ghost" data-act="reject-app" data-id="${a.id}">رفض</button>`;
      } else if(status==='accepted'){
        actions += ` <button class="btn-ghost" data-act="undo-app" data-id="${a.id}">تراجع</button>`;
      } else if(status==='rejected'){
        actions += ` <button class="btn-ghost" data-act="remove-app" data-id="${a.id}">حذف</button>`;
      }
      return `<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between"><div><strong>${safe(a.oppTitle)}</strong><div class="muted">مقدّم من: ${safe(a.applicantName||a.applicantId)} • ${created}</div></div><div>${actions}</div></div><div style="margin-top:8px">الحالة: ${safe(status)}</div></div>`;
    }).join(''); }

  document.addEventListener('click', (e)=>{ const btn = e.target.closest('[data-act]'); if(!btn) return; const act = btn.dataset.act; const id = btn.dataset.id; const s = sess(); if(!s) return;
    if(act==='del-opp'){ if(!confirm('حذف هذه الفرصة؟')) return; const arr = loadOpps().filter(x=> x.id!==id); saveOpps(arr); try{ const g = JSON.parse(localStorage.getItem(GLOBAL_OPPS_KEY)||'[]'); const ng = g.filter(x=> !(x.id===id && x.orgId==s.id)); localStorage.setItem(GLOBAL_OPPS_KEY, JSON.stringify(ng)); window.dispatchEvent(new Event('hibr:opps:changed')); }catch(e){} renderOpps(); DashAuth.showToast('تم الحذف'); return; }

    if(act==='edit-opp'){ const arr = loadOpps(); const it = arr.find(x=>x.id===id); if(!it) return; const html = `<div class="card" style="padding:16px"><h3>تعديل فرصة</h3><label>العنوان</label><input id="m_title" value="${safe(it.title)}" style="width:100%;padding:8px;margin-top:6px" /><label>النوع</label><input id="m_type" value="${safe(it.type)}" style="width:100%;padding:8px;margin-top:6px" /><label>الموقع</label><input id="m_loc" value="${safe(it.location)}" style="width:100%;padding:8px;margin-top:6px" /><label>الوصف</label><textarea id="m_desc" style="width:100%;padding:8px;margin-top:6px">${safe(it.description)}</textarea><div style="margin-top:10px"><button id="doSave" class="btn">حفظ</button> <button id="doCancel" class="btn-ghost">إلغاء</button></div></div>`; const modal = DashAuth.openModal(html); modal.querySelector('#doCancel').addEventListener('click', ()=>DashAuth.closeModal()); modal.querySelector('#doSave').addEventListener('click', ()=>{ it.title = modal.querySelector('#m_title').value.trim(); it.type = modal.querySelector('#m_type').value.trim(); it.location = modal.querySelector('#m_loc').value.trim(); it.description = modal.querySelector('#m_desc').value.trim(); saveOpps(arr); try{ const g = JSON.parse(localStorage.getItem(GLOBAL_OPPS_KEY)||'[]'); const idx = g.findIndex(x=> x.id===it.id && x.orgId==s.id); if(idx>=0){ g[idx].title = it.title; g[idx].type = it.type; g[idx].location = it.location; g[idx].description = it.description; localStorage.setItem(GLOBAL_OPPS_KEY, JSON.stringify(g)); window.dispatchEvent(new Event('hibr:opps:changed')); } }catch(e){} renderOpps(); DashAuth.closeModal(); DashAuth.showToast('تم التعديل'); }); return; }

    if(act==='view-app'){ const apps = loadApps(); const a = apps.find(x=> x.id===id); if(!a) return; const html = `<div class="card" style="padding:16px"><h3>${safe(a.oppTitle)}</h3><div class="muted">مقدّم من: ${safe(a.applicantName||a.applicantId)}</div><p style="margin-top:8px">${safe(a.message||'')}</p><div style="margin-top:12px"><button id="closeApp" class="btn-ghost">إغلاق</button></div></div>`; const modal = DashAuth.openModal(html); modal.querySelector('#closeApp').addEventListener('click', ()=>DashAuth.closeModal()); return; }

    if(act==='accept-app' || act==='reject-app'){ const apps = loadApps(); const idx = apps.findIndex(x=> x.id===id); if(idx<0) return; const verb = act==='accept-app' ? 'قبول' : 'رفض'; const modalHtml = `<div class="card" style="padding:16px"><h3>${verb} الطلب</h3><p class="muted">ملاحظة (اختياري)</p><textarea id="decision_note" style="width:100%;padding:8px;margin-top:8px"></textarea><div style="margin-top:12px"><button id="doDecision" class="btn">${verb}</button> <button id="cancelDecision" class="btn-ghost">إلغاء</button></div></div>`; const modal = DashAuth.openModal(modalHtml); modal.querySelector('#cancelDecision').addEventListener('click', ()=>DashAuth.closeModal()); modal.querySelector('#doDecision').addEventListener('click', ()=>{ const note = modal.querySelector('#decision_note').value.trim(); apps[idx].status = (act==='accept-app')? 'accepted' : 'rejected'; apps[idx].note = note; apps[idx].decidedBy = s.id; apps[idx].decidedAt = Date.now(); saveApps(apps); renderOppApps(); DashAuth.closeModal(); DashAuth.showToast('تم حفظ القرار'); window.dispatchEvent(new Event('hibr:opps:changed')); }); return; }

    if(act==='undo-app'){ const apps = loadApps(); const idx = apps.findIndex(x=> x.id===id); if(idx<0) return; // revert decision to pending
      apps[idx].status = 'pending'; delete apps[idx].decidedBy; delete apps[idx].decidedAt; delete apps[idx].note; saveApps(apps); renderOppApps(); DashAuth.showToast('تم التراجع عن القرار'); window.dispatchEvent(new Event('hibr:opps:changed')); return; }

    if(act==='remove-app'){ const apps = loadApps(); const idx = apps.findIndex(x=> x.id===id); if(idx<0) return; if(!confirm('حذف هذا الطلب نهائياً؟')) return; apps.splice(idx,1); saveApps(apps); renderOppApps(); DashAuth.showToast('تم حذف الطلب'); window.dispatchEvent(new Event('hibr:opps:changed')); return; }
  });

  document.addEventListener('DOMContentLoaded', ()=>{
    if(!DashAuth.ensureRole(['org'])) return; renderProfile(); renderOpps(); renderOppApps(); const add=document.getElementById('addOppBtn'); if(add) add.addEventListener('click', ()=>{
      const html = `<div class="card" style="padding:16px"><h3>نشر فرصة جديدة</h3><label>العنوان</label><input id="n_title" style="width:100%;padding:8px;margin-top:6px" /><label>النوع</label><input id="n_type" style="width:100%;padding:8px;margin-top:6px" /><label>الموقع</label><input id="n_loc" style="width:100%;padding:8px;margin-top:6px" /><label>الوصف</label><textarea id="n_desc" style="width:100%;padding:8px;margin-top:6px"></textarea><div style="margin-top:10px"><button id="doCreate" class="btn">نشر</button> <button id="doCancel" class="btn-ghost">إلغاء</button></div></div>`;
      const modal = DashAuth.openModal(html); modal.querySelector('#doCancel').addEventListener('click', ()=>DashAuth.closeModal()); modal.querySelector('#doCreate').addEventListener('click', ()=>{ const title = modal.querySelector('#n_title').value.trim(); if(!title){ DashAuth.showToast('أدخل عنوان الفرصة'); return; } const it = { id: newId('op_'), title, type: modal.querySelector('#n_type').value.trim(), location: modal.querySelector('#n_loc').value.trim(), description: modal.querySelector('#n_desc').value.trim(), created: Date.now() }; const arr = loadOpps(); arr.unshift(it); saveOpps(arr); try{ publishToGlobal(it); }catch(e){} renderOpps(); renderOppApps(); DashAuth.closeModal(); DashAuth.showToast('تم النشر'); }); });

    window.addEventListener('hibr:opps:changed', ()=>{ renderOpps(); renderOppApps(); });
    window.addEventListener('storage', ()=>{ renderOpps(); renderOppApps(); renderProfile(); });

    // sidebar navigation: show only the selected section
    const navLinks = document.querySelectorAll('.dash-sidebar .nav a');
    const sections = ['profile','opps','requests'];
    function showSection(id){ sections.forEach(s=>{ const el=document.getElementById(s); if(!el) return; el.style.display = (s===id)? 'block' : 'none'; }); navLinks.forEach(a=> a.classList.toggle('active', (a.getAttribute('href')||'')=== (id==='profile'? 'org.html' : '#'+id) )); }
    navLinks.forEach(a=>{ a.addEventListener('click', (e)=>{ const href = a.getAttribute('href')||''; if(href.startsWith('#')){ e.preventDefault(); const id = href.slice(1); showSection(id); } else { e.preventDefault(); showSection('profile'); history.replaceState(null,'', 'org.html'); } }); });
    // initialize: show profile by default
    showSection('profile');
  });

})();
