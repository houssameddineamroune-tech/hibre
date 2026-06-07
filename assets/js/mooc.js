(function(){
  'use strict';
  const GLOBAL_COURSES_KEY = 'hibr_courses';
  function loadGlobalCourses(){ try{return JSON.parse(localStorage.getItem(GLOBAL_COURSES_KEY)||'[]'); }catch(e){return []} }
  function session(){ try{return JSON.parse(sessionStorage.getItem('hibr_session')||'null')}catch(e){return null} }
  const keyEnroll = (uid)=>`hibr_enrollments_user_${uid}`;
  function loadEnrollments(){ const s=session(); if(!s) return {}; try{return JSON.parse(localStorage.getItem(keyEnroll(s.id))||'{}');}catch(e){return{}} }
  function saveEnrollments(obj){ const s=session(); if(!s) return; localStorage.setItem(keyEnroll(s.id), JSON.stringify(obj)); }

  function qsel(id){ return document.getElementById(id); }
  function getParam(name){ const u=new URL(window.location.href); return u.searchParams.get(name); }

  function renderCourse(){ const courseId = getParam('course'); const lessonIdx = Number(getParam('lesson')||0);
    const all = loadGlobalCourses(); const course = all.find(c=>c.id===courseId); if(!course){ qsel('playerContent').innerHTML = '<div class="muted">الدورة غير موجودة</div>'; return; }
    qsel('courseTitle').textContent = course.title || 'الدورة'; qsel('courseMeta').textContent = course.description||'';
    const enroll = loadEnrollments(); const prog = enroll[courseId] || { current: lessonIdx, completed: [] };

    function loadLesson(idx){ const m=(course.modules||[])[idx]; if(!m){ qsel('playerContent').innerHTML = '<div class="muted">لا يوجد درس</div>'; return; }
      qsel('playerContent').innerHTML = '';
      const res = (m.resources||[])[0]; if(res && res.id){ (async ()=>{ try{ const url = await DashAuth.getFileURL(res.id);
            if(res.type && res.type.startsWith('video/')){
              // create video element for Plyr
              qsel('playerContent').innerHTML = `<video id="player" playsinline controls crossorigin><source src="${url}" type="${res.type}"></video>`;
              // captions (if provided as m.captions array)
              if(m.captions && Array.isArray(m.captions)){
                const vid = qsel('playerContent').querySelector('video'); m.captions.forEach(t=>{ const track = document.createElement('track'); track.kind='subtitles'; track.label=t.label||'sub'; track.srclang=t.srclang||'ar'; track.src=t.url; vid.appendChild(track); });
              }
              // init Plyr
              setTimeout(()=>{ try{ if(window._HibrPlyr && window._HibrPlyr.destroy) window._HibrPlyr.destroy(); window._HibrPlyr = new Plyr('#player', {controls:['play','progress','current-time','mute','volume','settings','pip','fullscreen'], settings:['quality','speed','captions']}); }catch(e){} }, 50);
            }
            else if(res.type && res.type.startsWith('image/')){ qsel('playerContent').innerHTML = `<img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain"/>`; }
            else if(res.type==='application/pdf'){ qsel('playerContent').innerHTML = `<iframe src="${url}" style="width:100%;height:100%;border:0"></iframe>`; }
            else { qsel('playerContent').innerHTML = `<a href="${url}" target="_blank">تحميل المورد</a>`; }
          }catch(e){ qsel('playerContent').innerHTML = '<div class="muted">فشل تحميل المورد</div>'; } })(); }
      else { qsel('playerContent').innerHTML = `<div style="padding:12px"><h3>${m.title}</h3><div class="muted">لا موارد مرفقة</div><p>${m.description||''}</p></div>`; }
      // update controls
      const done = (prog.completed||[]).includes(idx);
      qsel('markDone').textContent = done? 'تم الانتهاء' : 'علم الانتهاء';
      qsel('prevLesson').disabled = (idx<=0);
      qsel('nextLesson').disabled = (idx >= (course.modules||[]).length-1);
      // save current
      prog.current = idx; saveEnrollments(Object.assign(loadEnrollments(), {[courseId]: prog})); renderLessons();
    }

    function renderLessons(){ const list = qsel('lessonsList'); list.innerHTML = (course.modules||[]).map((m,i)=>{ const done=(loadEnrollments()[courseId]?.completed||[]).includes(i); return `<div class="lesson-item"><div><strong>${i+1}. ${m.title}</strong><div class="muted">${m.type||''}</div></div><div style="display:flex;gap:8px"><button class="btn-ghost" data-i="${i}" data-course="${courseId}">${done? '✓' : '▶'}</button></div></div>` }).join('');
      list.querySelectorAll('button').forEach(b=>{ b.addEventListener('click', ()=>{ const idx=Number(b.dataset.i); loadLesson(idx); }); });
    }

    // wire top controls
    qsel('prevLesson').addEventListener('click', ()=>{ const idx = (loadEnrollments()[courseId]?.current)||0; loadLesson(Math.max(0, idx-1)); });
    qsel('nextLesson').addEventListener('click', ()=>{ const idx = (loadEnrollments()[courseId]?.current)||0; loadLesson(Math.min((course.modules||[]).length-1, idx+1)); });
    qsel('markDone').addEventListener('click', ()=>{ const idx = (loadEnrollments()[courseId]?.current)||0; const enroll=loadEnrollments(); const prog = enroll[courseId]||{current:idx,completed:[]}; if(!prog.completed.includes(idx)) prog.completed.push(idx); saveEnrollments(Object.assign(loadEnrollments(), {[courseId]: prog})); renderLessons(); qsel('markDone').textContent='تم الانتهاء'; });

    renderLessons(); loadLesson(lessonIdx||prog.current||0);
  }

  document.addEventListener('DOMContentLoaded', function(){ // guard
    if(!DashAuth || !DashAuth.ensureRole){ /* still render but show guard */ }
    const back = document.getElementById('backBtn'); if(back) back.addEventListener('click', ()=>{ history.back(); });
    renderCourse();
  });

})();
