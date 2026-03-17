import { Scale, Globe, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "About — Spot AI Content",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-paper px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <div className="mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-human mb-4">About Spot AI Content</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-navy tracking-tight mb-6">
            Human judgment first.
            <br />
            <span className="text-human">We&apos;re the second opinion.</span>
          </h1>
          <p className="text-grey text-lg leading-relaxed">
            Spot AI Content doesn&apos;t replace how you evaluate content. You look at something,
            you form a view — and then you come to us to see if the data agrees.
            That&apos;s it. That&apos;s the whole idea.
          </p>
        </div>

        <div className="space-y-10 mb-16">
          {[
            {
              icon: <Scale className="w-6 h-6" />,
              title: "Honest about uncertainty",
              body: "No content can ever be certified as 100% human or 100% AI. Anyone claiming otherwise is oversimplifying. We show you a score on a spectrum and tell you exactly what it means — and what it doesn't. Our job is to inform your judgment, not override it.",
              color: "#2D6A4F",
            },
            {
              icon: <Globe className="w-6 h-6" />,
              title: "Every piece of content deserves a score",
              body: "YouTube videos, news articles, blog posts, research papers, social media comments — all of it. We want Spot AI Content badges to be as ubiquitous as URLs. Not as a gatekeeping tool, but as a transparency layer that helps people understand what they're reading and watching.",
              color: "#4A6FA5",
            },
            {
              icon: <ShieldCheck className="w-6 h-6" />,
              title: "A badge anyone can verify",
              body: "After analysis, content creators get a cryptographically signed badge they can embed anywhere — a YouTube description, a blog footer, a Twitter bio. Anyone who sees the badge can verify it in one click. The signature can't be forged or copied to other content.",
              color: "#2D6A4F",
            },
            {
              icon: <Zap className="w-6 h-6" />,
              title: "Powered by leading detection technology",
              body: "Image and video analysis is powered by Hive AI — trusted by platforms that process billions of pieces of content daily. Text analysis uses GPTZero, the leading academic and professional AI writing detector. We combine their signals to give you the most reliable probabilistic score available.",
              color: "#F4A261",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-5">
              <div
                className="shrink-0 w-12 h-12 rounded-card flex items-center justify-center"
                style={{ background: `${item.color}15`, color: item.color }}
              >
                {item.icon}
              </div>
              <div>
                <h3 className="font-serif font-semibold text-lg text-navy mb-2">{item.title}</h3>
                <p className="text-grey leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border-warm rounded-card p-8 shadow-card text-center">
          <h2 className="font-serif text-2xl font-semibold text-navy mb-3">Get started</h2>
          <p className="text-grey mb-2">Create a free account to start checking content.</p>
          <p className="text-sm text-grey/70 mb-6">3 free checks included · Upgrade for more</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/api/auth/signin"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-btn bg-navy text-white font-semibold hover:bg-navy-light transition-colors"
            >
              Create Account →
            </Link>
            <Link
              href="/feed"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-btn border border-border-warm text-navy font-semibold hover:bg-highlight/50 transition-colors"
            >
              Browse the feed
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
