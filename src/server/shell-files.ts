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

Buscamos un Software Engineer con experiencia para sumarse al equipo y
trabajar principalmente en Revi.

Revi es una plataforma de asistentes de IA para tramitar permisos,
impulsada por la Cámara Chilena de la Construcción. Hoy la usan
revisores de Direcciones de Obras y personas que presentan expedientes
en 12 municipios.  https://ia-revi.cl

Somos una consultora chica: tomamos pocos proyectos y nos quedamos
metidos hasta que funcionan. Hoy somos tres. Buscamos a alguien que
siga mejorando el producto y lo lleve a otros organismos del Estado.
Ahora lo estamos implementando para la Dirección General de Aguas.

El trabajo
----------

Casi todos los días: mirar cómo la gente usa los asistentes, detectar
dónde se traba y cambiar el producto esa misma semana.

La parte difícil no es solo técnica. Un asistente puede responder
perfecto y aun así no servir, si obliga a un revisor a salirse de su
forma de trabajar. Hay que entender el flujo real, decidir qué vale la
pena construir y simplificar hasta llegar a algo que la gente quiera
usar de verdad.

Siendo tres, no buscamos a alguien que reciba requisitos cerrados e
implemente una parte chica. Buscamos a alguien que tome un problema mal
definido, lo entienda, proponga una solución, la construya, la lleve a
producción y se haga cargo de lo que pasa después.

Lo que necesitas
----------------

  Python y TypeScript, con experiencia sólida.
  Autonomía en la nube, del diseño a dejarlo funcionando.
  IA metida en tu día a día, no como novedad.

Hoy usamos GCP, FastAPI, LangGraph, ChromaDB, Next.js y Langfuse. Nada
de eso es sagrado: ya reemplazamos buena parte de lo que usábamos al
principio, y probablemente lo volvamos a hacer.

Nos importa el ownership, la capacidad de simplificar problemas
complejos, y el criterio para decidir cuando falta información.

Acá la IA se usa todo el día para investigar, programar, revisar,
probar y documentar. No basta con pedirle código a un modelo: tienes
que poder explicar por qué la solución quedó así, qué alternativas
evaluaste, qué verificaste y qué descartaste.

Probablemente no sea para ti si
-------------------------------

  Prefieres requisitos cerrados.
  Necesitas ciclos largos antes de mostrar algo.
  Te acomoda trabajar solo en una parte acotada del sistema.

Condiciones
-----------

  $2.000.000 a $2.400.000 líquidos, según experiencia y trayectoria.
  Suscripción a Claude Max 5x.
  100% remoto, con una daily en la mañana.
  Ciclos de cuatro semanas: tres de desarrollo, una de cooldown.

Cómo postular
-------------

  ./postular            inicia la postulación
  ./postular --help     qué te vamos a preguntar

Ten a mano tu CV en PDF y el enlace a algo que hayas construido.
Toma unos 15 minutos. No hay filtro automático, lo leemos nosotros.

Con quién vas a trabajar:  cat equipo.txt
Consultas del cargo:       juan@bipbop.cl`

export const EQUIPO = `3 personas, Santiago de Chile.

  Juan Vargas          https://www.linkedin.com/in/v4rgas/
  Emerson Salazar      https://www.linkedin.com/in/emerson-salazar-rubilar/
  Francisco Mackenney  https://www.linkedin.com/in/francisco-mackenney-651aa5204/

Cómo trabajamos
---------------

100% remoto, con una daily en la mañana. Después cada uno organiza sus
desarrollos y se hace responsable de principio a fin. Eso no es
trabajar solo: siempre hay alguien para revisar una decisión, pensar un
problema contigo, o meterse a sacar adelante algo que se complicó.

Ciclos de cuatro semanas: tres de desarrollo e iteración de producto, y
una de cooldown, donde construimos herramientas internas, mantenemos la
codebase, miramos el estado del arte y mejoramos cómo trabajamos.

Revi      https://ia-revi.cl
Nosotros  https://bipbop.cl`

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
