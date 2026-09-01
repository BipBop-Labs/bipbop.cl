import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { Wordmark } from '#/components/wordmark'
import { capture } from '#/lib/analytics'
import { homeSchema } from '#/data/schema'
import { REVI_PRESS } from '#/data/revi-press'
import {
  MUNICIPIOS,
  MUNICIPIOS_COUNT,
  MUNICIPIOS_TEXTO,
} from '#/data/municipios'
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

const CARD =
  'mb-20 overflow-hidden rounded-[6px] border border-line bg-surface max-[560px]:mb-14'
const BANNER_SHADE =
  'absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,var(--color-surface)_100%)]'
const SECTION_HEAD =
  'rule-after mb-10 flex items-center gap-4 text-[0.85rem] font-semibold tracking-[0.01em] text-ink-3 max-[560px]:mb-7'
const FEATURED_CTA =
  'inline-flex min-h-11 items-center border-b border-success text-base font-semibold text-success no-underline underline-offset-4 transition-colors duration-200 hover:border-success-hover hover:text-success-hover focus-visible:rounded-[2px]'
const PROSE_LINK =
  'border-b border-dotted border-ink-3 text-ink no-underline underline-offset-4 transition-colors duration-200 hover:border-success hover:text-success focus-visible:rounded-[2px]'

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

          <section className="mb-20 scroll-mt-8 max-[560px]:mb-14" id="work">
            <h2 className={`${SECTION_HEAD} !text-success`}>
              <span>
                {t('En lo que estamos ahora', "What we're on right now")}
              </span>
            </h2>

            <ReviCard />

            <h2 className="mb-6 text-base font-semibold text-ink-2">
              {t('También en marcha', 'Also in the works')}
            </h2>

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

          <About />

          <Team />

          <Contact />

          <SiteFooter />
        </div>
      </main>
    </>
  )
}

function StatusBar() {
  const { lang, setLang } = useLang()
  const t = useT()

  const pick = (next: 'es' | 'en') => {
    setLang(next)
    capture('language_switched', { language: next })
  }

  return (
    <div className="pointer-events-none fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-6 py-[0.7rem] text-[0.68rem] tracking-[0.08em] text-ink-3 uppercase max-[720px]:px-4 max-[720px]:py-[0.65rem] max-[720px]:text-[0.6rem]">
      <div className="flex items-center gap-5" />
      <div className="pointer-events-auto flex items-center gap-5">
        <div
          className="flex gap-0 overflow-hidden rounded-[2px] border border-line bg-page/90 backdrop-blur-sm"
          role="group"
          aria-label={t('Idioma', 'Language')}
        >
          {(['en', 'es'] as const).map((code) => (
            <button
              key={code}
              onClick={() => pick(code)}
              aria-pressed={lang === code}
              className={`min-h-11 min-w-11 cursor-pointer border-0 px-[0.65rem] py-1 text-[0.65rem] tracking-[0.1em] transition-colors duration-200 focus-visible:outline-offset-[-3px] ${
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
    <section className="hero-skyline relative mb-0 flex min-h-screen flex-col items-center justify-center pb-8 text-center [&>*]:relative [&>*]:z-[2]">
      <Wordmark />

      <p
        className={`motion-safe-opacity mt-8 max-w-[42ch] animate-rise text-[clamp(1.25rem,2.4vw,1.6rem)] leading-[1.4] font-semibold text-ink opacity-0 [animation-delay:1.4s] ${glow}`}
      >
        <em className="text-success not-italic">
          {t('Software hecho con cariño', 'Thoughtful software')}
        </em>
        {t(
          ', pensado contigo y construido a tu lado.',
          ', shaped with you and built by your side.',
        )}
      </p>

      <div className="motion-safe-opacity mt-8 flex animate-rise flex-wrap justify-center gap-3 opacity-0 [animation-delay:1.55s]">
        <a
          className="inline-flex min-h-12 cursor-pointer items-center gap-[0.55rem] rounded-[2px] border border-line bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)] px-[1.05rem] py-[0.7rem] text-[0.95rem] font-semibold text-ink no-underline transition-colors duration-200 hover:border-line-strong hover:bg-subtle active:bg-line"
          href="#work"
          onClick={() => capture('work_cta_clicked')}
        >
          {t('Nuestro trabajo', 'Our work')}
        </a>
        <a
          className="inline-flex min-h-12 cursor-pointer items-center gap-[0.55rem] rounded-[2px] border border-success bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] px-[1.05rem] py-[0.7rem] text-[0.95rem] font-bold text-success no-underline transition-colors duration-200 hover:bg-success-soft hover:text-success-hover active:bg-[color-mix(in_srgb,var(--color-success)_22%,transparent)]"
          href="#contact"
          onClick={() => capture('contact_cta_clicked')}
        >
          {t('Conversemos', "Let's talk")}
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
      <h3 className="sr-only">
        Revi — asistente con IA para permisos de edificación de la Cámara
        Chilena de la Construcción (CChC)
      </h3>
      <div className="relative">
        <img
          className="block h-auto w-full"
          src="/brand/projects/revi/banner.png"
          alt="Revi, permisos de edificación impulsados con inteligencia artificial"
        />
        <div className={BANNER_SHADE} />
      </div>
      <div className="px-9 pt-8 pb-9 max-[560px]:px-5 max-[560px]:pt-6 max-[560px]:pb-7">
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

        <div className="mt-6 flex flex-wrap items-center gap-6">
          <Assistant
            src="/brand/projects/revi/clara.svg"
            name="Clara"
            role={t('Para solicitantes', 'For applicants')}
            href="https://app.ia-revi.cl/clara"
          />
          <Assistant
            src="/brand/projects/revi/norman.svg"
            name="Norman"
            role={t('Para revisores municipales', 'For city reviewers')}
            href="https://app.ia-revi.cl/norman"
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
            {MUNICIPIOS.map(([slug, name, href]) => (
              <a
                key={slug}
                className="flex h-14 w-full items-center justify-center rounded-[4px] p-1 transition-colors hover:bg-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visitar el sitio de la Municipalidad de ${name}`}
                onClick={() =>
                  capture('revi_municipality_link_clicked', {
                    municipality: name,
                  })
                }
              >
                <img
                  src={`/brand/projects/revi/municipalidades/${slug}.webp`}
                  loading="lazy"
                  decoding="async"
                  alt={`Municipalidad de ${name}`}
                  className="h-auto max-h-12 w-auto max-w-full object-contain opacity-85 grayscale-[0.2] transition-[opacity,filter] duration-200 hover:opacity-100 hover:grayscale-0"
                />
              </a>
            ))}
          </div>
          <p className="sr-only">
            Revi está en producción en los siguientes municipios de Chile:{' '}
            {MUNICIPIOS_TEXTO}.{' '}
          </p>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <div className="mb-4 text-base text-ink-3">
            {t('Revi en la prensa', 'Revi in the press')}
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-[560px]:grid-cols-1">
            {REVI_PRESS.map((item) => (
              <a
                key={item.href}
                className="group text-ink no-underline"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  capture('revi_press_link_clicked', {
                    outlet: item.outlet,
                    location: 'home',
                  })
                }
              >
                <span className="block text-[0.72rem] tracking-[0.07em] text-ink-3 uppercase">
                  {item.outlet} · {item.date}
                </span>
                <span className="external-link mt-1 block text-[0.92rem] leading-[1.4] transition-colors group-hover:text-success">
                  {item.title}
                </span>
              </a>
            ))}
          </div>
        </div>

        <p className="mt-8 border-t border-line pt-6">
          <a
            className={FEATURED_CTA}
            href="/revi"
            title={t('Qué es Revi CChC', 'About Revi CChC')}
            onClick={onReviLink}
          >
            {t('Conoce el caso Revi', 'Explore the Revi case study')}
          </a>
        </p>
      </div>
    </article>
  )
}

function Assistant({
  src,
  name,
  role,
  href,
}: {
  src: string
  name: string
  role: string
  href: string
}) {
  return (
    <a
      className="group flex items-center gap-[0.6rem] rounded-[4px] text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-success"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir ${name} Revi`}
      onClick={() =>
        capture('revi_assistant_link_clicked', {
          assistant: name.toLowerCase(),
          location: 'home',
        })
      }
    >
      <img
        className="block h-9 w-9"
        src={src}
        alt={name}
        loading="lazy"
        decoding="async"
      />
      <div>
        <div className="external-link text-[1.05rem] text-ink transition-colors group-hover:text-success">
          {name}
        </div>
        <div className="text-[0.9rem] text-ink-3">{role}</div>
      </div>
    </a>
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
      <h3 className="sr-only">{srHeading}</h3>
      <div
        className="relative aspect-[1441/300] bg-cover bg-center"
        style={{ backgroundImage: `url('${banner}')` }}
      >
        <div className={BANNER_SHADE} />
      </div>
      <div className="px-9 pt-6 pb-7 max-[560px]:px-5 max-[560px]:pt-5 max-[560px]:pb-6">
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
    <section className="mb-20 grid grid-cols-[1.7fr_1fr] gap-12 max-[720px]:grid-cols-1 max-[720px]:gap-8 max-[560px]:mb-14">
      <div>
        <h2 className={SECTION_HEAD}>
          <span>{t('El estudio', 'The studio')}</span>
        </h2>
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
        <h2 className={SECTION_HEAD}>
          <span>{t('Saluda', 'Say hi')}</span>
        </h2>
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

const TEAM = [
  {
    name: 'Juan Vargas',
    photo: '/brand/team/juan.webp',
    role: ['Fundador', 'Founder'],
    external: false,
    url: 'https://v4rgas.com',
    host: 'v4rgas.com',
  },
  {
    name: 'Diego Valenzuela',
    photo: '/brand/team/diego.webp',
    role: ['Ingeniero de software', 'Software engineer'],
    external: false,
    url: 'https://datadiego.com',
    host: 'datadiego.com',
  },
  {
    name: 'Emerson Salazar',
    photo: '/brand/team/emerson.webp',
    role: ['Ingeniero de software', 'Software engineer'],
    external: false,
    url: 'https://emersoftware.cl',
    host: 'emersoftware.cl',
  },
  {
    name: 'Gonzalo Saavedra',
    photo: '/brand/team/gonzalo.webp',
    role: ['Ingeniero de software', 'Software engineer'],
    url: 'https://github.com/gonzalo-saavedra-m/',
    host: 'gonzalo.saavedra',
    external: true,
  },
] as const

type Person = (typeof TEAM)[number]

const FLIP = { duration: 550, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' } as const

/**
 * Square tiles; click one and it expands in place to show the person's site,
 * while the other tiles slide around it (FLIP: measure, change, animate back).
 */
function Team() {
  const t = useT()
  const [open, setOpen] = useState<Person | null>(null)
  const [settled, setSettled] = useState(false)
  const tiles = useRef(new Map<string, HTMLElement>())
  const before = useRef(new Map<string, DOMRect>())

  const toggle = (p: Person) => {
    before.current = new Map(
      [...tiles.current].map(([k, el]) => [k, el.getBoundingClientRect()]),
    )
    setSettled(false)
    setOpen((cur) => (cur?.host === p.host ? null : p))
  }

  useLayoutEffect(() => {
    if (before.current.size === 0) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const anims: Animation[] = []
    for (const [k, el] of tiles.current) {
      const a = before.current.get(k)
      if (!a) continue
      const b = el.getBoundingClientRect()
      const dx = a.left - b.left
      const dy = a.top - b.top
      const resized = a.width !== b.width || a.height !== b.height
      if (!resized && !dx && !dy) continue
      if (reduced) continue
      const card = el.firstElementChild as HTMLElement
      anims.push(
        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
          FLIP,
        ),
      )
      if (resized)
        anims.push(
          card.animate(
            [
              { width: `${a.width}px`, height: `${a.height}px` },
              { width: `${b.width}px`, height: `${b.height}px` },
            ],
            FLIP,
          ),
        )
    }
    before.current = new Map()
    Promise.all(anims.map((x) => x.finished)).then(() => setSettled(true))
    if (anims.length === 0) setSettled(true)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && toggle(open)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <section className="mb-20 scroll-mt-8 max-[560px]:mb-14" id="team">
      <h2 className={SECTION_HEAD}>
        <span>{t('Quiénes somos', 'Who we are')}</span>
      </h2>
      <ul className="m-0 grid list-none grid-cols-4 gap-4 p-0 max-[720px]:grid-cols-2">
        {TEAM.map((p) => {
          const active = open?.host === p.host
          const card = `group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[6px] border border-line bg-surface p-0 text-left text-inherit no-underline transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-[0_10px_30px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]`
          const label = (
            <>
              <img
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                src={p.photo}
                alt=""
                width={320}
                height={320}
                loading="lazy"
                decoding="async"
              />
              <span className="absolute inset-x-0 bottom-0 flex flex-col gap-[0.2rem] bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.55)_35%,rgba(0,0,0,0.88)_100%)] px-4 pt-16 pb-4 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] max-[560px]:px-3 max-[560px]:pb-3">
                <span className="text-[0.62rem] font-semibold tracking-[0.15em] text-white/80 uppercase">
                  {t(p.role[0], p.role[1])}
                </span>
                <span className="text-[clamp(1.05rem,2vw,1.4rem)] leading-[1.15] font-semibold">
                  {p.name}
                </span>
                <span className="truncate text-[0.68rem] tracking-[0.06em] text-white/80">
                  {p.host}
                </span>
              </span>
            </>
          )
          return (
            <li
              key={p.host}
              ref={(el) => {
                if (el) tiles.current.set(p.host, el)
                else tiles.current.delete(p.host)
              }}
              className={
                active
                  ? 'col-span-4 h-[72vh] min-h-[420px] max-[720px]:col-span-2'
                  : 'aspect-square'
              }
            >
              {active ? (
                <div className={`${card} !cursor-default`}>
                  <div className="flex items-center gap-[0.35rem] border-b border-line bg-subtle px-3 py-2">
                    <button
                      type="button"
                      aria-label={t('Cerrar', 'Close')}
                      className="size-3 cursor-pointer rounded-full border-0 bg-clay-500 p-0 transition-opacity hover:opacity-70"
                      onClick={() => toggle(p)}
                    />
                    <span className="size-3 rounded-full bg-line-strong" />
                    <span className="size-3 rounded-full bg-line-strong" />
                    <span className="ml-2 min-w-0 flex-1 truncate rounded-[2px] bg-page px-2 py-[2px] text-[0.68rem] tracking-[0.06em] text-ink-3">
                      {p.host}
                    </span>
                    <a
                      className="text-[0.68rem] tracking-[0.06em] text-ink-2 no-underline hover:text-success"
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => capture('team_site_clicked', { host: p.host })}
                    >
                      {t('abrir ↗', 'open ↗')}
                    </a>
                  </div>
                  {p.external ? (
                    <div
                      className={`flex flex-1 flex-col items-center justify-center gap-5 bg-page px-6 text-center transition-opacity duration-300 ${
                        settled ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <p className="font-mono text-[0.7rem] tracking-[0.15em] text-ink-3 uppercase">
                        404 · {t('página no encontrada', 'page not found')}
                      </p>
                      <p className="max-w-[34ch] text-[clamp(1.3rem,2.6vw,1.9rem)] leading-[1.25] text-ink">
                        {t(
                          'Gonzalo todavía no tiene página. Está ocupado haciendo que las de los demás funcionen.',
                          "Gonzalo doesn't have a page yet. He's busy making everyone else's work.",
                        )}
                      </p>
                      <p className="text-[0.95rem] text-ink-2">
                        {t('Mientras tanto: ', 'In the meantime: ')}
                        <a
                          className={PROSE_LINK}
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => capture('team_site_clicked', { host: p.host })}
                        >
                          GitHub
                        </a>
                        {' · '}
                        <a
                          className={PROSE_LINK}
                          href="https://www.linkedin.com/in/gonzalosaavedram/"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => capture('team_site_clicked', { host: p.host })}
                        >
                          LinkedIn
                        </a>
                      </p>
                      <p className="font-mono text-[0.8rem] text-success">
                        {t('página en construcción', 'page under construction')}
                        <span className="animate-blink">_</span>
                      </p>
                    </div>
                  ) : (
                    <iframe
                      className={`block w-full flex-1 border-0 bg-page transition-opacity duration-300 ${
                        settled ? 'opacity-100' : 'opacity-0'
                      }`}
                      src={p.url}
                      title={`${p.name} · ${p.host}`}
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className={card}
                  onClick={() => {
                    toggle(p)
                    capture('team_site_opened', { host: p.host })
                  }}
                >
                  {label}
                </button>
              )}
            </li>
          )
        })}
      </ul>
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
      className="mt-8 flex scroll-mt-8 flex-col items-center gap-7 border-t border-line pt-12 pb-8 text-center max-[560px]:pt-10"
      id="contact"
    >
      <h2 className="text-[clamp(1.3rem,2.6vw,1.8rem)] leading-[1.3] font-normal text-ink">
        {t('¿Tienes un ', 'Got a ')}
        <em className="text-success not-italic">{t('problema', 'problem')}</em>
        {t(' que resolver?', ' to solve?')}
      </h2>
      <a
        className="arrow-before inline-flex min-h-12 items-center gap-[0.6rem] justify-self-end rounded-[2px] border border-line px-[1.2rem] py-[0.9rem] text-base text-ink no-underline transition-[color,background-color,border-color,box-shadow] duration-[250ms] hover:border-success hover:bg-success-soft hover:text-success hover:shadow-[0_8px_24px_color-mix(in_srgb,var(--color-success)_18%,transparent)] active:bg-[color-mix(in_srgb,var(--color-success)_20%,transparent)] max-[720px]:justify-self-start"
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
