(function(){
  'use strict';

  // Users
  function renderUsers(){
    const el=document.getElementById('usersTable'); if(!el) return;
    const users=DashAuth.getUsers();
    if(users.length===0){ el.innerHTML=''; }
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div></div><button class="btn" id="addManagerBtn">إضافة مستخدم</button></div>`;
    el.innerHTML += `<table class="table"><thead><tr><th>الاسم</th><th>البريد</th><th>الدور</th><th>إجراءات</th></tr></thead><tbody>` + users.map(u=>`<tr><td>${u.name||''}</td><td>${u.email}</td><td><select data-id="${u.id}" class="role-select"><option value="owner">مالك</option><option value="manager">مدير</option><option value="creator">مبدع</option><option value="coach">مدرب</option><option value="mentor">مرشد</option><option value="org">مؤسسة</option></select></td><td><button class="btn-ghost" data-action="del" data-id="${u.id}">حذف</button></td></tr>`).join('') + `</tbody></table>`;
    const addBtn = document.getElementById('addManagerBtn'); if(addBtn){ addBtn.addEventListener('click', ()=>{
      const html = `<div style="background:#fff;padding:18px;border-radius:6px"><h3>إضافة مستخدم جديد</h3><form id="addManagerForm"><div style="margin-top:8px"><label>الاسم</label><input name="name" required style="width:100%"/></div><div style="margin-top:8px"><label>البريد</label><input name="email" type="email" required style="width:100%"/></div><div style="margin-top:8px"><label>كلمة المرور</label><input name="password" type="password" required style="width:100%"/></div><div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn-ghost" id="cancelAdd">إلغاء</button><button type="submit" class="btn">حفظ</button></div></form></div>`;
      const overlay = DashAuth.openModal(html);
      overlay.querySelector('#cancelAdd').addEventListener('click', ()=>overlay.remove());
      overlay.querySelector('#addManagerForm').addEventListener('submit',(e)=>{
        e.preventDefault();
        const form = e.target;
        const name = (form.name.value||'').trim();
        const email = (form.email.value||'').trim();
        const password = (form.password.value||'').trim();
        if(!email||!password){ DashAuth.showToast('الرجاء تعبئة الحقول المطلوبة'); return; }
        const next = users.slice();
        const maxId = next.reduce((m,it)=>Math.max(m,Number(it.id)||0),0);
        const newUser = { id: maxId+1, name, email, password, role: 'manager' };
        next.push(newUser);
        DashAuth.saveUsers(next);
        overlay.remove();
        renderUsers();
        DashAuth.showToast('تم إضافة المستخدم');
        window.dispatchEvent(new Event('hibr:data-changed'));
      });
    }); }
    el.querySelectorAll('.role-select').forEach(s=>{ const id=s.dataset.id; const u=users.find(x=>x.id==id); if(u) s.value=u.role; s.addEventListener('change',()=>{ const u2=users.find(x=>x.id==id); if(u2){ u2.role=s.value; DashAuth.saveUsers(users); DashAuth.showToast('تم تحديث الصلاحية'); window.dispatchEvent(new Event('hibr:data-changed')); } }); });
    el.querySelectorAll('[data-action="del"]').forEach(b=>b.addEventListener('click',()=>{ if(confirm('حذف المستخدم؟')){ const id=b.dataset.id; const next=users.filter(x=>x.id!=id); DashAuth.saveUsers(next); renderUsers(); DashAuth.showToast('تم الحذف'); window.dispatchEvent(new Event('hibr:data-changed')); }}));
  }

  // Courses
  function getCourses(){ return JSON.parse(localStorage.getItem('hibr_courses')||'[]'); }
  function saveCourses(list){ localStorage.setItem('hibr_courses',JSON.stringify(list)); }
  function renderCourses(){ const el=document.getElementById('coursesList'); if(!el) return; const items=getCourses(); if(items.length===0){ el.innerHTML='<div class="muted">لا توجد دورات</div>'; } else {
      el.innerHTML = `<table class="table"><thead><tr><th>عنوان</th><th>المدرب</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>`+ items.map(it=>`<tr><td>${it.title}</td><td>${it.instructor||''}</td><td>${it.status||'نشطة'}</td><td><button class="btn-ghost" data-action="edit-course" data-id="${it.id}">تعديل</button> <button class="btn-ghost" data-action="del-course" data-id="${it.id}">حذف</button></td></tr>`).join('')+`</tbody></table>`;
    }
    // wire actions
    el.querySelectorAll('[data-action="edit-course"]').forEach(b=>b.addEventListener('click',()=>{
      const id=b.dataset.id; const items=getCourses(); const it=items.find(x=>x.id==id); if(!it) return;
      const html=`<div style="background:#fff;padding:18px;border-radius:6px"><h3>تعديل دورة</h3><form id="editCourseForm"><div style="margin-top:8px"><label>العنوان</label><input name="title" value="${it.title}" required style="width:100%"/></div><div style="margin-top:8px"><label>المدرب</label><input name="instructor" value="${it.instructor||''}" style="width:100%"/></div><div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn-ghost" id="cancelEdit">إلغاء</button><button type="submit" class="btn">حفظ</button></div></form></div>`;
      const overlay=DashAuth.openModal(html);
      overlay.querySelector('#cancelEdit').addEventListener('click',()=>overlay.remove());
      overlay.querySelector('#editCourseForm').addEventListener('submit',(e)=>{ e.preventDefault(); const f=e.target; it.title=f.title.value; it.instructor=f.instructor.value; saveCourses(items); overlay.remove(); renderCourses(); DashAuth.showToast('تم حفظ الدورة'); window.dispatchEvent(new Event('hibr:data-changed')); });
    }));
    el.querySelectorAll('[data-action="del-course"]').forEach(b=>b.addEventListener('click',()=>{ if(confirm('حذف الدورة؟')){ const id=b.dataset.id; const next=getCourses().filter(x=>x.id!=id); saveCourses(next); renderCourses(); DashAuth.showToast('تم الحذف'); window.dispatchEvent(new Event('hibr:data-changed')); }}));
  }

  // Market
  function getMarket(){ return JSON.parse(localStorage.getItem('hibr_market')||'[]'); }
  function saveMarket(list){ localStorage.setItem('hibr_market',JSON.stringify(list)); }
  function renderMarket(){ const el=document.getElementById('marketList'); if(!el) return; const items=getMarket(); if(items.length===0){ el.innerHTML='<div class="muted">لا توجد عناصر</div>'; } else {
      el.innerHTML = `<table class="table"><thead><tr><th>اسم</th><th>السعر</th><th>إجراءات</th></tr></thead><tbody>`+ items.map(it=>`<tr><td>${it.name}</td><td>${it.price||''}</td><td><button class="btn-ghost" data-action="edit-market" data-id="${it.id}">تعديل</button> <button class="btn-ghost" data-action="del-market" data-id="${it.id}">حذف</button></td></tr>`).join('')+`</tbody></table>`;
    }
    el.querySelectorAll('[data-action="edit-market"]').forEach(b=>b.addEventListener('click',()=>{
      const id=b.dataset.id; const items=getMarket(); const it=items.find(x=>x.id==id); if(!it) return;
      const html=`<div style="background:#fff;padding:18px;border-radius:6px"><h3>تعديل عنصر</h3><form id="editMarketForm"><div style="margin-top:8px"><label>الاسم</label><input name="name" value="${it.name}" required style="width:100%"/></div><div style="margin-top:8px"><label>السعر</label><input name="price" value="${it.price||''}" style="width:100%"/></div><div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn-ghost" id="cancelEdit">إلغاء</button><button type="submit" class="btn">حفظ</button></div></form></div>`;
      const overlay=DashAuth.openModal(html);
      overlay.querySelector('#cancelEdit').addEventListener('click',()=>overlay.remove());
      overlay.querySelector('#editMarketForm').addEventListener('submit',(e)=>{ e.preventDefault(); const f=e.target; it.name=f.name.value; it.price=f.price.value; saveMarket(items); overlay.remove(); renderMarket(); DashAuth.showToast('تم حفظ العنصر'); window.dispatchEvent(new Event('hibr:data-changed')); });
    }));
    el.querySelectorAll('[data-action="del-market"]').forEach(b=>b.addEventListener('click',()=>{ if(confirm('حذف العنصر؟')){ const id=b.dataset.id; const next=getMarket().filter(x=>x.id!=id); saveMarket(next); renderMarket(); DashAuth.showToast('تم الحذف'); window.dispatchEvent(new Event('hibr:data-changed')); }}));
  }

  // Opportunities
  function getOpps(){ return JSON.parse(localStorage.getItem('hibr_opportunities')||'[]'); }
  function saveOpps(list){ localStorage.setItem('hibr_opportunities',JSON.stringify(list)); }
  function renderOpps(){ const el=document.getElementById('oppsList'); if(!el) return; const items=getOpps(); if(items.length===0){ el.innerHTML='<div class="muted">لا توجد فرص</div>'; } else {
      el.innerHTML = `<table class="table"><thead><tr><th>العنوان</th><th>النوع</th><th>إجراءات</th></tr></thead><tbody>`+ items.map(it=>`<tr><td>${it.title}</td><td>${it.type||''}</td><td><button class="btn-ghost" data-action="edit-opp" data-id="${it.id}">تعديل</button> <button class="btn-ghost" data-action="del-opp" data-id="${it.id}">حذف</button></td></tr>`).join('')+`</tbody></table>`;
    }
    el.querySelectorAll('[data-action="edit-opp"]').forEach(b=>b.addEventListener('click',()=>{
      const id=b.dataset.id; const items=getOpps(); const it=items.find(x=>x.id==id); if(!it) return;
      const html=`<div style="background:#fff;padding:18px;border-radius:6px"><h3>تعديل فرصة</h3><form id="editOppForm"><div style="margin-top:8px"><label>العنوان</label><input name="title" value="${it.title}" required style="width:100%"/></div><div style="margin-top:8px"><label>النوع</label><input name="type" value="${it.type||''}" style="width:100%"/></div><div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn-ghost" id="cancelEdit">إلغاء</button><button type="submit" class="btn">حفظ</button></div></form></div>`;
      const overlay=DashAuth.openModal(html);
      overlay.querySelector('#cancelEdit').addEventListener('click',()=>overlay.remove());
      overlay.querySelector('#editOppForm').addEventListener('submit',(e)=>{ e.preventDefault(); const f=e.target; it.title=f.title.value; it.type=f.type.value; saveOpps(items); overlay.remove(); renderOpps(); DashAuth.showToast('تم حفظ الفرصة'); window.dispatchEvent(new Event('hibr:data-changed')); });
    }));
    el.querySelectorAll('[data-action="del-opp"]').forEach(b=>b.addEventListener('click',()=>{ if(confirm('حذف الفرصة؟')){ const id=b.dataset.id; const next=getOpps().filter(x=>x.id!=id); saveOpps(next); renderOpps(); DashAuth.showToast('تم الحذف'); window.dispatchEvent(new Event('hibr:data-changed')); }}));
  }

  // helpers for adding items
  function wireAddButtons(){
    const addCourse = document.getElementById('addCourseBtn'); if(addCourse) addCourse.addEventListener('click',()=>{
      const html=`<div style="background:#fff;padding:18px;border-radius:6px"><h3>إضافة دورة</h3><form id="addCourseForm"><div style="margin-top:8px"><label>العنوان</label><input name="title" required style="width:100%"/></div><div style="margin-top:8px"><label>المدرب</label><input name="instructor" style="width:100%"/></div><div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn-ghost" id="cancelAdd">إلغاء</button><button type="submit" class="btn">حفظ</button></div></form></div>`;
      const overlay=DashAuth.openModal(html);
      overlay.querySelector('#cancelAdd').addEventListener('click',()=>overlay.remove());
      overlay.querySelector('#addCourseForm').addEventListener('submit',(e)=>{ e.preventDefault(); const f=e.target; const list=getCourses(); const max=list.reduce((m,it)=>Math.max(m,Number(it.id)||0),0); const newIt={id:max+1,title:f.title.value,instructor:f.instructor.value,status:'نشطة'}; list.push(newIt); saveCourses(list); overlay.remove(); renderCourses(); DashAuth.showToast('تم إضافة الدورة'); window.dispatchEvent(new Event('hibr:data-changed')); });
    });
    const addMarket = document.getElementById('addMarketBtn'); if(addMarket) addMarket.addEventListener('click',()=>{
      const html=`<div style="background:#fff;padding:18px;border-radius:6px"><h3>إضافة عنصر</h3><form id="addMarketForm"><div style="margin-top:8px"><label>الاسم</label><input name="name" required style="width:100%"/></div><div style="margin-top:8px"><label>السعر</label><input name="price" style="width:100%"/></div><div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn-ghost" id="cancelAdd">إلغاء</button><button type="submit" class="btn">حفظ</button></div></form></div>`;
      const overlay=DashAuth.openModal(html); overlay.querySelector('#cancelAdd').addEventListener('click',()=>overlay.remove()); overlay.querySelector('#addMarketForm').addEventListener('submit',(e)=>{ e.preventDefault(); const f=e.target; const list=getMarket(); const max=list.reduce((m,it)=>Math.max(m,Number(it.id)||0),0); const newIt={id:max+1,name:f.name.value,price:f.price.value}; list.push(newIt); saveMarket(list); overlay.remove(); renderMarket(); DashAuth.showToast('تم إضافة العنصر'); window.dispatchEvent(new Event('hibr:data-changed')); });
    });
    const addOpp = document.getElementById('addOppBtn'); if(addOpp) addOpp.addEventListener('click',()=>{
      const html=`<div style="background:#fff;padding:18px;border-radius:6px"><h3>إضافة فرصة</h3><form id="addOppForm"><div style="margin-top:8px"><label>العنوان</label><input name="title" required style="width:100%"/></div><div style="margin-top:8px"><label>النوع</label><input name="type" style="width:100%"/></div><div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn-ghost" id="cancelAdd">إلغاء</button><button type="submit" class="btn">حفظ</button></div></form></div>`;
      const overlay=DashAuth.openModal(html); overlay.querySelector('#cancelAdd').addEventListener('click',()=>overlay.remove()); overlay.querySelector('#addOppForm').addEventListener('submit',(e)=>{ e.preventDefault(); const f=e.target; const list=getOpps(); const max=list.reduce((m,it)=>Math.max(m,Number(it.id)||0),0); const newIt={id:max+1,title:f.title.value,type:f.type.value}; list.push(newIt); saveOpps(list); overlay.remove(); renderOpps(); DashAuth.showToast('تم إضافة الفرصة'); window.dispatchEvent(new Event('hibr:data-changed')); });
    });
  }

  // Section switching
  function showSection(id){
    const main = document.querySelector('.dash-main'); if(!main) return;
    const overview = main.querySelector('.card'); // first card
    if(id==='users'){
      document.getElementById('usersSection').style.display='block';
      document.getElementById('coursesSection').style.display='none';
      document.getElementById('marketSection').style.display='none';
      document.getElementById('oppsSection').style.display='none';
    } else if(id==='courses'){
      document.getElementById('usersSection').style.display='none';
      document.getElementById('coursesSection').style.display='block';
      document.getElementById('marketSection').style.display='none';
      document.getElementById('oppsSection').style.display='none';
    } else if(id==='market'){
      document.getElementById('usersSection').style.display='none';
      document.getElementById('coursesSection').style.display='none';
      document.getElementById('marketSection').style.display='block';
      document.getElementById('oppsSection').style.display='none';
    } else if(id==='opps'){
      document.getElementById('usersSection').style.display='none';
      document.getElementById('coursesSection').style.display='none';
      document.getElementById('marketSection').style.display='none';
      document.getElementById('oppsSection').style.display='block';
    }
    document.querySelectorAll('.dash-sidebar .nav a').forEach(a=>{
      const href=a.getAttribute('href')||''; let target=''; if(href.startsWith('#')) target=href.slice(1); else if(href.endsWith('manager.html')) target='users'; a.classList.toggle('active', target===id);
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    if(!DashAuth.ensureRole(['manager','owner'])) return;
    renderUsers();
    renderCourses();
    renderMarket();
    renderOpps();
    wireAddButtons();
    // nav wiring
    document.querySelectorAll('.dash-sidebar .nav a').forEach(a=>{ a.addEventListener('click',(e)=>{ e.preventDefault(); const href=a.getAttribute('href')||''; let target=''; if(href.startsWith('#')) target=href.slice(1); else if(href.endsWith('manager.html')) target='users'; if(target){ showSection(target); if(href.startsWith('#')) history.pushState(null,'',href); else history.pushState(null,'',href); } }); });
    // initial
    const initial = (location.hash && location.hash.length>1) ? location.hash.slice(1) : 'users'; showSection(initial);
  });

})();
