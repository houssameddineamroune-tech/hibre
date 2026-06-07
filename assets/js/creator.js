(function(){
  'use strict';
  function session(){ try{return JSON.parse(sessionStorage.getItem('hibr_session')||'null')}catch(e){return null} }
  function escapeHtml(s){ return String(s||'').replace(/[&<>\"]/g, (c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c)); }
  const keyWorks = (uid)=>`hibr_works_user_${uid}`;
  const keyServices = (uid)=>`hibr_services_user_${uid}`;

  const keyProfile = (uid)=>`hibr_profile_user_${uid}`;
  const keyEnroll = (uid)=>`hibr_enrollments_user_${uid}`;

  // global courses (created by coaches)
  const GLOBAL_COURSES_KEY = 'hibr_courses';
  function loadGlobalCourses(){ try{return JSON.parse(localStorage.getItem(GLOBAL_COURSES_KEY)||'[]'); }catch(e){return []} }

  // Helper: unified card HTML builder used across creator dashboard
  function buildCardHTML(opts){
    const id = escapeHtml(opts.id||'');
    const title = opts.title? escapeHtml(opts.title) : '';
    const subtitle = opts.subtitle? escapeHtml(opts.subtitle) : '';
    const thumb = opts.thumb || '';
    const bodyHTML = opts.bodyHTML || '';
    const actionsHTML = opts.actionsHTML || '';
    const extraCls = opts.extraCls || '';
    const metaHTML = opts.metaHTML || '';
    return `<div class="course-card card ${extraCls}" data-id="${id}"><div class="course-card-body"><div class="course-head"><div class="course-thumb">${thumb}</div><div class="course-meta"><h4>${title}</h4>${subtitle? `<div class="muted">${subtitle}</div>` : ''}${metaHTML}</div></div>${bodyHTML}</div>${actionsHTML? `<div class="course-card-actions">${actionsHTML}</div>` : ''}</div>`;
  }

  // compute a stable "fake" rating (3.5 - 5.0) based on course id when not provided
  function getCourseRating(course){ try{ if(course.rating) return Number(course.rating); const id = String(course.id||''); let sum=0; for(let i=0;i<id.length;i++) sum += id.charCodeAt(i); const r = 3.5 + (sum % 150)/100; return Math.min(5, Math.round(r*10)/10); }catch(e){return 4.2} }
  function renderStars(rating){ const full = Math.floor(rating); const half = (rating - full) >= 0.5; let out=''; for(let i=0;i<5;i++){ if(i<full) out += '★'; else if(i===full && half) out += '☆'; else out += '☆'; } return `<span class="stars" aria-hidden="true">${out}</span> <span class="muted" style="margin-left:6px">${rating}</span>` }

  // enrollments: { courseId: { current:0, completed: [indexes] } }
  function loadEnrollments(){ const s=session(); if(!s) return {}; try{return JSON.parse(localStorage.getItem(keyEnroll(s.id))||'{}');}catch(e){return{}} }
  function saveEnrollments(obj){ const s=session(); if(!s) return; localStorage.setItem(keyEnroll(s.id), JSON.stringify(obj)); }

  function renderAvailableCourses(){ const cont=document.getElementById('coursesAvailable'); if(!cont) return; const all=loadGlobalCourses(); if(all.length===0){ cont.innerHTML='<div class="muted">لا توجد دورات متاحة</div>'; return; }
    const enrollAll = loadEnrollments();
    cont.innerHTML = `<div class="courses-grid">` + all.map(c=>{
      const instr = c.instructorName ? `<div class="muted">بواسطة: ${escapeHtml(c.instructorName)}</div>` : '';
      const level = c.level ? `<div class="muted">المستوى: ${escapeHtml(c.level)}</div>` : `<div class="muted">المستوى: متوسط</div>`;
      const rating = getCourseRating(c); const ratingHtml = `<div style="margin-top:6px" class="course-rating">${renderStars(rating)}</div>`;
      const desc = c.description? escapeHtml(c.description) : '';
      // thumbnail: instructor initial or generic icon
      const thumb = c.instructorName ? escapeHtml((c.instructorName||'')[0]||'م') : '🎓';
      const isEnrolled = !!enrollAll[c.id];
      const actionBtn = isEnrolled ? `<button class="btn-ghost" data-id="${escapeHtml(c.id)}" data-act="unenroll">إلغاء التسجيل <span class="icon">✖</span></button>` : `<button class="btn" data-id="${escapeHtml(c.id)}" data-act="enroll">سجل <span class="icon">＋</span></button>`;
      return `<div class="course-card card" data-course-id="${escapeHtml(c.id)}"><div class="course-card-body"><div class="course-head"><div class="course-thumb">${thumb}</div><div class="course-meta"><h4>${escapeHtml(c.title)}</h4>${instr}${level}${ratingHtml}</div></div><p class="muted">${desc.length>150? desc.slice(0,150)+'...': desc}</p></div><div class="course-card-actions">${actionBtn}</div></div>`;
    }).join('') + `</div>`; }

  function renderMyCourses(){ const cont=document.getElementById('myCoursesList'); if(!cont) return; const enroll=loadEnrollments(); const all=loadGlobalCourses(); const s=session(); if(!s){ cont.innerHTML=''; return;} const myIds = Object.keys(enroll||{}); if(myIds.length===0){ cont.innerHTML='<div class="muted">لم تسجل في أي دورة بعد</div>'; return; }
    const items = myIds.map(id=>{
      const course = all.find(x=>x.id===id); if(!course) return '';
      const prog = enroll[id] || { current:0, completed:[] };
      const done = (prog.completed||[]).length;
      const total = (course.modules||[]).length || 0;
      const pct = total>0? Math.round((done/total)*100) : (prog.current? Math.round(((prog.current+1)/Math.max(total,1))*100):0);
      const level = course.level ? `<div class="muted" style="margin-top:6px">المستوى: ${escapeHtml(course.level)}</div>` : `<div class="muted" style="margin-top:6px">المستوى: متوسط</div>`;
      const ratingVal = getCourseRating(course); const ratingHtml = `<div style="margin-top:6px" class="course-rating">${renderStars(ratingVal)}</div>`;
      const progressHtml = `<div class="course-progress-large"><div class="course-progress-bar" style="width:${pct}%"></div></div><div class="progress-label muted">${pct}% إكمال</div>`;
      return `<div class="my-course-card card" style="padding:12px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${course.title}</strong>${level}${ratingHtml}<div class="muted" style="margin-top:6px">${(course.modules||[]).length} درس</div></div><div><button class="btn" data-id="${course.id}" data-act="open-course">متابعة</button></div></div>${progressHtml}</div>`
    }).join('');
    cont.innerHTML = items;
  }

  // enrollment actions
  function enrollInCourse(courseId){ const enroll = loadEnrollments(); if(!enroll[courseId]) enroll[courseId] = { current:0, completed: [] }; saveEnrollments(enroll); renderMyCourses(); DashAuth.showToast('تم التسجيل في الدورة'); }
  function unenrollCourse(courseId){ const enroll = loadEnrollments(); if(enroll[courseId]){ delete enroll[courseId]; saveEnrollments(enroll); renderMyCourses(); DashAuth.showToast('تم إلغاء التسجيل'); } }

  // open course viewer (MOOC-like)
  async function openCourseViewer(courseId){ const all = loadGlobalCourses(); const course = all.find(c=>c.id===courseId); if(!course) return; const enroll = loadEnrollments(); const prog = enroll[courseId] || { current:0, completed: [] };
    const html = `<div style="display:flex;gap:12px"><div style="flex:1;min-width:320px"><h3>${course.title}</h3><div id="courseMain" style="min-height:220px;background:#f8fafc;padding:12px;border-radius:8px"></div><div id="courseQuizzes" style="margin-top:12px"></div></div><div style="width:300px"><h4>الدروس</h4><div id="courseLessons" style="max-height:420px;overflow:auto"></div><div style="margin-top:12px"><h4>الاختبارات</h4><div id="courseTests"></div></div></div></div>`;
    const modal = DashAuth.openModal(html);
    const main = modal.querySelector('#courseMain'); const lessonsEl = modal.querySelector('#courseLessons'); const testsEl = modal.querySelector('#courseTests'); const quizzesEl = modal.querySelector('#courseQuizzes');
    function renderLessonContent(idx){ const m = course.modules && course.modules[idx]; if(!m){ main.innerHTML = '<div class="muted">لا يوجد محتوى</div>'; return; } main.innerHTML=''; const res = (m.resources||[])[0]; if(res && res.id){ (async ()=>{ const url = await DashAuth.getFileURL(res.id); if(res.type && res.type.startsWith('image/')){ main.innerHTML = `<img src="${url}" style="max-width:100%;border-radius:8px"/>`; }
        else if(res.type && res.type.startsWith('video/')){ main.innerHTML = `<video src="${url}" controls style="width:100%;height:320px;object-fit:contain"></video>`; }
        else if(res.type==='application/pdf'){ main.innerHTML = `<iframe src="${url}" style="width:100%;height:420px;border:0"></iframe>`; }
        else { main.innerHTML = `<a href="${url}" target="_blank">تحميل الملف</a>`; }
      })(); }
      // progress controls
      const done = (prog.completed||[]).includes(idx);
      const btnHtml = `<div style="margin-top:8px"><button id="markDone" class="btn">${done? 'تم الانتهاء' : 'علم الانتهاء'}</button> <button id="nextLesson" class="btn-ghost">التالي</button></div>`;
      main.insertAdjacentHTML('beforeend', btnHtml);
      const markBtn = modal.querySelector('#markDone'); if(markBtn){ markBtn.addEventListener('click', ()=>{ if(!prog.completed.includes(idx)) prog.completed.push(idx); saveEnrollments(Object.assign(loadEnrollments(), {[courseId]: prog})); renderMyCourses(); markBtn.textContent='تم الانتهاء'; }); }
      const nextBtn = modal.querySelector('#nextLesson'); if(nextBtn){ nextBtn.addEventListener('click', ()=>{ const next = Math.min((course.modules||[]).length-1, idx+1); prog.current = next; saveEnrollments(Object.assign(loadEnrollments(), {[courseId]: prog})); renderLessonContent(next); renderLessonsList(); }); }
    }
    function renderLessonsList(){ lessonsEl.innerHTML = (course.modules||[]).map((m,i)=>{ const done = (prog.completed||[]).includes(i); return `<div style="padding:8px;border-bottom:1px solid rgba(0,0,0,0.04);display:flex;justify-content:space-between;align-items:center"><div><strong>${i+1}. ${m.title}</strong><div class="muted">${m.type||''}</div></div><div><button class="btn-ghost" data-i="${i}" data-act="open-lesson">${done? '✓': '▶'}</button></div></div>` }).join('');
      // wire lesson buttons (open full-screen MOOC viewer)
      lessonsEl.querySelectorAll('[data-act="open-lesson"]').forEach(b=>{ b.addEventListener('click', ()=>{ const idx = Number(b.dataset.i); prog.current = idx; saveEnrollments(Object.assign(loadEnrollments(), {[courseId]: prog})); renderLessonContent(idx); renderLessonsList(); navigateToMooc(courseId, idx); }); });
    }
    function renderTests(){ testsEl.innerHTML = (course.tests||[]).map((t,i)=>`<div style="padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.04)"><strong>${t.title}</strong><div class="muted">${(t.questions||[]).length} سؤال</div></div>`).join(''); quizzesEl.innerHTML=''; }

    renderLessonsList(); renderLessonContent(prog.current||0); renderTests();
  }

  // navigate to full-screen MOOC page
  function navigateToMooc(courseId, lessonIdx){ const base = window.location.pathname.replace(/pages\/dashboard\/.*$/,'/pages/'); // best-effort base
    // prefer a relative path from dashboard folder; fallback to absolute path
    const params = new URLSearchParams(); params.set('course', courseId); if(typeof lessonIdx !== 'undefined') params.set('lesson', String(lessonIdx));
    try{
      if(window.location.pathname.indexOf('/pages/dashboard/')!==-1){
        // e.g. /pages/dashboard/creator.html -> ../mooc.html
        const rel = window.location.pathname.replace(/\/pages\/dashboard\/.*$/,'/pages/mooc.html');
        window.location.href = rel + '?' + params.toString();
        return;
      }
    }catch(e){}
    // fallback: try relative sibling
    window.location.href = '../mooc.html?' + params.toString();
  }

  function loadWorks(){ const s=session(); if(!s) return []; return JSON.parse(localStorage.getItem(keyWorks(s.id))||'[]'); }
  function saveWorks(list){ const s=session(); if(!s) return; localStorage.setItem(keyWorks(s.id), JSON.stringify(list)); }

  function loadServices(){ const s=session(); if(!s) return []; return JSON.parse(localStorage.getItem(keyServices(s.id))||'[]'); }
  function saveServices(list){ const s=session(); if(!s) return; localStorage.setItem(keyServices(s.id), JSON.stringify(list)); }

  function renderWorks(){ const container=document.getElementById('worksList'); if(!container) return; const items=loadWorks(); if(items.length===0){ container.innerHTML='<div class="muted">لا توجد أعمال بعد</div>'; return; }
    container.innerHTML = items.map(it=>{
      const thumb = escapeHtml((it.title||'')[0]||'ع');
      const subtitle = `${it.type || ''} • ${it.year||''}`.trim();
      const body = `<p class="muted" style="margin-top:8px">${escapeHtml(it.description||'')}</p>`;
      const actions = `<div style=\"display:flex;gap:8px\"><button class=\"btn-ghost\" data-id=\"${escapeHtml(it.id)}\" data-action=\"edit-work\">تعديل</button><button class=\"btn-ghost\" data-id=\"${escapeHtml(it.id)}\" data-action=\"del-work\">حذف</button></div>`;
      return buildCardHTML({ id: it.id, title: it.title, subtitle, thumb, bodyHTML: body, actionsHTML: actions });
    }).join('');
  }

  // profile storage helpers
  function loadProfile(){ const s=session(); if(!s) return null; try{ return JSON.parse(localStorage.getItem(keyProfile(s.id))||'null'); }catch(e){return null} }
  function saveProfile(profile){ const s=session(); if(!s) return; localStorage.setItem(keyProfile(s.id), JSON.stringify(profile));
    // also update session storage so other dashboards show updated name/email
    try{ const sess=JSON.parse(sessionStorage.getItem('hibr_session')||'null')||{}; sess.name = profile.name||sess.name; sess.email = profile.email||sess.email; sessionStorage.setItem('hibr_session', JSON.stringify(sess)); }catch(e){}
  }

  function populateProfileUI(){ const s=session(); if(!s) return; const prof = loadProfile(); const nameEl = document.getElementById('profileName'); const emailEl = document.getElementById('profileEmail'); const bioEl = document.getElementById('profileBio'); const avatarEl = document.getElementById('profileAvatar'); if(nameEl) nameEl.textContent = prof?.name || s.name || s.email || 'مستخدم'; if(emailEl) emailEl.textContent = prof?.email || s.email || ''; if(bioEl) bioEl.textContent = prof?.bio || 'نبذة سريعة عنك'; if(avatarEl){ if(prof && prof.avatarUrl){ avatarEl.innerHTML = `<img src="${prof.avatarUrl}" style="width:64px;height:64px;border-radius:10px;object-fit:cover"/>`; } else { avatarEl.textContent = (s && s.name)? (s.name[0]||'م') : 'م'; } } }

  function renderServices(){ const container=document.getElementById('servicesList'); if(!container) return; const items=loadServices(); if(items.length===0){ container.innerHTML='<div class="muted">لا توجد خدمات بعد</div>'; return; }
    container.innerHTML = items.map(it=>{
      const thumb = escapeHtml((it.title||'')[0]||'خ');
      const subtitle = `السعر: ${it.price||'-'}`;
      const body = `<p class="muted" style="margin-top:8px">${escapeHtml(it.description||'')}</p>`;
      const actions = `<div style=\"display:flex;gap:8px\"><button class=\"btn-ghost\" data-id=\"${escapeHtml(it.id)}\" data-action=\"edit-service\">تعديل</button> <button class=\"btn-ghost\" data-id=\"${escapeHtml(it.id)}\" data-action=\"del-service\">حذف</button></div>`;
      return buildCardHTML({ id: it.id, title: it.title, subtitle, thumb, bodyHTML: body, actionsHTML: actions });
    }).join('');
  }

  function newId(){ return 'id_'+Math.random().toString(36).slice(2,9); }

  // INCUBATOR applications (global)
  const INCUBATOR_APPS_KEY = 'hibr_incubator_apps';
  function loadIncubatorApps(){ try{return JSON.parse(localStorage.getItem(INCUBATOR_APPS_KEY)||'[]')}catch(e){return []} }
  function saveIncubatorApps(list){ localStorage.setItem(INCUBATOR_APPS_KEY, JSON.stringify(list)); }

  function renderMyProjects(){ const container=document.getElementById('myProjectsList'); if(!container) return; const s=session(); if(!s){ container.innerHTML=''; return; }
    const all = loadIncubatorApps(); const mine = all.filter(a=>String(a.creatorId)===String(s.id)); if(mine.length===0){ container.innerHTML = '<div class="muted">لم تقم بتقديم أي مشروع بعد</div>'; return; }
    const docKeys = [{k:'bmc',label:'BMC'},{k:'prototype',label:'النموذج الأولي'},{k:'economicModel',label:'النموذج الاقتصادي'},{k:'financialPlan',label:'الخطة المالية'},{k:'marketingPlan',label:'الخطة التسويقية'}];
    container.innerHTML = mine.map(it=>{
      const status = it.status || 'pending';
      const note = it.note? `<div class="muted">ملاحظة: ${escapeHtml(it.note)}</div>` : '';
      const created = new Date(it.created || Date.now()).toLocaleString();
      const docsHtml = docKeys.map(d=>{
        const doc = (it.documents||{})[d.k];
        if(doc && doc.status==='uploaded'){
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0"><div><strong>${d.label}</strong><div class="muted">تم الرفع من ${escapeHtml(doc.uploadedBy||'')}</div></div><div><button class="btn-ghost" data-act="view-doc" data-file-id="${doc.fileId}">عرض</button></div></div>`;
        }
        if(doc && doc.status==='requested'){
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0"><div><strong>${d.label}</strong><div class="muted">مطلوب رفع المستند</div></div><div><button class="btn" data-act="upload-doc" data-app-id="${it.id}" data-doc="${d.k}">رفع</button></div></div>`;
        }
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0"><div><strong>${d.label}</strong><div class="muted">غير مطلوب/لم يُطلب بعد</div></div><div><button class="btn" data-act="upload-doc" data-app-id="${it.id}" data-doc="${d.k}">رفع (اختياري)</button></div></div>`;
      }).join('');
      const thumb = escapeHtml((it.title||'')[0]||'م');
      const body = `<div style="margin-top:8px"><div class=\"muted\">${escapeHtml(it.description||'')}</div><div style=\"margin-top:8px\"><strong>الحالة:</strong> ${escapeHtml(status)} ${note}</div><div style=\"margin-top:8px\">${docsHtml}</div><div style=\"margin-top:8px;display:flex;gap:8px;justify-content:flex-end\"><button class=\"btn-ghost\" data-act=\"delete-app\" data-id=\"${escapeHtml(it.id)}\">حذف المشروع</button></div></div>`;
      return buildCardHTML({ id: it.id, title: it.title, subtitle: created, thumb, bodyHTML: body, extraCls: '' });
    }).join('');
  }

  // Global opportunities (published by orgs)
  const GLOBAL_OPPS_KEY = 'hibr_opportunities';
  function loadGlobalOpps(){ try{return JSON.parse(localStorage.getItem(GLOBAL_OPPS_KEY)||'[]'); }catch(e){return []} }
  function loadOrgApps(orgId){ try{ return JSON.parse(localStorage.getItem(`hibr_opps_apps_user_${orgId}`)||'[]'); }catch(e){return []} }
  function renderGlobalOpps(){ const container = document.getElementById('oppsGlobalList'); if(!container) return; const items = loadGlobalOpps(); if(!items || items.length===0){ container.innerHTML = '<div class="muted">لا توجد فرص منشورة من المؤسسات</div>'; return; }
    container.innerHTML = items.map(it=>{
      const org = it.orgName ? `من: ${escapeHtml(it.orgName)}` : '';
      const created = new Date(it.created||Date.now()).toLocaleDateString();
      const s = session(); let myApp = null; if(s && it.orgId){ const apps = loadOrgApps(it.orgId); myApp = apps.find(a=> String(a.applicantId)===String(s.id) && String(a.oppId)===String(it.id)); }
      let actionHtml = '';
      if(!s || !myApp){ actionHtml = `<button class="btn" data-act="apply-opp" data-opp-id="${escapeHtml(it.id)}" data-org-id="${escapeHtml(it.orgId||'')}">تقديم على الفرصة</button>`; }
      else {
        const st = myApp.status || 'pending';
        if(st==='pending'){ actionHtml = `<button class="btn-ghost" data-act="view-my-app" data-app-id="${escapeHtml(myApp.id)}" data-org-id="${escapeHtml(it.orgId)}">تم التقديم (قيد الانتظار)</button> <button class="btn-ghost" data-act="withdraw-app" data-app-id="${escapeHtml(myApp.id)}" data-org-id="${escapeHtml(it.orgId)}">إلغاء</button>`; }
        else if(st==='accepted'){ actionHtml = `<button class="btn-ghost" data-act="view-my-app" data-app-id="${escapeHtml(myApp.id)}" data-org-id="${escapeHtml(it.orgId)}">مقبول</button> <button class="btn-ghost" data-act="withdraw-app" data-app-id="${escapeHtml(myApp.id)}" data-org-id="${escapeHtml(it.orgId)}">تراجع</button>`; }
        else if(st==='rejected'){ actionHtml = `<button class="btn-ghost" data-act="view-my-app" data-app-id="${escapeHtml(myApp.id)}" data-org-id="${escapeHtml(it.orgId)}">مرفوض</button> <button class="btn-ghost" data-act="remove-my-app" data-app-id="${escapeHtml(myApp.id)}" data-org-id="${escapeHtml(it.orgId)}">حذف</button>`; }
      }
      const thumb = escapeHtml((it.title||'')[0]||'ف');
      const subtitle = `${escapeHtml(it.type||'')} • ${escapeHtml(it.location||'')}`;
      const body = `<p style=\"margin-top:8px\">${escapeHtml(it.description||'')}</p><div style=\"margin-top:8px;display:flex;justify-content:space-between;align-items:center\"><div class=\"muted\">${org}</div><div><small class=\"muted\">${created}</small></div></div>`;
      return buildCardHTML({ id: it.id, title: it.title, subtitle, thumb, bodyHTML: body, actionsHTML: actionHtml });
    }).join(''); }

  // open submit project modal
  function openSubmitProjectModal(){ const html = `
    <div class="card" style="padding:14px">
      <h3>تقديم مشروع للاحتضان</h3>
      <label>عنوان المشروع</label>
      <input id="p_title" style="width:100%;padding:8px;margin-top:6px" />
      <label style="margin-top:8px">وصف موجز</label>
      <textarea id="p_desc" style="width:100%;padding:8px;margin-top:6px"></textarea>
      <label style="margin-top:8px">رابط أو ملف (اختياري)</label>
      <div style="display:flex;gap:8px;align-items:center"><button id="p_pick" class="btn-ghost">اختر ملف</button><span id="p_pick_name" class="muted">لم يتم الاختيار</span></div>
      <div style="margin-top:12px;display:flex;gap:8px"><button id="saveProject" class="btn">أرسل الطلب</button><button id="cancelProject" class="btn-ghost">إلغاء</button></div>
    </div>`;
    const modal = DashAuth.openModal(html);
    const pick = modal.querySelector('#p_pick'); const pickName = modal.querySelector('#p_pick_name'); let pickedFileId = null;
    pick.addEventListener('click', ()=>{
      const inp=document.createElement('input'); inp.type='file'; inp.accept='*/*'; inp.addEventListener('change', async ()=>{ const f=inp.files[0]; if(!f) return; try{ const id = await DashAuth.saveFile(f); pickedFileId = id; pickName.textContent = f.name; }catch(err){ DashAuth.showToast('فشل حفظ الملف'); } }); inp.click();
    });
    modal.querySelector('#cancelProject').addEventListener('click', ()=>DashAuth.closeModal());
    modal.querySelector('#saveProject').addEventListener('click', ()=>{
      const title = modal.querySelector('#p_title').value.trim(); if(!title){ DashAuth.showToast('أدخل عنوان المشروع'); return; }
      const desc = modal.querySelector('#p_desc').value.trim(); const s=session(); if(!s) return;
      const app = { id: newId(), creatorId: s.id, creatorName: s.name||'', title, description: desc, files: pickedFileId ? [pickedFileId] : [], status: 'pending', note: '', created: Date.now() };
      const arr = loadIncubatorApps(); arr.unshift(app); saveIncubatorApps(arr); DashAuth.closeModal(); DashAuth.showToast('تم إرسال طلب الاحتضان'); window.dispatchEvent(new Event('hibr:incubator:changed')); renderMyProjects();
    });
  }

  // Home statistics and activity summary for creator
  function loadAllOppApps(){ const g = loadGlobalOpps(); const orgIds = Array.from(new Set(g.map(x=>x.orgId).filter(x=>x))); let all = []; orgIds.forEach(orgId=>{ try{ const arr = JSON.parse(localStorage.getItem(`hibr_opps_apps_user_${orgId}`)||'[]'); all = all.concat(arr); }catch(e){} }); return all.sort((a,b)=> (b.created||0)-(a.created||0)); }

  function renderHomeStats(){ const el = document.getElementById('homeStats'); if(!el) return; const s = session(); if(!s) return; const works = loadWorks().length; const services = loadServices().length; const enrollCount = Object.keys(loadEnrollments()||{}).length; const allApps = loadAllOppApps(); const myApps = allApps.filter(a=> String(a.applicantId)===String(s.id)); const applied = myApps.length; const accepted = myApps.filter(a=> a.status==='accepted').length; const rejected = myApps.filter(a=> a.status==='rejected').length;
    // profile completeness heuristic
    const prof = loadProfile()||{}; let scoreItems = 0; if(prof.name) scoreItems++; if(prof.email) scoreItems++; if(prof.bio) scoreItems++; if(prof.avatarUrl) scoreItems++; if(works>0) scoreItems++; if(services>0) scoreItems++; if(enrollCount>0) scoreItems++; const pct = Math.min(100, Math.round((scoreItems/7)*100));

    // render radial SVG
    const radial = document.getElementById('statsRadial'); if(radial){ const size=110; const stroke=10; const r=(size-stroke)/2; const c=2*Math.PI*r; const dash = (pct/100)*c; const color = pct>=75 ? '#16a34a' : (pct>=40? '#f59e0b' : '#ef4444'); radial.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs><linearGradient id="g1"><stop offset="0%" stop-color="#06b6d4"/><stop offset="100%" stop-color="${color}"/></linearGradient></defs><circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="#eef2f7" stroke-width="${stroke}" fill="none"/></svg>`;
      const svg = radial.querySelector('svg'); const progress = document.createElementNS('http://www.w3.org/2000/svg','circle'); progress.setAttribute('cx', String(size/2)); progress.setAttribute('cy', String(size/2)); progress.setAttribute('r', String(r)); progress.setAttribute('stroke-width', String(stroke)); progress.setAttribute('stroke-linecap','round'); progress.setAttribute('fill','none'); progress.setAttribute('stroke','url(#g1)'); progress.setAttribute('transform', `rotate(-90 ${size/2} ${size/2})`);
      progress.setAttribute('stroke-dasharray', `${dash} ${c-dash}`); progress.setAttribute('stroke-dashoffset','0'); svg.appendChild(progress);
      const txt = document.createElement('div'); txt.style.position='relative'; txt.style.top='-'+String(size)+'px'; txt.style.height=String(size)+'px'; txt.style.display='flex'; txt.style.alignItems='center'; txt.style.justifyContent='center'; txt.style.pointerEvents='none'; txt.innerHTML = `<div style="text-align:center"><div style="font-weight:700">${pct}%</div><div class="muted" style="font-size:12px">اكتمال الملف</div></div>`; radial.appendChild(txt);
    }

    // stats list
    const statsList = document.getElementById('statsList'); if(statsList){ statsList.innerHTML = `<div style="min-width:120px"><strong>${works}</strong><div class="muted">أعمال</div></div><div style="min-width:120px"><strong>${services}</strong><div class="muted">خدمات</div></div><div style="min-width:120px"><strong>${enrollCount}</strong><div class="muted">دورات</div></div><div style="min-width:120px"><strong>${applied}</strong><div class="muted">طلبات</div></div><div style="min-width:120px"><strong>${accepted}</strong><div class="muted">مقبول</div></div>`; }

    // activity summary (recent 3 events)
    const activityEl = document.getElementById('activitySummary'); if(activityEl){ const recent = myApps.slice(0,3).map(a=>{ const created = new Date(a.created||Date.now()).toLocaleDateString(); const status = a.status||'pending'; return `• ${escapeHtml(a.oppTitle||'')} — ${escapeHtml(status)} (${created})`; }).join('<br/>'); const more = (myApps.length>3)? `<div class="muted" style="margin-top:6px">عرض ${myApps.length} طلب/طلبات إجمالياً</div>` : ''; activityEl.innerHTML = (recent || '<div class="muted">لم يتم إجراء أي نشاط مؤخرًا</div>') + more; }
  }

  // Recent activity for sidebar: collect events from works, services, enrollments, and opp apps
  function renderRecentActivity(){ const el = document.getElementById('recentActivityList'); if(!el) return; const s = session(); if(!s) return; const events = [];
    // works
    try{ loadWorks().forEach(w=> events.push({ date: w.created||0, title: w.title||'عمل', type:'work', text: w.type||'' })); }catch(e){}
    // services
    try{ loadServices().forEach(sv=> events.push({ date: sv.created||0, title: sv.title||'خدمة', type:'service', text: sv.price||'' })); }catch(e){}
    // enrollments - show just count as event
    try{ const enroll = loadEnrollments(); Object.keys(enroll||{}).forEach(cid=>{ events.push({ date: Date.now(), title: `تسجيل في دورة`, type:'enroll', text: cid }); }); }catch(e){}
    // opp apps
    try{ const all = loadAllOppApps(); const mine = all.filter(a=> String(a.applicantId)===String(s.id)); mine.forEach(a=> events.push({ date: a.created||0, title: a.oppTitle||'تقديم فرصة', type:'app', text: a.status||'pending' })); }catch(e){}
    // sort desc and take 6
    events.sort((a,b)=> (b.date||0)-(a.date||0)); const pick = events.slice(0,6);
    if(pick.length===0){ el.innerHTML = '<div class="muted">لا توجد نشاطات بعد</div>'; return; }
    el.innerHTML = pick.map(ev=>{ const d = ev.date? new Date(ev.date).toLocaleDateString() : ''; return `<div class="recent-original-item"><strong>${escapeHtml(ev.title)}</strong><div class="muted">${escapeHtml(ev.text)} • ${d}</div></div>`; }).join(''); }

  function initAsideWidgets(){ // wire quick action buttons and render recent activity
    const qa = document.getElementById('quickAddWork'); if(qa) qa.addEventListener('click', ()=>{ const btn=document.getElementById('addWorkBtn'); if(btn) btn.click(); else { const addWorkBtn=document.getElementById('addWorkBtn'); if(addWorkBtn) addWorkBtn.click(); } });
    const qs = document.getElementById('quickAddService'); if(qs) qs.addEventListener('click', ()=>{ const btn=document.getElementById('addServiceBtn'); if(btn) btn.click(); });
    const qp = document.getElementById('quickSubmitProject'); if(qp) qp.addEventListener('click', ()=>{ const btn=document.getElementById('submitProjectBtn'); if(btn) btn.click(); });
    const qc = document.getElementById('quickCourses'); if(qc) qc.addEventListener('click', ()=>{ try{ showSection('my-courses'); }catch(e){ window.location.href = '../mooc.html'; } });
    // initial render
    try{ renderRecentActivity(); }catch(e){}
    // refresh on relevant events
    window.addEventListener('hibr:opps:changed', ()=>{ try{ renderRecentActivity(); }catch(e){} });
    window.addEventListener('hibr:incubator:changed', ()=>{ try{ renderRecentActivity(); }catch(e){} });
    window.addEventListener('hibr:courses:changed', ()=>{ try{ renderRecentActivity(); }catch(e){} });
    window.addEventListener('storage', ()=>{ try{ renderRecentActivity(); }catch(e){} });
  }

  // Show/hide dashboard sections based on sidebar navigation
  function showSection(id){
    const sectionIds = ['homeStats','profile','gallery','services','courses','my-courses','incubator','opportunities','messages'];
    sectionIds.forEach(sid=>{ const el=document.getElementById(sid); if(!el) return; el.style.display = (sid===id || (sid==='homeStats' && id==='gallery'))? 'block' : 'none'; });
    // update active link
    document.querySelectorAll('.dash-sidebar .nav a').forEach(a=>{
      const href = a.getAttribute('href')||''; let t=''; if(href.startsWith('#')) t=href.slice(1); else if(href.endsWith('creator.html')) t='gallery'; a.classList.toggle('active', t===id);
    });
  }

  // handlers
  function initCreator(){
    // render lists
    renderWorks(); renderServices();
    // populate profile UI
    populateProfileUI();
    // render courses lists
    renderAvailableCourses(); renderMyCourses();
    // update courses when other dashboards change data
    window.addEventListener('hibr:courses:changed', ()=>{ try{ renderAvailableCourses(); renderMyCourses(); }catch(e){} });
    // render incubator submissions and wire submit button
    if(typeof renderMyProjects === 'function'){ renderMyProjects(); }
    const submitProjectBtn = document.getElementById('submitProjectBtn'); if(submitProjectBtn) submitProjectBtn.addEventListener('click', ()=>{ openSubmitProjectModal(); });

    // render global opportunities published by organizations
    try{ renderGlobalOpps(); }catch(e){}
    window.addEventListener('hibr:opps:changed', ()=>{ try{ renderGlobalOpps(); }catch(e){} });
    // render home stats and refresh on relevant events
    try{ renderHomeStats(); }catch(e){}
    window.addEventListener('hibr:opps:changed', ()=>{ try{ renderHomeStats(); }catch(e){} });
    window.addEventListener('hibr:incubator:changed', ()=>{ try{ renderHomeStats(); }catch(e){} });
    window.addEventListener('hibr:courses:changed', ()=>{ try{ renderHomeStats(); }catch(e){} });
    window.addEventListener('storage', ()=>{ try{ renderHomeStats(); }catch(e){} });
    // init aside widgets (quick actions + recent activity)
    try{ initAsideWidgets(); }catch(e){}

    // add new work
    const addWorkBtn=document.getElementById('addWorkBtn'); if(addWorkBtn) addWorkBtn.addEventListener('click', ()=>{
      const html = `
        <div class="card" style="padding:18px">
          <h3>أضف عمل</h3>
          <div style="margin-top:10px">
            <label>العنوان</label>
            <input id="w_title" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px" />
            <label style="margin-top:8px">النوع</label>
            <input id="w_type" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px" />
            <label style="margin-top:8px">السنة</label>
            <input id="w_year" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px" />
            <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-start"><button id="saveWork" class="btn">حفظ</button><button id="cancelWork" class="btn-ghost">إلغاء</button></div>
          </div>
        </div>
      `;
      const modal = DashAuth.openModal(html);
      modal.querySelector('#cancelWork').addEventListener('click', ()=>DashAuth.closeModal());
      modal.querySelector('#saveWork').addEventListener('click', ()=>{
        const t=modal.querySelector('#w_title').value.trim(); if(!t){ DashAuth.showToast('أدخل عنوان العمل'); return; }
        const it={id:newId(),title:t,type:modal.querySelector('#w_type').value||'',year:modal.querySelector('#w_year').value||''};
        const arr=loadWorks(); arr.unshift(it); saveWorks(arr); renderWorks(); DashAuth.closeModal(); DashAuth.showToast('تم حفظ العمل');
      });
    });

    // edit profile
    const editProfileBtn = document.getElementById('editProfileBtn'); if(editProfileBtn) editProfileBtn.addEventListener('click', ()=>{
      const s = session(); if(!s) return; const prof = loadProfile() || { name: s.name||'', email: s.email||'', bio:'', avatarId:null, avatarUrl: null };
      const html = `
        <div class="card" style="padding:18px">
          <h3>تعديل الملف الشخصي</h3>
          <label>الاسم</label>
          <input id="p_name" value="${prof.name||''}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px" />
          <label style="margin-top:8px">البريد الإلكتروني</label>
          <input id="p_email" value="${prof.email||''}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px" />
          <label style="margin-top:8px">نبذة قصيرة</label>
          <textarea id="p_bio" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px">${prof.bio||''}</textarea>
          <label style="margin-top:8px">صورة الملف الشخصي</label>
          <div style="display:flex;gap:8px;align-items:center"><button id="p_pick" class="btn-ghost">اختر صورة</button> <span id="p_pick_name" class="muted">${prof.avatarId? 'محمّل' : 'لم يتم الاختيار'}</span></div>
          <div style="margin-top:12px;display:flex;gap:8px"><button id="saveProfile" class="btn">حفظ</button><button id="cancelProfile" class="btn-ghost">إلغاء</button></div>
        </div>
      `;
      const modal = DashAuth.openModal(html);
      modal.querySelector('#cancelProfile').addEventListener('click', ()=>DashAuth.closeModal());
      modal.querySelector('#p_pick').addEventListener('click', ()=>{
        const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.addEventListener('change', async ()=>{ const f=inp.files[0]; if(!f) return; try{ const id = await DashAuth.saveFile(f); const url = await DashAuth.getFileURL(id); prof.avatarId = id; prof.avatarUrl = url; modal.querySelector('#p_pick_name').textContent = f.name; }catch(err){ DashAuth.showToast('فشل حفظ الصورة'); } }); inp.click();
      });
      modal.querySelector('#saveProfile').addEventListener('click', async ()=>{
        prof.name = modal.querySelector('#p_name').value.trim(); prof.email = modal.querySelector('#p_email').value.trim(); prof.bio = modal.querySelector('#p_bio').value.trim(); saveProfile(prof); populateProfileUI(); DashAuth.closeModal(); DashAuth.showToast('تم حفظ الملف الشخصي');
      });
    });

    // list action delegates
    document.addEventListener('click',(e)=>{
      const btn=e.target.closest('[data-action]'); if(!btn) return; const act=btn.dataset.action; const id=btn.dataset.id;
      if(act==='del-work'){ if(confirm('حذف هذا العمل؟')){ const arr=loadWorks().filter(x=>x.id!==id); saveWorks(arr); renderWorks(); DashAuth.showToast('تم الحذف'); } }
      if(act==='edit-work'){ const arr=loadWorks(); const item=arr.find(x=>x.id===id); if(!item) return; const html=`<div class="card" style="padding:18px"><h3>تعديل عمل</h3><label>العنوان</label><input id="w_title" value="${item.title}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px" /><label style="margin-top:8px">النوع</label><input id="w_type" value="${item.type}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px" /><label style="margin-top:8px">السنة</label><input id="w_year" value="${item.year||''}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px" /><div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-start"><button id="saveWork" class="btn">حفظ</button><button id="cancelWork" class="btn-ghost">إلغاء</button></div></div>`;
        const modal=DashAuth.openModal(html);
        modal.querySelector('#cancelWork').addEventListener('click', ()=>DashAuth.closeModal());
        modal.querySelector('#saveWork').addEventListener('click', ()=>{
          item.title=modal.querySelector('#w_title').value.trim(); item.type=modal.querySelector('#w_type').value; item.year=modal.querySelector('#w_year').value;
          saveWorks(arr); renderWorks(); DashAuth.closeModal(); DashAuth.showToast('تم التعديل');
        });
      }

      if(act==='edit-service'){ const arr=loadServices(); const item=arr.find(x=>x.id===id); if(!item) return; const html=`<div class="card" style="padding:18px"><h3>تعديل خدمة</h3><label>العنوان</label><input id="s_title" value="${item.title}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px" /><label style="margin-top:8px">السعر</label><input id="s_price" value="${item.price}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px" /><div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-start"><button id="saveService" class="btn">حفظ</button><button id="cancelService" class="btn-ghost">إلغاء</button></div></div>`;
        const modal=DashAuth.openModal(html);
        modal.querySelector('#cancelService').addEventListener('click', ()=>DashAuth.closeModal());
        modal.querySelector('#saveService').addEventListener('click', ()=>{
          item.title=modal.querySelector('#s_title').value.trim(); item.price=modal.querySelector('#s_price').value.trim(); saveServices(arr); renderServices(); DashAuth.closeModal(); DashAuth.showToast('تم التعديل');
        });
      }

      if(act==='del-service'){ if(confirm('حذف هذه الخدمة؟')){ const arr=loadServices().filter(x=>x.id!==id); saveServices(arr); renderServices(); DashAuth.showToast('تم الحذف'); } }
    });

    // handle course actions (enroll/open/unenroll) using data-act
    document.addEventListener('click', (e)=>{
      const b = e.target.closest('[data-act]'); if(!b) return; const act = b.dataset.act; const id = b.dataset.id;
      if(act==='enroll'){ enrollInCourse(id); renderAvailableCourses(); }
      if(act==='open-course'){ navigateToMooc(id); }
      if(act==='unenroll'){ if(confirm('إلغاء التسجيل في هذه الدورة؟')){ unenrollCourse(id); renderAvailableCourses(); } }
      if(act==='apply-opp'){
        // apply to an opportunity published by an organization
        const oppId = b.dataset.oppId; const orgId = b.dataset.orgId;
        const s = session(); if(!s){ DashAuth.showToast('يجب تسجيل الدخول'); return; }
        const html = `<div class="card" style="padding:16px"><h3>تقديم على: ${escapeHtml(oppId)}</h3><label>رسالة التقديم</label><textarea id="app_msg" style="width:100%;padding:8px;margin-top:6px" placeholder="اكتب رسالة قصيرة تُعرّف بها نفسك وخبراتك"></textarea><div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end"><button id="cancelApp" class="btn-ghost">إلغاء</button><button id="doApply" class="btn">إرسال الطلب</button></div></div>`;
        const modal = DashAuth.openModal(html);
        modal.querySelector('#cancelApp').addEventListener('click', ()=>DashAuth.closeModal());
        modal.querySelector('#doApply').addEventListener('click', ()=>{
          const msg = modal.querySelector('#app_msg').value.trim();
          // find global opp to get title
          const all = loadGlobalOpps(); const opp = all.find(x=>String(x.id)===String(oppId)); const oppTitle = opp? opp.title : '';
          const app = { id: newId('app_'), oppId, oppTitle, applicantId: s.id, applicantName: s.name||'', applicantEmail: s.email||'', message: msg, status: 'pending', created: Date.now() };
          try{
            if(!orgId){ DashAuth.showToast('جهة النشر غير معروفة'); DashAuth.closeModal(); return; }
            const key = `hibr_opps_apps_user_${orgId}`;
            const raw = localStorage.getItem(key) || '[]'; const arr = JSON.parse(raw);
            arr.unshift(app); localStorage.setItem(key, JSON.stringify(arr));
            // notify org dashboard
            window.dispatchEvent(new Event('hibr:opps:changed'));
            DashAuth.showToast('تم إرسال الطلب');
            DashAuth.closeModal();
          }catch(err){ console.error(err); DashAuth.showToast('فشل إرسال الطلب'); }
        });
      }
      if(act==='view-my-app'){
        const appsKeyOrg = b.dataset.orgId; const appId = b.dataset.appId; if(!appsKeyOrg || !appId) return; const key = `hibr_opps_apps_user_${appsKeyOrg}`; const arr = JSON.parse(localStorage.getItem(key)||'[]'); const app = arr.find(x=> String(x.id)===String(appId)); if(!app) return; const created = new Date(app.created||Date.now()).toLocaleString(); const html = `<div class="card" style="padding:16px"><h3>${escapeHtml(app.oppTitle||'')}</h3><div class="muted">${escapeHtml(app.applicantName||app.applicantId)} • ${created}</div><p style="margin-top:8px">${escapeHtml(app.message||'')}</p><div style="margin-top:12px">الحالة: ${escapeHtml(app.status||'pending')}</div><div style="margin-top:12px"><button id="closeMyApp" class="btn-ghost">إغلاق</button></div></div>`; const modal = DashAuth.openModal(html); modal.querySelector('#closeMyApp').addEventListener('click', ()=>DashAuth.closeModal()); return; }
      if(act==='withdraw-app' || act==='remove-my-app'){
        const appsKeyOrg = b.dataset.orgId; const appId = b.dataset.appId; if(!appsKeyOrg || !appId) return; const key = `hibr_opps_apps_user_${appsKeyOrg}`; const arr = JSON.parse(localStorage.getItem(key)||'[]'); const idx = arr.findIndex(x=> String(x.id)===String(appId)); if(idx<0) return;
        if(act==='remove-my-app'){ if(!confirm('حذف هذا الطلب نهائياً؟')) return; arr.splice(idx,1); localStorage.setItem(key, JSON.stringify(arr)); DashAuth.showToast('تم حذف الطلب'); window.dispatchEvent(new Event('hibr:opps:changed')); renderGlobalOpps(); return; }
        // withdraw -> remove the user's application
        if(act==='withdraw-app'){ arr.splice(idx,1); localStorage.setItem(key, JSON.stringify(arr)); DashAuth.showToast('تم إلغاء الطلب'); window.dispatchEvent(new Event('hibr:opps:changed')); renderGlobalOpps(); return; }
      }
    });

    // handle document upload and view for incubator projects (creator)
    document.addEventListener('click', (e)=>{
      const viewBtn = e.target.closest('[data-act="view-doc"]'); if(viewBtn){ const fileId = viewBtn.dataset.fileId; if(fileId){ (async ()=>{ try{ const ok = await DashAuth.openFileInNewTab(fileId); if(!ok) DashAuth.showToast('الملف غير متوافر'); }catch(err){ DashAuth.showToast('فشل فتح الملف'); } })(); } return; }
      const b = e.target.closest('[data-act="upload-doc"]'); if(!b) return; const appId = b.dataset.appId; const docKey = b.dataset.doc; const inp = document.createElement('input'); inp.type='file'; inp.accept='*/*'; inp.addEventListener('change', async ()=>{ const f = inp.files[0]; if(!f) return; try{ const id = await DashAuth.saveFile(f); if(window.Incubator && window.Incubator.uploadDocument){ const s=session(); window.Incubator.uploadDocument(appId, docKey, id, s?.id, s?.name); DashAuth.showToast('تم رفع المستند'); renderMyProjects(); window.dispatchEvent(new Event('hibr:incubator:changed')); } else { DashAuth.showToast('وحدة الاحتضان غير متوفرة'); } }catch(err){ DashAuth.showToast('فشل رفع الملف'); } }); inp.click(); });

    // handle incubator project deletion (creator)
    document.addEventListener('click', (e)=>{
      const del = e.target.closest('[data-act="delete-app"]'); if(!del) return; const id = del.dataset.id; if(!id) return; if(!confirm('حذف هذا المشروع؟')) return; const arr = loadIncubatorApps().filter(x=>String(x.id)!==String(id)); saveIncubatorApps(arr); renderMyProjects(); DashAuth.showToast('تم حذف المشروع'); try{ window.dispatchEvent(new Event('hibr:incubator:changed')); }catch(e){}
    });

    // add service button
    const addServiceBtn=document.getElementById('addServiceBtn'); if(addServiceBtn) addServiceBtn.addEventListener('click', ()=>{
      const html=`<div class="card" style="padding:18px"><h3>أضف خدمة</h3><label>العنوان</label><input id="s_title" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px" /><label style="margin-top:8px">السعر</label><input id="s_price" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px" /><div style="margin-top:12px;display:flex;gap:8px"><button id="saveService" class="btn">حفظ</button><button id="cancelService" class="btn-ghost">إلغاء</button></div></div>`;
      const modal=DashAuth.openModal(html);
      modal.querySelector('#cancelService').addEventListener('click', ()=>DashAuth.closeModal());
      modal.querySelector('#saveService').addEventListener('click', ()=>{
        const t=modal.querySelector('#s_title').value.trim(); if(!t){ DashAuth.showToast('أدخل عنوان الخدمة'); return; }
        const it={id:newId(),title:t,price:modal.querySelector('#s_price').value.trim()}; const arr=loadServices(); arr.unshift(it); saveServices(arr); renderServices(); DashAuth.closeModal(); DashAuth.showToast('تم حفظ الخدمة');
      });
    });

  }

  // init when DOM ready
  document.addEventListener('DOMContentLoaded', function(){ if(session()){ initCreator();
      // initial section based on hash or default to gallery
      const initial = (location.hash && location.hash.length>1)? location.hash.slice(1) : 'gallery';
      showSection(initial);
      // wire sidebar links for section switching
      document.querySelectorAll('.dash-sidebar .nav a').forEach(a=>{
        a.addEventListener('click',(e)=>{
          e.preventDefault(); const href=a.getAttribute('href')||''; let t=''; if(href.startsWith('#')) t=href.slice(1); else if(href.endsWith('creator.html')) t='gallery'; if(t) showSection(t); if(href.startsWith('#')) history.pushState(null,'',href); else history.pushState(null,'',href);
        });
      });
      // refresh projects list when incubator apps change
      window.addEventListener('hibr:incubator:changed', ()=>{ try{ renderMyProjects && renderMyProjects(); }catch(e){} });
    } });

  // expose for testing
  window.Creator = { loadWorks, saveWorks, loadServices, saveServices, renderWorks, renderServices };
})();
