import { Link, createFileRoute } from '@tanstack/react-router'

import {
  MUNICIPIOS,
  MUNICIPIOS_COUNT,
  MUNICIPIOS_TEXTO,
} from '#/data/municipios'
import { capture } from '#/lib/analytics'
import { reviSchema } from '#/data/schema'
import { REVI_PRESS } from '#/data/revi-press'

const DESCRIPTION =
  'Cómo BipBop Labs desarrolló Revi junto a la Cámara Chilena de la Construcción: un asistente con IA que lee planos y guía a solicitantes y a la DOM en permisos de edificación.'
const TITLE =
  'Revi · IA para permisos de edificación · Caso de BipBop Labs junto a la CChC'

export const Route = createFileRoute('/revi')({
  head: () => ({
    meta: [
      {
        title: TITLE,
      },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:type', content: 'article' },
      {
        property: 'og:title',
        content: TITLE,
      },
      {
        property: 'og:description',
        content: DESCRIPTION,
      },
      { property: 'og:url', content: 'https://bipbop.cl/revi' },
      {
        property: 'og:image',
        content: 'https://bipbop.cl/brand/projects/revi/og-revi.jpg',
      },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: 'image/jpeg' },
      {
        property: 'og:image:alt',
        content:
          'Revi CChC, asistente con IA de la Cámara Chilena de la Construcción para permisos de edificación',
      },
      { property: 'og:locale', content: 'es_CL' },
      { property: 'article:published_time', content: '2026-05-17' },
      { property: 'article:modified_time', content: '2026-09-01' },
      { property: 'article:author', content: 'Juan Vargas' },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: TITLE,
      },
      {
        name: 'twitter:description',
        content: DESCRIPTION,
      },
      {
        name: 'twitter:image',
        content: 'https://bipbop.cl/brand/projects/revi/og-revi.jpg',
      },
      { name: 'twitter:image:alt', content: 'Revi CChC, asistente con IA' },
    ],
    links: [
      { rel: 'canonical', href: 'https://bipbop.cl/revi' },
      { rel: 'alternate', hrefLang: 'es-CL', href: 'https://bipbop.cl/revi' },
      {
        rel: 'alternate',
        hrefLang: 'x-default',
        href: 'https://bipbop.cl/revi',
      },
    ],
    scripts: [
      { type: 'application/ld+json', children: JSON.stringify(reviSchema) },
    ],
  }),
  component: Revi,
})

const A = 'border-b border-success text-success no-underline hover:opacity-70'
const H2 = 'mt-12 mb-4 text-[1.35rem] font-semibold tracking-[-0.01em]'
const P = 'mb-4 max-w-[62ch]'
const UL = 'mt-2 mb-6 ml-6 list-disc [&>li]:mb-[0.4rem]'

const FAQ = [
  {
    q: '¿Qué es Revi?',
    a: (
      <>
        Revi es un asistente con inteligencia artificial creado para la Cámara
        Chilena de la Construcción (CChC) que facilita los permisos de
        edificación en Chile. Lee planos y documentos, y guía a solicitantes y
        revisores municipales por la normativa.
      </>
    ),
  },
  {
    q: '¿Dónde se usa Revi?',
    a: (
      <>
        Revi está en producción en {MUNICIPIOS_COUNT} municipios de Chile:{' '}
        {MUNICIPIOS_TEXTO}.
      </>
    ),
  },
  {
    q: '¿Quiénes son Clara y Norman?',
    a: (
      <>
        Clara y Norman son los dos asistentes de Revi. Clara ayuda a los
        solicitantes de permisos de edificación, y Norman ayuda a los revisores
        de las Direcciones de Obras Municipales (DOM).
      </>
    ),
  },
  {
    q: '¿Cómo accedo a Revi?',
    a: (
      <>
        Revi está disponible en <AppLink location="faq">app.ia-revi.cl</AppLink>
        .
      </>
    ),
  },
  {
    q: '¿Cuánto cuesta Revi?',
    a: (
      <>
        Revi es gratuito para todos los usuarios. Actualmente solo se apoya a
        las municipalidades con convenio con la Cámara Chilena de la
        Construcción (CChC).
      </>
    ),
  },
  {
    q: '¿Quién hizo Revi?',
    a: (
      <>
        Revi fue desarrollado por{' '}
        <Link className={A} to="/">
          BipBop Labs
        </Link>
        , un estudio de software chileno, en colaboración con la{' '}
        <strong>Cámara Chilena de la Construcción (CChC)</strong>.
      </>
    ),
  },
  {
    q: '¿Revi reemplaza al revisor municipal?',
    a: (
      <>
        No. Revi es un apoyo, no un reemplazo. Tanto el solicitante como la DOM
        mantienen sus roles y decisiones; Revi acelera la revisión documental y
        ayuda a detectar observaciones contra la normativa antes de la revisión
        formal.
      </>
    ),
  },
]

function AppLink({
  children,
  location,
}: {
  children: React.ReactNode
  location: 'faq' | 'body'
}) {
  return (
    <a
      className={A}
      href="https://app.ia-revi.cl/"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => capture('revi_app_link_clicked', { location })}
    >
      {children}
    </a>
  )
}

function Revi() {
  return (
    <main
      className="mx-auto max-w-[760px] px-6 pt-16 pb-24 leading-[1.65]"
      itemScope
      itemType="https://schema.org/Article"
    >
      <nav
        className="mb-8 text-[0.78rem] tracking-[0.08em] text-ink-3 uppercase"
        aria-label="Breadcrumb"
      >
        <Link
          className="border-b border-dotted border-ink-3 text-ink-3 no-underline hover:border-success hover:text-success"
          to="/"
        >
          BipBop Labs
        </Link>{' '}
        / Revi
      </nav>

      <img
        className="mb-10 aspect-[1441/454] h-auto w-full rounded-[6px] border border-line object-cover"
        src="/brand/projects/revi/banner.webp"
        width="1441"
        height="454"
        alt="Revi CChC, asistente con IA de la Cámara Chilena de la Construcción para permisos de edificación"
        fetchPriority="high"
        decoding="async"
        itemProp="image"
      />

      <h1
        className="mb-5 font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.1] font-normal tracking-[-0.01em]"
        itemProp="headline"
      >
        Revi: IA para permisos de edificación,{' '}
        <em className="text-success italic">desarrollada junto a la CChC</em>
      </h1>

      <p
        className="mb-10 max-w-[60ch] text-[1.2rem] leading-[1.55] font-normal text-ink-2"
        itemProp="description"
      >
        En <strong>BipBop Labs</strong> desarrollamos <strong>Revi</strong>{' '}
        junto a la <strong>Cámara Chilena de la Construcción (CChC)</strong>:
        una plataforma de asistentes con inteligencia artificial que ayuda a
        solicitantes y a las Direcciones de Obras Municipales a revisar{' '}
        <strong>permisos de edificación en Chile</strong>. Lee planos
        arquitectónicos y documentos, y guía a ambos lados por la normativa.
      </p>

      <p className={P}>
        <AppLink location="body">Prueba Revi en app.ia-revi.cl</AppLink>
      </p>

      <p className="mb-8 text-[0.85rem] text-ink-2">
        Por{' '}
        <a
          className="border-b border-dotted border-ink-3 text-ink-2 no-underline hover:opacity-70"
          href="https://v4rgas.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Juan Vargas
        </a>
        , fundador de{' '}
        <Link
          className="border-b border-dotted border-ink-3 text-ink-2 no-underline hover:opacity-70"
          to="/"
        >
          BipBop Labs
        </Link>
        . Publicado el{' '}
        <time dateTime="2026-05-17" itemProp="datePublished">
          17 de mayo de 2026
        </time>
        , actualizado el{' '}
        <time dateTime="2026-09-01" itemProp="dateModified">
          1 de septiembre de 2026
        </time>
        .
      </p>

      <nav
        className="mb-12 border-y border-line py-5 text-[0.92rem]"
        aria-label="Contenido del artículo"
      >
        <p className="mb-2 font-semibold">En esta página</p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2 max-[560px]:grid-cols-1">
          <li><a className={A} href="#nuestro-trabajo">Nuestro trabajo en Revi</a></li>
          <li><a className={A} href="#para-que-sirve">Para qué sirve</a></li>
          <li><a className={A} href="#como-se-usa">Cómo se usa</a></li>
          <li><a className={A} href="#donde-se-usa">Municipios disponibles</a></li>
          <li><a className={A} href="#faq">Preguntas frecuentes</a></li>
        </ul>
      </nav>

      <h2 className={H2} id="nuestro-trabajo">Nuestro trabajo en Revi</h2>
      <p className={P}>
        BipBop Labs es el equipo de ingeniería de software detrás de Revi.
        Trabajamos junto al equipo de la CChC en el diseño, el desarrollo, la
        operación y la evolución del producto: desde el primer piloto en una
        municipalidad hasta la plataforma que hoy corre en{' '}
        {MUNICIPIOS_COUNT} municipios. La CChC impulsa la iniciativa, define
        prioridades y lleva la relación con las municipalidades; nosotros
        construimos y mantenemos la tecnología.
      </p>
      <ul className={UL}>
        <li>
          <strong>Lectura de expedientes.</strong> Modelos que leen planos
          arquitectónicos, memorias y certificados, y los cruzan con la
          normativa aplicable (LGUC, OGUC y planes reguladores comunales).
        </li>
        <li>
          <strong>Dos asistentes, dos roles.</strong> Diseñamos Clara para
          quien ingresa un permiso y Norman para quien lo revisa en la DOM,
          porque los dos lados del trámite necesitan respuestas distintas
          sobre el mismo expediente.
        </li>
        <li>
          <strong>Trabajo con revisores reales.</strong> Cada municipio nuevo
          se incorpora con sus propios criterios y ordenanzas, y ajustamos el
          sistema con los revisores municipales antes de ponerlo en
          producción.
        </li>
        <li>
          <strong>Operación continua.</strong> Somos responsables de la
          plataforma en producción: infraestructura, seguridad, monitoreo y
          las mejoras que salen de lo que vemos en uso.
        </li>
      </ul>

      <h2 className={H2} id="para-que-sirve">¿Para qué sirve Revi?</h2>
      <p className={P}>
        Tramitar un <strong>permiso de edificación en Chile</strong> es un
        proceso largo, lleno de normativa específica (LGUC, OGUC, planos
        reguladores comunales) y de ida y vuelta entre los solicitantes y las{' '}
        <strong>Direcciones de Obras Municipales (DOM)</strong>. Revi acorta ese
        ciclo: lee el expediente, identifica lo que falta o no calza con la
        norma, y propone correcciones antes de que el caso vuelva a revisión.
        Según la <strong>CChC</strong>, la herramienta ha reducido los tiempos
        de tramitación en cerca de un <strong>30%</strong> en los municipios
        donde ya opera, de acuerdo con la{' '}
        <a className={A} href={REVI_PRESS[2].href} target="_blank" rel="noopener noreferrer">
          cobertura de La Tercera
        </a>
        .
      </p>
      <p className={P}>
        Revi fue impulsado por la{' '}
        <strong>Cámara Chilena de la Construcción (CChC)</strong> como una
        iniciativa público-privada para modernizar la tramitación municipal.
        Está desarrollado por{' '}
        <Link className={A} to="/">
          BipBop Labs
        </Link>
        .
      </p>

      <h2 className={H2} id="como-se-usa">¿Cómo se usa Revi?</h2>
      <p className={P}>
        Para usar Revi, entra a{' '}
        <AppLink location="body">app.ia-revi.cl</AppLink> y elige el asistente
        según tu rol: <strong>Clara</strong> si vas a ingresar un permiso de
        edificación a la DOM, o <strong>Norman</strong> si eres revisor
        municipal. Subes los documentos del expediente (planos, memoria,
        certificados) y Revi los lee, los contrasta con la normativa vigente y
        conversa contigo para resolver dudas u observaciones.
      </p>

      <h2 className={H2}>Clara y Norman: los dos asistentes de Revi</h2>
      <div className="my-4 mb-8 grid grid-cols-2 gap-6 max-[560px]:grid-cols-1">
        <AssistantCard
          src="/brand/projects/revi/clara.svg"
          name="Clara"
          copy="Para solicitantes. Ayuda a preparar el expediente y a entender qué pide la normativa antes de ingresarlo a la DOM."
          href="https://app.ia-revi.cl/clara"
        />
        <AssistantCard
          src="/brand/projects/revi/norman.svg"
          name="Norman"
          copy="Para revisores municipales. Apoya a las Direcciones de Obras Municipales a revisar expedientes contra la normativa vigente."
          href="https://app.ia-revi.cl/norman"
        />
      </div>

      <h2 className={H2} id="donde-se-usa">Dónde se usa Revi</h2>
      <p className={P}>
        Revi está en producción en {MUNICIPIOS_COUNT} municipios de Chile:
      </p>
      <ul className={UL}>
        {MUNICIPIOS.map(([slug, name]) => (
          <li key={slug}>Municipalidad de {name}</li>
        ))}
      </ul>

      <h2 className={H2}>Revi en la prensa</h2>
      <p className={P}>
        El lanzamiento, la expansión municipal y los resultados de Revi han
        sido cubiertos por medios nacionales y especializados.
      </p>
      <div className="mb-8 grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
        {REVI_PRESS.map((item) => (
          <a
            key={item.href}
            className="group flex flex-col rounded-[6px] border border-line bg-surface p-5 text-ink no-underline transition-colors hover:border-success"
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              capture('revi_press_link_clicked', { outlet: item.outlet })
            }
          >
            <span className="mb-3 text-[0.72rem] tracking-[0.08em] text-ink-3 uppercase">
              {item.outlet} · {item.date}
            </span>
            <span className="text-[1rem] leading-[1.45] font-semibold group-hover:text-success">
              {item.title}
            </span>
            <span className="mt-auto pt-4 text-[0.82rem] text-success">
              Leer artículo ↗
            </span>
          </a>
        ))}
      </div>

      <h2 className={H2}>Glosario rápido: DOM, LGUC y OGUC</h2>
      <p className={P}>
        Para entender qué hace Revi conviene tener a mano los términos que más
        se repiten en un permiso de edificación:
      </p>
      <ul className={UL}>
        <li>
          <strong>DOM (Dirección de Obras Municipales):</strong> unidad de cada
          municipalidad que revisa y aprueba los permisos de edificación.
        </li>
        <li>
          <strong>LGUC (Ley General de Urbanismo y Construcciones):</strong> ley
          que regula la planificación urbana y la construcción en Chile.
        </li>
        <li>
          <strong>
            OGUC (Ordenanza General de Urbanismo y Construcciones):
          </strong>{' '}
          reglamento que detalla la aplicación de la LGUC, con requisitos
          técnicos y de procedimiento.
        </li>
      </ul>

      <h2 className={H2} id="faq">
        Preguntas frecuentes sobre Revi
      </h2>
      <div className="faq">
        {FAQ.map((item, i) => (
          <details
            key={item.q}
            open={i === 0}
            className="border-b border-line py-4"
          >
            <summary className="cursor-pointer text-[1.05rem] font-semibold">
              {item.q}
            </summary>
            <p className="mt-3 max-w-[62ch] text-ink-2">{item.a}</p>
          </details>
        ))}
      </div>

      <h2 className={H2}>¿Tienes un problema parecido?</h2>
      <p className={P}>
        Si trabajas en un gremio, una municipalidad o una empresa con un proceso
        normativo pesado que podría apoyarse en IA, escríbenos a{' '}
        <a
          className={A}
          href="mailto:juan@bipbop.cl"
          onClick={() =>
            capture('contact_email_clicked', {
              page: 'revi',
              email: 'juan@bipbop.cl',
            })
          }
        >
          juan@bipbop.cl
        </a>
        .
      </p>

      <footer className="mt-16 border-t border-line pt-8 text-[0.78rem] tracking-[0.06em] text-ink-3">
        <p>
          © {new Date().getFullYear()} BipBop Labs · Santiago, CL ·{' '}
          <Link className="border-0 text-ink-2 no-underline" to="/">
            bipbop.cl
          </Link>
        </p>
      </footer>
    </main>
  )
}

function AssistantCard({
  src,
  name,
  copy,
  href,
}: {
  src: string
  name: string
  copy: string
  href: string
}) {
  return (
    <a
      className="group rounded-[6px] border border-line bg-surface p-5 text-ink no-underline transition-colors hover:border-success focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir ${name} Revi`}
      onClick={() =>
        capture('revi_assistant_link_clicked', {
          assistant: name.toLowerCase(),
          location: 'revi',
        })
      }
    >
      <img
        className="mb-3 h-12 w-12"
        src={src}
        alt={name}
        loading="lazy"
        decoding="async"
      />
      <h3 className="mb-2 text-[1.05rem] font-semibold group-hover:text-success">
        {name} ↗
      </h3>
      <p className="text-[0.95rem] text-ink-2">{copy}</p>
    </a>
  )
}
