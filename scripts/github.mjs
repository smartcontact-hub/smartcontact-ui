/**
 * GitHub, por `gh api` y nada más.
 *
 * POR QUÉ. Los scripts leían GitHub con `gh run list` y `gh pr list --json`, y en una sesión en la nube el `gh` es otro:
 * solo tiene `api`. Medido el 2026-10-04: `ci:verdict` salía con «no pude leer el CI» (código 2) y `sesiones` se tragaba
 * el fallo y daba todas las cajas por «sin PR». `gh api` es el mismo en el Mac (la CLI de GitHub) y en la nube.
 *
 * QUÉ HACE. Pide el REST y lo devuelve con la forma que ya usaban los scripts (la de `--json`), así que su lógica y sus
 * tests no cambian. Tres diferencias del REST, traducidas aquí:
 *   · no hay estado MERGED: lo es un PR cerrado con `merged_at`;
 *   · `mergeable` es true/false/null y solo viene en el PR suelto, no en la lista;
 *   · los checks no vienen con el PR: se piden al commit (check-runs y estados), y llegan en minúsculas.
 *
 * Las consultas van en la ruta: `-f` convierte la petición en POST, `--jq` necesita un `jq` que la nube no trae y
 * `--paginate` no existe en el `gh` de la nube.
 */
import { execFileSync } from 'node:child_process';

const ghReal = (args) =>
  execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 });
const gitReal = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/**
 * El dueño y el repo de la URL de `origin`. Vale para las tres formas que se ven en este repo: `https://github.com/o/r.git`,
 * `git@github.com:o/r.git` y la del proxy de la nube (`http://…@127.0.0.1:1234/git/o/r`). `null` si no se entiende.
 */
export function repoDeRemoto(url) {
  const m = /[:/]([^/:\s]+)\/([^/\s]+?)(?:\.git)?\/?$/.exec(String(url ?? '').trim());
  return m ? { owner: m[1], repo: m[2] } : null;
}

/** El `mergeable` del REST en el vocabulario de `gh pr --json`: MERGEABLE, CONFLICTING o UNKNOWN (aún calculándose). */
export function mergeableDe(pr) {
  if (pr?.mergeable_state === 'dirty' || pr?.mergeable === false) return 'CONFLICTING';
  if (pr?.mergeable === true) return 'MERGEABLE';
  return 'UNKNOWN';
}

/**
 * Un PR del REST con la forma de `gh pr list --json number,state,headRefName,headRefOid,mergedAt,mergeCommit,url`.
 * `headRefOid` es el sha de la rama en el momento de ESTE PR (`head.sha`): lo que compara `ci:verdict` contra tu
 * HEAD para saber si un PR fundido describe tu commit de hoy o uno viejo con trabajo nuevo encima (#333).
 */
export function prDe(p) {
  const fundido = Boolean(p.merged_at);
  return {
    number: p.number,
    state: fundido ? 'MERGED' : String(p.state ?? '').toUpperCase(),
    headRefName: p.head?.ref ?? '',
    headRefOid: p.head?.sha ?? null,
    mergedAt: p.merged_at ?? null,
    mergeCommit: fundido && p.merge_commit_sha ? { oid: p.merge_commit_sha } : null,
    url: p.html_url ?? '',
  };
}

const CONCLUSION_DE_ESTADO = { success: 'SUCCESS', failure: 'FAILURE', error: 'FAILURE', pending: null };

/**
 * Los checks de un commit con la forma de `statusCheckRollup`: los check-runs (con su `name`) y los estados de commit
 * (con su `context`), con la conclusión en mayúsculas y `null` mientras corren.
 */
export function rollupDe(checkRuns, estados) {
  const runs = (checkRuns ?? []).map((c) => ({ name: c.name, conclusion: c.conclusion ? c.conclusion.toUpperCase() : null }));
  const ctx = (estados ?? []).map((s) => ({ context: s.context, conclusion: CONCLUSION_DE_ESTADO[s.state] ?? null }));
  return [...runs, ...ctx];
}

/** Una ejecución de Actions con la forma de `gh run list --json headSha,status,conclusion,url,createdAt`. */
export function runDe(r) {
  return {
    id: r.id,
    headSha: r.head_sha,
    status: r.status,
    conclusion: r.conclusion,
    url: r.html_url,
    createdAt: r.created_at,
    startedAt: r.run_started_at ?? r.created_at,
    event: r.event,
    runAttempt: r.run_attempt ?? 1,
  };
}

/** Los números de los `## DD-N` que AÑADE un parche unificado (las líneas `+`), en su orden. */
export function ddsAnadidas(parche) {
  return [...String(parche ?? '').matchAll(/^\+## DD-(\d+)\b/gm)].map((m) => Number(m[1]));
}

/**
 * El cliente. `gh` y `git` se inyectan para las pruebas; por defecto son los de verdad. El repo sale de `origin` y, si no
 * se entiende, se deja a `gh`, que rellena `{owner}` y `{repo}` él solo.
 */
export function cliente({ gh = ghReal, git = gitReal } = {}) {
  let repo;
  const base = () => {
    if (repo) return repo;
    let r = null;
    try {
      r = repoDeRemoto(git(['remote', 'get-url', 'origin']));
    } catch {
      /* sin origin legible: que lo resuelva gh */
    }
    repo = r ?? { owner: '{owner}', repo: '{repo}' };
    return repo;
  };
  const api = (ruta) => JSON.parse(gh(['api', `repos/${base().owner}/${base().repo}/${ruta}`]));
  const rama = (r) => encodeURIComponent(r);

  return {
    /** La última ejecución del workflow `ci` en la rama, como lista de 0 o 1 (la forma de `gh run list --limit 1`). */
    ultimaCI(r) {
      return (api(`actions/workflows/ci.yml/runs?branch=${rama(r)}&per_page=1`).workflow_runs ?? []).map(runDe);
    },
    /** Las ejecuciones de `ci` de una rama, las más nuevas primero. */
    ejecucionesCI(r, porPagina = 50) {
      return (api(`actions/workflows/ci.yml/runs?branch=${rama(r)}&per_page=${porPagina}`).workflow_runs ?? []).map(runDe);
    },
    /** Las ejecuciones de `ci` de un commit (la de `main` tras fundir, por ejemplo). */
    ejecucionesDeCommit(sha) {
      return (api(`actions/workflows/ci.yml/runs?head_sha=${sha}&per_page=10`).workflow_runs ?? []).map(runDe);
    },
    /** Los jobs de una ejecución: nombre, estado, conclusión e instantes. */
    jobsDe(id) {
      return (api(`actions/runs/${id}/jobs?per_page=100`).jobs ?? []).map((j) => ({
        name: j.name,
        status: j.status,
        conclusion: j.conclusion,
        startedAt: j.started_at,
        completedAt: j.completed_at,
        // Vacío en un job que GitHub canceló sin darle máquina (DD-175): no llegó a correr.
        runnerName: j.runner_name ?? '',
      }));
    },
    /** Relanza los jobs fallidos o cancelados de una ejecución (`rerun-failed-jobs`). */
    relanzarFallidos(id) {
      gh(['api', `repos/${base().owner}/${base().repo}/actions/runs/${id}/rerun-failed-jobs`, '-X', 'POST']);
    },
    /**
     * El PR que importa de la rama, con `mergeable` si está abierto; `null` si no hay ninguno. Una sesión cloud
     * reutiliza el mismo nombre de rama tras fundir un PR (#333): el siguiente lote llega a esa rama antes de
     * que exista el PR nuevo, así que por unos commits conviven un fundido VIEJO y, en cuanto se abre, un
     * abierto NUEVO con el mismo `headRefName`. El abierto es siempre el que describe el HEAD de hoy —gana
     * aunque el REST no lo devuelva primero—, y si no hay ninguno abierto se cae al más reciente de la lista
     * (el REST ordena por fecha de creación descendente por defecto).
     */
    prDeRama(r) {
      const lista = api(`pulls?head=${base().owner}:${rama(r)}&state=all&per_page=10`);
      if (!lista.length) return null;
      const elegido = lista.find((p) => p.state === 'open') ?? lista[0];
      const pr = prDe(elegido);
      if (pr.state !== 'OPEN') return { ...pr, mergeable: null };
      return { ...pr, mergeable: mergeableDe(api(`pulls/${pr.number}`)) };
    },
    /** Un PR suelto, con lo que trae el REST tal cual (fechas, título, commit de fusión). */
    pr(numero) {
      return api(`pulls/${numero}`);
    },
    /** Los commits de un PR (hasta 100): sha y fecha de autor. */
    commitsDe(numero) {
      return api(`pulls/${numero}/commits?per_page=100`).map((c) => ({ sha: c.sha, date: c.commit?.author?.date ?? null }));
    },
    /**
     * Los PRs abiertos (hasta 50). Los de las ramas que `quiero` acepte llevan además `mergeable` y sus checks, que
     * cuestan dos llamadas más cada uno: por eso solo se piden para los que tienen caja local.
     */
    prsAbiertos(quiero = () => true) {
      return api('pulls?state=open&per_page=50').map((p) => {
        const pr = prDe(p);
        if (!quiero(pr.headRefName)) return { ...pr, mergeable: 'UNKNOWN', statusCheckRollup: [] };
        const sha = p.head?.sha;
        return {
          ...pr,
          mergeable: mergeableDe(api(`pulls/${pr.number}`)),
          statusCheckRollup: rollupDe(
            api(`commits/${sha}/check-runs?per_page=100`).check_runs,
            api(`commits/${sha}/status`).statuses,
          ),
        };
      });
    },
    /** Las rutas que cambia un PR (hasta 100). Las cruza el aviso de ledgers del preflight (LEARNINGS #21). */
    ficherosDePr(numero) {
      return api(`pulls/${numero}/files?per_page=100`).map((f) => f.filename);
    },
    /** Los `## DD-N` que añade el `docs/DECISIONS.md` de un PR, sacados de su parche (DD-175). */
    ddsDePr(numero) {
      const f = api(`pulls/${numero}/files?per_page=100`).find((x) => x.filename === 'docs/DECISIONS.md');
      return ddsAnadidas(f?.patch);
    },
    /** Los últimos PRs fundidos (el REST no filtra por fundido: se piden cerrados y se quedan los que tienen fecha). */
    prsFundidos(cuantos = 40) {
      return api('pulls?state=closed&per_page=100')
        .filter((p) => p.merged_at)
        .slice(0, cuantos)
        .map(prDe);
    },
    /** El PR fundido de una rama aunque ya no esté entre los últimos; `null` si no lo hay. */
    prFundidoDeRama(r) {
      const p = api(`pulls?head=${base().owner}:${rama(r)}&state=closed&per_page=10`).find((x) => x.merged_at);
      return p ? prDe(p) : null;
    },
  };
}
