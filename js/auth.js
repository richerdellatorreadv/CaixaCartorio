// ══════════════════════════════════════════════════════════
// AUTHENTICATION LOGIC
// ══════════════════════════════════════════════════════════
function toggleAuth(mode) {
  document.getElementById('login-box').style.display = mode === 'login' ? 'block' : 'none';
  document.getElementById('register-box').style.display = mode === 'register' ? 'block' : 'none';
}

function generateCode() {
  return 'CRT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
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
    showToast("Erro: " + getFriendlyAuthError(e.code), 4000, true);
    btn.disabled = false; btn.innerHTML = '<i data-lucide="log-in"></i> Entrar'; 
    if(window.lucide) lucide.createIcons();
  }
}

async function doRegister() {
  const email = document.getElementById('reg-email').value;
  const pass = document.getElementById('reg-pass').value;
  const btn = document.getElementById('btn-reg-submit');
  btn.disabled = true; btn.textContent = 'Registrando...';
  window.isRegistering = true;

  try {
    const licenseKey = document.getElementById('reg-license').value.toUpperCase();
    const licSnap = await db.ref('licenses/' + licenseKey).once('value');
    if (!licSnap.exists() || licSnap.val() !== true) {
      throw new Error("Chave de Licença inválida ou já utilizada.");
    }

    let planoDefinido = 'profissional';
    if (licenseKey.startsWith('BAS-')) planoDefinido = 'basico';

    const userCred = await auth.createUserWithEmailAndPassword(email, pass);
    const targetCartorioId = db.ref('cartorios').push().key;
    const targetCartorioCode = generateCode();
    const cartorioNome = document.getElementById('reg-cartorio-nome').value || 'Cartório Sem Nome';

    await db.ref('users/' + userCred.user.uid).set({ nome: "Administrador", email: email, cartorioId: targetCartorioId });
    
    await db.ref('cartorios/' + targetCartorioId).set({
      info: { nome: cartorioNome, codigoAcesso: targetCartorioCode, criadoEm: firebase.database.ServerValue.TIMESTAMP, plano: planoDefinido },
      config: { caixas: DEFAULT_CAIXAS, operadores: DEFAULT_OPERADORES, departamentos: [], sistemas: [], labels: DEFAULT_LABELS }
    });

    await db.ref('cartorio_codes/' + targetCartorioCode).set(targetCartorioId);
    await db.ref('licenses/' + licenseKey).remove();
    
    window.isRegistering = false;
    location.reload();
  } catch(e) {
    window.isRegistering = false;
    showToast("Erro ao registrar: " + (e.code ? getFriendlyAuthError(e.code) : e.message), 4000, true);
    btn.disabled = false; btn.textContent = 'Registrar Cartório';
  }
}

function doLogout() {
  activeOperator = null;
  auth.signOut();
}

function getFriendlyAuthError(code) {
  switch(code) {
    case 'auth/invalid-email': return 'E-mail inválido.';
    case 'auth/user-disabled': return 'Conta desativada.';
    case 'auth/user-not-found': return 'Usuário não encontrado.';
    case 'auth/wrong-password': return 'Senha incorreta.';
    default: return 'Erro na autenticação.';
  }
}
