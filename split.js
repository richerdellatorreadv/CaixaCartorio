const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync('index.html', 'utf8');

const scriptMatch = indexHtml.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("No script tag found!");
  process.exit(1);
}

const fullScript = scriptMatch[1];
const jsDir = path.join(__dirname, 'js');
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir);
}

// We will parse the script based on comments starting with // ═══
const parts = fullScript.split(/\/\/\s*═══\s*(.+?)\s*═══/g);

// parts[0] is everything before the first // ═══
// Then pairs of (sectionName, content)

let configContent = parts[0];
let authContent = '';
let utilsContent = '';
let uiContent = '';
let calcContent = '';
let dbContent = '';
let dashboardContent = '';

for (let i = 1; i < parts.length; i += 2) {
  const sectionName = parts[i].toUpperCase();
  const content = parts[i + 1];

  const fullContent = `// ═══ ${parts[i]} ═══\n${content}`;

  if (sectionName.includes('DEFAULT CONFIGURATION') || sectionName.includes('FIREBASE INIT') || sectionName.includes('CONFIGURAÇÃO MODAL')) {
    configContent += fullContent;
  } else if (sectionName.includes('AUTHENTICATION') || sectionName.includes('AUTH ONSTATECHANGED')) {
    authContent += fullContent;
  } else if (sectionName.includes('FUNÇÕES MATEMÁTICAS') || sectionName.includes('CÁLCULO E LÓGICA')) {
    calcContent += fullContent;
  } else if (sectionName.includes('UI & TABS') || sectionName.includes('ONBOARDING / PLANOS') || sectionName.includes('LANÇAMENTOS INDIVIDUAIS')) {
    uiContent += fullContent;
  } else if (sectionName.includes('DASHBOARD') || sectionName.includes('CHART')) {
    dashboardContent += fullContent;
  } else if (sectionName.includes('FIREBASE PERSISTENCE') || sectionName.includes('INIT') || sectionName.includes('DETECÇÃO DE CONEXÃO') || sectionName.includes('CADEADO')) {
    dbContent += fullContent;
  } else {
    // defaults to utils
    utilsContent += fullContent;
  }
}

fs.writeFileSync(path.join(jsDir, 'config.js'), configContent.trim());
fs.writeFileSync(path.join(jsDir, 'auth.js'), authContent.trim());
fs.writeFileSync(path.join(jsDir, 'calc.js'), calcContent.trim());
fs.writeFileSync(path.join(jsDir, 'ui.js'), uiContent.trim());
fs.writeFileSync(path.join(jsDir, 'dashboard.js'), dashboardContent.trim());
fs.writeFileSync(path.join(jsDir, 'main.js'), dbContent.trim());
fs.writeFileSync(path.join(jsDir, 'utils.js'), utilsContent.trim());

// Now replace the <script> block in index.html with multiple tags
const newTags = `
<script src="js/config.js"></script>
<script src="js/utils.js"></script>
<script src="js/auth.js"></script>
<script src="js/ui.js"></script>
<script src="js/calc.js"></script>
<script src="js/dashboard.js"></script>
<script src="js/main.js"></script>
`;

const updatedHtml = indexHtml.replace(/<script>[\s\S]*?<\/script>/, newTags.trim());
fs.writeFileSync('index.html', updatedHtml);

console.log("Successfully split the JavaScript files!");
