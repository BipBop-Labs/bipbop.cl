/** Municipios donde Revi está en producción. Fuente única para páginas y JSON-LD. */
export const MUNICIPIOS = [
  ['independencia', 'Independencia'],
  ['maipu', 'Maipú'],
  ['providencia', 'Providencia'],
  ['pmontt', 'Puerto Montt'],
  ['aysen', 'Puerto Aysén'],
  ['valdivia', 'Valdivia'],
  ['pvaras', 'Puerto Varas'],
  ['vitacura', 'Vitacura'],
  ['vina', 'Viña del Mar'],
  ['renca', 'Renca'],
  ['rancagua', 'Rancagua'],
  ['sanmiguel', 'San Miguel'],
] as const

export const MUNICIPIOS_COUNT = MUNICIPIOS.length

/** "Independencia, Maipú, … Renca y Rancagua" */
export const MUNICIPIOS_TEXTO = MUNICIPIOS.map(([, n]) => n)
  .join(', ')
  .replace(/, ([^,]+)$/, ' y $1')

/** Municipios anunciados como próximos por la CChC (app.ia-revi.cl). */
export const PROXIMOS = [
  'Talca',
  'Los Ángeles',
  'Recoleta',
  'Talcahuano',
  'Alto Hospicio',
] as const

export const PROXIMOS_TEXTO = PROXIMOS.join(', ').replace(/, ([^,]+)$/, ' y $1')
