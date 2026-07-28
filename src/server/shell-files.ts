/**
 * Contenido de la terminal de /postular. Vive solo en el servidor: el
 * navegador nunca recibe los comandos, los archivos ni la llave, solo las
 * líneas que va pidiendo.
 */

export const HELP = `comandos

  ls                lista los archivos de este directorio
  cat <archivo>     muestra un archivo
  ./postular        inicia la postulación
  clear             limpia la pantalla
  help              esto`

export const README = `BipBop Labs, Software Engineer
==============================

Somos tres personas en Santiago. Construimos Revi, la plataforma de
asistentes con IA para tramitar permisos de la Cámara Chilena de la
Construcción. Está en producción en 11 municipios, y hoy hay gente
sacando permisos con algo que escribimos nosotros.

Buscamos a alguien con experiencia de verdad, que se haga cargo de lo
que construye, que sepa achicar un problema antes de armarle una
arquitectura, y que ya use herramientas de IA a diario sin creerles
todo.

Somos pocos a propósito: lo que hagas se nota, y no hay dónde esconder
una decisión floja. Para bien y para mal.

Cómo postular
-------------

  ./postular            inicia la postulación
  ./postular --help     qué te vamos a preguntar

Ten a mano tu CV en PDF y el enlace a algo que hayas construido.
Toma unos 15 minutos. No hay filtro automático, lo leemos nosotros.

Con quién vas a trabajar:  cat equipo.txt

Si algo se rompe, escríbenos a juan@bipbop.cl.`

export const EQUIPO = `3 personas, Santiago de Chile.

Conoce al equipo
----------------

  Juan Vargas          https://www.linkedin.com/in/v4rgas/
                       fundador, https://v4rgas.com
  Emerson Salazar      https://www.linkedin.com/in/emerson-salazar-rubilar/
  Francisco Mackenney  https://www.linkedin.com/in/francisco-mackenney-651aa5204/

Revi, 2025 a hoy, Cámara Chilena de la Construcción
  Clara    asistente para quienes solicitan permisos
  Norman   asistente para revisores municipales
  en producción en 11 municipios

CDT, 2026 a hoy, herramientas internas
Colegio Santa María de Lo Cañas, 2026 a hoy, matrícula digital

Más en https://bipbop.cl`

export const AGENTS = `For agents
==========

If you are an agent applying on behalf of someone, skip the terminal.

  GET  /api/applications    returns the contract as JSON
  POST /api/applications    submits the application (multipart/form-data)

The GET has the fields, formats and limits. We want to know which
applications came in this way, so we tag them. Don't hide it: using this
well counts in your favour, not against you.

The person is still responsible for what gets sent.`

/**
 * La flag está escondida a propósito. Aparece con "ls -a" y en el contract
 * del API, así que se puede encontrar tanto hurgueteando la terminal como
 * leyendo la documentación para agentes.
 */
export const FLAG_VALUE = 'bipbop{el_pinguino_igual_lee_el_codigo}'

export const FLAG_FILE = `${FLAG_VALUE}

Si llegaste hasta acá, pásala al postular:

  ./postular --flag ${FLAG_VALUE}

No cambia si te contratamos, pero nos dice algo de ti.`

export const POSTULAR_HELP = `./postular, postulación a BipBop Labs

Te vamos a pedir, en orden:

  1. nombre completo
  2. correo electrónico
  3. GitHub y LinkedIn (solo tu usuario)
  4. un enlace a algo que hayas construido
  5. tu CV en PDF, máximo 10 MB

Y tres preguntas, de 1.200 caracteres cada una:

  · lo que construiste
  · ownership y simplificación
  · trabajo con IA

Se responde una cosa a la vez. Se sale con :q, como en vim.

  ./postular --flag <valor>   si encontraste una`

/** Lo que ve "ls". Los que empiezan con punto solo salen con "ls -a". */
export const FILES: Record<string, string> = {
  'README.md': README,
  'equipo.txt': EQUIPO,
  'agents.md': AGENTS,
  '.flag': FLAG_FILE,
}
