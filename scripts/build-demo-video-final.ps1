param(
  [Parameter(Mandatory = $true)]
  [string]$FfmpegPath,
  [Parameter(Mandatory = $true)]
  [string]$FfprobePath
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$frameRoot = Join-Path $projectRoot ".artifacts-build\video-v2\frames"
$buildRoot = Join-Path $projectRoot ".artifacts-build\video-final\render"
$outputRoot = Join-Path $projectRoot "submission"
$culture = [System.Globalization.CultureInfo]::InvariantCulture

New-Item -ItemType Directory -Force -Path $buildRoot, $outputRoot | Out-Null

$scenes = @(
  [PSCustomObject]@{ Frame = 1; Text = "Five hundred kilograms of aluminum. One wrong AI answer can turn reusable material into a safety risk, or into waste." },
  [PSCustomObject]@{ Frame = 2; Text = "MaterialLoop AI does something more useful than producing a confident sentence. It knows when the evidence is strong enough to act, and when the system must stop." },
  [PSCustomObject]@{ Frame = 3; Text = "Photos, certificates and process data enter one workflow. Gemini 2.5 Flash interprets the evidence on Vertex AI. Deterministic rules protect every value, impact and matching claim." },
  [PSCustomObject]@{ Frame = 4; Text = "When Case A provides a consistent photo, certificate and lot record, the system produces an auditable material passport. The synthetic result is thirty-five thousand five hundred New Taiwan dollars in second-life value, sixteen hundred kilograms of avoided carbon, and a ninety-two out of one hundred conditional match." },
  [PSCustomObject]@{ Frame = 5; Text = "Every field retains source, confidence and verification status. Gemini observes. Code calculates. Evidence gates. And a human remains in control before any outreach." },
  [PSCustomObject]@{ Frame = 6; Text = "But the strongest demo is refusal. With only a photo, Case B blocks financial value, carbon impact and buyer matching. Missing evidence is visible, not silently ignored." },
  [PSCustomObject]@{ Frame = 7; Text = "When the certificate contradicts the lot and composition totals one hundred two point four percent, Case C stops again. It never invents certainty to complete the screen." },
  [PSCustomObject]@{ Frame = 8; Text = "The stack is Google native. React and Express run on Cloud Run. Gemini runs through Vertex AI. Structured logs record each execution, with adapters ready for Cloud Storage and Firestore." },
  [PSCustomObject]@{ Frame = 9; Text = "The live deployment was smoke tested end to end with Gemini 2.5 Flash. Three independent runs produced ready, insufficient evidence and evidence conflict outcomes." },
  [PSCustomObject]@{ Frame = 10; Text = "The commercial path begins with paid factory pilots, then annual site licenses, and only expands after repeat use proves the workflow. We are building a defensible decision layer, not another speculative marketplace." },
  [PSCustomObject]@{ Frame = 11; Text = "MaterialLoop AI turns industrial leftovers into decision-ready value, only when the evidence earns it. Try the live prototype on Google Cloud Run." },
  [PSCustomObject]@{ Frame = 9; Text = "A pilot is measured with operational evidence, not vanity metrics. We compare review time, evidence completeness, blocked unsafe decisions, recovered material value and avoided carbon before and after deployment." },
  [PSCustomObject]@{ Frame = 5; Text = "That creates a human review loop. Operators can see why a recommendation passed, which source supports it, what is still missing and exactly where responsibility remains with the reviewer." },
  [PSCustomObject]@{ Frame = 10; Text = "The first customer is one factory and one material stream. Prove repeat use there, then expand to more sites, more materials and licensed enterprise workflows." },
  [PSCustomObject]@{ Frame = 9; Text = "Each pilot ends with a reviewable before-and-after report, so the customer can decide whether faster decisions, safer refusals and recovered value justify expansion." },
  [PSCustomObject]@{ Frame = 8; Text = "The same evidence-to-decision pattern can travel across countries. Regional price, carbon and compliance rules are versioned inputs, while the audit trail and refusal behavior stay consistent." },
  [PSCustomObject]@{ Frame = 11; Text = "This is the multiplier: Gemini helps understand messy evidence, deterministic controls protect the decision, and Google Cloud makes the workflow deployable. MaterialLoop AI converts circularity from an aspiration into a reviewable operating process." },
  [PSCustomObject]@{ Frame = 5; Text = "Every recommendation stays explainable, every refusal stays visible, and every deployment can improve without hiding the evidence." }
)

$extendedTargetSeconds = 210.0

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
  $frameNumber = $scenes[$index].Frame
  $imagePath = Join-Path $frameRoot ("scene-{0:00}.png" -f $frameNumber)
  $wavPath = Join-Path $buildRoot ("scene-{0:00}.wav" -f $sceneNumber)
  $mp4Path = Join-Path $buildRoot ("scene-{0:00}.mp4" -f $sceneNumber)

  if (-not (Test-Path -LiteralPath $imagePath)) {
    throw "Missing story frame: $imagePath"
  }

  $synth.SetOutputToWaveFile($wavPath)
  $synth.Speak($scenes[$index].Text)
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
    throw "ffmpeg failed while rendering scene $sceneNumber"
  }
  $sceneFiles += $mp4Path
}

$synth.Dispose()

function Build-Variant {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [int[]]$SceneIndices,
    [Parameter(Mandatory = $true)]
    [double]$TargetSeconds
  )

  $concatPath = Join-Path $buildRoot ("concat-{0}.txt" -f $Name)
  $joinedPath = Join-Path $buildRoot ("joined-{0}.mp4" -f $Name)
  $outputPath = Join-Path $outputRoot ("MaterialLoop_AI_Demo_{0}.mp4" -f $Name)
  $selectedSceneFiles = $SceneIndices | ForEach-Object {
    if ($_ -lt 1 -or $_ -gt $sceneFiles.Count) {
      throw "Invalid scene index for ${Name}: $_"
    }
    $sceneFiles[$_ - 1]
  }
  $concatLines = $selectedSceneFiles | ForEach-Object {
    "file '" + ($_.Replace("'", "'\''")) + "'"
  }
  [System.IO.File]::WriteAllLines($concatPath, $concatLines, [System.Text.UTF8Encoding]::new($false))

  & $FfmpegPath -hide_banner -loglevel error -y `
    -f concat -safe 0 -i $concatPath `
    -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k `
    -pix_fmt yuv420p -movflags +faststart $joinedPath
  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg failed while joining $Name"
  }

  $joinedDurationText = & $FfprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $joinedPath
  $joinedDuration = [double]::Parse($joinedDurationText.Trim(), $culture)
  if ($joinedDuration -gt $TargetSeconds) {
    throw ("{0} narration is too long: {1:N2}s exceeds {2:N2}s" -f $Name, $joinedDuration, $TargetSeconds)
  }

  $padding = $TargetSeconds - $joinedDuration
  $paddingText = $padding.ToString("0.000", $culture)
  $targetText = $TargetSeconds.ToString("0.000", $culture)
  $musicFadeOut = [Math]::Max(1, $TargetSeconds - 1.8).ToString("0.000", $culture)
  $musicSource = "aevalsrc=0.055*sin(2*PI*55*t)*(0.70+0.30*sin(2*PI*0.42*t))+0.028*sin(2*PI*82.41*t)+0.016*sin(2*PI*110*t):s=48000:d=$targetText"
  $closingFrameNumber = $scenes[$SceneIndices[-1] - 1].Frame
  $closingImagePath = Join-Path $frameRoot ("scene-{0:00}.png" -f $closingFrameNumber)

  & $FfmpegPath -hide_banner -loglevel error -y `
    -i $joinedPath -loop 1 -framerate 30 -i $closingImagePath -f lavfi -i $musicSource `
    -filter_complex "[0:v]setpts=PTS-STARTPTS[main];[1:v]scale=1920:1080,trim=duration=${paddingText},setpts=PTS-STARTPTS,format=yuv420p[hold];[main][hold]concat=n=2:v=1:a=0[v];[0:a]apad=pad_dur=${paddingText},volume=1.0[voice];[2:a]lowpass=f=520,highpass=f=35,afade=t=in:st=0:d=1.2,afade=t=out:st=${musicFadeOut}:d=1.8,volume=0.13[bed];[voice][bed]amix=inputs=2:duration=longest:dropout_transition=1,loudnorm=I=-16:TP=-1.5:LRA=11[a]" `
    -map "[v]" -map "[a]" -t $targetText `
    -c:v libx264 -preset medium -crf 18 -r 30 -pix_fmt yuv420p `
    -c:a aac -b:a 224k -movflags +faststart $outputPath
  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg failed while finalizing $Name"
  }

  $durationText = & $FfprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $outputPath
  $durationSeconds = [double]::Parse($durationText.Trim(), $culture)

  [PSCustomObject]@{
    Variant = $Name
    Video = $outputPath
    DurationSeconds = [Math]::Round($durationSeconds, 2)
    NarrationSeconds = [Math]::Round($joinedDuration, 2)
    PaddingSeconds = [Math]::Round($padding, 2)
    SceneCount = $SceneIndices.Count
    SceneIndices = $SceneIndices
  }
}

$results = @(
  Build-Variant -Name "Final_2m59" -SceneIndices @(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 15, 17) -TargetSeconds 179.0
  Build-Variant -Name "Extended_3m30" -SceneIndices (1..$scenes.Count) -TargetSeconds $extendedTargetSeconds
)

[PSCustomObject]@{
  Voice = if ($englishVoice) { $englishVoice.VoiceInfo.Name } else { "System default" }
  Resolution = "1920x1080"
  Soundtrack = "Original synthesized ambient bed"
  Results = $results
} | ConvertTo-Json -Depth 4
