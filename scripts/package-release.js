#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectRoot, 'dist');
await mkdir(outputDirectory, { recursive: true });
const result = spawnSync('npm', ['pack', '--pack-destination', outputDirectory], {
  cwd: projectRoot,
  stdio: 'inherit'
});

if (result.error) {
  console.error(`Could not run npm pack: ${result.error.message}`);
  process.exit(1);
}
process.exitCode = result.status ?? 1;
