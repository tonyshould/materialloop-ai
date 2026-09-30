param([string]$ProjectId = $env:GOOGLE_CLOUD_PROJECT)

$ErrorActionPreference = "Stop"
$gcloud = (Get-Command gcloud -ErrorAction SilentlyContinue).Source
if (-not $gcloud) {
  $localGcloud = Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
  if (Test-Path -LiteralPath $localGcloud) { $gcloud = $localGcloud }
}
if (-not $gcloud) {
  Write-Error "Google Cloud CLI is not installed. Install it from https://cloud.google.com/sdk/docs/install-sdk and reopen PowerShell."
}

$account = & $gcloud auth list --filter=status:ACTIVE --format="value(account)"
if (-not $account) {
  Write-Error "No active gcloud account. Run: gcloud init"
}

if (-not $ProjectId) {
  $ProjectId = & $gcloud config list --format="value(core.project)"
}
if (-not $ProjectId -or $ProjectId -eq "(unset)") {
  Write-Error "No Google Cloud project selected. Pass -ProjectId or run: gcloud config set project YOUR_PROJECT_ID"
}

& $gcloud projects describe $ProjectId --format="value(projectId)" 1>$null
& $gcloud auth application-default print-access-token 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Application Default Credentials are missing. Run: gcloud auth application-default login"
}

$billingEnabled = & $gcloud billing projects describe $ProjectId --format="value(billingEnabled)" 2>$null
$vertexEnabled = & $gcloud services list --project=$ProjectId --enabled --filter="name:aiplatform.googleapis.com" --format="value(name)"

[pscustomobject]@{
  Status = if ($billingEnabled -eq "True" -and $vertexEnabled) { "READY" } else { "ACTION_REQUIRED" }
  Account = $account
  ProjectId = $ProjectId
  BillingEnabled = $billingEnabled
  VertexAiEnabled = [bool]$vertexEnabled
  Adc = "READY"
} | Format-List

if ($billingEnabled -ne "True") {
  Write-Warning "Billing is not enabled for $ProjectId."
}
if (-not $vertexEnabled) {
  Write-Warning "Vertex AI API is not enabled. Run: gcloud services enable aiplatform.googleapis.com --project=$ProjectId"
}
