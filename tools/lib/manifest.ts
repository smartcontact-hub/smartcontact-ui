/**
 * RUN MANIFEST — sello de cada artefacto de medicion.
 *
 * Dos artefactos con manifiestos distintos NO son comparables. Cualquier script que
 * compare dos ficheros debe llamar antes a 'assertComparable()'.
 */
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';

const require = createRequire(import.meta.url);

export interface HarnessSettings {
  readonly deviceScaleFactor: number;
  readonly reducedMotion: 'reduce' | 'no-preference';
  readonly colorScheme: 'light' | 'dark';
  readonly locale: string;
  readonly timezoneId: string;
  readonly hideScrollbars: boolean;
  readonly blockedHosts: readonly string[];
}

export interface RunManifest {
  readonly playwrightVersion: string;
  readonly browserName: string;
  readonly browserVersion: string;
  readonly os: string;
  readonly node: string;
  readonly timestamp: string;
  readonly replicaSha: string;
  readonly harness: HarnessSettings;
}

export function replicaSha(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

export function buildManifest(
  browserName: string,
  browserVersion: string,
  harness: HarnessSettings
): RunManifest {
  return {
    playwrightVersion: require('playwright-core/package.json').version,
    browserName,
    browserVersion,
    os: `${os.platform()} ${os.release()} ${os.arch()}`,
    node: process.version,
    timestamp: new Date().toISOString(),
    replicaSha: replicaSha(),
    harness,
  };
}

/**
 * Compara dos manifiestos ignorando el sello de tiempo. Devuelve la lista de campos que
 * difieren; vacia = comparables.
 */
export function manifestDrift(a: RunManifest, b: RunManifest): string[] {
  const drift: string[] = [];
  const flat = (m: RunManifest): Record<string, unknown> => ({
    playwrightVersion: m.playwrightVersion,
    browserName: m.browserName,
    browserVersion: m.browserVersion,
    os: m.os,
    node: m.node,
    ...Object.fromEntries(
      Object.entries(m.harness).map(([k, v]) => [
        `harness.${k}`,
        JSON.stringify(v),
      ])
    ),
  });
  const fa = flat(a);
  const fb = flat(b);
  for (const k of Object.keys(fa)) {
    if (String(fa[k]) !== String(fb[k])) {
      drift.push(`${k}: ${String(fa[k])} != ${String(fb[k])}`);
    }
  }
  return drift;
}
