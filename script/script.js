import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { addDoc, collection, getDocs, getFirestore, query, serverTimestamp, where } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDxCBGKk8nT09hdW85-PyOkhw5_JPZLF1A',
  authDomain: 'beapp-501d1.firebaseapp.com',
  projectId: 'beapp-501d1',
  storageBucket: 'beapp-501d1.appspot.com',
  messagingSenderId: '151993360357',
  appId: '1:151993360357:web:127db5b6d20896fb84990c'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function setError(id, visible, message) {
  const el = document.getElementById(id);
  if (!el) return;
  if (message) el.textContent = message;
  el.style.display = visible ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('demoForm');
  const prefixSelect = document.getElementById('floatingSelectGrid');
  const prefixDisplay = document.getElementById('prefixDisplay');
  const phoneInput = document.getElementById('phone');

  if (prefixSelect && prefixDisplay) {
    prefixDisplay.value = prefixSelect.value || '+52';
    prefixSelect.addEventListener('change', () => {
      prefixDisplay.value = prefixSelect.value || '+52';
      phoneInput?.focus();
    });
  }

  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name')?.value.trim() || '';
    const phone = document.getElementById('phone')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const company = document.getElementById('company')?.value.trim() || '';
    const role = document.getElementById('floatingSelectGrid2')?.value || '';
    const prefix = prefixDisplay?.value || '+52';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneOk = phone.replace(/\s+/g, '').length >= 7;

    setError('error-name', !name);
    setError('error-phone', !phone || !phoneOk);
    setError('error-email', !email || !emailOk);
    setError('error-company', !company);
    setError('error-role', !role);

    if (!name || !phone || !email || !company || !role || !emailOk || !phoneOk) {
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn?.textContent || 'Enviar solicitud';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verificando...';
    }

    try {
      const pendingQuery = query(
        collection(db, 'demos'),
        where('email', '==', email),
        where('estado', '==', 'pendiente')
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      if (!pendingSnapshot.empty) {
        setError('error-email', true, 'Ya existe una solicitud pendiente con este correo.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
        return;
      }
    } catch (error) {
      console.warn('No se pudo verificar solicitudes previas:', error);
    }

    const telephone = `${prefix} ${phone}`;

    try {
      if (submitBtn) {
        submitBtn.textContent = 'Enviando...';
      }

      await addDoc(collection(db, 'demos'), {
        nombre: name,
        telefono: telephone,
        email,
        empresa: company,
        rol: role,
        estado: 'pendiente',
        origen: 'web',
        fechaCreacion: serverTimestamp()
      });

      await addDoc(collection(db, 'mail'), {
        to: ['jsoriano@bi2.mx', 'jsorglez@gmail.com'],
        replyTo: email,
        message: {
          subject: `Nueva solicitud de demo - ${name} (${company})`,
          html: `
            <h2 style="color:#0b1f33">Nueva solicitud de demo</h2>
            <table style="border-collapse:collapse;width:100%;max-width:560px;font-family:Arial,sans-serif">
              <tr><td style="padding:10px;background:#0b1f33;color:#fff;font-weight:700" colspan="2">Datos del prospecto</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb">Nombre</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${name}</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb">Empresa</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${company}</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb">Rol</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${role}</td></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb">Email</td><td style="padding:10px;border-bottom:1px solid #e5e7eb">${email}</td></tr>
              <tr><td style="padding:10px">Teléfono</td><td style="padding:10px">${telephone}</td></tr>
            </table>
          `
        }
      });

      form.reset();
      if (prefixDisplay) {
        prefixDisplay.value = '+52';
      }
      if (prefixSelect) {
        prefixSelect.value = '+52';
      }

      if (submitBtn) {
        submitBtn.textContent = 'Solicitud enviada';
        submitBtn.classList.remove('btn-accent');
        submitBtn.classList.add('btn-success');
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
          submitBtn.classList.remove('btn-success');
          submitBtn.classList.add('btn-accent');
        }, 3500);
      }
    } catch (error) {
      console.error(error);
      if (submitBtn) {
        submitBtn.textContent = 'Error al enviar';
        submitBtn.disabled = false;
        setTimeout(() => {
          submitBtn.textContent = originalLabel;
        }, 2500);
      }
    }
  });
});
