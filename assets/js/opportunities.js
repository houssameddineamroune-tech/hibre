(function(){
  'use strict';
  function sess(){ try{return JSON.parse(sessionStorage.getItem('hibr_session')||'null')}catch(e){return null} }
  function newId(){ return 'app_'+Math.random().toString(36).slice(2,9); }

  function loadGlobal(){ try{return JSON.parse(localStorage.getItem('hibr_opportunities')||'[]')}catch(e){return []} }
  function saveAppToOrg(orgId, app){ try{ const key = 'hibr_opps_apps_user_' + orgId; const arr = JSON.parse(localStorage.getItem(key)||'[]'); arr.unshift(app); localStorage.setItem(key, JSON.stringify(arr)); window.dispatchEvent(new Event('hibr:opps:changed')); }catch(e){} }

  function hasApplied(orgId, oppId, userId){ try{ const key = 'hibr_opps_apps_user_' + orgId; const arr = JSON.parse(localStorage.getItem(key)||'[]'); return arr.some(a=> a.oppId===oppId && String(a.applicantId)===String(userId)); }catch(e){return false} }

  function render(){ const container = document.querySelector('.opps-list'); if(!container) return; const list = loadGlobal(); // keep static HTML always; render stored opportunities below static cards
    // remove previously generated dynamic cards
    Array.from(container.querySelectorAll('[data-generated="true"]')).forEach(n=>n.remove());
    if(!list || list.length===0) return;
    const html = list.map(op=>{
      const applied = (sess() && sess().role==='creator' && hasApplied(op.orgId, op.id, (sess()&&sess().id))) ? true : false;
      const badges = `${op.type?`<span class="badge badge-gold">${op.type}</span>`:''}`;
      return `<div class="opp-card reveal" data-generated="true"><div class="opp-info"><div class="opp-badges">${badges}</div><h3>${op.title}</h3><p class="company">${op.orgName||op.company||''}</p><div class="opp-meta"><span>📍 ${op.location||'عن بُعد'}</span><span>⏱ آخر موعد: ${op.deadline? op.deadline : (new Date(op.created||Date.now()).toLocaleDateString())}</span><span>💼 ${op.type||''}</span></div></div><button class="btn btn-primary" data-act="apply-opp" data-opp="${op.id}" data-org="${op.orgId}" ${applied? 'disabled':''} style="white-space:nowrap;">${applied? 'تم التقديم' : 'قدّم الآن ←'}</button></div>`;
    }).join('');
    container.insertAdjacentHTML('beforeend', html);
  }

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-act="apply-opp"]'); if(!btn) return; const oppId = btn.dataset.opp; const orgId = btn.dataset.org;
    const s = sess(); if(!s){ if(confirm('سجل الدخول كمبدع للتقديم الآن. الانتقال إلى صفحة الدخول؟')) window.location.href = 'login.html'; return; }
    if(s.role !== 'creator'){ alert('يجب أن تكون مسجلاً كمبدع لتقديم الطلبات.'); return; }
    // simple message capture
    const msg = prompt('أضف رسالة قصيرة للمؤسسة (اختياري)');
    const list = loadGlobal(); const opp = list.find(o=>o.id===oppId && String(o.orgId)===String(orgId)); const app = { id: newId(), oppId: oppId, oppTitle: opp? opp.title : '', orgId: orgId, orgName: opp? opp.orgName : '', applicantId: s.id, applicantName: s.name, message: msg||'', created: Date.now(), status: 'pending' };
    saveAppToOrg(orgId, app);
    // also save under user's apps for their view
    try{ const key = 'hibr_user_apps_' + s.id; const arr = JSON.parse(localStorage.getItem(key)||'[]'); arr.unshift(app); localStorage.setItem(key, JSON.stringify(arr)); }catch(e){}
    btn.disabled = true; btn.textContent = 'تم التقديم'; alert('تم إرسال طلبك إلى المؤسسة');
  });

  // Support static HTML buttons (legacy) that don't have data-act/data-opp attributes
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.opps-list .opp-card .btn'); if(!btn) return; if(btn.dataset.act) return; // handled above
    const card = btn.closest('.opp-card'); if(!card) return;
    const s = sess(); if(!s){ if(confirm('سجل الدخول كمبدع للتقديم الآن. الانتقال إلى صفحة الدخول؟')) window.location.href = 'login.html'; return; }
    if(s.role !== 'creator'){ alert('يجب أن تكون مسجلاً كمبدع لتقديم الطلبات.'); return; }
    const cards = Array.from(document.querySelectorAll('.opps-list .opp-card'));
    const index = cards.indexOf(card);
    const title = card.querySelector('h3')?.textContent.trim()||('فرصة '+(index+1));
    const company = card.querySelector('.company')?.textContent.trim()||'';
    const meta = Array.from(card.querySelectorAll('.opp-meta span')).map(s=>s.textContent.replace(/\n/g,'').trim());
    const location = meta[0]? meta[0].replace('📍','').trim() : 'عن بُعد';
    const deadline = meta[1]? meta[1].replace('⏱ آخر موعد:','').trim() : '';
    const oppId = 'seed_' + (index+1);
    const orgId = 'seed_org';
    if(hasApplied(orgId, oppId, s.id)){ btn.disabled = true; btn.textContent = 'تم التقديم'; alert('لقد قمت بالتقديم مسبقاً'); return; }
    const msg = prompt('أضف رسالة قصيرة للمؤسسة (اختياري)');
    const app = { id: newId(), oppId: oppId, oppTitle: title, orgId: orgId, orgName: company, applicantId: s.id, applicantName: s.name, message: msg||'', created: Date.now(), status: 'pending' };
    saveAppToOrg(orgId, app);
    try{ const key = 'hibr_user_apps_' + s.id; const arr = JSON.parse(localStorage.getItem(key)||'[]'); arr.unshift(app); localStorage.setItem(key, JSON.stringify(arr)); }catch(e){}
    btn.disabled = true; btn.textContent = 'تم التقديم'; alert('تم إرسال طلبك إلى المؤسسة');
  });

  document.addEventListener('DOMContentLoaded', ()=>{ render(); window.addEventListener('hibr:opps:changed', ()=>{ render(); }); window.addEventListener('storage', ()=>{ render(); }); });
})();
