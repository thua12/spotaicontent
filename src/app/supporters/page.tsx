import Link from "next/link";

export default function SupportersPage() {
  const TIERS = [
    {
      emoji: "🌱",
      name: "Sprout",
      price: "$5",
      period: "/mo",
      tagline: "You believe in an honest internet",
      perks: ["Name in supporters list", "Thank-you email", "Warm feelings"],
    },
    {
      emoji: "🌿",
      name: "Sustainer",
      price: "$15",
      period: "/mo",
      tagline: "You&apos;re helping us keep the lights on",
      perks: ["Everything in Sprout", "Early access to new features", "Supporter badge on profile"],
    },
    {
      emoji: "🌳",
      name: "Champion",
      price: "$50",
      period: "/mo",
      tagline: "You&apos;re building the foundation",
      perks: ["Everything in Sustainer", "Direct input on roadmap", "Champion badge", "Monthly update email"],
    },
  ];

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-0">

        {/* Hero */}
        <section className="pb-14 border-b border-border-warm text-center">
          <div className="text-6xl mb-6">🦾</div>
          <h1 className="font-serif text-5xl font-semibold text-navy leading-tight mb-5">
            Keep the internet honest.<br />Support Spot AI Content.
          </h1>
          <p className="text-grey text-lg leading-relaxed max-w-xl mx-auto">
            Spot AI Content is free to use. It always will be. If you believe in what we&apos;re building —
            a more honest internet — consider supporting us.
          </p>
        </section>

        {/* Support tiers */}
        <section className="py-14 border-b border-border-warm">
          <h2 className="font-serif text-2xl font-semibold text-navy mb-8 text-center">Choose your level</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TIERS.map((tier) => (
              <div key={tier.name} className="bg-card border border-border-warm rounded-card shadow-card p-6 flex flex-col">
                <div className="text-4xl mb-3">{tier.emoji}</div>
                <h3 className="font-serif text-xl font-semibold text-navy mb-1">{tier.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-navy">{tier.price}</span>
                  <span className="text-sm text-grey">{tier.period}</span>
                </div>
                <p
                  className="text-xs text-grey italic mb-4"
                  dangerouslySetInnerHTML={{ __html: tier.tagline }}
                />
                <ul className="space-y-1.5 mb-5 flex-1">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-xs text-grey">
                      <span className="text-human mt-0.5 shrink-0">✓</span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard/billing"
                  className="block w-full text-center px-4 py-2.5 rounded-btn bg-navy text-white text-sm font-semibold hover:bg-navy-light transition-colors"
                >
                  Support at this level →
                </Link>
              </div>
            ))}
          </div>

          {/* One-time */}
          <div className="mt-8 text-center">
            <p className="text-grey text-sm mb-3">Or make a one-time contribution — any amount</p>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn border border-border-warm text-navy text-sm font-semibold hover:bg-highlight/50 transition-colors"
            >
              One-time donation →
            </Link>
          </div>
        </section>

        {/* What your support funds */}
        <section className="py-14 border-b border-border-warm">
          <h2 className="font-serif text-2xl font-semibold text-navy mb-6">What your support funds</h2>
          <div className="space-y-4">
            {[
              {
                title: "Server costs",
                desc: "Database hosting, API calls to Hive AI and GPTZero, CDN, and infrastructure. These scale with usage.",
              },
              {
                title: "Algorithm improvements",
                desc: "Training better models, reducing bias, improving accuracy — especially for non-English content.",
              },
              {
                title: "Community moderation",
                desc: "Keeping the platform honest and spam-free takes real human attention.",
              },
              {
                title: "The transparency layer",
                desc: "Building the infrastructure the internet needs: open scoring, published datasets, public audits.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="shrink-0 w-2 h-2 rounded-full bg-human mt-2" />
                <div>
                  <h3 className="font-semibold text-sm text-navy mb-0.5">{item.title}</h3>
                  <p className="text-sm text-grey">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Our promise */}
        <section className="py-14 border-b border-border-warm">
          <h2 className="font-serif text-2xl font-semibold text-navy mb-4">Our promise</h2>
          <div className="bg-highlight/40 border border-middle/30 rounded-card p-6 space-y-3">
            {[
              "We will never sell your data.",
              "We will never show ads.",
              "We will publish our financials annually.",
            ].map((promise) => (
              <div key={promise} className="flex items-center gap-3">
                <span className="text-human font-bold text-lg">✓</span>
                <p className="font-semibold text-navy">{promise}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="py-14 border-b border-border-warm text-center">
          <div className="font-serif text-5xl font-bold text-navy mb-2">0</div>
          <p className="text-grey">supporters so far</p>
          <p className="text-sm text-grey mt-2">
            Join us. Be the first. Tell your friends.
          </p>
        </section>

        {/* Footer note */}
        <section className="py-10">
          <p className="text-sm text-grey italic leading-relaxed text-center max-w-lg mx-auto">
            Not-for-profit in spirit, for-profit in structure for now. We&apos;re figuring this out honestly.
            If you have thoughts on the right structure for a tool like this, we&apos;d love to{" "}
            <a href="mailto:hello@spotaicontent.com" className="text-human hover:underline">
              hear from you
            </a>.
          </p>
        </section>

      </div>
    </div>
  );
}
