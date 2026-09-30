param([string]$Version = "2026-09-28")

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$deliveryRoot = Join-Path $projectRoot "delivery"
$stagingRoot = Join-Path $projectRoot ".delivery-staging"
$archiveName = "MaterialLoop_AI_GoogleCloud_Source_$Version.zip"
$archivePath = Join-Path $deliveryRoot $archiveName
$hashPath = "$archivePath.sha256.txt"

foreach ($target in @($deliveryRoot, $stagingRoot)) {
  $resolvedParent = [System.IO.Path]::GetFullPath((Split-Path $target -Parent))
  if ($resolvedParent -ne $projectRoot) {
    throw "Refusing to modify a path outside the project: $target"
  }
}

New-Item -ItemType Directory -Force -Path $deliveryRoot | Out-Null
if (Test-Path -LiteralPath $stagingRoot) {
  Remove-Item -LiteralPath $stagingRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $stagingRoot | Out-Null

$excludedDirectories = @("node_modules", "dist", "dist-server", "tmp", "delivery", ".delivery-staging", ".git", "coverage")
$excludedFiles = @(".env", ".env.local")

Get-ChildItem -LiteralPath $projectRoot -Recurse -File | Where-Object {
  $relative = $_.FullName.Substring($projectRoot.Length + 1)
  $segments = $relative -split '[\\/]'
  -not ($segments | Where-Object { $_ -in $excludedDirectories }) -and $_.Name -notin $excludedFiles
} | ForEach-Object {
  $relative = $_.FullName.Substring($projectRoot.Length + 1)
  $destination = Join-Path $stagingRoot $relative
  New-Item -ItemType Directory -Force -Path (Split-Path $destination -Parent) | Out-Null
  Copy-Item -LiteralPath $_.FullName -Destination $destination
}

if (Test-Path -LiteralPath $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}
Compress-Archive -Path (Join-Path $stagingRoot "*") -DestinationPath $archivePath -CompressionLevel Optimal
$sha256 = [System.Security.Cryptography.SHA256]::Create()
$stream = [System.IO.File]::OpenRead($archivePath)
try {
  $hash = ([System.BitConverter]::ToString($sha256.ComputeHash($stream))).Replace("-", "").ToLowerInvariant()
} finally {
  $stream.Dispose()
  $sha256.Dispose()
}
"$hash  $archiveName" | Set-Content -LiteralPath $hashPath -Encoding ascii
Remove-Item -LiteralPath $stagingRoot -Recurse -Force

[pscustomobject]@{
  Archive = $archivePath
  Sha256 = $hash
  Bytes = (Get-Item -LiteralPath $archivePath).Length
  SecretsIncluded = $false
} | Format-List
