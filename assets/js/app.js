/* ============================================================
   حِبر — app.js
   Scroll Reveal · Back to Top · Navbar · Mobile Menu
   ============================================================ */

(function () {
  "use strict";

  /* ---------- NAVBAR SCROLL --------------------------------- */
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- MOBILE MENU ----------------------------------- */
  const hamburger = document.querySelector(".hamburger");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("open");
      mobileMenu.classList.toggle("open");
    });
    // Close on link click
    mobileMenu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        hamburger.classList.remove("open");
        mobileMenu.classList.remove("open");
      });
    });
  }

  /* ---------- ACTIVE NAV LINK ------------------------------- */
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a, .mobile-menu a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href === path || (path === "index.html" && href === "index.html")) {
      a.classList.add("active");
    }
  });

  /* ---------- SCROLL REVEAL --------------------------------- */
  const revealEls = document.querySelectorAll(
    ".reveal, .reveal-left, .reveal-right, .reveal-scale"
  );
  if (revealEls.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  /* ---------- BACK TO TOP ----------------------------------- */
  const btn = document.getElementById("backToTop");
  if (btn) {
    window.addEventListener(
      "scroll",
      () => {
        btn.classList.toggle("visible", window.scrollY > 320);
      },
      { passive: true }
    );
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- PASSWORD TOGGLE ------------------------------ */
  document.querySelectorAll(".toggle-pass").forEach((btn) => {
    btn.addEventListener("click", () => {
      const inputId = btn.dataset.target;
      const input = document.getElementById(inputId);
      if (!input) return;
      const isText = input.type === "text";
      input.type = isText ? "password" : "text";
      btn.textContent = isText ? "إظهار" : "إخفاء";
    });
  });

  /* ---------- FORM SUBMIT SIMULATION ----------------------- */
  document.querySelectorAll("form[data-form]").forEach((form) => {
    // Skip hijacking the login form - RBAC handles it separately
    if (form.dataset.form === "login") return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("[type=submit]");
      if (!btn) return;
      const orig = btn.textContent;
      btn.textContent = "جارٍ المعالجة...";
      btn.disabled = true;
      setTimeout(() => {
        const dest = form.dataset.redirect || "index.html";
        window.location.href = dest;
      }, 1200);
    });
  });

  /* ---------- COUNTER ANIMATION ---------------------------- */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length > 0) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseFloat(el.dataset.count.replace(/,/g, "")) || 0;
          const suffix = el.dataset.suffix || "";
          const prefix = el.dataset.prefix || "";
          const duration = 1800;
          const start = performance.now();
          const isFloat = String(target).includes(".");
          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo
            const ease =
              progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = target * ease;
            el.textContent =
              prefix +
              (isFloat
                ? current.toFixed(1)
                : Math.floor(current).toLocaleString("ar")) +
              suffix;
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          countObserver.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => countObserver.observe(el));
  }

  /* ---------- SMOOTH ANCHOR LINKS -------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
})();

/* ---------- PAYMENT MODAL -------- */
(function () {
  "use strict";
  const modal = document.querySelector('.payment-modal');
  if (!modal) return;

  const openBtns = document.querySelectorAll('.open-pay-btn');
  openBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      // focus first input for better UX
      setTimeout(() => document.getElementById('pm-card')?.focus(), 80);
    });
  });

  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  modal.querySelectorAll('.pm-close, .pm-cancel').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Form handling and simple formatting/validation
  const form = document.getElementById('paymentPreviewForm');
  const card = document.getElementById('pm-card');
  const exp = document.getElementById('pm-exp');
  const cvc = document.getElementById('pm-cvc');
  const amount = document.getElementById('pm-amount');
  const payBtn = document.getElementById('pmPayBtn');

  function onlyDigits(str) { return (str || '').replace(/[^0-9]/g, ''); }

  function formatCardNumber(value) {
    const digits = onlyDigits(value).slice(0, 19);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExp(value) {
    const digits = onlyDigits(value).slice(0,4);
    if (digits.length <= 2) return digits;
    return digits.slice(0,2) + '/' + digits.slice(2);
  }

  card?.addEventListener('input', (e) => {
    const pos = e.target.selectionStart || 0;
    e.target.value = formatCardNumber(e.target.value);
  });

  exp?.addEventListener('input', (e) => {
    e.target.value = formatExp(e.target.value);
  });

  cvc?.addEventListener('input', (e) => {
    e.target.value = onlyDigits(e.target.value).slice(0,4);
  });

  function validateSimple() {
    const num = onlyDigits(card?.value || '');
    const expv = (exp?.value || '');
    const cvcv = onlyDigits(cvc?.value || '');
    if (num.length < 13 || num.length > 19) return { ok:false, msg: 'رقم بطاقة غير صالح' };
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expv)) return { ok:false, msg: 'تاريخ انتهاء صالح بصيغة MM/YY' };
    if (cvcv.length < 3) return { ok:false, msg: 'رمز CVC غير صالح' };
    const amtRaw = (amount?.value || '').toString().replace(/,/g, '.');
    const amt = parseFloat(amtRaw);
    if (isNaN(amt) || amt <= 0) return { ok:false, msg: 'المبلغ غير صالح' };
    return { ok:true };
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = validateSimple();
    if (!v.ok) {
      alert(v.msg);
      return;
    }

    // simulate processing
    payBtn.disabled = true;
    payBtn.textContent = 'جارٍ معالجة الدفع...';
    card.disabled = true; exp.disabled = true; cvc.disabled = true;

    setTimeout(() => {
      // show success message inside modal
      const tx = Math.floor(Math.random() * 900000) + 100000;
        const amtDisplay = Number((amount?.value || '0').toString().replace(/,/g, '.')).toFixed(2);
        const body = modal.querySelector('.payment-body');
        body.innerHTML = `
          <div style="text-align:center;padding:24px 10px;">
            <div style="font-size:40px;margin-bottom:8px;color:var(--gold);">✓</div>
            <h3 style="margin:0 0 6px;">الدفع تم بنجاح</h3>
            <div style="color:var(--muted);margin-bottom:10px;">رقم العملية: <strong>${tx}</strong></div>
            <div style="color:var(--navy);font-weight:700;">المبلغ: <strong>${amtDisplay} دج</strong></div>
          </div>
        `;

      const footer = modal.querySelector('.payment-footer');
      footer.innerHTML = '<button class="pm-close btn btn-primary">إغلاق</button>';
      footer.querySelector('.pm-close').addEventListener('click', () => {
        closeModal();
      });
    }, 1400);
  });
})();

/* ============================================================
   حِبر — RBAC & Auth (local prototype)
   - seeds demo users in LocalStorage
   - intercepts login form and redirects by role
   - session stored in sessionStorage
   ============================================================ */

(function () {
  "use strict";

  const ROLE_REDIRECT = {
    owner: "./dashboard/owner.html",
    manager: "./dashboard/manager.html",
    creator: "./dashboard/creator.html",
    coach: "./dashboard/coach.html",
    mentor: "./dashboard/mentor.html",
    org: "./dashboard/org.html",
  };

  function seedDemoUsers() {
    try {
      const key = "hibr_users";
      const extrasToRemove = new Set([
        'creator2@hibr.local','creator3@hibr.local','creator-test1@hibr.local',
        'coach2@hibr.local','coach-test1@hibr.local',
        'mentor2@hibr.local','mentor-test1@hibr.local'
      ]);

      const original = [
        { id: 1, name: "مالك المنصة", email: "owner@hibr.local", password: "password", role: "owner" },
        { id: 2, name: "مدير المنصة", email: "admin@hibr.local", password: "password", role: "manager" },
        { id: 3, name: "المبدع", email: "creator@hibr.local", password: "password", role: "creator" },
        { id: 4, name: "المدرب", email: "coach@hibr.local", password: "password", role: "coach" },
        { id: 5, name: "المرشد", email: "mentor@hibr.local", password: "password", role: "mentor" },
        { id: 6, name: "المؤسسة", email: "org@hibr.local", password: "password", role: "org" }
      ];

      // If no users exist, write the original seeds
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(original));
        return;
      }

      // If users exist, remove any extra demo accounts
      try {
        const raw = localStorage.getItem(key) || '[]';
        let users = JSON.parse(raw);
        users = users.filter(u => !extrasToRemove.has(u.email));
        // ensure canonical originals exist
        original.forEach(seed => { if (!users.find(u => u.email === seed.email)) users.push(seed); });
        localStorage.setItem(key, JSON.stringify(users));
      } catch (e) {
        console.error('RBAC seed cleanup error', e);
      }
    } catch (err) {
      console.error("RBAC seed error", err);
    }
  }

  function findUserByEmail(email) {
    const raw = localStorage.getItem("hibr_users") || "[]";
    const users = JSON.parse(raw);
    return users.find((u) => u.email === email);
  }

  function createSession(user) {
    sessionStorage.setItem("hibr_session", JSON.stringify({ id: user.id, email: user.email, role: user.role, name: user.name }));
  }

  function handleLoginForm(form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = (form.querySelector('#email')?.value || "").trim();
      const pass = (form.querySelector('#password')?.value || "").trim();
      const btn = form.querySelector('[type=submit]');
      if (btn) { btn.disabled = true; btn.textContent = 'جارٍ التحقق...'; }
      setTimeout(() => {
        const user = findUserByEmail(email);
        if (!user || user.password !== pass) {
          alert('بيانات الدخول غير صحيحة؛ استخدم أحد المستخدمين التجريبيين (مثال: creator@hibr.local / password)');
          if (btn) { btn.disabled = false; btn.textContent = 'دخول'; }
          return;
        }
        createSession(user);
        const dest = ROLE_REDIRECT[user.role] || (form.dataset.redirect || '../index.html');
        window.location.href = dest;
      }, 800);
    });
  }

  function handleRegisterForm(form){
    form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const name = (form.querySelector('[name="name"]')?.value||'').trim();
      const email = (form.querySelector('[name="email"]')?.value||'').trim();
      const pass = (form.querySelector('[name="password"]')?.value||'').trim();
      let role = (form.querySelector('[name="role"]')?.value||'visitor').trim();
      // map some registration role values to internal roles
      if(role === 'trainer') role = 'coach';
      if(role === 'incubator') role = 'org';
      if(!name || !email || !pass){ alert('الرجاء ملء الحقول المطلوبة'); return; }
      // ensure users storage
      const key = 'hibr_users';
      const raw = localStorage.getItem(key) || '[]';
      const users = JSON.parse(raw);
      if(users.find(u=>u.email===email)){
        alert('هذا البريد مستخدم بالفعل'); return;
      }
      const maxId = users.reduce((m,u)=>Math.max(m,u.id||0),0);
      const newUser = { id: maxId+1, name, email, password: pass, role };
      users.push(newUser);
      try{ localStorage.setItem(key, JSON.stringify(users)); }catch(err){ console.error(err); alert('خطأ عند حفظ المستخدم'); return; }
      // create session and redirect to role dashboard
      createSession(newUser);
      const dest = ROLE_REDIRECT[newUser.role] || (form.dataset.redirect || '../index.html');
      window.location.href = dest;
    });
  }

  // initialize
  try {
    seedDemoUsers();
    document.querySelectorAll('form[data-form="login"]').forEach((f) => handleLoginForm(f));
    document.querySelectorAll('form[data-form="register"]').forEach((f)=> handleRegisterForm(f));
  } catch (err) {
    console.error(err);
  }
})();
