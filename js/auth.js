// ══════════════════════════════════════════════════════════
// AUTHENTICATION LOGIC
// ══════════════════════════════════════════════════════════
function toggleAuth(mode) {
  document.getElementById('login-box').style.display = mode === 'login' ? 'block' : 'none';
  document.getElementById('register-box').style.display = mode === 'register' ? 'block' : 'none';
}

async function doLogin() {
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;
  const btn = document.querySelector('#login-form button');
  try {
    btn.disabled = true; btn.innerHTML = '<i data-lucide="loader"></i> Entrando...'; 
    if(window.lucide) lucide.createIcons();
    await auth.signInWithEmailAndPassword(email, pass);
  } catch(e) {
    showToast("Erro: " + e.message, 4000, true);
    btn.disabled = false; btn.innerHTML = '<i data-lucide="log-in"></i> Entrar'; 
    if(window.lucide) lucide.createIcons();
  }
}

async function doRegister() {
  const email = document.getElementById('reg-email').value;
  const pass = document.getElementById('reg-pass').value;
  const btn = document.getElementById('btn-reg-submit');
  const cartorioNome = document.getElementById('reg-cartorio-nome').value || 'Cartório Sem Nome';
  const licenseKey = document.getElementById('reg-license').value.toUpperCase();

  btn.disabled = true; btn.textContent = 'Registrando...';
  window.isRegistering = true;

  try {
    const licSnap = await db.ref('licenses/' + licenseKey).once('value');
    if (!licSnap.exists() || licSnap.val() !== true) throw new Error("Licença inválida.");

    const userCred = await auth.createUserWithEmailAndPassword(email, pass);
    const targetCartorioId = db.ref('cartorios').push().key;

    await db.ref('users/' + userCred.user.uid).set({ email, cartorioId: targetCartorioId });
    await db.ref('cartorios/' + targetCartorioId).set({
      info: { nome: cartorioNome, criadoEm: firebase.database.ServerValue.TIMESTAMP, plano: 'profissional' },
      config: { caixas: DEFAULT_CAIXAS, operadores: DEFAULT_OPERADORES, labels: DEFAULT_LABELS }
    });
    await db.ref('licenses/' + licenseKey).remove();
    
    window.isRegistering = false;
    location.reload();
  } catch(e) {
    window.isRegistering = false;
    showToast("Erro: " + e.message, 4000, true);
    btn.disabled = false; btn.textContent = 'Registrar Cartório';
  }
}

function doLogout() {
  activeOperator = null;
  auth.signOut();
}
