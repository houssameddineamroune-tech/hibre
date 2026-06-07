(function(){
  'use strict';
  function sess(){ try{return JSON.parse(sessionStorage.getItem('hibr_session')||'null')}catch(e){return null} }
  function escapeHtml(s){ return String(s||'').replace(/[&<>\"]/g, (c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c)); }

  const INCUBATOR_APPS_KEY = 'hibr_incubator_apps';
  function loadIncubatorApps(){ try{return JSON.parse(localStorage.getItem(INCUBATOR_APPS_KEY)||'[]')}catch(e){return []} }
  function saveIncubatorApps(list){ localStorage.setItem(INCUBATOR_APPS_KEY, JSON.stringify(list)); }

  function renderIncubatorRequests(){ const el=document.getElementById('incRequestsList'); if(!el) return; const apps = loadIncubatorApps(); if(apps.length===0){ el.innerHTML = '<div class="muted">لا توجد طلبات احتضان</div>'; return; }
    el.innerHTML = apps.map(a=>{
      const created = new Date(a.created||Date.now()).toLocaleString();
      const status = a.status || 'pending';
      const note = a.note? `<div class="muted">ملاحظة: ${escapeHtml(a.note)}</div>` : '';
      return `<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${escapeHtml(a.title)}</strong><div class="muted">مقدّم من: ${escapeHtml(a.creatorName||a.creatorId)} • ${created}</div></div><div><button class="btn" data-id="${a.id}" data-act="view-app">عرض</button> <button class="btn-ghost" data-id="${a.id}" data-act="accept-app">قبول</button> <button class="btn-ghost" data-id="${a.id}" data-act="reject-app">رفض</button> <button class="btn-ghost" data-id="${a.id}" data-act="delete-app">حذف الطلب</button></div></div><div style="margin-top:8px">الحالة: ${escapeHtml(status)} ${note}</div></div>`;
    }).join('');
  }

  document.addEventListener('click',(e)=>{
    const btn = e.target.closest('[data-act]'); if(!btn) return; const act = btn.dataset.act; const id = btn.dataset.id;
    // handle request-doc/view-doc from incubator accepted list
    if(act==='request-doc'){
      const appId = btn.dataset.appId; const docKey = btn.dataset.doc; const s = sess(); if(!window.Incubator){ DashAuth.showToast('وحدة الاحتضان غير متوفرة'); return; }
      const ok = window.Incubator.requestDocument(appId, docKey, s?.id, s?.name); if(ok){ DashAuth.showToast('تم طلب المستند'); try{ renderAcceptedIncubator(); }catch(e){} window.dispatchEvent(new Event('hibr:incubator:changed')); }
      return;
    }
    if(act==='delete-app'){
      const apps = loadIncubatorApps(); const idx = apps.findIndex(x=>x.id===id); if(idx===-1) return; if(!confirm('حذف هذا الطلب نهائياً؟')) return; apps.splice(idx,1); saveIncubatorApps(apps); DashAuth.showToast('تم حذف الطلب'); try{ renderIncubatorRequests(); renderAcceptedIncubator && renderAcceptedIncubator(); }catch(e){} window.dispatchEvent(new Event('hibr:incubator:changed')); return;
    }
      if(act==='view-doc'){
        const fileId = btn.dataset.fileId; if(!fileId) return; (async ()=>{ try{ const ok = await DashAuth.openFileInNewTab(fileId); if(!ok) DashAuth.showToast('الملف غير متوافر'); }catch(err){ DashAuth.showToast('فشل فتح الملف'); } })(); return;
      }
    if(act==='view-app'){ const apps = loadIncubatorApps(); const a = apps.find(x=>x.id===id); if(!a) return; const html = `<div class="card" style="padding:16px"><h3>${escapeHtml(a.title)}</h3><div class="muted">مقدّم من: ${escapeHtml(a.creatorName||a.creatorId)}</div><p style="margin-top:8px">${escapeHtml(a.description||'')}</p>${(a.files && a.files.length>0)?'<div style="margin-top:8px"><a href="#" id="openFile">عرض الملف</a></div>':''}<div style="margin-top:12px"><button class="btn-ghost" id="closeApp">إغلاق</button></div></div>`; const modal = DashAuth.openModal(html); modal.querySelector('#closeApp').addEventListener('click',()=>DashAuth.closeModal()); if(a.files && a.files.length>0){ modal.querySelector('#openFile').addEventListener('click', async (ev)=>{ ev.preventDefault(); try{ const ok = await DashAuth.openFileInNewTab(a.files[0]); if(!ok) DashAuth.showToast('الملف غير متوافر'); }catch(err){ DashAuth.showToast('فشل تحميل الملف'); } }); } }

    if(act==='accept-app' || act==='reject-app'){ const apps = loadIncubatorApps(); const a = apps.find(x=>x.id===id); if(!a) return; const verb = act==='accept-app' ? 'قبول' : 'رفض'; const modalHtml = `<div class="card" style="padding:16px"><h3>${verb} طلب الاحتضان</h3><p class="muted">أضف ملاحظة للمبدع (اختياري)</p><textarea id="decision_note" style="width:100%;padding:8px;margin-top:8px"></textarea><div style="margin-top:12px"><button id="doDecision" class="btn">${verb}</button> <button id="cancelDecision" class="btn-ghost">إلغاء</button></div></div>`; const modal = DashAuth.openModal(modalHtml); modal.querySelector('#cancelDecision').addEventListener('click',()=>DashAuth.closeModal()); modal.querySelector('#doDecision').addEventListener('click', ()=>{ const note = modal.querySelector('#decision_note').value.trim(); a.status = (act==='accept-app')? 'accepted' : 'rejected'; a.note = note; a.decidedBy = (sess() && sess().id) || null; a.decidedAt = Date.now(); saveIncubatorApps(apps); DashAuth.closeModal(); DashAuth.showToast('تم حفظ القرار'); renderIncubatorRequests(); window.dispatchEvent(new Event('hibr:incubator:changed')); }); }
  });

  document.addEventListener('DOMContentLoaded', ()=>{
    if(!DashAuth.ensureRole(['mentor'])) return; renderIncubatorRequests(); window.addEventListener('hibr:incubator:changed', ()=>{ renderIncubatorRequests(); try{ renderAcceptedIncubator && renderAcceptedIncubator(); }catch(e){} try{ renderReports && renderReports(); }catch(e){} }); window.addEventListener('storage', ()=>{ renderIncubatorRequests(); try{ renderAcceptedIncubator && renderAcceptedIncubator(); }catch(e){} try{ renderReports && renderReports(); }catch(e){} });
    // render reports
    try{ renderReports && renderReports(); }catch(e){}
    // render accepted/incubated projects when requested via hash
    function renderAcceptedIncubator(){ try{
        const el = document.getElementById('incubatorProjectsList'); if(!el) return; if(!window.Incubator){ el.innerHTML = '<div class="muted">وحدة الاحتضان غير متاحة</div>'; return; }
        const apps = window.Incubator.getAcceptedApps(); if(!apps || apps.length===0){ el.innerHTML = '<div class="muted">لا توجد مشاريع محتضنة حالياً</div>'; return; }
        const docKeys = [{k:'bmc',label:'BMC'},{k:'prototype',label:'النموذج الأولي'},{k:'economicModel',label:'النموذج الاقتصادي'},{k:'financialPlan',label:'الخطة المالية'},{k:'marketingPlan',label:'الخطة التسويقية'}];
        el.innerHTML = apps.map(app=>{
          const owner = app.creatorName || app.creatorId || 'مالك';
        const docsHtml = docKeys.map(d=>{
            const doc = (app.documents||{})[d.k];
            if(doc && doc.status==='uploaded'){
              return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0"><div><strong>${d.label}</strong><div class="muted">تم الرفع من ${escapeHtml(doc.uploadedBy||'')}</div></div><div><button class="btn-ghost" data-act="view-doc" data-file-id="${doc.fileId}">عرض</button></div></div>`;
            }
            if(doc && doc.status==='requested'){
              return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0"><div><strong>${d.label}</strong><div class="muted">مطلوب</div></div><div><button class="btn" data-act="request-doc" data-app-id="${app.id}" data-doc="${d.k}">إعادة طلب</button></div></div>`;
            }
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0"><div><strong>${d.label}</strong><div class="muted">غير مطلوب/غير مرفوع</div></div><div><button class="btn" data-act="request-doc" data-app-id="${app.id}" data-doc="${d.k}">طلب المستند</button></div></div>`;
          }).join('');
          // files uploaded at submission (generic files)
          const files = app.files || [];
          const filesHtml = files.length>0 ? `<div style="margin-top:8px"><strong>ملفات المبدع:</strong><div style="margin-top:6px">` + files.map((fid,i)=>`<button class="btn-ghost" data-act="view-doc" data-file-id="${fid}">ملف ${i+1}</button>`).join(' ') + `</div></div>` : '';
          const status = app.status || 'pending';
          return `<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between"><div><strong>${escapeHtml(app.title)}</strong><div class="muted">المالك: ${escapeHtml(owner)}</div></div><div><small class="muted">${new Date(app.created||Date.now()).toLocaleString()}</small></div></div><div style="margin-top:8px"><strong>الحالة:</strong> ${escapeHtml(status)}</div><div style="margin-top:8px">${docsHtml}</div>${filesHtml}<div style="margin-top:8px;display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-act="view-app" data-id="${app.id}">فتح</button></div></div>`;
        }).join('');
      }catch(e){ console.error && console.error('mentor: renderAcceptedIncubator error', e); }}

    // reports: basic stats about incubator requests
    function renderReports(){ try{
        const el = document.getElementById('reportsList'); if(!el) return; const apps = loadIncubatorApps(); const total = apps.length; const pending = apps.filter(a=>!a.status || a.status==='pending').length; const accepted = apps.filter(a=>a.status==='accepted').length; const incubated = apps.filter(a=>a.status==='incubated').length; const rejected = apps.filter(a=>a.status==='rejected').length; const withFiles = apps.filter(a=> (a.files||[]).length>0 ).length; el.innerHTML = `<div class="muted">إجمالي الطلبات: ${total}</div><div class="muted">قيد الانتظار: ${pending}</div><div class="muted">مقبولة: ${accepted}</div><div class="muted">محتضنة: ${incubated}</div><div class="muted">مرفوضة: ${rejected}</div><div class="muted">طلبات مع ملفات مرفوعة: ${withFiles}</div>`;
      }catch(e){ console.error && console.error('mentor: renderReports error', e); }}
    function handleHash(){ try{ const h = (location.hash||'').replace('#',''); const reqSec = document.querySelector('#incRequestsList') && document.querySelector('#incRequestsList').closest('section'); const incubSec = document.getElementById('incubatorProjectsSection'); const repSec = document.getElementById('reportsSection');
        if(h==='incubator'){
          if(incubSec) incubSec.style.display='block'; if(reqSec) reqSec.style.display='none'; if(repSec) repSec.style.display='none'; renderAcceptedIncubator();
        } else if(h==='reports'){
          if(repSec) repSec.style.display='block'; if(reqSec) reqSec.style.display='none'; if(incubSec) incubSec.style.display='none'; renderReports();
        } else {
          if(reqSec) reqSec.style.display='block'; if(incubSec) incubSec.style.display='none'; if(repSec) repSec.style.display='none';
        }
      }catch(e){}
    }
    handleHash(); window.addEventListener('hashchange', handleHash);
    // sidebar nav active toggling and click handling
    function updateSidebarActive(){ try{
        const h = (location.hash||'').replace('#','');
        document.querySelectorAll('.dash-sidebar .nav a').forEach(a=>{
          const href = a.getAttribute('href')||''; let id=''; if(href.startsWith('#')) id = href.slice(1); else if(href.endsWith('mentor.html')) id = '';
          a.classList.toggle('active', (id === h) || (id==='' && !h));
        });
      }catch(e){}
    }
    document.querySelectorAll('.dash-sidebar .nav a').forEach(a=>{ a.addEventListener('click',(e)=>{ e.preventDefault(); const href=a.getAttribute('href')||''; if(href.startsWith('#')) location.hash = href; else location.hash=''; updateSidebarActive(); }); });
    updateSidebarActive(); window.addEventListener('hashchange', updateSidebarActive);
  });

})();
