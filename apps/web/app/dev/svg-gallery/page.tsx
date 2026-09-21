import { notFound } from 'next/navigation';

/**
 * Development-only SVG asset gallery.
 * Not linked in product navigation. 404 in production builds.
 */
const ASSETS = [
  {
    group: 'Guest states',
    items: [
      {
        id: 'discover-guest',
        title: 'Discover Guest',
        metaphor: 'Venue + arrow',
        src: '/bynd8/illustrations/empty/discover-guest.svg',
      },
      {
        id: 'events-guest',
        title: 'Events Guest',
        metaphor: 'Poster wall + lock',
        src: '/bynd8/illustrations/empty/events-guest.svg',
      },
      {
        id: 'organize-guest',
        title: 'Organize Guest',
        metaphor: 'Flight case',
        src: '/bynd8/illustrations/empty/organize-guest.svg',
      },
      {
        id: 'profile-guest',
        title: 'Profile Guest',
        metaphor: 'Dancer identity',
        src: '/bynd8/illustrations/empty/profile-guest.svg',
      },
    ],
  },
  {
    group: 'Signed-in empty states',
    items: [
      {
        id: 'discover-empty',
        title: 'Discover Empty',
        metaphor: 'Location signal',
        src: '/bynd8/illustrations/empty/discover-empty.svg',
      },
      {
        id: 'events-empty',
        title: 'Events Empty',
        metaphor: 'Collectible ticket',
        src: '/bynd8/illustrations/empty/events-empty.svg',
      },
      {
        id: 'organize-empty',
        title: 'Organize Empty',
        metaphor: 'Production board',
        src: '/bynd8/illustrations/empty/organize-empty.svg',
      },
      {
        id: 'profile-empty',
        title: 'Profile Empty',
        metaphor: 'Credential',
        src: '/bynd8/illustrations/empty/profile-empty.svg',
      },
      {
        id: 'passes-empty',
        title: 'Passes Empty',
        metaphor: 'Access pass',
        src: '/bynd8/illustrations/empty/passes-empty.svg',
      },
    ],
  },
  {
    group: 'Event experience (current)',
    items: [
      {
        id: 'check-in',
        title: 'Check-In',
        metaphor: 'Venue access checkpoint',
        src: '/bynd8/illustrations/event-day/check-in.svg',
      },
    ],
  },
] as const;

const WIDTHS = [220, 320, 420] as const;

export default function SvgGalleryPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <div className="min-h-dvh bg-[#080908] px-4 py-10 text-[#F4F4F1] sm:px-8">
      <header className="mx-auto mb-12 max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FF6500]">
          Dev only
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl uppercase tracking-wide sm:text-5xl">
          BYND8 SVG gallery
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/55">
          Empty-state family + Check-In. Phase G battle-day assets intentionally omitted.
          Previewed on #080908 at 220 / 320 / 420.
        </p>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-16">
        {ASSETS.map((section) => (
          <section key={section.group}>
            <h2 className="mb-8 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/45">
              {section.group}
            </h2>
            <div className="flex flex-col gap-14">
              {section.items.map((asset) => (
                <article key={asset.id} className="border-t border-white/[0.08] pt-8">
                  <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h3 className="text-lg font-semibold tracking-tight">{asset.title}</h3>
                    <span className="text-[12px] text-white/40">{asset.metaphor}</span>
                    <code className="text-[11px] text-white/30">{asset.src}</code>
                  </div>
                  <div className="flex flex-wrap items-end gap-10">
                    {WIDTHS.map((w) => (
                      <div key={w} className="flex flex-col items-center gap-3">
                        <div className="relative flex items-center justify-center">
                          <div
                            aria-hidden
                            className="pointer-events-none absolute h-[70%] w-[85%] rounded-full bg-[radial-gradient(circle,rgba(255,101,0,0.14)_0%,transparent_70%)] blur-2xl"
                          />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={asset.src}
                            alt=""
                            width={w}
                            height={Math.round(w * (520 / 800))}
                            className="relative z-[1] h-auto w-auto"
                            style={{ width: w }}
                          />
                        </div>
                        <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">
                          {w}px
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
