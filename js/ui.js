// ══════════════════════════════════════════════════════════
// CONFIGURATION & SETTINGS
// ══════════════════════════════════════════════════════════
function saveConfigCaixas() {
  if(!currentCartorioId) return;
  
  Promise.all([
    db.ref('cartorios/' + currentCartorioId + '/config/caixas').set(editingCaixas),
    db.ref('cartorios/' + currentCartorioId + '/config/operadores').set(editingOperadores)
  ]).then(() => {
    document.getElementById('settingsModal').style.display = 'none';
    location.reload();
  }).catch(e => alert("Erro: " + e.message));
}

function softReloadUI() {
    window._uiInitialized = false;
    const container = document.getElementById('pages-container');
    if(container) container.innerHTML = '';
    loadConfigAndBuildUI();
}
