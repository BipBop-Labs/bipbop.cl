import { Link, createFileRoute } from '@tanstack/react-router'

import { Wordmark } from '#/components/wordmark'
import {
  MUNICIPIOS,
  MUNICIPIOS_COUNT,
  MUNICIPIOS_TEXTO,
} from '#/data/municipios'
import { capture } from '#/lib/analytics'
import { homeSchema } from '#/data/schema'
import { useLang, useT } from '#/lib/lang'

const DESCRIPTION =
  'Software hecho con cariño, pensado contigo y construido a tu lado. Un estudio pequeño para empresas a las que les importan los detalles.'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'BipBop Labs · software hecho con cariño · Santiago, CL' },
      { name: 'description', content: DESCRIPTION },
      {
        name: 'keywords',
        content:
          'BipBop Labs, software con IA Chile, Juan Vargas, Santiago Chile, estudio software, Revi, Revi CChC, qué es Revi, ia-revi, app.ia-revi.cl, Cámara Chilena de la Construcción, permisos de edificación Chile, Clara Revi, Norman Revi, asistente IA construcción, DOM Chile',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'BipBop Labs' },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:url', content: 'https://bipbop.cl' },
      {
        property: 'og:image',
        content: 'https://bipbop.cl/brand/generated/og.png',
      },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: 'image/png' },
      {
        property: 'og:image:alt',
        content: 'BipBop Labs, estudio de software en Santiago, Chile',
      },
      { property: 'og:locale', content: 'es_CL' },
      { property: 'og:locale:alternate', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'BipBop Labs' },
      { name: 'twitter:description', content: DESCRIPTION },
      {
        name: 'twitter:image',
        content: 'https://bipbop.cl/brand/generated/og.png',
      },
      {
        name: 'twitter:image:alt',
        content: 'BipBop Labs, estudio de software en Santiago, Chile',
      },
    ],
    links: [
      { rel: 'canonical', href: 'https://bipbop.cl' },
      { rel: 'alternate', hrefLang: 'es-CL', href: 'https://bipbop.cl/' },
      { rel: 'alternate', hrefLang: 'x-default', href: 'https://bipbop.cl/' },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(homeSchema),
      },
    ],
  }),
  component: Home,
})

const CARD = 'mb-20 overflow-hidden rounded-[6px] border border-line bg-surface'
const BANNER_SHADE =
  'absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,var(--color-surface)_100%)]'
const SECTION_HEAD =
  'rule-after mb-10 flex items-center gap-4 text-[0.85rem] font-medium text-ink-3'
const FEATURED_CTA =
  'border-b border-success text-base text-success no-underline transition-opacity duration-200 hover:opacity-70'
const PROSE_LINK =
  'border-b border-dotted border-ink-3 text-ink no-underline transition-all duration-200 hover:border-success hover:text-success'

function Home() {
  const t = useT()

  return (
    <>
      <StatusBar />

      <main className="relative z-[2] mx-auto max-w-[880px] px-8 pb-24 max-[720px]:px-5 max-[720px]:pb-20">
        <Hero />

        <div className="relative">
          <img
            className="pointer-events-none absolute top-0 right-[calc(((100vw-100%)/-2)+0.5rem)] z-[1] block h-auto w-[clamp(220px,22vw,360px)] opacity-45 mix-blend-multiply max-[1100px]:hidden"
            src="/brand/machine.webp"
            loading="lazy"
            decoding="async"
            alt=""
            aria-hidden="true"
          />

          <section className="mb-20" id="work">
            <div className={`${SECTION_HEAD} !text-success`}>
              <span>
                {t('En lo que estamos ahora', "What we're on right now")}
              </span>
            </div>

            <ReviCard />

            <div className="mb-6 text-base text-ink-3">
              {t('También en marcha', 'Also in the works')}
            </div>

            <CompactCard
              srHeading="CDT: herramientas internas para la Corporación de Desarrollo Tecnológico"
              banner="/brand/projects/cdt/banner.webp"
              name="Corporación de Desarrollo Tecnológico"
              href="https://www.cdt.cl/"
              sub={t('Herramientas internas', 'Internal tools')}
              desc={t(
                'Unas cuantas cosas más chicas que estamos armando para el brazo tecnológico de la CChC. Vamos hacia reuniones que tomen sus propias notas, áreas que se mantengan al día sin andar persiguiéndose, y un solo lugar para ver qué pasa en la organización. Todavía temprano, y todavía en camino.',
                "A few smaller things we're building for the CChC's tech arm. We're working towards meetings that take their own notes, areas that keep up with each other without chasing for updates, and one place to see what's going on across the org. Still early, and still building our way there.",
              )}
            />
          </section>

          <div className={SECTION_HEAD} id="what-we-do">
            <span>{t('Qué hacemos', 'What we do')}</span>
          </div>

          <section className="mb-20">
            <div className="grid grid-cols-[minmax(0,62ch)_clamp(110px,16vw,170px)] items-start gap-8 text-[1.05rem] leading-[1.7] text-ink max-[560px]:block max-[560px]:max-w-[62ch]">
              <div>
                <p>
                  <span className="mr-[0.35rem] font-semibold text-success">
                    {t('Cómo trabajamos.', 'How we work.')}
                  </span>
                  {t(
                    'Pocos proyectos a la vez. Pensamos contigo qué hay que construir, lo construimos, y nos quedamos hasta resolverlo.',
                    "Two or three projects at a time. We figure out with you what needs to be built, we build it, and we stay on it until it's solved.",
                  )}
                </p>
              </div>
              <span
                className="block aspect-square w-full bg-[url('/brand/generated/bipbop_logo.webp')] bg-contain bg-center bg-no-repeat opacity-90 max-[560px]:mx-auto max-[560px]:mb-6 max-[560px]:w-36"
                aria-hidden="true"
              />
            </div>
          </section>

          <About />

          <Contact />

          <SiteFooter />
        </div>
      </main>
    </>
  )
}

function StatusBar() {
  const { lang, setLang } = useLang()

  const pick = (next: 'es' | 'en') => {
    setLang(next)
    capture('language_switched', { language: next })
  }

  return (
    <div className="pointer-events-none fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-6 py-[0.7rem] text-[0.68rem] tracking-[0.08em] text-ink-3 uppercase max-[720px]:px-4 max-[720px]:py-[0.65rem] max-[720px]:text-[0.6rem]">
      <div className="flex items-center gap-5" />
      <div className="pointer-events-auto flex items-center gap-5">
        <div className="flex gap-0 overflow-hidden rounded-[2px] border border-line">
          {(['en', 'es'] as const).map((code) => (
            <button
              key={code}
              onClick={() => pick(code)}
              className={`cursor-pointer border-0 px-[0.55rem] py-1 text-[0.65rem] tracking-[0.1em] transition-all duration-200 ${
                lang === code
                  ? 'bg-success-soft text-success'
                  : 'bg-transparent text-ink-3 hover:text-ink'
              }`}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Hero() {
  const t = useT()

  const glow =
    '[text-shadow:0_0_14px_var(--color-page),0_0_4px_var(--color-page)]'

  return (
    <section className="hero-skyline relative mb-0 flex min-h-screen flex-col justify-center pb-8 [&>*]:relative [&>*]:z-[2]">
      <Wordmark />

      <p
        className={`motion-safe-opacity mt-8 max-w-[42ch] animate-rise text-[clamp(1.25rem,2.4vw,1.6rem)] leading-[1.4] font-semibold text-ink opacity-0 [animation-delay:0.15s] ${glow}`}
      >
        <em className="text-success not-italic">
          {t('Software hecho con cariño', 'Thoughtful software')}
        </em>
        {t(
          ', pensado contigo y construido a tu lado.',
          ', shaped with you and built by your side.',
        )}
      </p>

      <p
        className={`motion-safe-opacity mt-6 max-w-[56ch] animate-rise text-base leading-[1.7] font-medium text-ink opacity-0 [animation-delay:0.3s] [text-shadow:0_0_10px_var(--color-page),0_0_3px_var(--color-page)]`}
      >
        {t(
          'Tomamos pocos proyectos a la vez. Y nos quedamos cerca hasta que de verdad funcione.',
          'We take on a few projects at a time. And we stay close until it truly works.',
        )}
      </p>

      <div className="motion-safe-opacity mt-8 flex animate-rise flex-wrap gap-3 opacity-0 [animation-delay:0.45s]">
        <a
          className="inline-flex cursor-pointer items-center gap-[0.55rem] rounded-[2px] border border-success bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] px-[1.05rem] py-[0.7rem] text-[0.95rem] font-bold text-success no-underline"
          href="#contact"
          onClick={() => capture('contact_cta_clicked')}
        >
          {t('Conversemos', "Let's talk")}
        </a>
        <a
          className="inline-flex cursor-pointer items-center gap-[0.55rem] rounded-[2px] border border-line bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)] px-[1.05rem] py-[0.7rem] text-[0.95rem] font-semibold text-ink no-underline"
          href="#what-we-do"
          onClick={() => capture('work_cta_clicked')}
        >
          {t('Lo que hacemos', 'What we do')}
        </a>
      </div>
    </section>
  )
}

function ReviCard() {
  const t = useT()

  const onReviLink = () =>
    capture('featured_project_link_clicked', { project: 'revi' })

  return (
    <article className={CARD}>
      <h2 className="sr-only">
        Revi — asistente con IA para permisos de edificación de la Cámara
        Chilena de la Construcción (CChC)
      </h2>
      <div className="relative aspect-[1441/360] bg-[url('/brand/projects/revi/banner.webp')] bg-cover bg-center">
        <div className={BANNER_SHADE} />
      </div>
      <div className="px-9 pt-8 pb-9">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-6">
          <div>
            <img
              className="block h-11 w-auto"
              src="/brand/projects/revi/revi-logo.svg"
              alt="Revi, asistente con IA de la CChC para permisos de edificación"
            />
          </div>
          <div className="flex flex-col gap-[0.15rem] text-base leading-[1.35] text-ink-3">
            <span className="text-ink-2">
              Cámara Chilena de la Construcción
            </span>
            <span>2025 → {t('actualidad', 'present')}</span>
          </div>
        </div>

        <p className="mb-6 max-w-[62ch] text-[1.25rem] leading-[1.55] text-ink">
          {t(
            'Un asistente con IA que hace mucho menos doloroso obtener permisos de edificación en Chile. Lee planos y documentos, y guía a solicitantes y revisores municipales por la normativa, juntos.',
            'An AI helper that makes building permits in Chile far less painful. It reads architectural drawings and paperwork, then walks applicants and city reviewers through the regulations together.',
          )}
        </p>

        <p>
          <a
            className={FEATURED_CTA}
            href="https://app.ia-revi.cl/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onReviLink}
          >
            {t('Prueba Revi', 'Try Revi')}
          </a>
          &nbsp;·&nbsp;
          <Link
            className={FEATURED_CTA}
            to="/revi"
            title={t('Qué es Revi CChC', 'About Revi CChC')}
            onClick={onReviLink}
          >
            {t('Qué es Revi CChC', 'About Revi CChC')}
          </Link>
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-6">
          <Assistant
            src="/brand/projects/revi/clara.svg"
            name="Clara"
            role={t('Para solicitantes', 'For applicants')}
          />
          <Assistant
            src="/brand/projects/revi/norman.svg"
            name="Norman"
            role={t('Para revisores municipales', 'For city reviewers')}
          />
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <div className="mb-5 text-base text-ink-3">
            {t(
              `En producción en ${MUNICIPIOS_COUNT} municipios`,
              `Live in ${MUNICIPIOS_COUNT} municipalities`,
            )}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] items-center justify-items-center gap-x-5 gap-y-7">
            {MUNICIPIOS.map(([slug, name]) => (
              <img
                key={slug}
                src={`/brand/projects/revi/municipalidades/${slug}.webp`}
                loading="lazy"
                decoding="async"
                alt={`Municipalidad de ${name}`}
                className="h-auto max-h-12 w-auto max-w-full object-contain opacity-85 grayscale-[0.2] transition-[opacity,filter] duration-200 hover:opacity-100 hover:grayscale-0"
              />
            ))}
          </div>
          <p className="sr-only">
            Revi está en producción en los siguientes municipios de Chile:{' '}
            {MUNICIPIOS_TEXTO}.{' '}
          </p>
        </div>
      </div>
    </article>
  )
}

function Assistant({
  src,
  name,
  role,
}: {
  src: string
  name: string
  role: string
}) {
  return (
    <div className="flex items-center gap-[0.6rem]">
      <img
        className="block h-9 w-9"
        src={src}
        alt={name}
        loading="lazy"
        decoding="async"
      />
      <div>
        <div className="text-[1.05rem] text-ink">{name}</div>
        <div className="text-[0.9rem] text-ink-3">{role}</div>
      </div>
    </div>
  )
}

function CompactCard({
  srHeading,
  banner,
  name,
  href,
  sub,
  desc,
}: {
  srHeading: string
  banner: string
  name: string
  href: string
  sub: string
  desc: string
}) {
  const t = useT()

  return (
    <article className={`${CARD} !mb-8`}>
      <h2 className="sr-only">{srHeading}</h2>
      <div
        className="relative aspect-[1441/300] bg-cover bg-center"
        style={{ backgroundImage: `url('${banner}')` }}
      >
        <div className={BANNER_SHADE} />
      </div>
      <div className="px-9 pt-6 pb-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-col gap-[0.3rem]">
            <span className="text-[1.4rem] leading-[1.2] text-ink">
              <a
                className="border-b border-line-strong text-inherit no-underline transition-opacity duration-200 hover:opacity-70"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {name}
              </a>
            </span>
            <span className="text-[0.95rem] text-ink-3">
              {sub}
              &nbsp;·&nbsp;2026 → {t('actualidad', 'present')}
            </span>
          </div>
        </div>
        <p className="max-w-[62ch] text-[1.1rem] leading-[1.55] text-ink">
          {desc}
        </p>
      </div>
    </article>
  )
}

function About() {
  const t = useT()

  return (
    <section className="mb-20 grid grid-cols-[1.7fr_1fr] gap-12 max-[720px]:grid-cols-1 max-[720px]:gap-8">
      <div>
        <div className={SECTION_HEAD}>
          <span>{t('Quiénes estamos detrás', "Who's behind this")}</span>
        </div>
        <div className="max-w-[56ch] text-base leading-[1.7] text-ink-2 [&_p+p]:mt-4">
          <p>
            {t(
              'BipBop Labs es un estudio pequeño en Santiago de Chile. Trabajamos sobre todo con empresas chilenas, en proyectos que se mueven entre la IA, las herramientas internas y la web.',
              'BipBop Labs is a small studio based in Santiago, Chile. We work mostly with Chilean companies, and the projects we take on usually live somewhere between AI, internal tools, and the web.',
            )}
          </p>
          <p>
            {t('Fundado por ', 'Founded by ')}
            <a className={PROSE_LINK} href="https://v4rgas.com">
              Juan Vargas
            </a>
            {t(
              ', Ingeniero Civil en Computación de la Pontificia Universidad Católica de Chile. Nos mantenemos pequeños a propósito: así el trabajo se mantiene enfocado, y a quienes lo hacen de verdad les importa.',
              ', Computer Engineer from Pontificia Universidad Católica de Chile. We stay small on purpose: the work stays focused, and the people doing it actually care about it.',
            )}
          </p>
        </div>
      </div>

      <aside>
        <div className={SECTION_HEAD}>
          <span>{t('Saluda', 'Say hi')}</span>
        </div>
        <dl className="motion-safe-opacity flex flex-col gap-0 text-[0.78rem]">
          <MetaRow label={t('Desde', 'Based in')}>Santiago, Chile</MetaRow>
          <MetaRow label={t('Contacto', 'Contact')}>
            <a
              className={PROSE_LINK}
              href="mailto:juan@bipbop.cl"
              onClick={() =>
                capture('contact_email_clicked', { source: 'meta_sidebar' })
              }
            >
              juan@bipbop.cl
            </a>
          </MetaRow>
        </dl>
      </aside>
    </section>
  )
}

function MetaRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-line py-[0.65rem] last:border-b-0">
      <dt className="text-[0.62rem] tracking-[0.15em] text-ink-3 uppercase">
        {label}
      </dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  )
}

function Contact() {
  const t = useT()

  return (
    <section
      className="mt-8 flex flex-col items-center gap-7 border-t border-line pt-12 pb-8 text-center"
      id="contact"
    >
      <p className="text-[clamp(1.3rem,2.6vw,1.8rem)] leading-[1.3] font-normal text-ink">
        {t('¿Tienes un ', 'Got a ')}
        <em className="text-success not-italic">{t('problema', 'problem')}</em>
        {t(' que resolver?', ' to solve?')}
      </p>
      <a
        className="arrow-before inline-flex items-center gap-[0.6rem] justify-self-end rounded-[2px] border border-line px-[1.2rem] py-[0.9rem] text-base text-ink no-underline transition-all duration-[250ms] hover:border-success hover:bg-success-soft hover:text-success hover:shadow-[0_0_24px_var(--color-success)] max-[720px]:justify-self-start"
        href="mailto:juan@bipbop.cl"
        onClick={() =>
          capture('contact_email_clicked', { source: 'contact_section' })
        }
      >
        juan@bipbop.cl
      </a>
    </section>
  )
}

function SiteFooter() {
  const links = [
    ['github', 'https://github.com/v4rgas'],
    ['linkedin', 'https://linkedin.com/in/v4rgas'],
    ['v4rgas.com', 'https://v4rgas.com'],
  ] as const

  return (
    <footer className="mt-16 flex flex-wrap justify-between gap-4 border-t border-line pt-6 text-[0.7rem] tracking-[0.06em] text-ink-3">
      <span>© {new Date().getFullYear()} bipbop labs · santiago, cl</span>
      <div className="flex gap-5">
        {links.map(([label, href]) => (
          <a
            key={label}
            href={href}
            className="text-ink-2 no-underline transition-colors duration-200 hover:text-success"
            onClick={() => capture('social_link_clicked', { label })}
          >
            {label}
          </a>
        ))}
      </div>
    </footer>
  )
}
