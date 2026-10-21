# Open Game launch video

## Master

- `Open-Game-Launch-v6.mp4` — faster 24-second vertical cut, 1080×1920, 30 fps, H.264/AAC at 48 kHz.
- `assets/open-game-original-score.wav` — locally synthesized original instrumental cue.
- `render_launch.py` — editable procedural motion-graphics source.
- `generate_score.py` — editable original-score synthesis source.
- `scripts/verify.sh` — extract contact sheets and check the master’s technical format/audio stream.
- `publish.md` — LinkedIn caption, hashtags, cover frame, and provenance note.

The score uses oscillator and noise synthesis only. The 3D sphere/system-map and racing-track moments are explanatory illustrations; no gameplay or coding-agent session is represented as captured footage. Open Game's current included playable example is a bounded browser-racing adapter. The connected coding LLM implements arbitrary games using the tools available to it. The v6 master measures -13.9 LUFS integrated and -1.5 dBTP true peak.

## Re-render

From the repository root:

```sh
python3 launch-video/generate_score.py
set -o pipefail
python3 launch-video/render_launch.py 2>.studio/render-progress.log | ffmpeg -hide_banner -loglevel warning -f rawvideo -pixel_format rgb24 -video_size 720x1280 -framerate 30 -i - -i launch-video/assets/open-game-original-score.wav -vf "scale=1080:1920:flags=lanczos,format=yuv420p" -af "atempo=1.5,acompressor=threshold=-18dB:ratio=3:attack=15:release=150:makeup=3dB,alimiter=limit=0.841395,loudnorm=I=-14:TP=-1.5:LRA=11" -t 24 -r 30 -c:v libx264 -preset fast -crf 18 -profile:v high -level 4.1 -c:a aac -b:a 192k -ar 48000 -movflags +faststart -metadata title="Open Game — Build Your Own World" -y launch-video/Open-Game-Launch-v6.mp4
launch-video/scripts/verify.sh launch-video/Open-Game-Launch-v6.mp4 .studio/qc/v6 24
```

## Claim limits

The video does not promise an instant AAA result, a universal engine compiler, guaranteed multiplayer hosting, or legal immunity. Keep those limits in the post caption if the clip is reposted without its end card/context.
