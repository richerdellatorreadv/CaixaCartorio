$content = Get-Content -Path "index.html" -Raw

if ($content -match '(?s)<script>(.*?)</script>') {
    $scriptContent = $matches[1]
    
    if (!(Test-Path "js")) {
        New-Item -ItemType Directory -Path "js" | Out-Null
    }

    $parts = $scriptContent -split '(?=// ═══)'
    
    $configContent = ""
    $authContent = ""
    $utilsContent = ""
    $uiContent = ""
    $calcContent = ""
    $dbContent = ""
    $dashboardContent = ""

    foreach ($part in $parts) {
        $upper = $part.ToUpper()
        
        if ($upper.Contains('DEFAULT CONFIGURATION') -or $upper.Contains('FIREBASE INIT') -or $upper.Contains('CONFIGURAÇÃO MODAL')) {
            $configContent += $part
        } elseif ($upper.Contains('AUTHENTICATION') -or $upper.Contains('AUTH ONSTATECHANGED')) {
            $authContent += $part
        } elseif ($upper.Contains('FUNÇÕES MATEMÁTICAS') -or $upper.Contains('CÁLCULO E LÓGICA')) {
            $calcContent += $part
        } elseif ($upper.Contains('UI & TABS') -or $upper.Contains('ONBOARDING / PLANOS') -or $upper.Contains('LANÇAMENTOS INDIVIDUAIS')) {
            $uiContent += $part
        } elseif ($upper.Contains('DASHBOARD') -or $upper.Contains('CHART')) {
            $dashboardContent += $part
        } elseif ($upper.Contains('FIREBASE PERSISTENCE') -or $upper.Contains('INIT') -or $upper.Contains('DETECÇÃO DE CONEXÃO') -or $upper.Contains('CADEADO')) {
            $dbContent += $part
        } else {
            $utilsContent += $part
        }
    }

    Set-Content -Path "js\config.js" -Value $configContent.Trim()
    Set-Content -Path "js\auth.js" -Value $authContent.Trim()
    Set-Content -Path "js\calc.js" -Value $calcContent.Trim()
    Set-Content -Path "js\ui.js" -Value $uiContent.Trim()
    Set-Content -Path "js\dashboard.js" -Value $dashboardContent.Trim()
    Set-Content -Path "js\main.js" -Value $dbContent.Trim()
    Set-Content -Path "js\utils.js" -Value $utilsContent.Trim()

    $newTags = @"
<script src="js/config.js"></script>
<script src="js/utils.js"></script>
<script src="js/auth.js"></script>
<script src="js/ui.js"></script>
<script src="js/calc.js"></script>
<script src="js/dashboard.js"></script>
<script src="js/main.js"></script>
"@

    $newContent = $content -replace '(?s)<script>.*?</script>', $newTags
    Set-Content -Path "index.html" -Value $newContent
    
    Write-Host "JavaScript files successfully split!"
} else {
    Write-Host "Could not find script block"
}
