// ═══ AUTHENTICATION LOGIC ═══
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
    btn.disabled = true; btn.innerHTML = '<i data-lucide="loader"></i> Entrando...'; lucide.createIcons();
    await auth.signInWithEmailAndPassword(email, pass);
    btn.disabled = false; btn.innerHTML = '<i data-lucide="log-in"></i> Entrar'; lucide.createIcons();
  } catch(e) {
    showToast("Erro: " + getFriendlyAuthError(e.code), 4000, true);
    btn.disabled = false; btn.innerHTML = '<i data-lucide="log-in"></i> Entrar'; lucide.createIcons();
  }
}
async function doRegister() {
  const email = document.getElementById('reg-email').value;
  const pass = document.getElementById('reg-pass').value;
  const btn = document.getElementById('btn-reg-submit');
  btn.disabled = true; btn.textContent = 'Registrando...';
  window.isRegistering = true;

  try {
    let targetCartorioId = null;
    let targetCartorioCode = null;
    const licenseKey = document.getElementById('reg-license').value.toUpperCase();
    const licSnap = await db.ref('licenses/' + licenseKey).once('value');
    if (!licSnap.exists() || licSnap.val() !== true) {
      throw new Error("Chave de Licença inválida ou já utilizada.");
    }

    let planoDefinido = 'profissional';
    if (licenseKey.startsWith('BAS-')) planoDefinido = 'basico';
    if (licenseKey.startsWith('PER-')) planoDefinido = 'personalizado';

    // Create Auth User
    const userCred = await auth.createUserWithEmailAndPassword(email, pass);
    
    // Generate IDs
    targetCartorioId = db.ref('cartorios').push().key;
    targetCartorioCode = generateCode();

    const cartorioNome = document.getElementById('reg-cartorio-nome').value || 'Cartório Sem Nome';
    const cfg = buildConfigFromServentias(Array.from(_selectedServentias));
    
    // Passo 1: Salvar a vinculação do usuário (permite que a regra root.child('users') funcione no próximo passo)
    await db.ref('users/' + userCred.user.uid).set({ nome: "Administrador", email: email, cartorioId: targetCartorioId });
    
    // Passo 2: Salvar o cartório e suas configurações
    await db.ref('cartorios/' + targetCartorioId).set({
      info: { 
        nome: cartorioNome, 
        codigoAcesso: targetCartorioCode, 
        criadoEm: firebase.database.ServerValue.TIMESTAMP, 
        plano: planoDefinido 
      },
      config: {
        caixas: cfg.caixas,
        operadores: DEFAULT_OPERADORES,
        departamentos: cfg.departamentos,
        sistemas: cfg.sistemas,
        labels: DEFAULT_LABELS
      }
    });

    // Passo 3: Salvar o código de acesso e queimar a licença
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
  if (currentCartorioId && window._sessionPresenceRef) {
    window._sessionPresenceRef.remove();
  }
  localStorage.removeItem('activeOperatorId');
  activeOperator = null;
  auth.signOut();
}
function copyCartorioCode() {
  if(cartorioCode) {
    navigator.clipboard.writeText(cartorioCode);
    showToast("Código copiado!");
  }
}
