param(
  [Parameter(Mandatory = $true)]
  [string]$FfmpegPath,
  [Parameter(Mandatory = $true)]
  [string]$FfprobePath
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$previewRoot = Join-Path $projectRoot ".artifacts-build\previews"
$buildRoot = Join-Path $projectRoot ".artifacts-build\video"
$outputRoot = Join-Path $projectRoot "submission"
$finalVideo = Join-Path $outputRoot "MaterialLoop_AI_Demo_2min45max.mp4"

New-Item -ItemType Directory -Force -Path $buildRoot, $outputRoot | Out-Null

$scenes = @(
  @{
    Slide = "slide-1.png"
    Text = "MaterialLoop AI turns uncertain industrial by-products into auditable reuse decisions. This is our Google Cloud AI Builder Cup prototype in the Sustainability and Social Impact track."
  },
  @{
    Slide = "slide-2.png"
    Text = "Today, reuse decisions often depend on scattered files, expert judgment, and slow back-and-forth. A false positive can create safety and compliance risk. A false negative sends valuable material to disposal. The real challenge is not producing a confident answer. It is knowing when the evidence is strong enough to act."
  },
  @{
    Slide = "slide-4.png"
    Text = "The prototype runs on Google Cloud Run. Gemini 2.5 Flash on Vertex AI converts unstructured evidence into a strict JSON assessment. A deterministic policy engine then applies thresholds, provenance rules, and conflict checks. Cloud Logging records every execution. Firestore and Cloud Storage adapters are ready for permanent audit retention after the production region is approved."
  },
  @{
    Slide = "slide-5.png"
    Text = "In Case A, the user uploads a consistent, high-quality evidence set. MaterialLoop extracts the relevant signals, evaluates reuse feasibility, and returns a ready decision with confidence, risk, route, and next actions. The important part is separation of duties: Gemini interprets the evidence, while code enforces the final decision policy. The interface exposes the model, execution ID, and decision trace instead of hiding them."
  },
  @{
    Slide = "slide-6.png"
    Text = "Case B proves that the system can refuse. When evidence is incomplete, the result is insufficient evidence, with a request for the missing tests. Case C proves that it can detect contradictions. Conflicting evidence produces an evidence conflict decision rather than a fabricated recommendation. These refusal paths are first-class product behavior, not error screens."
  },
  @{
    Slide = "slide-7.png"
    Text = "The live deployment has been verified end to end with Gemini 2.5 Flash. Three separate runs produced ready, insufficient evidence, and evidence conflict outcomes. The public Cloud Run service is available for judging, while production secrets remain outside the repository in Google Cloud configuration."
  },
  @{
    Slide = "slide-8.png"
    Text = "The commercial path starts with paid pilots for recyclers and manufacturers. Pricing combines onboarding, per-site subscription, and optional audit integration. The wedge is a faster, safer decision package. The long-term asset is a reusable evidence-to-decision engine for regulated material workflows."
  },
  @{
    Slide = "slide-9.png"
    Text = "MaterialLoop AI makes uncertainty visible, creates an auditable trail, and only recommends action when the evidence earns it. The live prototype and public source repository are provided with this submission."
  }
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$englishVoice = $synth.GetInstalledVoices() |
  Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -like "en-*" } |
  Select-Object -First 1
if ($englishVoice) {
  $synth.SelectVoice($englishVoice.VoiceInfo.Name)
}
$synth.Rate = 1
$synth.Volume = 100

$sceneFiles = @()
for ($index = 0; $index -lt $scenes.Count; $index++) {
  $sceneNumber = $index + 1
  $scene = $scenes[$index]
  $imagePath = Join-Path $previewRoot $scene.Slide
  $wavPath = Join-Path $buildRoot ("scene-{0:00}.wav" -f $sceneNumber)
  $mp4Path = Join-Path $buildRoot ("scene-{0:00}.mp4" -f $sceneNumber)

  if (-not (Test-Path -LiteralPath $imagePath)) {
    throw "Missing slide preview: $imagePath"
  }

  $synth.SetOutputToWaveFile($wavPath)
  $synth.Speak($scene.Text)
  $synth.SetOutputToDefaultAudioDevice()

  & $FfmpegPath -hide_banner -loglevel error -y `
    -loop 1 -framerate 30 -i $imagePath -i $wavPath `
    -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p,fade=t=in:st=0:d=0.35" `
    -c:v libx264 -preset medium -tune stillimage -r 30 `
    -c:a aac -b:a 192k -shortest -movflags +faststart $mp4Path
  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg failed while rendering scene $sceneNumber"
  }
  $sceneFiles += $mp4Path
}

$synth.Dispose()

$concatPath = Join-Path $buildRoot "concat.txt"
$concatLines = $sceneFiles | ForEach-Object {
  "file '" + ($_.Replace("'", "'\''")) + "'"
}
[System.IO.File]::WriteAllLines($concatPath, $concatLines, [System.Text.UTF8Encoding]::new($false))

& $FfmpegPath -hide_banner -loglevel error -y `
  -f concat -safe 0 -i $concatPath `
  -c:v libx264 -preset medium -c:a aac -b:a 192k `
  -pix_fmt yuv420p -movflags +faststart $finalVideo
if ($LASTEXITCODE -ne 0) {
  throw "ffmpeg failed while concatenating the final video"
}

$durationText = & $FfprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $finalVideo
if ($LASTEXITCODE -ne 0) {
  throw "ffprobe failed while validating the final video"
}

$durationSeconds = [double]::Parse($durationText.Trim(), [System.Globalization.CultureInfo]::InvariantCulture)
if ($durationSeconds -ge 180) {
  throw ("Demo video is too long: {0:N2} seconds" -f $durationSeconds)
}

[PSCustomObject]@{
  Video = $finalVideo
  DurationSeconds = [Math]::Round($durationSeconds, 2)
  Voice = if ($englishVoice) { $englishVoice.VoiceInfo.Name } else { "System default" }
  SceneCount = $scenes.Count
} | ConvertTo-Json
