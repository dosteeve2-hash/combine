<#
  Vérifie les deux fonctions de `mise-en-ligne.ps1` qu'on ne peut pas éprouver
  sans `gh` ni `vercel` : la lecture du `.env.local` et l'extraction de l'URL de
  déploiement. Le reste du script est de l'enchaînement de commandes.

    pwsh -File .\scripts\test-mise-en-ligne.ps1
#>
$Source = Join-Path ([System.IO.Path]::GetTempPath()) "combine-test-$([guid]::NewGuid())"
New-Item -ItemType Directory -Force -Path $Source | Out-Null
@'
DATABASE_URL="postgresql://u:p@example.invalid/neondb?sslmode=require"
BETTER_AUTH_SECRET=abc
'@ | Set-Content (Join-Path $Source '.env.local')

function LireEnvLocal([string]$cle) {
  $fichier = Join-Path $Source '.env.local'
  if (-not (Test-Path $fichier)) { return $null }
  $ligne = Select-String -Path $fichier -Pattern "^$cle=" -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $ligne) { return $null }
  return ($ligne.Line -replace "^$cle=", '').Trim('"', "'")
}

$echecs = 0
function Verifier($nom, $condition, $detail) {
  if ($condition) { Write-Host "  OK  $nom" -ForegroundColor Green }
  else { Write-Host "  ECHEC $nom — $detail" -ForegroundColor Red; $script:echecs++ }
}

$v = LireEnvLocal 'DATABASE_URL'
Verifier 'lecture du .env.local' ($v -match 'example\.invalid') 'valeur attendue non chargée'
Verifier 'guillemets retires' (-not $v.StartsWith('"')) 'les guillemets sont encore présents'
Verifier 'cle absente rend null' ($null -eq (LireEnvLocal 'INEXISTANTE')) 'non nul'

# Cas piegeux : deux URL, dont une non-vercel.app, sur des lignes differentes
$sortie = "Inspect: https://vercel.com/dosteeve2-8163s-projects/combine/abc`nProduction: https://combine-abc-dosteeve2.vercel.app [2s]`n"
$occ = [regex]::Matches($sortie, 'https://[A-Za-z0-9._-]+\.vercel\.app')
$url = $occ[$occ.Count - 1].Value
Verifier 'URL extraite' ($url -eq 'https://combine-abc-dosteeve2.vercel.app') $url
Verifier 'le resultat est une chaine, pas un tableau' ($url -is [string]) $url.GetType().Name

# Contre-epreuve : l ancienne methode
$ancien = ($sortie -split "`n" | Select-String -Pattern 'https://\S+' -AllMatches | Select-Object -Last 1).Matches.Value
Write-Host "  (ancienne methode : type = $($ancien.GetType().Name))" -ForegroundColor DarkGray

if ($echecs -gt 0) { exit 1 }
$racineTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\') + '\'
$cibleTemp = [System.IO.Path]::GetFullPath($Source)
if (-not $cibleTemp.StartsWith($racineTemp, [StringComparison]::OrdinalIgnoreCase) -or
    -not [System.IO.Path]::GetFileName($cibleTemp).StartsWith('combine-test-', [StringComparison]::OrdinalIgnoreCase)) {
  throw 'Le dossier temporaire de test est hors de la cible attendue.'
}
Remove-Item -LiteralPath $cibleTemp -Recurse -Force
Write-Host "`n$($echecs) echec(s)." -ForegroundColor Green
