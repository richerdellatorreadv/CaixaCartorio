// ══════════════════════════════════════════════════════════
// CONFIGURATION & SETTINGS
// ══════════════════════════════════════════════════════════

function saveConfigCaixas() {
  if(!currentCartorioId) return;
  if(editingCaixas.length === 0) { alert("Você precisa ter pelo menos um caixa."); return; }
  if(editingOperadores.length === 0) { alert("Você precisa ter pelo menos um operador."); return; }
  
  editingLabels = {
    maquininha: document.getElementById('cfg-label-maq').value || 'Operadora',
    saida_patrimonial: document.getElementById('cfg-label-patrimonio').value || 'Retirada/Sócio'
  };

  configOperadoresPodemDestravar = document.getElementById('cfg-lock-permission').checked;

  salvarDados(false); // Salva os dados financeiros pendentes antes de mudar a config
  
  Promise.all([
    db.ref('cartorios/' + currentCartorioId + '/config/caixas').set(editingCaixas),
    db.ref('cartorios/' + currentCartorioId + '/config/operadores').set(editingOperadores),
    db.ref('cartorios/' + currentCartorioId + '/config/labels').set(editingLabels),
    db.ref('cartorios/' + currentCartorioId + '/config/departamentos').set(editingDepartamentos),
    db.ref('cartorios/' + currentCartorioId + '/config/sistemas').set(editingSistemas),
    db.ref('cartorios/' + currentCartorioId + '/config/lockPermission').set(configOperadoresPodemDestravar)
  ]).then(() => {
    closeModal('settingsModal');
    softReloadUI();
    showToast('✓ Configurações salvas!');
  }).catch(e => {
    alert("Erro ao salvar configurações na nuvem: " + e.message);
    softReloadUI();
  });
}

function softReloadUI() {
    // Only reload UI if not in auth mode
    if (document.body.classList.contains('auth-mode')) return;
    
    window._uiInitialized = false;
    const container = document.getElementById('pages-container');
    if(container) container.innerHTML = '';
    loadConfigAndBuildUI();
    calcularTudo();
}
