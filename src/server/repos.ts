/**
 * Los repos públicos de la organización, tal como los cuenta GitHub. Se piden
 * sin credenciales (60 llamadas por hora y hora), así que la respuesta se
 * guarda media hora en memoria: la portada la pide en cada visita.
 */

const ORG = 'BipBop-Labs'
const TTL_MS = 30 * 60 * 1000
/** Artefactos de distribución: es un repo público, pero no hay nada que leer. */
const OCULTOS = new Set(['actas-releases'])

export type Repo = {
  name: string
  url: string
  description: string | null
  language: string | null
  stars: number
  fork: boolean
  contributors: Array<string>
}

let cache: { at: number; repos: Array<Repo> } | null = null
let enVuelo: Promise<Array<Repo>> | null = null

async function gh(path: string): Promise<unknown> {
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': 'bipbop.cl',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  const res = await fetch(`https://api.github.com${path}`, { headers })
  if (!res.ok) throw new Error(`github ${path}: ${res.status}`)
  return res.json()
}

async function fetchRepos(): Promise<Array<Repo>> {
  const raw = (await gh(
    `/orgs/${ORG}/repos?type=public&per_page=100&sort=pushed`,
  )) as Array<{
    name: string
    html_url: string
    description: string | null
    language: string | null
    stargazers_count: number
    fork: boolean
    archived: boolean
  }>

  const visibles = raw.filter((r) => !r.archived && !OCULTOS.has(r.name))

  const repos = await Promise.all(
    visibles.map(async (r) => {
      // Un repo sin commits o con el gráfico aún calculándose responde vacío;
      // no es motivo para dejar la sección entera sin datos.
      const contributors = await gh(
        `/repos/${ORG}/${r.name}/contributors?per_page=6`,
      )
        .then((list) =>
          (list as Array<{ login: string }>).map((c) => c.login),
        )
        .catch(() => [])

      return {
        name: r.name,
        url: r.html_url,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        fork: r.fork,
        contributors,
      }
    }),
  )

  // Más estrellas primero; entre empatados, el que se tocó hace menos (la API
  // ya los devuelve ordenados por push).
  return repos.sort((a, b) => b.stars - a.stars)
}

export async function listRepos(): Promise<Array<Repo>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.repos
  // ponytail: una sola petición en vuelo; sin esto un peak de visitas al
  // vencer la caché dispara una llamada a GitHub por visita.
  enVuelo ??= fetchRepos()
    .then((repos) => {
      cache = { at: Date.now(), repos }
      return repos
    })
    .finally(() => {
      enVuelo = null
    })

  // Si GitHub falla y tenemos algo viejo, sirve lo viejo antes que nada.
  return enVuelo.catch((error) => {
    if (cache) return cache.repos
    throw error
  })
}
