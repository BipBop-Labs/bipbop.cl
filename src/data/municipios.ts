/** Municipios donde Revi está en producción. Fuente única para páginas y JSON-LD. */
export const MUNICIPIOS = [
  ['independencia', 'Independencia', 'https://www.independencia.cl/'],
  ['maipu', 'Maipú', 'https://www.maipu.cl/'],
  ['providencia', 'Providencia', 'https://providencia.cl/'],
  ['pmontt', 'Puerto Montt', 'https://www.puertomontt.cl/'],
  ['aysen', 'Puerto Aysén', 'https://www.puertoaysen.cl/'],
  ['valdivia', 'Valdivia', 'https://munivaldivia.cl/'],
  ['pvaras', 'Puerto Varas', 'https://www.ptovaras.cl/'],
  ['vitacura', 'Vitacura', 'https://vitacura.cl/'],
  ['vina', 'Viña del Mar', 'https://www.munivina.cl/'],
  ['renca', 'Renca', 'https://renca.cl/'],
  ['rancagua', 'Rancagua', 'https://www.rancagua.cl/'],
  ['sanmiguel', 'San Miguel', 'https://web.sanmiguel.cl/'],
  ['los-angeles', 'Los Ángeles', 'https://www.losangeles.cl/'],
  ['talca', 'Talca', 'https://www.talca.cl/'],
  ['recoleta', 'Recoleta', 'https://www.recoleta.cl/'],
  ['alto-hospicio', 'Alto Hospicio', 'https://maho.cl/web/'],
] as const

export const MUNICIPIOS_COUNT = MUNICIPIOS.length

/** "Independencia, Maipú, … Renca y Rancagua" */
export const MUNICIPIOS_TEXTO = MUNICIPIOS.map(([, n]) => n)
  .join(', ')
  .replace(/, ([^,]+)$/, ' y $1')
