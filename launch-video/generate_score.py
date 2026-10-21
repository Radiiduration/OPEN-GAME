#!/usr/bin/env python3
"""Synthesize an original Open Game launch cue; no samples or third-party audio."""

import os
import wave

import numpy as np

SR = 48000
DURATION = 36
N = SR * DURATION
T = np.arange(N, dtype=np.float64) / SR
RNG = np.random.default_rng(31026)
mix = np.zeros(N, dtype=np.float64)


def add(signal, start, gain=1.0):
    offset = int(start * SR)
    if offset < 0 or offset >= N:
        return
    usable = min(len(signal), N - offset)
    mix[offset:offset + usable] += signal[:usable] * gain


def envelope(length, attack=.01, release=.2):
    n = max(1, int(length * SR))
    x = np.arange(n) / SR
    return np.minimum(1.0, x / max(.001, attack)) * np.minimum(1.0, np.maximum(0, (length - x) / max(.001, release)))


# Four restrained suspended/add9 chord colors, voiced as warm, slowly breathing pads.
chords = [
    [73.416, 110.000, 146.832, 164.814],       # Dm(add9)
    [58.270, 87.307, 110.000, 130.813],        # Bbmaj7 color
    [87.307, 130.813, 164.814, 196.000],       # F(add9)
    [65.406, 98.000, 130.813, 146.832],         # Csus2
    [73.416, 110.000, 146.832, 164.814],        # resolve home
]
starts = [0, 8, 16, 24, 32]
ends = [8, 16, 24, 32, 36]
for chord, start, end in zip(chords, starts, ends):
    length = end - start
    n = int(length * SR)
    local = np.arange(n) / SR
    fade = np.minimum(1, local / 1.2) * np.minimum(1, np.maximum(0, (length-local) / .8))
    breath = .88 + .12 * np.sin(2*np.pi*0.13*local)
    pad = np.zeros(n)
    for i, hz in enumerate(chord):
        pad += np.sin(2*np.pi*hz*local + i*.18) / (1 + .45*i)
        pad += .18*np.sin(2*np.pi*hz*2.003*local + i*.6) / (1 + i)
    add(pad * fade * breath / len(chord), start, .15)

# Rounded four-on-the-floor sub-kicks start after the opening signal.
for beat in np.arange(0, 36, .5):
    if beat < 4 or beat >= 30:
        continue
    n = int(.30 * SR)
    local = np.arange(n) / SR
    freq = 58 - 21 * np.minimum(1, local / .19)
    phase = 2*np.pi*np.cumsum(freq) / SR
    env = np.exp(-local*16) * np.minimum(1, local/.004)
    kick = np.sin(phase) * env
    add(kick, beat, .44 if beat < 20 else .62)

# Evolving mono bass pulse, side-chain-like ducking around the kick.
roots = [36.708, 29.135, 43.654, 32.703, 36.708]
for beat in np.arange(4, 30, .5):
    section = min(4, int(beat // 8))
    n = int(.35 * SR)
    local = np.arange(n) / SR
    env = np.exp(-local*8) * np.minimum(1, local/.01)
    bass = np.sin(2*np.pi*roots[section]*local) + .22*np.sin(2*np.pi*roots[section]*2*local)
    add(bass * env, beat, .20 if beat < 20 else .27)

# High passed breath risers at the major section transitions.
for start, length, gain in [(3.0, 1.0, .12), (11.0, 1.0, .10), (19.0, 1.0, .14), (27.0, .8, .10)]:
    n = int(length*SR)
    noise = RNG.normal(0, 1, n)
    high = np.concatenate(([0], np.diff(noise)))
    x = np.arange(n)/SR/length
    env = x*x
    add(high*env, start, gain)

# Metallic UI connection pings: synthesized sine partials with short inharmonic decay.
for hit, freq in [(1.5, 780), (3.5, 1120), (8, 940), (12, 1310), (16, 1560), (20, 1050), (28, 880), (32, 1180), (33, 1480), (34, 1760)]:
    n = int(.22*SR)
    local = np.arange(n)/SR
    ping = (np.sin(2*np.pi*freq*local) + .24*np.sin(2*np.pi*freq*1.48*local)) * np.exp(-local*22)
    add(ping, hit, .12 if hit < 20 else .10)

# Restrained claps after the main reveal; only filtered-noise synthesis.
for hit in np.arange(24, 30, 1.0):
    n = int(.12*SR)
    noise = RNG.normal(0, 1, n)
    smoothed = np.convolve(noise, np.ones(5)/5, mode='same')
    local = np.arange(n)/SR
    add(smoothed*np.exp(-local*35), hit, .11)

# Opening low signal pulse and a final warm, noise-free resolution.
n = int(.9*SR)
local = np.arange(n)/SR
add(np.sin(2*np.pi*46*local)*np.exp(-local*4), 0, .38)
n = int(4*SR)
local = np.arange(n)/SR
tail = sum(np.sin(2*np.pi*hz*local + phase) for hz, phase in [(73.416,0), (110,.3), (146.832,.6), (164.814,.9)]) / 4
add(tail * np.minimum(1, local/.35) * np.minimum(1, (4-local)/.7), 32, .22)

# Master fade and gentle peak control; ffmpeg performs final loudness normalization.
fade_in = np.minimum(1, T/.08)
fade_out = np.minimum(1, np.maximum(0, (DURATION-T)/.5))
mix *= fade_in * fade_out
peak = np.max(np.abs(mix))
if peak > 0:
    mix *= .88 / peak
stereo = np.column_stack((mix, np.roll(mix, int(.006*SR))))
pcm = np.clip(stereo * 32767, -32768, 32767).astype('<i2')
out = os.path.join(os.path.dirname(__file__), 'assets', 'open-game-original-score.wav')
os.makedirs(os.path.dirname(out), exist_ok=True)
with wave.open(out, 'wb') as f:
    f.setnchannels(2)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes(pcm.tobytes())
print(out)
