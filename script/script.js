import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore, addDoc, collection, serverTimestamp, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDxCBGKk8nT09hdW85-PyOkhw5_JPZLF1A",
  authDomain: "beapp-501d1.firebaseapp.com",
  projectId: "beapp-501d1",
  storageBucket: "beapp-501d1.appspot.com",
  messagingSenderId: "151993360357",
  appId: "1:151993360357:web:127db5b6d20896fb84990c"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

function mostrarContenido(id) {
  for (let i = 1; i <= 7; i++) {
    const c = document.getElementById('content-' + i);
    const b = document.getElementById('btn-' + i);
    if (c) c.classList.add('visually-hidden');
    if (b) b.classList.remove('bg-success');
  }
  const sc = document.getElementById('content-' + id);
  const sb = document.getElementById('btn-' + id);
  if (sc) sc.classList.remove('visually-hidden');
  if (sb) sb.classList.add('bg-success');
}
window.mostrarContenido = mostrarContenido;

document.addEventListener('DOMContentLoaded', function () {
  for (let i = 1; i <= 7; i++) {
    const btn = document.getElementById('btn-' + i);
    if (btn) btn.addEventListener('click', () => mostrarContenido(i));
  }

  const countrySelect = document.getElementById('floatingSelectGrid');
  const prefixDisplay = document.getElementById('prefixDisplay');
  if (countrySelect && prefixDisplay) {
    prefixDisplay.value = countrySelect.value || '+52';
    countrySelect.addEventListener('change', function () {
      prefixDisplay.value = this.value;
      document.getElementById('phone').focus();
    });
  }

  const form = document.getElementById('demoForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const nameVal    = document.getElementById('name').value.trim();
    const prefix     = prefixDisplay ? prefixDisplay.value : '';
    const phoneVal   = document.getElementById('phone').value.trim();
    const emailVal   = document.getElementById('email').value.trim();
    const companyVal = document.getElementById('company').value.trim();
    const roleVal    = document.getElementById('floatingSelectGrid2').value;

    const show = (id, visible) => {
      const el = document.getElementById(id);
      if (el) el.style.display = visible ? 'block' : 'none';
    };
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
    show('error-name',    !nameVal);
    show('error-phone',   !phoneVal);
    show('error-email',   !emailVal || !emailOk);
    show('error-company', !companyVal);
    show('error-role',    !roleVal);
    if (!roleVal) {
      document.getElementById('floatingSelectGrid2').focus();
      btn.disabled = false; btn.textContent = orig;
      return;
    }
    if (!nameVal || !phoneVal || !emailVal || !emailOk || !companyVal) return;

    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Verificando...';

    // Verificar si ya existe una solicitud pendiente con ese correo
    try {
      const q = query(collection(db, 'demos'), where('email', '==', emailVal), where('estado', '==', 'pendiente'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        show('error-email', true);
        const errEl = document.getElementById('error-email');
        if (errEl) errEl.textContent = '⚠️ Ya tienes una solicitud pendiente con este correo. Revisa tu bandeja de entrada.';
        btn.disabled = false;
        btn.textContent = orig;
        return;
      }
    } catch(_) { /* si falla la verificación, continuar igual */ }

    btn.textContent = 'Enviando...';

    try {
      const tel = (prefix ? prefix + ' ' : '') + phoneVal;
      await addDoc(collection(db, 'demos'), {
        nombre: nameVal, email: emailVal, telefono: tel,
        empresa: companyVal, rol: roleVal,
        estado: 'pendiente', origen: 'web',
        fechaCreacion: serverTimestamp()
      });
      await addDoc(collection(db, 'mail'), {
        to: ['jsoriano@bi2.mx', 'jsorglez@gmail.com'],
        replyTo: emailVal,
        message: {
          subject: '🗓️ Nueva Solicitud de Demo — ' + nameVal + ' (' + companyVal + ')',
          html: '<h2 style="color:#002e2e">🗓️ Nueva Solicitud de Demo</h2>' +
                '<table style="border-collapse:collapse;width:100%;max-width:500px">' +
                '<tr><td style="padding:10px;background:#004d4d;color:#fff;font-weight:700" colspan="2">Datos del Prospecto</td></tr>' +
                '<tr style="background:#f8fafc"><td style="padding:10px;color:#64748b;width:120px">👤 Nombre</td><td style="padding:10px;font-weight:700;color:#002e2e">' + nameVal + '</td></tr>' +
                '<tr><td style="padding:10px;color:#64748b">🏢 Empresa</td><td style="padding:10px;color:#002e2e">' + companyVal + '</td></tr>' +
                '<tr style="background:#f8fafc"><td style="padding:10px;color:#64748b">💼 Rol</td><td style="padding:10px;color:#002e2e">' + roleVal + '</td></tr>' +
                '<tr><td style="padding:10px;color:#64748b">📧 Email</td><td style="padding:10px"><a href="mailto:' + emailVal + '" style="color:#006868">' + emailVal + '</a></td></tr>' +
                '<tr style="background:#f8fafc"><td style="padding:10px;color:#64748b">📱 Teléfono</td><td style="padding:10px"><a href="tel:' + tel + '" style="color:#006868">' + tel + '</a></td></tr>' +
                '</table>' +
                '<br><a href="https://t.me/biapp_bot" style="display:inline-block;background:#006868;color:#fff;text-decoration:none;padding:12px 28px;border-radius:50px;font-weight:700">Gestionar en Bot Telegram →</a>'
        }
      });
      form.reset();
      if (prefixDisplay) prefixDisplay.value = '';
      btn.textContent = '✅ ¡Solicitud enviada!';
      btn.style.background = '#0d6efd';
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; btn.style.background = ''; }, 4000);
    } catch (err) {
      console.error(err);
      btn.textContent = '❌ Error, intenta de nuevo';
      btn.disabled = false;
      setTimeout(() => { btn.textContent = orig; }, 3000);
    }
  });
});