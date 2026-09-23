<#
.SYNOPSIS
  Crée le dépôt GitHub `combine` et déploie COMBINE sur Vercel — en une commande.

.DESCRIPTION
  Pourquoi ce script existe : depuis une session Claude distante, deux actions sont
  structurellement impossibles.

    · Créer un dépôt sous un compte personnel — une GitHub App ne le peut pas,
      seul un jeton utilisateur le peut. (`POST /user/repos` → 403.)
    · Créer un projet Vercel — le connecteur est une intégration, pas ton compte.
      (`create_project` → 403, `get_auth_user` → « User not found ».)

  Mais `gh` et `vercel`, sur ta machine, sont authentifiés EN TON NOM. Ils font
  donc les deux sans difficulté. Ce script enchaîne tout, dans le bon ordre, et
  s'arrête proprement à la première erreur.

  Il est REJOUABLE : si le dépôt existe déjà, il pousse ; si le projet Vercel
  existe déjà, il redéploie. Les variables Production et le schéma sont prêts
  avant la poussée GitHub, pour qu'aucun build automatique ne parte trop tôt.

.EXAMPLE
  pwsh -File .\scripts\mise-en-ligne.ps1
#>

[CmdletBinding()]
param(
  [string]$Source      = "$PSScriptRoot\..",
  [string]$Destination = "$env:USERPROFILE\Documents\GitHub\combine",
  [string]$Depot       = 'dosteeve2-hash/combine',
  [string]$Projet      = 'combine',
  [switch]$PreparationSeule
)

$ErrorActionPreference = 'Stop'

$cheminSource = [System.IO.Path]::GetFullPath($Source).TrimEnd([char[]]@('\', '/'))
$cheminDestination = [System.IO.Path]::GetFullPath($Destination).TrimEnd([char[]]@('\', '/'))
if ([string]::Equals($cheminSource, $cheminDestination, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'Source et destination pointent vers le même dossier. Lance le script depuis le worktree source.'
}

function Etape($n, $texte) { Write-Host "`n[$n] $texte" -ForegroundColor Cyan }
function Ok($texte)        { Write-Host "    OK  $texte" -ForegroundColor Green }
function Info($texte)      { Write-Host "    ·   $texte" -ForegroundColor DarkGray }

# --------------------------------------------------------------- 0. pré-requis
Etape 0 'Outils et authentification'

$outilsRequis = if ($PreparationSeule) { @('git') } else { @('git', 'gh', 'vercel', 'node') }
foreach ($outil in $outilsRequis) {
  if (-not (Get-Command $outil -ErrorAction SilentlyContinue)) {
    throw "$outil est introuvable dans le PATH. Installe-le avant de relancer."
  }
}
Ok "$($outilsRequis -join ', ') présent(s)"

if (-not $PreparationSeule) {
  gh auth status 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "gh n'est pas connecté. Lance : gh auth login" }
  Ok 'gh authentifié'

  $etatGh = (gh auth status -h github.com 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0) { throw "Impossible de vérifier les permissions gh." }
  if ($etatGh -notmatch "'workflow'") {
    throw "Il manque le scope GitHub 'workflow'. Ajoute-le d'abord avec : gh auth refresh -h github.com -s workflow"
  }

  $compteVercel = (vercel whoami 2>&1)
  if ($LASTEXITCODE -ne 0) { throw "vercel n'est pas connecté. Lance : vercel login" }
  Ok "vercel authentifié ($compteVercel)"
}

# ------------------------------------------------------------- 1. les secrets
Etape 1 'Variables d''environnement'

# On ne met JAMAIS un secret en dur dans un fichier versionné : on le lit dans
# le .env.local local s'il existe, sinon on le demande.
function LireEnvLocal([string]$cle) {
  $fichier = Join-Path $Source '.env.local'
  if (-not (Test-Path $fichier)) { return $null }
  $ligne = Select-String -Path $fichier -Pattern "^$cle=" -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $ligne) { return $null }
  return ($ligne.Line -replace "^$cle=", '').Trim('"', "'")
}

function LireSecretConsole([string]$invite) {
  $secretSecurise = Read-Host -Prompt $invite -AsSecureString
  $pointeur = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretSecurise)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointeur)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointeur)
    $secretSecurise.Dispose()
  }
}

if ($PreparationSeule) {
  Info 'aucun secret ne sera lu ni transmis dans ce mode'
} else {
  $dbUrl = LireEnvLocal 'DATABASE_URL'
  if (-not $dbUrl -or $dbUrl -notmatch 'neon\.tech') {
    Write-Host '    Saisis la chaîne de connexion Neon du projet `combine`' -ForegroundColor Yellow
    Write-Host '    (console.neon.tech → projet combine → Connect → Pooled connection)' -ForegroundColor DarkGray
    $dbUrl = LireSecretConsole 'DATABASE_URL (saisie masquée)'
  }
  if ([string]::IsNullOrWhiteSpace($dbUrl)) { throw 'DATABASE_URL est vide.' }
  Ok 'DATABASE_URL reçue sans affichage'

  $resendKey  = LireEnvLocal 'RESEND_API_KEY'
  $resendFrom = LireEnvLocal 'RESEND_FROM_EMAIL'
  if ([bool]$resendKey -ne [bool]$resendFrom) {
    throw 'RESEND_API_KEY et RESEND_FROM_EMAIL doivent être renseignées ensemble dans .env.local.'
  }

  # Un secret d'authentification par environnement, différent aussi du local.
  $authSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
  Ok 'BETTER_AUTH_SECRET généré (32 octets, propre à la production)'
  $previewSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
  Ok 'BETTER_AUTH_SECRET isolé généré pour Preview'
}

# ------------------------------------------------------------ 2. le dépôt Git
Etape 2 "Dépôt $Depot"

$exclusDossiers = @('node_modules', '.next', '.git', '.vercel')
$exclusFichiers = @('.env.local', 'tsconfig.tsbuildinfo')

New-Item -ItemType Directory -Force -Path $Destination | Out-Null
robocopy $Source $Destination /E /XD $exclusDossiers /XF $exclusFichiers /NFL /NDL /NJH /NJS /NP | Out-Null
# robocopy rend 0..7 en cas de succès ; 8 et plus sont de vraies erreurs.
if ($LASTEXITCODE -ge 8) { throw "robocopy a échoué (code $LASTEXITCODE)" }
Ok "code copié vers $Destination"

Push-Location $Destination
try {
  if (-not (Test-Path '.git')) {
    git init -b main | Out-Null
    Ok 'dépôt git initialisé'
  }

  git add -A
  if ((git status --porcelain).Length -gt 0) {
    git commit -q -m 'COMBINE — le chemin du prototype au capital'
    Ok 'commit créé'
  } else {
    Info 'rien de nouveau à committer'
  }

  if ($PreparationSeule) {
    Write-Host "`nPréparation locale terminée. Aucun service distant, secret, push ou déploiement n'a été utilisé.`n" -ForegroundColor Green
    return
  }

  $existe = $false
  gh repo view $Depot 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { $existe = $true }

  if ($existe) {
    Info "$Depot existe déjà"
    $visibilite = gh repo view $Depot --json visibility --jq '.visibility'
    if ($LASTEXITCODE -ne 0) { throw 'Impossible de vérifier la visibilité du dépôt.' }
    if ($visibilite.Trim() -ne 'PRIVATE') {
      throw "Le dépôt $Depot est $visibilite. COMBINE doit rester privé tant qu'aucun feu vert n'a été donné pour le publier."
    }
    if (-not (git remote | Select-String -Quiet '^origin$')) {
      git remote add origin "https://github.com/$Depot.git"
    }
    $remoteAttendu = "https://github.com/$Depot.git"
    $origin = (git remote get-url origin 2>$null)
    if ($origin -and $origin.TrimEnd('/') -notin @($remoteAttendu, "git@github.com:$Depot.git", "ssh://git@github.com/$Depot.git")) {
      throw "Le remote origin ne pointe pas vers $Depot. Vérifie le dossier de destination avant de pousser."
    }
  } else {
    gh repo create $Depot --private --source=. --remote=origin
  }
  if ($LASTEXITCODE -ne 0) { throw 'la préparation du dépôt GitHub privé a échoué' }
  Ok "dépôt privé prêt : https://github.com/$Depot"

  # ------------------------------------------------------------ 3. Vercel
  Etape 3 "Projet Vercel $Projet"

  vercel link --yes --project $Projet | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'vercel link a échoué' }
  Ok 'projet lié (créé si besoin)'

  function VariablesVercel([string]$cible) {
    $sortie = (vercel env ls $cible --format json --no-color 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) { throw "Impossible de lire les variables Vercel de $cible." }
    $debutJson = $sortie.IndexOf('{')
    if ($debutJson -lt 0) { throw "Réponse JSON Vercel absente pour $cible." }
    try {
      return ($sortie.Substring($debutJson) | ConvertFrom-Json -ErrorAction Stop).envs
    }
    catch {
      throw "Réponse JSON Vercel invalide pour $cible."
    }
  }

  function VariablePresente([string]$nom, [string]$cible) {
    $variables = @(VariablesVercel $cible)
    return @($variables | Where-Object { $_.key -eq $nom -or $_.name -eq $nom }).Count -gt 0
  }

  function RetirerVariable([string]$nom, [string]$cible) {
    if (-not (VariablePresente $nom $cible)) { return }
    vercel env rm $nom $cible --yes 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Impossible de retirer $nom de Vercel $cible." }
    if (VariablePresente $nom $cible) { throw "$nom est encore présente sur Vercel $cible après son retrait." }
  }

  function PoserVariable([string]$nom, [string]$valeur, [string[]]$cibles) {
    foreach ($cible in $cibles) {
      # `vercel env rm` échoue si la variable n'existe pas : c'est sans gravité.
      RetirerVariable $nom $cible
      $valeur | vercel env add $nom $cible 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) { throw "Impossible de poser $nom pour $cible." }
    }
    Info "$nom configurée pour $($cibles -join ', ')"
  }

  PoserVariable 'DATABASE_URL'       $dbUrl @('production')
  PoserVariable 'BETTER_AUTH_SECRET' $authSecret @('production')
  PoserVariable 'DATABASE_URL' 'postgresql://combine:preview@127.0.0.1:5432/combine' @('preview')
  PoserVariable 'BETTER_AUTH_SECRET' $previewSecret @('preview')
  RetirerVariable 'BETTER_AUTH_URL' 'preview'
  RetirerVariable 'RESEND_API_KEY' 'preview'
  RetirerVariable 'RESEND_FROM_EMAIL' 'preview'
  RetirerVariable 'COMBINE_PASSERELLE_ACTIVE' 'production'
  RetirerVariable 'COMBINE_PASSERELLE_ACTIVE' 'preview'
  if (VariablePresente 'COMBINE_PASSERELLE_ACTIVE' 'production') {
    throw "La passerelle doit rester désactivée en Production tant que la limitation IP n’est pas configurée."
  }
  if ($resendKey -and $resendFrom) {
    PoserVariable 'RESEND_API_KEY'   $resendKey @('production')
    PoserVariable 'RESEND_FROM_EMAIL' $resendFrom @('production')
    Info "vérification de l'adresse e-mail activée en production"
  } else {
    Info 'sans Resend, les inscriptions de production restent fermées et les sessions non vérifiées sont bloquées'
  }

  Etape 4 'Migration additive du schéma Neon'
  $databaseUrlPrecedente = $env:DATABASE_URL
  try {
    $env:DATABASE_URL = $dbUrl
    node .\db\migrer.mjs
    if ($LASTEXITCODE -ne 0) { throw 'la migration du schéma a échoué' }
  }
  finally {
    if ($null -eq $databaseUrlPrecedente) {
      Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
    } else {
      $env:DATABASE_URL = $databaseUrlPrecedente
    }
  }
  Ok 'schéma idempotent appliqué'

  Etape 5 'Publication du code sur GitHub'
  git push -u origin main
  if ($LASTEXITCODE -ne 0) {
    throw 'la poussée a échoué. Pour le workflow CI, gh auth doit avoir le scope GitHub workflow.'
  }
  Ok "poussé sur https://github.com/$Depot"

  # L'URL n'est connue qu'après le premier déploiement, et BETTER_AUTH_URL doit
  # y correspondre au caractère près — sinon les cookies de session sont rejetés
  # et la connexion échoue SANS message d'erreur. D'où ce déploiement en deux
  # temps : on déploie, on lit l'URL, on la pose, on redéploie.
  Etape 6 'Premier déploiement (pour connaître l''URL)'
  # Deux pièges évités ici. `https://\S+` attraperait aussi l'URL d'inspection
  # `vercel.com/...` — on restreint donc à `*.vercel.app`. Et `-AllMatches` rend
  # un TABLEAU dès que deux URL partagent une ligne, ce que `vercel env add`
  # recevrait comme un objet au lieu d'une chaîne. D'où [regex] et l'index
  # explicite. Testé dans `scripts/test-mise-en-ligne.ps1`.
  $sortie      = (vercel deploy --prod --yes 2>&1 | Out-String)
  $occurrences = [regex]::Matches($sortie, 'https://[A-Za-z0-9._-]+\.vercel\.app')
  if ($occurrences.Count -eq 0) {
    Write-Host $sortie
    throw 'impossible de lire l''URL du déploiement dans la sortie ci-dessus'
  }
  $url = $occurrences[$occurrences.Count - 1].Value
  Ok $url

  Etape 7 'BETTER_AUTH_URL, puis déploiement définitif'
  PoserVariable 'BETTER_AUTH_URL' $url @('production')
  vercel deploy --prod --yes | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'le déploiement final a échoué' }

  Write-Host "`n═══════════════════════════════════════════════" -ForegroundColor Green
  Write-Host " COMBINE est en ligne : $url" -ForegroundColor Green
  Write-Host "═══════════════════════════════════════════════`n" -ForegroundColor Green
  Write-Host " Lien public vérifiable : $url/dossier/DEMO-0001`n"
  Write-Host ' Les identifiants de démonstration sont conservés hors du dépôt et des journaux.'
}
finally {
  $dbUrl = $null
  $authSecret = $null
  $previewSecret = $null
  $resendKey = $null
  $resendFrom = $null
  Pop-Location
}
