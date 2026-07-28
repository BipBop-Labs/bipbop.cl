import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/styleguide')({
  head: () => ({
    meta: [
      { title: 'BipBop Labs · Style Guide' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: StyleGuide,
})

const SECTION_HEAD =
  'mb-8 border-b border-line pb-3 text-[0.72rem] tracking-[0.16em] text-ink-3 uppercase'
const CARD =
  'mb-6 rounded-[6px] border border-line bg-surface px-9 py-8'
const CARD_META =
  'mb-6 flex flex-wrap justify-between gap-4 border-b border-line pb-5'
const ROLE = 'text-[0.72rem] tracking-[0.12em] text-ink-3 uppercase'
const CODE =
  'rounded-[3px] border border-line bg-page px-[0.4em] py-[0.1em] font-mono text-[0.85em] text-ink'
const SPECIMEN_BODY = 'max-w-[60ch] text-[1.05rem] leading-[1.65] text-ink'
const SCALE_ROW =
  'grid grid-cols-[90px_1fr] items-baseline gap-6 border-b border-line pb-4 last:border-b-0 last:pb-0'
const SCALE_TAG = 'text-[0.65rem] tracking-[0.14em] text-ink-3 uppercase'

function StyleGuide() {
  return (
    <div className="px-8 pt-16 pb-24">
      <main className="mx-auto max-w-[880px]">
        <header className="mb-16 border-b border-line pb-8">
          <div className="mb-4 text-[0.75rem] tracking-[0.12em] text-ink-3 uppercase">
            <Link
              className="border-b border-transparent text-ink-3 no-underline hover:border-success hover:text-success"
              to="/"
            >
              ← bipbop.cl
            </Link>{' '}
            · Style guide
          </div>
          <h1 className="font-display text-[clamp(3rem,8vw,5rem)] leading-[1.05] font-normal tracking-[-0.02em]">
            Typography
          </h1>
          <p className="mt-5 max-w-[56ch] text-[1.1rem] text-ink-2">
            Two typefaces. One for the wordmark, one for everything else. That's
            it.
          </p>
        </header>

        <section className="mb-20">
          <div className={SECTION_HEAD}>The two faces</div>

          <div className={CARD}>
            <div className={CARD_META}>
              <div>
                <div className="text-[1.05rem] font-medium">
                  Instrument Serif
                </div>
                <div className={ROLE}>Display · wordmark only</div>
              </div>
              <code className={CODE}>--font-display</code>
            </div>
            <div className="mb-4 font-display text-[clamp(3rem,7vw,4.75rem)] leading-[1.05] tracking-[-0.01em]">
              Bip<em className="text-success italic">Bop</em> Labs
            </div>
            <div className={SPECIMEN_BODY}>
              Used exclusively for the BipBop Labs wordmark in the hero and any
              logo-treatment moments. Not for body copy, not for headings
              elsewhere.
            </div>
          </div>

          <div className={CARD}>
            <div className={CARD_META}>
              <div>
                <div className="text-[1.05rem] font-medium">IBM Plex Sans</div>
                <div className={ROLE}>Body · everything else</div>
              </div>
              <code className={CODE}>--font-sans</code>
            </div>
            <div className="max-w-[60ch] text-[1.5rem] leading-[1.4] text-ink">
              <em className="text-success italic">Thoughtful software</em>,
              shaped with you and built by your side.
            </div>
            <div className={`${SPECIMEN_BODY} mt-3 !text-[0.95rem] !text-ink-2`}>
              Body copy, headings, labels, buttons, navigation, captions,
              code-adjacent UI. Weight 300 for prose, 400–500 for emphasis and
              UI affordances.
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className={SECTION_HEAD}>Scale</div>
          <div className="grid gap-5">
            <div className={SCALE_ROW}>
              <div className={SCALE_TAG}>Wordmark</div>
              <div className="font-display text-[4rem] leading-none">
                BipBop Labs
              </div>
            </div>
            <div className={SCALE_ROW}>
              <div className={SCALE_TAG}>Lede</div>
              <div className="text-[1.4rem] leading-[1.4] font-light">
                Thoughtful software, shaped with you and built by your side.
              </div>
            </div>
            <div className={SCALE_ROW}>
              <div className={SCALE_TAG}>Body</div>
              <div className="text-base font-light">
                We take on a few projects at a time. We pick them by the
                problem, not the size.
              </div>
            </div>
            <div className={SCALE_ROW}>
              <div className={SCALE_TAG}>Small</div>
              <div className="text-[0.85rem] font-light text-ink-2">
                Used for secondary descriptions and metadata.
              </div>
            </div>
            <div className={SCALE_ROW}>
              <div className={SCALE_TAG}>Label</div>
              <div className="text-[0.72rem] font-light tracking-[0.14em] text-ink-3 uppercase">
                SECTION HEADS · BREADCRUMBS · TAGS
              </div>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className={SECTION_HEAD}>Rules</div>
          <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
            <Rule kind="do">
              Reserve Instrument Serif strictly for the BipBop Labs wordmark.
            </Rule>
            <Rule kind="dont">
              Use Instrument Serif for headings, buttons, or body copy.
            </Rule>
            <Rule kind="do">
              Use IBM Plex Sans for every other text element on the page.
            </Rule>
            <Rule kind="dont">
              Introduce a third typeface. If you need contrast, change weight or
              size.
            </Rule>
          </div>
        </section>
      </main>
    </div>
  )
}

function Rule({
  kind,
  children,
}: {
  kind: 'do' | 'dont'
  children: React.ReactNode
}) {
  const accent = kind === 'do' ? 'border-l-success' : 'border-l-danger'
  const label = kind === 'do' ? 'text-success' : 'text-danger'

  return (
    <div
      className={`rounded-[4px] border border-l-[3px] border-line bg-surface px-6 py-5 ${accent}`}
    >
      <div
        className={`mb-2 text-[0.65rem] tracking-[0.14em] uppercase ${label}`}
      >
        {kind === 'do' ? 'Do' : "Don't"}
      </div>
      <p className="text-[0.95rem] text-ink-2">{children}</p>
    </div>
  )
}
