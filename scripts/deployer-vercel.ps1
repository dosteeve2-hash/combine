<#
.SYNOPSIS
    Pose les variables d'environnement de COMBINE sur Vercel et deploie `main`.

.DESCRIPTION
    Le connecteur Vercel de la session Claude est refuse en 403 sur
    `projectEnvVars` — en lecture comme en ecriture. La CLI `vercel`, elle, est
    authentifiee au nom de Steve : elle peut ce que la session ne peut pas.
    D'ou ce script.

    AUCUN SECRET N'EST ECRIT SUR DISQUE. La chaine Neon est demandee en saisie
    masquee et passee a `vercel env add` par l'entree standard ; le secret de
    session est genere ici et n'est jamais affiche.

.EXAMPLE
    pwsh -File .\scripts\deployer-vercel.ps1
    pwsh -File .\scripts\deployer-vercel.ps1 -Verifier   # ne modifie rien
#>
[CmdletBinding()]
param([switch]$Verifier)

$ErrorActionPreference = 'Stop'
function Titre($t) { Write-Host "`n$t" -ForegroundColor Cyan; Write-Host ('-' * $t.Length) -ForegroundColor DarkGray }
function Vert($t)  { Write-Host "  [ok] $t" -ForegroundColor Green }
function Rouge($t) { Write-Host "  [!!] $t" -ForegroundColor Red }
function Info($t)  { Write-Host "       $t" -ForegroundColor DarkGray }

Titre 'Prerequis'
foreach ($outil in 'vercel', 'node') {
    if (-not (Get-Command $outil -ErrorAction SilentlyContinue)) {
        Rouge "$outil est introuvable dans le PATH."
        Info  'vercel : npm i -g vercel'
        exit 1
    }
    Vert "$outil present"
}

$qui = (& vercel whoami 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0) { Rouge "vercel n'est pas connecte. Lance : vercel login"; exit 1 }
Vert "connecte en tant que $qui"

Titre 'Variables deja posees en production'
$existantes = (& vercel env ls production 2>&1 | Out-String)
$attendues  = 'DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL'
$manquantes = @($attendues | Where-Object { $existantes -notmatch [regex]::Escape($_) })

foreach ($v in $attendues) {
    if ($manquantes -contains $v) { Rouge "$v : absente" } else { Vert "$v : presente" }
}
if ($manquantes.Count -eq 0) { Info 'Rien a poser.' }

if ($Verifier) {
    Write-Host "`nMode verification : rien n'a ete modifie." -ForegroundColor Cyan
    exit 0
}

if ($manquantes -contains 'DATABASE_URL') {
    Titre 'DATABASE_URL'
    Info 'Console Neon > projet combine > Connect > Pooled connection.'
    Info 'La chaine se termine par sslmode=require. Elle ne s''affichera pas.'
    $secure = Read-Host 'Colle la chaine Neon' -AsSecureString
    $url = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))

    if ($url -notmatch '^postgres(ql)?://')   { Rouge "Ce n'est pas une chaine postgres://."; exit 1 }
    if ($url -notmatch 'sslmode=require')     { Rouge 'Il manque sslmode=require a la fin.'; exit 1 }
    if ($url -match 'localhost|127\.0\.0\.1') { Rouge "C'est une base locale, pas Neon."; exit 1 }
    Vert 'forme de la chaine correcte'

    $url | & vercel env add DATABASE_URL production
    if ($LASTEXITCODE -ne 0) { Rouge 'Echec de la pose.'; exit 1 }
    Vert 'DATABASE_URL posee'
    Remove-Variable url, secure
}

if ($manquantes -contains 'BETTER_AUTH_SECRET') {
    Titre 'BETTER_AUTH_SECRET'
    # Genere ici, jamais affiche, jamais ecrit sur disque.
    $secret = (& node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))").Trim()
    $secret | & vercel env add BETTER_AUTH_SECRET production
    if ($LASTEXITCODE -ne 0) { Rouge 'Echec de la pose.'; exit 1 }
    Vert 'BETTER_AUTH_SECRET genere et pose (32 octets, jamais affiche)'
    Remove-Variable secret
}

Titre 'Deploiement de main en production'
$sortie = (& vercel deploy --prod --yes 2>&1 | Out-String)
$trouve = [regex]::Matches($sortie, 'https://[A-Za-z0-9._-]+\.vercel\.app')
if ($trouve.Count -eq 0) { Rouge 'Aucune URL dans la sortie.'; Write-Host $sortie; exit 1 }
$adresse = $trouve[$trouve.Count - 1].Value
Vert "deploye : $adresse"

# BETTER_AUTH_URL doit correspondre AU CARACTERE PRES a l'URL servie, sinon les
# cookies de session sont rejetes et la connexion echoue SANS message d'erreur.
# C'est l'erreur numero un sur ce type de mise en ligne.
Titre 'BETTER_AUTH_URL'
if ($existantes -match 'BETTER_AUTH_URL') {
    Info 'Deja posee — verifie qu''elle vaut exactement :'
    Info "  $adresse"
} else {
    $adresse | & vercel env add BETTER_AUTH_URL production
    if ($LASTEXITCODE -ne 0) { Rouge 'Echec de la pose.'; exit 1 }
    Vert 'BETTER_AUTH_URL posee'
    Info "Un second deploiement est necessaire pour qu'elle soit lue au build."
    $sortie2 = (& vercel deploy --prod --yes 2>&1 | Out-String)
    $trouve2 = [regex]::Matches($sortie2, 'https://[A-Za-z0-9._-]+\.vercel\.app')
    if ($trouve2.Count -gt 0) { $adresse = $trouve2[$trouve2.Count - 1].Value }
    Vert "redeploye : $adresse"
}

Titre 'A verifier toi-meme — Regle numero 1'
Info "Ouvre $adresse et regarde :"
Info "  - la page d'accueil repond"
Info '  - /tarifs affiche les trois plans'
Info "  - /dossier/DEMO-0001 montre le bandeau « cette entreprise n'existe pas »"
Info '  - connexion avec fabrique@demo.combine.africa'
Info '  - a 375 px : aucune barre de defilement horizontale'
Write-Host ''
Info 'Si la connexion echoue en silence : BETTER_AUTH_URL ne correspond pas a'
Info "l'URL servie. C'est la cause dans neuf cas sur dix."
Write-Host ''
