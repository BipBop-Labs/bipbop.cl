import { Link, createFileRoute } from '@tanstack/react-router'

import { capture } from '#/lib/analytics'
import { reviSchema } from '#/data/schema'

const DESCRIPTION =
  'Revi CChC es el asistente con inteligencia artificial de la Cámara Chilena de la Construcción para permisos de edificación en Chile. Disponible en app.ia-revi.cl. Lee planos y documentos, y guía a solicitantes y revisores municipales (DOM) por la normativa.'

export const Route = createFileRoute('/revi')({
  head: () => ({
    meta: [
      {
        title: 'Revi CChC · Asistente IA para permisos de edificación en Chile',
      },
      { name: 'description', content: DESCRIPTION },
      {
        name: 'keywords',
        content:
          'Revi, Revi CChC, Revi Cámara Chilena de la Construcción, qué es Revi, cómo funciona Revi, quién hizo Revi, ia-revi, ia revi, ia-revi.cl, app.ia-revi.cl, Revi IA, Revi CChC IA, permisos de edificación Chile, permiso edificación IA, BipBop Labs, Clara Revi, Norman Revi, DOM Chile, Direcciones de Obras Municipales, asistente IA construcción, LGUC, OGUC',
      },
      { property: 'og:type', content: 'article' },
      {
        property: 'og:title',
        content:
          'Revi CChC · Qué es y cómo funciona el asistente IA para permisos de edificación',
      },
      {
        property: 'og:description',
        content:
          'Revi CChC es el asistente con IA de la Cámara Chilena de la Construcción para permisos de edificación en Chile. Disponible en app.ia-revi.cl.',
      },
      { property: 'og:url', content: 'https://bipbop.cl/revi' },
      {
        property: 'og:image',
        content: 'https://bipbop.cl/brand/projects/revi/banner.png',
      },
      { property: 'og:image:width', content: '1441' },
      { property: 'og:image:height', content: '454' },
      { property: 'og:image:type', content: 'image/png' },
      {
        property: 'og:image:alt',
        content:
          'Revi CChC, asistente con IA de la Cámara Chilena de la Construcción para permisos de edificación',
      },
      { property: 'og:locale', content: 'es_CL' },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: 'Revi CChC · Asistente IA para permisos de edificación',
      },
      {
        name: 'twitter:description',
        content:
          'Revi CChC es el asistente con IA de la Cámara Chilena de la Construcción. Lee planos y guía a solicitantes y DOM por la normativa.',
      },
      {
        name: 'twitter:image',
        content: 'https://bipbop.cl/brand/projects/revi/banner.png',
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

const MUNICIPIOS = [
  'Independencia',
  'Maipú',
  'Providencia',
  'Puerto Montt',
  'Aysén',
  'Valdivia',
  'Puerto Varas',
  'Vitacura',
  'Viña del Mar',
  'Renca',
  'Rancagua',
]

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
        Revi está en producción en 12 municipios de Chile: Independencia, Maipú,
        Providencia, Puerto Montt, Aysén, Valdivia, Puerto Varas, Vitacura, Viña
        del Mar, Renca y Rancagua.
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
        Revi está disponible en{' '}
        <AppLink location="faq">app.ia-revi.cl</AppLink>.
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
    <main className="mx-auto max-w-[760px] px-6 pt-16 pb-24 leading-[1.65]">
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

      <div
        className="mb-10 aspect-[1441/360] rounded-[6px] border border-line bg-[url('/brand/projects/revi/banner.png')] bg-cover bg-center bg-no-repeat"
        role="img"
        aria-label="Revi CChC, asistente con IA de la Cámara Chilena de la Construcción para permisos de edificación"
      />

      <h1 className="mb-5 font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.1] font-normal tracking-[-0.01em]">
        Qué es Revi <em className="text-success italic">de la CChC</em>
      </h1>

      <p className="mb-10 max-w-[60ch] text-[1.2rem] leading-[1.55] font-normal text-ink-2">
        <strong>Revi</strong> (también conocido como <strong>Revi CChC</strong> o{' '}
        <strong>ia-revi</strong>) es el asistente con inteligencia artificial de
        la <strong>Cámara Chilena de la Construcción (CChC)</strong> para{' '}
        <strong>permisos de edificación en Chile</strong>. Lee planos
        arquitectónicos y documentos, y guía a solicitantes y a revisores
        municipales por la normativa, juntos.
      </p>

      <p className={P}>
        <AppLink location="body">Prueba Revi en app.ia-revi.cl</AppLink>
      </p>

      <p className="mb-10 text-[0.85rem] text-ink-2">
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
        . Publicado el 17 de mayo de 2026, actualizado el 18 de junio de 2026.
      </p>

      <h2 className={H2}>¿Para qué sirve Revi?</h2>
      <p className={P}>
        Tramitar un <strong>permiso de edificación en Chile</strong> es un
        proceso largo, lleno de normativa específica (LGUC, OGUC, planos
        reguladores comunales) y de ida y vuelta entre los solicitantes y las{' '}
        <strong>Direcciones de Obras Municipales (DOM)</strong>. Revi acorta ese
        ciclo: lee el expediente, identifica lo que falta o no calza con la
        norma, y propone correcciones antes de que el caso vuelva a revisión.
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

      <h2 className={H2}>¿Cómo se usa Revi CChC?</h2>
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
        />
        <AssistantCard
          src="/brand/projects/revi/norman.svg"
          name="Norman"
          copy="Para revisores municipales. Apoya a las Direcciones de Obras Municipales a revisar expedientes contra la normativa vigente."
        />
      </div>

      <h2 className={H2}>Dónde se usa Revi</h2>
      <p className={P}>Revi está en producción en 12 municipios de Chile:</p>
      <ul className={UL}>
        {MUNICIPIOS.map((m) => (
          <li key={m}>Municipalidad de {m}</li>
        ))}
      </ul>

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
          <strong>OGUC (Ordenanza General de Urbanismo y Construcciones):</strong>{' '}
          reglamento que detalla la aplicación de la LGUC, con requisitos
          técnicos y de procedimiento.
        </li>
      </ul>

      <h2 className={H2}>Otros nombres con que se busca Revi</h2>
      <p className={P}>
        Revi aparece referida con varios nombres en buscadores y conversaciones
        del rubro. Todos refieren a lo mismo: el asistente con IA de la CChC
        para permisos de edificación en Chile.
      </p>
      <ul className={UL}>
        <li>
          <strong>Revi CChC</strong> (asistente de la Cámara Chilena de la
          Construcción)
        </li>
        <li>
          <strong>ia-revi</strong> o <strong>ia revi</strong> (por el dominio
          app.ia-revi.cl)
        </li>
        <li>
          <strong>Revi IA</strong> o <strong>Revi de la CChC</strong>
        </li>
        <li>
          <strong>Clara</strong> y <strong>Norman</strong> (los dos asistentes
          que conforman Revi)
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
}: {
  src: string
  name: string
  copy: string
}) {
  return (
    <div className="rounded-[6px] border border-line bg-surface p-5">
      <img className="mb-3 h-12 w-12" src={src} alt={name} />
      <h3 className="mb-2 text-[1.05rem] font-semibold">{name}</h3>
      <p className="text-[0.95rem] text-ink-2">{copy}</p>
    </div>
  )
}
