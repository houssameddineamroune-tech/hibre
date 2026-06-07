(function(){
  'use strict';
  const COURSES_KEY = 'hibr_courses';

  function getSession(){ try{ return DashAuth.getSession(); }catch(e){ try{ return JSON.parse(sessionStorage.getItem('hibr_session')||'null'); }catch(err){return null} } }
  function loadAll(){ try{ return JSON.parse(localStorage.getItem(COURSES_KEY)||'[]'); }catch(e){ return []; } }
  function saveAll(list){ try{ localStorage.setItem(COURSES_KEY, JSON.stringify(list||[])); }catch(e){} }
  function genId(prefix='c'){ return prefix+'_'+Math.random().toString(36).slice(2,9); }
  function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]; }); }

  function removeCourseFromEnrollments(courseId){
    try{
      const users = (typeof DashAuth.getUsers === 'function')? DashAuth.getUsers() : JSON.parse(localStorage.getItem('hibr_users')||'[]');
      (users||[]).forEach(u=>{
        try{
          const key = `hibr_enrollments_user_${u.id}`;
          const enroll = JSON.parse(localStorage.getItem(key)||'{}');
          if(enroll && enroll[courseId]){ delete enroll[courseId]; localStorage.setItem(key, JSON.stringify(enroll)); }
        }catch(e){}
      });
    }catch(e){}
  }

  function renderCourses(){
    const el = document.getElementById('coursesList'); if(!el) return;
    const s = getSession(); if(!s) return; const items = loadAll().filter(c=>c.instructorId===(s.id));
    if(items.length===0){ el.innerHTML = '<div class="muted">لا توجد دورات منشورة</div>'; return; }
    el.innerHTML = items.map(c=>{
      const modulesCount = (c.modules||[]).length;
      const testsCount = (c.tests||[]).length;
      const level = c.level ? escapeHtml(c.level) : 'متوسط';
      const rating = (typeof c.rating !== 'undefined') ? Number(c.rating).toFixed(1) : '';
      const meta = `${modulesCount} دروس • ${testsCount} اختبارات • المستوى: ${level}` + (rating? ` • تقييم: ${rating}` : '');
      return `<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between"><div><strong>${escapeHtml(c.title)}</strong><div class="muted">${meta}</div></div><div style="display:flex;gap:6px"><button class="btn-ghost" data-id="${c.id}" data-act="edit">تعديل</button><button class="btn-ghost" data-id="${c.id}" data-act="del">حذف</button></div></div><p style="margin-top:8px">${escapeHtml(c.description||'')}</p></div>`;
    }).join('');
  }

  function renderLessonsList(){
    const el = document.getElementById('lessonsList'); if(!el) return; const s = getSession(); if(!s) return;
    const flat=[]; loadAll().filter(c=>c.instructorId===s.id).forEach(c=>{ (c.modules||[]).forEach((m,i)=> flat.push({courseId:c.id, courseTitle:c.title, module:m, idx:i})); });
    if(flat.length===0){ el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div></div><div><button id="addLessonBtn" class="btn">إضافة درس</button></div></div><div class="mt-10"><div class="muted">لا توجد دروس</div></div>`; const addBtn = el.querySelector('#addLessonBtn'); if(addBtn) addBtn.addEventListener('click', showAddLessonModal); return; }

    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div></div><div><button id="addLessonBtn" class="btn">إضافة درس</button></div></div><div style="margin-top:12px">${flat.map(it=>`<div class="card" style="margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;padding:8px"><div><strong>${escapeHtml(it.module.title)}</strong><div class="muted">${escapeHtml(it.courseTitle)} • ${it.module.type||'عام'}</div></div><div style="display:flex;gap:6px"><button class="btn-ghost edit-lesson" data-course="${it.courseId}" data-i="${it.idx}">تعديل</button><button class="btn-ghost del-lesson" data-course="${it.courseId}" data-i="${it.idx}">حذف</button></div></div>`).join('')}</div>`;

    // wire direct listeners
    const addBtn = el.querySelector('#addLessonBtn'); if(addBtn){ addBtn.addEventListener('click', ()=>{ showAddLessonModal(); }); }
    el.querySelectorAll('.edit-lesson').forEach(b=>{ b.addEventListener('click',(ev)=>{ const courseId = b.dataset.course; const idx = Number(b.dataset.i); const all = loadAll(); const course = all.find(x=>x.id===courseId); if(!course){ DashAuth.showToast('الدورة غير موجودة'); return; } if(!course.modules || !course.modules[idx]){ DashAuth.showToast('الدرس غير موجود'); return; } showEditLessonModal(courseId, idx); }); });
    el.querySelectorAll('.del-lesson').forEach(b=>{ b.addEventListener('click',(ev)=>{ const courseId = b.dataset.course; const idx = Number(b.dataset.i); if(!confirm('حذف هذا الدرس؟')) return; const all = loadAll(); const course = all.find(x=>x.id===courseId); if(!course) return; course.modules = (course.modules||[]).filter((m,i)=>i!==idx); saveAll(all); renderLessonsList(); renderCourses(); DashAuth.showToast('تم الحذف'); window.dispatchEvent(new Event('hibr:courses:changed')); }); });
  }

  function renderTestsList(){ const el = document.getElementById('testsList'); if(!el) return; const s = getSession(); if(!s) return; const flat=[]; loadAll().filter(c=>c.instructorId===s.id).forEach(c=>{ (c.tests||[]).forEach((t,i)=> flat.push({courseId:c.id, courseTitle:c.title, test:t, idx:i})); });
    if(flat.length===0){ el.innerHTML = '<div class="muted">لا توجد اختبارات</div>'; return; }
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div></div><div><button id="addTestBtn" class="btn">إضافة اختبار</button></div></div><div style="margin-top:12px">${flat.map(it=>`<div class="card" style="margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;padding:8px"><div><strong>${escapeHtml(it.test.title)}</strong><div class="muted">${escapeHtml(it.courseTitle)}</div></div><div style="display:flex;gap:6px"><button class="btn-ghost" data-course="${it.courseId}" data-i="${it.idx}" data-act="edit-test">تعديل</button><button class="btn-ghost" data-course="${it.courseId}" data-i="${it.idx}" data-act="del-test">حذف</button></div></div>`).join('')}</div>`;
    el.removeEventListener('click', el._handler||function(){});
    const handler = function(e){ const btn = e.target.closest('[data-act]') || e.target.closest('#addTestBtn'); if(!btn) return; if(btn.id==='addTestBtn'){ showAddTestModal(); return; } const act = btn.dataset.act; const courseId = btn.dataset.course; const idx = Number(btn.dataset.i); if(act==='del-test'){ if(confirm('حذف الاختبار؟')){ const all = loadAll(); const course = all.find(x=>x.id===courseId); if(!course) return; course.tests = (course.tests||[]).filter((t,i)=>i!==idx); saveAll(all); renderTestsList(); DashAuth.showToast('تم الحذف'); } } if(act==='edit-test'){ showEditTestModal(courseId, idx); } };
    el._handler = handler; el.addEventListener('click', handler);
  }

  function showAddCourseModal(){ const html = `<div class="card" style="padding:16px"><h3>إنشاء دورة</h3><label>العنوان</label><input id="c_title" style="width:100%;padding:8px;margin-top:6px"/><label>الوصف</label><textarea id="c_desc" style="width:100%;padding:8px;margin-top:6px"></textarea><div style="margin-top:8px;display:flex;gap:8px;align-items:center"><div style="flex:1"><label>المستوى</label><select id="c_level" style="width:100%;padding:8px;margin-top:6px"><option value="مبتدئ">مبتدئ</option><option value="متوسط" selected>متوسط</option><option value="متقدم">متقدم</option></select></div><div style="width:120px"><label>التقييم (اختياري)</label><input id="c_rating" type="number" min="0" max="5" step="0.1" placeholder="4.5" style="width:100%;padding:8px;margin-top:6px"/></div></div><div style="margin-top:10px;text-align:left"><button id="saveCourse" class="btn">حفظ</button></div></div>`; const modal = DashAuth.openModal(html); modal.querySelector('#saveCourse').addEventListener('click', ()=>{ const title = modal.querySelector('#c_title').value.trim(); if(!title){ DashAuth.showToast('أدخل عنوان الدورة'); return; } const s = getSession(); const all = loadAll(); const item = { id: genId('c'), title, description: modal.querySelector('#c_desc').value.trim(), modules:[], tests:[], instructorId: s.id, instructorName: s.name, level: modal.querySelector('#c_level').value || 'متوسط' }; const r = modal.querySelector('#c_rating').value.trim(); if(r) item.rating = Number(r); all.unshift(item); saveAll(all); DashAuth.closeModal(); renderCourses(); DashAuth.showToast('تم إنشاء الدورة'); }); }

  function showEditCourseModal(courseId){ const all = loadAll(); const course = all.find(c=>c.id===courseId); if(!course) return; const html = `<div class="card" style="padding:16px"><h3>تعديل دورة</h3><label>العنوان</label><input id="c_title" value="${escapeHtml(course.title)}" style="width:100%;padding:8px;margin-top:6px"/><label>الوصف</label><textarea id="c_desc" style="width:100%;padding:8px;margin-top:6px">${escapeHtml(course.description||'')}</textarea><div style="margin-top:8px;display:flex;gap:8px;align-items:center"><div style="flex:1"><label>المستوى</label><select id="c_level" style="width:100%;padding:8px;margin-top:6px"><option value="مبتدئ">مبتدئ</option><option value="متوسط">متوسط</option><option value="متقدم">متقدم</option></select></div><div style="width:120px"><label>التقييم (اختياري)</label><input id="c_rating" type="number" min="0" max="5" step="0.1" placeholder="4.5" style="width:100%;padding:8px;margin-top:6px" value="${escapeHtml(course.rating||'')}"/></div></div><div style="margin-top:10px;text-align:left"><button id="saveCourse" class="btn">حفظ</button></div></div>`; const modal = DashAuth.openModal(html);
    // pre-select level
    try{ const sel = modal.querySelector('#c_level'); if(sel && course.level){ sel.value = course.level; } }catch(e){}
    modal.querySelector('#saveCourse').addEventListener('click', ()=>{ course.title = modal.querySelector('#c_title').value.trim(); course.description = modal.querySelector('#c_desc').value.trim(); course.level = modal.querySelector('#c_level').value || course.level || 'متوسط'; const r = modal.querySelector('#c_rating').value.trim(); if(r) course.rating = Number(r); else delete course.rating; saveAll(all); DashAuth.closeModal(); renderCourses(); DashAuth.showToast('تم الحفظ'); }); }

  function showAddLessonModal(){
    const s = getSession(); const my = loadAll().filter(c=>c.instructorId===s.id); if(my.length===0){ DashAuth.showToast('لا توجد دورات. أنشئ دورة أولاً'); return; }
    const opts = my.map(c=>`<option value="${c.id}">${escapeHtml(c.title)}</option>`).join('');
    const html = `
      <div class="card" style="padding:12px">
        <h3>إضافة درس</h3>
        <label>العنوان</label>
        <input id="mod_title" style="width:100%;padding:8px;margin-top:6px"/>
        <label>اختر الدورة</label>
        <select id="mod_course" style="width:100%;padding:8px;margin-top:6px">${opts}</select>
        <label style="margin-top:8px">المحتوى (فيديو / PDF)</label>
        <div style="display:flex;gap:8px;align-items:center"><button id="mod_pick" class="btn-ghost">اختر ملف</button><span id="mod_pick_name" class="muted">لم يتم الاختيار</span></div>
        <div id="mod_preview" style="margin-top:8px"></div>
        <div style="margin-top:10px;text-align:left"><button id="saveLesson" class="btn">إضافة</button></div>
      </div>`;
    const modal = DashAuth.openModal(html);
    let pickedFileId = null, pickedFileType = null, pickedFileName = null;
    const pickBtn = modal.querySelector('#mod_pick'), pickName = modal.querySelector('#mod_pick_name'), previewEl = modal.querySelector('#mod_preview');
    pickBtn.addEventListener('click', ()=>{ const inp=document.createElement('input'); inp.type='file'; inp.accept='*/*'; inp.addEventListener('change', async ()=>{ const f=inp.files[0]; if(!f) return; try{ const id = await DashAuth.saveFile(f); pickedFileId = id; pickedFileType = f.type||''; pickedFileName = f.name||''; pickName.textContent = pickedFileName; DashAuth.showToast('تم حفظ الملف'); try{ const url = await DashAuth.getFileURL(pickedFileId); if(pickedFileType.startsWith('video')) previewEl.innerHTML = `<video src="${url}" controls style="max-width:100%;height:200px"></video>`; else if(pickedFileType==='application/pdf') previewEl.innerHTML = `<iframe src="${url}" style="width:100%;height:300px;border:0"></iframe>`; else previewEl.innerHTML = `<a href="${url}" target="_blank">عرض الملف</a>`; }catch(e){} }catch(err){ DashAuth.showToast('فشل حفظ الملف'); } }); inp.click(); });
    modal.querySelector('#saveLesson').addEventListener('click', ()=>{ const title = modal.querySelector('#mod_title').value.trim(); if(!title){ DashAuth.showToast('أدخل عنوان الدرس'); return; } const courseId = modal.querySelector('#mod_course').value; const all = loadAll(); const course = all.find(c=>c.id===courseId); if(!course) return; course.modules = course.modules||[]; const mod = { id: genId('m'), title, type: (pickedFileType && pickedFileType.startsWith('video'))? 'video' : (pickedFileType && pickedFileType==='application/pdf')? 'pdf' : 'other', description:'', resources: [] }; if(pickedFileId) mod.resources.push({ id: pickedFileId, type: pickedFileType, name: pickedFileName }); course.modules.push(mod); saveAll(all); DashAuth.closeModal(); renderLessonsList(); renderCourses(); DashAuth.showToast('تم الإضافة'); window.dispatchEvent(new Event('hibr:courses:changed')); });
  }

  function showEditLessonModal(courseId, idx){
    const all = loadAll(); const course = all.find(c=>c.id===courseId); if(!course || !course.modules || !course.modules[idx]) return; const mod = course.modules[idx]; const existing = (mod.resources||[])[0] || null;
    const html = `
      <div class="card" style="padding:12px">
        <h3>تعديل درس</h3>
        <label>العنوان</label>
        <input id="mod_title" value="${escapeHtml(mod.title)}" style="width:100%;padding:8px;margin-top:6px"/>
        <label>الوصف</label>
        <textarea id="mod_desc" style="width:100%;padding:8px;margin-top:6px">${escapeHtml(mod.description||'')}</textarea>
        <label style="margin-top:8px">المحتوى الحالي</label>
        <div id="existingRes" style="margin-top:6px">${existing? escapeHtml(existing.name||'ملف') : '<span class="muted">لا يوجد ملف</span>'}</div>
        <div id="existingPreview" style="margin-top:8px"></div>
        <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
          <button id="mod_pick" class="btn-ghost">استبدال/اختر ملف</button>
          <button id="mod_remove" class="btn-ghost" ${existing? '' : 'disabled'}>حذف الملف</button>
          <span id="mod_pick_name" class="muted">لم يتم الاختيار</span>
        </div>
        <div style="margin-top:10px;text-align:left"><button id="saveLesson" class="btn">حفظ</button></div>
      </div>`;
    const modal = DashAuth.openModal(html);
    const pickBtn = modal.querySelector('#mod_pick'), pickName = modal.querySelector('#mod_pick_name'), removeBtn = modal.querySelector('#mod_remove'), existingResEl = modal.querySelector('#existingRes'), existingPreview = modal.querySelector('#existingPreview');
    let pickedFileId = null, pickedFileType = null, pickedFileName = null, removedExisting = false;
    (async ()=>{ if(existing && existing.id){ try{ const url = await DashAuth.getFileURL(existing.id); if(existing.type && existing.type.startsWith('video')) existingPreview.innerHTML = `<video src="${url}" controls style="max-width:100%;height:200px"></video>`; else if(existing.type==='application/pdf') existingPreview.innerHTML = `<iframe src="${url}" style="width:100%;height:300px;border:0"></iframe>`; else existingPreview.innerHTML = `<a href="${url}" target="_blank">${escapeHtml(existing.name||'عرض الملف')}</a>`; }catch(e){} }})();
    pickBtn.addEventListener('click', ()=>{ const inp=document.createElement('input'); inp.type='file'; inp.accept='*/*'; inp.addEventListener('change', async ()=>{ const f=inp.files[0]; if(!f) return; try{ const id = await DashAuth.saveFile(f); pickedFileId = id; pickedFileType = f.type||''; pickedFileName = f.name||''; pickName.textContent = pickedFileName; removedExisting = false; removeBtn.disabled = false; try{ const url = await DashAuth.getFileURL(pickedFileId); if(pickedFileType.startsWith('video')) existingPreview.innerHTML = `<video src="${url}" controls style="max-width:100%;height:200px"></video>`; else if(pickedFileType==='application/pdf') existingPreview.innerHTML = `<iframe src="${url}" style="width:100%;height:300px;border:0"></iframe>`; else existingPreview.innerHTML = `<a href="${url}" target="_blank">${escapeHtml(pickedFileName||'عرض الملف')}</a>`; }catch(e){} DashAuth.showToast('تم حفظ الملف'); }catch(err){ DashAuth.showToast('فشل حفظ الملف'); } }); inp.click(); });
    removeBtn.addEventListener('click', ()=>{ if(!confirm('حذف الملف الحالي؟')) return; removedExisting = true; pickedFileId = null; pickedFileType = null; pickedFileName = null; existingPreview.innerHTML = ''; existingResEl.innerHTML = '<span class="muted">لا يوجد ملف</span>'; pickName.textContent = 'لم يتم الاختيار'; removeBtn.disabled = true; DashAuth.showToast('تم حذف الملف محلياً'); });
    modal.querySelector('#saveLesson').addEventListener('click', ()=>{ mod.title = modal.querySelector('#mod_title').value.trim(); mod.description = modal.querySelector('#mod_desc').value.trim(); if(removedExisting){ mod.resources = []; mod.type = 'other'; } if(pickedFileId){ mod.resources = mod.resources||[]; mod.resources[0] = { id: pickedFileId, type: pickedFileType, name: pickedFileName }; mod.type = (pickedFileType && pickedFileType.startsWith('video'))? 'video' : (pickedFileType && pickedFileType==='application/pdf')? 'pdf' : 'other'; } saveAll(all); DashAuth.closeModal(); renderLessonsList(); renderCourses(); DashAuth.showToast('تم الحفظ'); window.dispatchEvent(new Event('hibr:courses:changed')); });
  }

  function showAddTestModal(){ const s = getSession(); const my = loadAll().filter(c=>c.instructorId===s.id); if(my.length===0){ DashAuth.showToast('لا توجد دورات. أنشئ دورة أولاً'); return; } const opts = my.map(c=>`<option value="${c.id}">${escapeHtml(c.title)}</option>`).join(''); const html = `<div class="card" style="padding:12px"><h3>إضافة اختبار</h3><label>العنوان</label><input id="t_title" style="width:100%;padding:8px;margin-top:6px"/><label>اختر الدورة</label><select id="t_course" style="width:100%;padding:8px;margin-top:6px">${opts}</select><div style="margin-top:10px;text-align:left"><button id="saveTest" class="btn">إضافة</button></div></div>`; const modal = DashAuth.openModal(html); modal.querySelector('#saveTest').addEventListener('click', ()=>{ const title = modal.querySelector('#t_title').value.trim(); if(!title){ DashAuth.showToast('أدخل عنوان الاختبار'); return; } const courseId = modal.querySelector('#t_course').value; const all = loadAll(); const course = all.find(c=>c.id===courseId); course.tests = course.tests||[]; course.tests.push({ id: genId('t'), title, type:'questions', questions:[] }); saveAll(all); DashAuth.closeModal(); renderTestsList(); DashAuth.showToast('تم الإضافة'); }); }

  function showEditTestModal(courseId, idx){ const all = loadAll(); const course = all.find(c=>c.id===courseId); if(!course || !course.tests || !course.tests[idx]) return; const test = course.tests[idx]; const html = `<div class="card" style="padding:12px"><h3>تعديل اختبار</h3><label>العنوان</label><input id="t_title" value="${escapeHtml(test.title)}" style="width:100%;padding:8px;margin-top:6px"/><div style="margin-top:10px;text-align:left"><button id="saveTest" class="btn">حفظ</button></div></div>`; const modal = DashAuth.openModal(html); modal.querySelector('#saveTest').addEventListener('click', ()=>{ test.title = modal.querySelector('#t_title').value.trim(); saveAll(all); DashAuth.closeModal(); renderTestsList(); DashAuth.showToast('تم الحفظ'); }); }

  function renderReports(){ const el = document.getElementById('reportsList'); if(!el) return; const s = getSession(); if(!s) return; const mine = loadAll().filter(c=>c.instructorId===s.id); const totalCourses = mine.length; let totalModules=0, totalTests=0, totalQuestions=0; mine.forEach(c=>{ totalModules += (c.modules||[]).length; totalTests += (c.tests||[]).length; (c.tests||[]).forEach(t=> totalQuestions += (t.questions||[]).length); }); el.innerHTML = `<div class="muted">دوراتي: ${totalCourses}</div><div class="muted">إجمالي الدروس: ${totalModules}</div><div class="muted">إجمالي الاختبارات: ${totalTests}</div><div class="muted">إجمالي الأسئلة: ${totalQuestions}</div>`; }

  function showSection(id){ const mapping = { courses:'coursesSection', lessons:'lessonsSection', tests:'testsSection', reports:'reportsSection' }; Object.values(mapping).forEach(sec=>{ const el=document.getElementById(sec); if(!el) return; el.style.display = (mapping[id]===sec)?'block':'none'; }); document.querySelectorAll('.dash-sidebar .nav a').forEach(a=>{ const href=a.getAttribute('href')||''; let t=''; if(href.startsWith('#')) t=href.slice(1); else if(href.endsWith('coach.html')) t='courses'; a.classList.toggle('active', t===id); }); const ph = document.getElementById('pageHeader'); if(ph){ if(id==='courses') ph.innerHTML='<h3>إدارة الدورات</h3><p class="muted">إنشاء وتعديل الدورات.</p>'; else if(id==='lessons') ph.innerHTML='<h3>إدارة الدروس</h3><p class="muted">إدارة الدروس ضمن الدورات.</p>'; else if(id==='tests') ph.innerHTML='<h3>إدارة الاختبارات</h3><p class="muted">إنشاء وإدارة الاختبارات.</p>'; }
    if(id==='courses') renderCourses(); if(id==='lessons') renderLessonsList(); if(id==='tests') renderTestsList(); if(id==='reports') renderReports(); }

  function bindCoursesList(){ const el = document.getElementById('coursesList'); if(!el) return; el.removeEventListener('click', el._handler||function(){});
    const handler = function(e){ const btn = e.target.closest('[data-act]'); if(!btn) return; const act = btn.dataset.act; const cid = btn.dataset.id; if(act==='lessons'){ showSection('lessons'); location.hash='#lessons'; renderLessonsList(); return; } if(act==='tests'){ showSection('tests'); location.hash='#tests'; renderTestsList(); return; } if(act==='edit'){ showEditCourseModal(cid); return; } if(act==='del'){ if(confirm('حذف هذه الدورة؟')){ const all = loadAll(); removeCourseFromEnrollments(cid); saveAll(all.filter(x=>x.id!==cid)); renderCourses(); DashAuth.showToast('تم الحذف'); } return; } };
    el._handler = handler; el.addEventListener('click', handler);
  }

  function init(){
    // run immediately (scripts loaded at end) and also on DOMContentLoaded to be safe
    const boot = ()=>{
      if(!DashAuth.ensureRole(['coach'])) return;
      const addCourse = document.getElementById('addCourseBtn'); if(addCourse){ addCourse.removeEventListener('click', addCourse._h); addCourse._h = ()=> showAddCourseModal(); addCourse.addEventListener('click', addCourse._h); }
      document.querySelectorAll('.dash-sidebar .nav a').forEach(a=>{ a.removeEventListener('click', a._h||function(){}); const href=a.getAttribute('href')||''; const handler = function(e){ e.preventDefault(); let t=''; if(href.startsWith('#')) t=href.slice(1); else if(href.endsWith('coach.html')) t='courses'; if(t){ showSection(t); history.pushState(null,'', href); } }; a._h = handler; a.addEventListener('click', handler); });
      const initial = (location.hash && location.hash.length>1)? location.hash.slice(1): 'courses'; showSection(initial);
      bindCoursesList(); renderCourses(); renderLessonsList(); renderTestsList(); renderReports();
    };
    document.addEventListener('DOMContentLoaded', boot);
    // if DOM already parsed, run now
    if(document.readyState==='interactive' || document.readyState==='complete') boot();
    window.addEventListener('storage', ()=>{ renderCourses(); renderLessonsList(); renderTestsList(); renderReports(); });
    window.hibrCoachShowSection = showSection;
  }

  init();
})();
