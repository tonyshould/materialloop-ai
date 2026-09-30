param(
  [Parameter(Mandatory = $true)]
  [string]$FfmpegPath,
  [Parameter(Mandatory = $true)]
  [string]$FfprobePath
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$frameRoot = Join-Path $projectRoot ".artifacts-build\video-v2\frames"
$buildRoot = Join-Path $projectRoot ".artifacts-build\video-v2\render"
$outputRoot = Join-Path $projectRoot "submission"
$joinedVideo = Join-Path $buildRoot "joined.mp4"
$finalVideo = Join-Path $outputRoot "MaterialLoop_AI_Demo_Competition_V2.mp4"
$culture = [System.Globalization.CultureInfo]::InvariantCulture

New-Item -ItemType Directory -Force -Path $buildRoot, $outputRoot | Out-Null

$scenes = @(
  "Five hundred kilograms of aluminum. One wrong AI answer can turn reusable material into a safety risk, or into waste.",
  "MaterialLoop AI does something more useful than producing a confident sentence. It knows when the evidence is strong enough to act, and when the system must stop.",
  "Photos, certificates and process data enter one workflow. Gemini 2.5 Flash interprets the evidence on Vertex AI. Deterministic rules protect every value, impact and matching claim.",
  "When Case A provides a consistent photo, certificate and lot record, the system produces an auditable material passport. The synthetic result is thirty-five thousand five hundred New Taiwan dollars in second-life value, sixteen hundred kilograms of avoided carbon, and a ninety-two out of one hundred conditional match.",
  "Every field retains source, confidence and verification status. Gemini observes. Code calculates. Evidence gates. And a human remains in control before any outreach.",
  "But the strongest demo is refusal. With only a photo, Case B blocks financial value, carbon impact and buyer matching. Missing evidence is visible, not silently ignored.",
  "When the certificate contradicts the lot and composition totals one hundred two point four percent, Case C stops again. It never invents certainty to complete the screen.",
  "The stack is Google native. React and Express run on Cloud Run. Gemini runs through Vertex AI. Structured logs record each execution, with adapters ready for Cloud Storage and Firestore.",
  "The live deployment was smoke tested end to end with Gemini 2.5 Flash. Three independent runs produced ready, insufficient evidence and evidence conflict outcomes.",
  "The commercial path begins with paid factory pilots, then annual site licenses, and only expands after repeat use proves the workflow. We are building a defensible decision layer, not another speculative marketplace.",
  "MaterialLoop AI turns industrial leftovers into decision-ready value, only when the evidence earns it. Try the live prototype on Google Cloud Run."
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
$sceneDurations = @()

for ($index = 0; $index -lt $scenes.Count; $index++) {
  $sceneNumber = $index + 1
  $imagePath = Join-Path $frameRoot ("scene-{0:00}.png" -f $sceneNumber)
  $wavPath = Join-Path $buildRoot ("scene-{0:00}.wav" -f $sceneNumber)
  $mp4Path = Join-Path $buildRoot ("scene-{0:00}.mp4" -f $sceneNumber)

  if (-not (Test-Path -LiteralPath $imagePath)) {
    throw "Missing V2 story frame: $imagePath"
  }

  $synth.SetOutputToWaveFile($wavPath)
  $synth.Speak($scenes[$index])
  $synth.SetOutputToDefaultAudioDevice()

  $audioDurationText = & $FfprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $wavPath
  if ($LASTEXITCODE -ne 0) {
    throw "ffprobe failed for scene $sceneNumber audio"
  }

  $audioDuration = [double]::Parse($audioDurationText.Trim(), $culture)
  $audioDurationClean = $audioDuration.ToString("0.000", $culture)
  $sceneDuration = $audioDuration + 0.55
  $sceneDurations += $sceneDuration
  $frameCount = [Math]::Ceiling($sceneDuration * 30)
  $fadeOut = [Math]::Max(0.25, $sceneDuration - 0.35)
  $fadeOutText = $fadeOut.ToString("0.000", $culture)
  $sceneDurationText = $sceneDuration.ToString("0.000", $culture)

  if (($sceneNumber % 2) -eq 1) {
    $zoomExpression = "min(zoom+0.00065,1.065)"
  } else {
    $zoomExpression = "if(eq(on,1),1.065,max(1.0,zoom-0.00065))"
  }

  $videoFilter = "zoompan=z='$zoomExpression':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frameCount}:s=1920x1080:fps=30,fade=t=in:st=0:d=0.22,fade=t=out:st=${fadeOutText}:d=0.35,format=yuv420p"

  & $FfmpegPath -hide_banner -loglevel error -y `
    -loop 1 -framerate 30 -i $imagePath -i $wavPath `
    -filter_complex "[0:v]$videoFilter[v];[1:a]apad=pad_dur=0.55,afade=t=in:st=0:d=0.08,afade=t=out:st=${audioDurationClean}:d=0.45[a]" `
    -map "[v]" -map "[a]" -t $sceneDurationText `
    -c:v libx264 -preset medium -crf 18 -r 30 `
    -c:a aac -b:a 192k -movflags +faststart $mp4Path
  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg failed while rendering V2 scene $sceneNumber"
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
  -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k `
  -pix_fmt yuv420p -movflags +faststart $joinedVideo
if ($LASTEXITCODE -ne 0) {
  throw "ffmpeg failed while joining the V2 scenes"
}

$joinedDurationText = & $FfprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $joinedVideo
$joinedDuration = [double]::Parse($joinedDurationText.Trim(), $culture)
$joinedDurationArg = $joinedDuration.ToString("0.000", $culture)
$musicFadeOut = [Math]::Max(1, $joinedDuration - 1.8).ToString("0.000", $culture)
$musicSource = "aevalsrc=0.055*sin(2*PI*55*t)*(0.70+0.30*sin(2*PI*0.42*t))+0.028*sin(2*PI*82.41*t)+0.016*sin(2*PI*110*t):s=48000:d=$joinedDurationArg"

& $FfmpegPath -hide_banner -loglevel error -y `
  -i $joinedVideo -f lavfi -i $musicSource `
  -filter_complex "[0:a]volume=1.0[voice];[1:a]lowpass=f=520,highpass=f=35,afade=t=in:st=0:d=1.2,afade=t=out:st=${musicFadeOut}:d=1.8,volume=0.13[bed];[voice][bed]amix=inputs=2:duration=first:dropout_transition=1,loudnorm=I=-16:TP=-1.5:LRA=11[a]" `
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 224k `
  -movflags +faststart $finalVideo
if ($LASTEXITCODE -ne 0) {
  throw "ffmpeg failed while mixing the V2 soundtrack"
}

$durationText = & $FfprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $finalVideo
$durationSeconds = [double]::Parse($durationText.Trim(), $culture)
if ($durationSeconds -ge 180) {
  throw ("V2 demo video is too long: {0:N2} seconds" -f $durationSeconds)
}

[PSCustomObject]@{
  Video = $finalVideo
  DurationSeconds = [Math]::Round($durationSeconds, 2)
  Voice = if ($englishVoice) { $englishVoice.VoiceInfo.Name } else { "System default" }
  SceneCount = $scenes.Count
  Resolution = "1920x1080"
  Soundtrack = "Original synthesized ambient bed"
} | ConvertTo-Json
