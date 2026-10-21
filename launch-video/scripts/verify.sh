#!/usr/bin/env bash
set -euo pipefail

video=${1:?usage: verify.sh <video.mp4> <qc-folder>}
qc=${2:?usage: verify.sh <video.mp4> <qc-folder> [expected-duration-seconds]}
expected_duration=${3:-24}
mkdir -p "$qc"

probe=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration -of default=noprint_wrappers=1 "$video")
printf '%s\n' "$probe" > "$qc/ffprobe.txt"
grep -q 'codec_name=h264' <<<"$probe" || { echo 'Expected H.264 video.' >&2; exit 1; }
grep -q 'width=1080' <<<"$probe" || { echo 'Expected 1080px width.' >&2; exit 1; }
grep -q 'height=1920' <<<"$probe" || { echo 'Expected 1920px height.' >&2; exit 1; }
grep -q 'r_frame_rate=30/1' <<<"$probe" || { echo 'Expected 30 fps.' >&2; exit 1; }
duration=$(awk -F= '$1 == "duration" {print $2}' <<<"$probe")
awk -v d="$duration" -v expected="$expected_duration" 'BEGIN { if (d < expected-.2 || d > expected+.2) exit 1 }' || { echo "Unexpected duration: $duration (expected about ${expected_duration}s)" >&2; exit 1; }

ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,channels,sample_rate -of default=noprint_wrappers=1 "$video" > "$qc/audio-probe.txt"
grep -q 'codec_name=aac' "$qc/audio-probe.txt" || { echo 'Expected AAC audio.' >&2; exit 1; }
ffmpeg -hide_banner -loglevel error -i "$video" -vf "fps=0.5,scale=240:-1,tile=3x6" -frames:v 1 -y "$qc/contact-sheet.png"
ffmpeg -hide_banner -loglevel error -sseof -0.12 -i "$video" -frames:v 1 -y "$qc/end-frame.png"
ffmpeg -hide_banner -loglevel info -i "$video" -af "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2> "$qc/audio-loudness.txt"
printf 'PASS: %s\n' "$probe"
