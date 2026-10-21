# Multiplayer networking playbook

Use this whenever the creator requests online play. A local WebSocket demo is not a production online service. Treat networking as an architecture decision tied to the selected engine, genre, player count, latency target, persistence, and deployment environment.

## Define authority and state

Before implementation, make a table for each replicated entity/state field: authoritative owner, clients allowed to request changes, validation rule, replication frequency, persistence rule, and visibility/interest policy. The server owns shared outcomes such as race results, mission completion, inventory, currency, unlocks, and world events. Never trust a client to award itself durable progress.

Version the protocol and reject incompatible clients. Validate message size, field types/ranges, rate limits, identity/session membership, and legal state transitions at the boundary. Keep account authentication, secrets, and persistent data out of client builds.

## Movement and interaction loop

For a responsive action game, clients may predict their own movement while the server remains authoritative. Tag each input with a monotonic sequence number and simulation tick. The server validates and simulates inputs; the owning client reconciles against acknowledged authoritative state and replays only unacknowledged inputs. Render remote actors from buffered snapshots with interpolation; use genre-appropriate bounded extrapolation only when necessary. Do not label client-side simulation authoritative.

For physics-heavy vehicles, explicitly choose the model: authoritative server physics; client input prediction with authoritative correction; or a simpler server-validated racing state. Keep server/client fixed-step assumptions documented and measure divergence under latency. Quantize only after proving the error budget. If the engine's network physics feature is selected, use its documented workflow and test it on the exact engine version.

## Sessions, relevance, persistence

Implement session creation/join/leave, lobby readiness, version/region checks, start/end transitions, disconnect timeout, rejoin identity, and clean shutdown. Make reward/save writes idempotent using unique event IDs or transaction keys. Define what happens if a server process exits between simulation and persistence.

Use an interest policy so each client receives only relevant actors and events. A spatial grid/region index can narrow candidates; visibility, team, mission, and distance rules determine the final set. Keep relevance decisions observable in a debug panel. Measure bandwidth and server tick cost at the requested player/entity counts rather than claiming scalability from a two-client test.

## Security and operations

Assume clients can send stale, duplicated, malformed, extreme, or out-of-order inputs. Bound physics parameters and movement deltas, reject state jumps, and rate-limit interactions. Define server logs/metrics, health checks, crash recovery, deployment variables, secret handling, data retention, and migration/backup behavior. Do not hard-code paid provider endpoints or imply that Open Game provisioned hosting.

## Verification

1. Run one server and at least two independent clients on the intended transport.
2. Verify join/leave, state replication, simultaneous interactions, race/mission completion, and durable results.
3. Exercise client disconnect/reconnect, stale/duplicate input, invalid payloads, and server restart.
4. Simulate latency/loss if tooling permits and record the conditions; otherwise mark this criterion unverified.
5. Record exact commands, logs, player count, measured server/client behavior, persistence evidence, and all external infrastructure blockers.

Do not report production multiplayer without real deployment, load, security, reconnect, and operational evidence. A local multi-client test is a verified prototype only.
