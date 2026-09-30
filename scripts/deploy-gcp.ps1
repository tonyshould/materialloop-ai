param(
  [Parameter(Mandatory = $true)][string]$ProjectId,
  [string]$Region = "asia-east1",
  [string]$GeminiLocation = "global",
  [string]$GeminiModel = "gemini-2.5-flash",
  [switch]$EnablePersistence,
  [switch]$CreateFirestoreIfMissing
)

$ErrorActionPreference = "Stop"
$serviceName = "materialloop-ai"
$bucketName = "$ProjectId-materialloop-evidence"
$repository = "materialloop"
$serviceAccountName = "materialloop-runtime"
$serviceAccountEmail = "$serviceAccountName@$ProjectId.iam.gserviceaccount.com"
$imageTag = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")
$imageUri = "$Region-docker.pkg.dev/$ProjectId/$repository/materialloop-ai`:$imageTag"
$gcloud = (Get-Command gcloud -ErrorAction SilentlyContinue).Source
if (-not $gcloud) {
  $localGcloud = Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
  if (Test-Path -LiteralPath $localGcloud) { $gcloud = $localGcloud }
}
if (-not $gcloud) { throw "Google Cloud CLI is not installed." }

& $gcloud config set project $ProjectId
& $gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com aiplatform.googleapis.com firestore.googleapis.com storage.googleapis.com logging.googleapis.com

$repositoryExists = & $gcloud artifacts repositories list --location=$Region --filter="name:$repository" --format="value(name)" --quiet
if (-not $repositoryExists) {
  & $gcloud artifacts repositories create $repository --repository-format=docker --location=$Region --description="MaterialLoop AI containers"
}

$serviceAccountExists = & $gcloud iam service-accounts list --filter="email:$serviceAccountEmail" --format="value(email)" --quiet
if (-not $serviceAccountExists) {
  & $gcloud iam service-accounts create $serviceAccountName --display-name="MaterialLoop AI runtime"
}

& $gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$serviceAccountEmail" --role="roles/aiplatform.user" --quiet

$buildServiceAccount = & $gcloud builds get-default-service-account --project=$ProjectId
& $gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$buildServiceAccount" --role="roles/artifactregistry.writer" --quiet

$persistResults = "false"
if ($EnablePersistence) {
  $bucketExists = & $gcloud storage buckets list --filter="name:$bucketName" --format="value(name)" --quiet
  if (-not $bucketExists) {
    & $gcloud storage buckets create "gs://$bucketName" --location=$Region --uniform-bucket-level-access
  }
  & $gcloud storage buckets add-iam-policy-binding "gs://$bucketName" --member="serviceAccount:$serviceAccountEmail" --role="roles/storage.objectUser" --quiet
  & $gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$serviceAccountEmail" --role="roles/datastore.user" --quiet

  $firestoreDatabase = & $gcloud firestore databases list --project=$ProjectId --filter="name:(default)" --format="value(name)"
  if (-not $firestoreDatabase) {
    if (-not $CreateFirestoreIfMissing) {
      throw "Persistence requested but Firestore does not exist. Re-run with -CreateFirestoreIfMissing after confirming the permanent database location: $Region."
    }
    & $gcloud firestore databases create --project=$ProjectId --database="(default)" --location=$Region --type=firestore-native
  }
  $persistResults = "true"
}

& $gcloud builds submit --project=$ProjectId --tag=$imageUri .
& $gcloud run deploy $serviceName `
  --project=$ProjectId `
  --image=$imageUri `
  --region=$Region `
  --platform=managed `
  --allow-unauthenticated `
  --service-account=$serviceAccountEmail `
  --set-env-vars="ANALYZER_PROVIDER=gemini,GOOGLE_CLOUD_PROJECT=$ProjectId,GOOGLE_CLOUD_LOCATION=$GeminiLocation,GEMINI_MODEL=$GeminiModel,GCS_BUCKET=$bucketName,FIRESTORE_COLLECTION=materialloop_runs,PERSIST_RESULTS=$persistResults"

Write-Host "Deployment completed for $serviceName in project $ProjectId."
Write-Host "Runtime identity: $serviceAccountEmail"
Write-Host "Persistence enabled: $persistResults"
