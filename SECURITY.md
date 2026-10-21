# Security policy

## Reporting a vulnerability

Do not publish exploit details in a public issue. Use GitHub's private vulnerability reporting for this repository when available; otherwise contact the maintainers through the private contact route shown on the repository profile. Include the affected version, steps to reproduce, impact, and a safe proof of concept. Do not include real credentials or other people's data.

## Trust boundaries

- Open Game's MCP server is a local stdio process. Any coding agent configured to use it can invoke its workspace operations.
- Engine build, scenario, and launch operations execute project-authored code. They require an explicit `allow_project_code_execution` MCP value or `--allow-project-code-execution` CLI flag. Review projects first. For untrusted projects, use a disposable VM/container with no secrets and restricted network access.
- The reduced environment passed to child processes removes unrelated environment variables, but it is **not a sandbox**. Engine code still runs with the operating-system permissions of the current account.
- The generated multiplayer server binds to `127.0.0.1` by default. Setting `HOST=0.0.0.0` exposes it to the LAN; the demo has no user authentication, persistence, or TLS and must not be exposed directly to the internet. Its WebSocket handshake returns HTTP 429 with `Retry-After` when connection limits are reached; established sockets are closed with code 1008 when message limits are exceeded.
- Project and archive size limits reduce resource exhaustion but do not make arbitrary projects safe to open or execute.

## Supported security measures

Project data reads reject symlink and hard-link targets and oversized JSON files. Progress writes are atomic and replace a link itself rather than following it. The multiplayer prototype allows at most 12 connection attempts per IP per 10 seconds, 8 open sockets per IP, 48 sockets total, 60 messages per second per socket, and 120 messages per second per IP. Archive packaging rejects symlinks and hard links, excludes common credential/key files, streams ZIP output, and limits archives to 10,000 files and 256 MiB uncompressed. These controls are defense in depth, not a guarantee against every local filesystem race or platform-specific behavior.

Open Game cannot guarantee that a project is secure, legally cleared, or immune from claims. Review the code, assets, dependencies, and deployment configuration you choose to use.
