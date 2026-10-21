# Racing simulation playbook

Use this for an original motorsport/racing experience. This does not reproduce EA/Codemasters' private handling model, parameters, vehicle data, circuits, teams, or presentation. EA publicly describes its F1 handling work in terms of interacting suspension, tire, aerodynamics, engine, and setup systems; the design below is an original, physically motivated starting point that still requires tuning and play testing. See [the public evidence note](../reverse-engineering/what-public-evidence-can-tell-us.md).

## Fixed-step vehicle model

Use the chosen engine's supported vehicle physics when it exists and the target has been validated. Avoid a hand-written arcade integrator in a purported simulation. If implementing a custom model, use a fixed physics step with bounded substeps; separate input sampling, physics, presentation, and network replication. Make every tunable value data-driven per vehicle and save setup presets.

For each wheel/contact patch, estimate normal load `Fz` from suspension and load transfer. In wheel coordinates, one common starting definition is `kappa = (R * omega - vx) / max(abs(vx), v_min)` and `alpha = atan2(vy, max(abs(vx), v_min))`, with signs documented consistently for forward/reverse travel and steering. `R` is effective radius, `omega` wheel angular speed, and `vx/vy` contact velocity. Clamp pathological values and blend to a low-speed model around `v_min`; otherwise standing starts and reversals can explode. A tractable original tire approximation can use saturating curves:

```text
Fx_raw = mu_long * Fz * tanh(C_long * kappa)
Fy_raw = -mu_lat  * Fz * tanh(C_lat  * tan(alpha))
scale = min(1, 1 / sqrt((Fx_raw / (mu_long*Fz))^2 + (Fy_raw / (mu_lat*Fz))^2))
Fx, Fy = scale * Fx_raw, scale * Fy_raw
```

Guard the zero-load/near-zero-speed cases. The combined-force limit keeps braking/drive and cornering from each demanding full grip simultaneously. This is not a proprietary tire equation or a claim of tire-test accuracy; tune it against target handling goals and disclose model limits.

Suspension uses per-wheel spring/damper response from compression and compression velocity, with configurable travel, anti-roll coupling, and bump stops. Compute load transfer from acceleration, center-of-mass height, track width, and wheelbase as an approximation, then distribute corner loads consistently. Engine torque curves, gearing, differential behavior, brakes, steering geometry, rolling resistance, drag, and downforce feed the same chassis step. Clamp forces and inspect signs/units.

## Driver experience and assists

Separate raw player input from steering/throttle/brake assists. Support keyboard/gamepad/wheel mappings, dead zones, steering-rate limits, traction and ABS assists, automatic/manual gears, camera modes, vibration/audio feedback where available, and accessibility options. Assist settings should change control difficulty without secretly changing race outcomes.

Make grip legible through tire/audio/skid/force-feedback cues and telemetry: wheel speed, slip, load, temperature/wear if modeled, aero load, brake state, gear, and damage. Add a developer overlay and setup comparison that can explain understeer, oversteer, lockup, traction loss, and setup changes.

## Track, opponent, and race systems

Represent the circuit as a spline/segment graph with racing line, width, surface material, elevation, sector and marshal markers, pit lane, and recovery boundaries. AI follows a parameterized line with braking zones and speed targets; it reacts to traffic and grip without teleporting or making perfect decisions. Build a race director for grid, lights, laps, flags, penalties, pit calls, finish order, and restart rules. Weather and track evolution should affect measured grip only if those systems are actually implemented.

Connect practice, qualifying, race, results, standings, contracts/rivalries, upgrades, setup, and saves into the requested career loop. Race outcomes must update one canonical progression state, with migration/versioning and idempotent rewards.

## Tuning and acceptance

Do not tune by code intuition alone. Provide a deterministic test track and scripted maneuvers for straight-line acceleration, braking, constant-radius cornering, lane change, curb impact, and recovery. Record input and telemetry at fixed intervals. Compare handling profiles with the project acceptance goals; test keyboard/controller/wheel as requested. Check deterministic replay within the selected physics/network limits.

Minimum slice evidence: player can start, drive, brake, steer, recover, complete a race, receive results, change a setup, save, reload, and observe the setup/progression persist. AI must finish or fail safely. If online is requested, see the authoritative multiplayer requirements in the [open-world playbook](open-world-action.md) and test multiple clients. A beautiful car model or successful compile is not evidence of convincing handling.
