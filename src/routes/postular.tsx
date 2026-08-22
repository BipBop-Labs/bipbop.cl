import { createFileRoute } from '@tanstack/react-router'

const MESSAGE = 'Ya no estamos recibiendo postulaciones.'

export const Route = createFileRoute('/postular')({
  head: () => ({
    meta: [
      { title: 'Postulaciones cerradas · BipBop Labs' },
      {
        name: 'description',
        content:
          'Las postulaciones para Software Engineer en BipBop Labs están cerradas.',
      },
      { name: 'robots', content: 'noindex, follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'Postulaciones cerradas · BipBop Labs' },
      { property: 'og:url', content: 'https://bipbop.cl/postular' },
      {
        property: 'og:description',
        content: MESSAGE,
      },
      { property: 'og:locale', content: 'es_CL' },
    ],
    links: [{ rel: 'canonical', href: 'https://bipbop.cl/postular' }],
  }),
  component: Postular,
})

function Postular() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[760px] items-center px-6 py-16">
      <section className="w-full rounded-[6px] border border-line bg-surface px-8 py-10 max-[560px]:px-6">
        <p className="mb-4 font-mono text-[0.72rem] tracking-[0.12em] text-ink-3 uppercase">
          BipBop Labs · Software Engineer
        </p>
        <h1 className="mb-5 text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] text-ink">
          Postulaciones cerradas
        </h1>
        <p className="max-w-[48ch] text-[1.1rem] leading-[1.7] text-ink-2">
          {MESSAGE} Gracias a todas las personas que se dieron el tiempo de
          conocernos y postular.
        </p>
        <a
          href="/"
          className="mt-8 inline-block border-b border-success text-success no-underline transition-opacity hover:opacity-70"
        >
          Volver a bipbop.cl
        </a>
      </section>
    </main>
  )
}
