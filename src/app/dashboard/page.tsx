import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import CopyButton from "@/components/CopyButton";
import { Key, Zap, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

function generateApiKey(): string {
  return "vrs_" + crypto.randomUUID().replace(/-/g, "").slice(0, 32);
}

const TIER_LIMITS: Record<string, number> = {
  free: 100,
  developer: 5000,
  publisher: 50000,
};

const TIER_COLORS: Record<string, string> = {
  free: "text-grey border-grey/30 bg-grey/10",
  developer: "text-human border-human/30 bg-human/10",
  publisher: "text-navy border-navy/30 bg-navy/10",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const userId = session.user.id;

  let apiKey = await prisma.apiKey.findFirst({ where: { userId } });

  if (!apiKey) {
    apiKey = await prisma.apiKey.create({
      data: {
        userId,
        key: generateApiKey(),
        tier: "free",
      },
    });
  }

  const limit = TIER_LIMITS[apiKey.tier] ?? 100;
  const usagePct = Math.min(100, Math.round((apiKey.callsThisMonth / limit) * 100));

  return (
    <div className="min-h-screen bg-paper px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-4xl font-semibold text-navy mb-1">Your Dashboard</h1>
          <p className="text-grey text-sm">
            {session.user.name ?? session.user.email} &mdash; API access &amp; account settings
          </p>
        </div>

        {/* API Key Card */}
        <div className="bg-card border border-border-warm rounded-card shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light bg-paper/50 flex items-center gap-2">
            <Key className="w-4 h-4 text-human" />
            <p className="text-xs font-semibold uppercase tracking-widest text-grey">API Key</p>
          </div>
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border capitalize ${TIER_COLORS[apiKey.tier] ?? TIER_COLORS.free}`}
              >
                {apiKey.tier}
              </span>
              <span className="text-xs text-grey">plan</span>
            </div>

            <div>
              <p className="text-xs text-grey mb-2">Your API key — keep this secret</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-paper px-4 py-3 rounded-btn border border-border-warm font-mono text-navy truncate">
                  {apiKey.key}
                </code>
                <CopyButton value={apiKey.key} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-grey">
                  Usage this month: <span className="font-semibold text-navy">{apiKey.callsThisMonth.toLocaleString()}</span> / {limit.toLocaleString()} calls
                </span>
                <span className="text-xs font-mono text-grey">{usagePct}%</span>
              </div>
              <div className="h-2 bg-border-light rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usagePct > 85 ? "bg-ai" : usagePct > 60 ? "bg-middle" : "bg-human"}`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <p className="text-xs text-grey mt-1.5">
                Resets monthly &mdash; last reset {new Date(apiKey.lastResetAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Card */}
        <div className="bg-card border border-border-warm rounded-card shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light bg-paper/50 flex items-center gap-2">
            <Zap className="w-4 h-4 text-human" />
            <p className="text-xs font-semibold uppercase tracking-widest text-grey">Upgrade Your Plan</p>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Free */}
              <div className={`rounded-card border p-4 ${apiKey.tier === "free" ? "border-human bg-human/5" : "border-border-warm"}`}>
                {apiKey.tier === "free" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-human bg-human/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                    Current Plan
                  </span>
                )}
                <h3 className="font-serif text-lg font-semibold text-navy mb-1">Free</h3>
                <p className="text-2xl font-bold text-navy mb-3">$0<span className="text-sm font-normal text-grey">/mo</span></p>
                <ul className="space-y-1.5 text-xs text-grey mb-4">
                  <li>10 content checks/month</li>
                  <li>Unlimited voting</li>
                  <li>Save history</li>
                </ul>
                {apiKey.tier === "free" ? (
                  <span className="block w-full text-center px-4 py-2 rounded-btn text-xs font-semibold bg-paper border border-border-warm text-grey">
                    Current plan
                  </span>
                ) : (
                  <Link href="/dashboard/billing" className="block w-full text-center px-4 py-2 rounded-btn text-xs font-semibold bg-paper border border-border-warm text-grey hover:bg-highlight/50 transition-colors">
                    Downgrade
                  </Link>
                )}
              </div>

              {/* Developer */}
              <div className={`rounded-card border p-4 ${apiKey.tier === "developer" ? "border-human bg-human/5" : "border-border-warm"}`}>
                {apiKey.tier === "developer" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-human bg-human/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                    Current Plan
                  </span>
                )}
                <h3 className="font-serif text-lg font-semibold text-navy mb-1">Pro</h3>
                <p className="text-2xl font-bold text-navy mb-3">$9<span className="text-sm font-normal text-grey">/mo</span></p>
                <ul className="space-y-1.5 text-xs text-grey mb-4">
                  <li>100 content checks/month</li>
                  <li>Sentence analysis</li>
                  <li>Certificates · Unlimited voting</li>
                </ul>
                <Link href="/dashboard/billing" className="block w-full text-center px-4 py-2 rounded-btn text-xs font-semibold bg-navy text-white hover:bg-navy-light transition-colors">
                  {apiKey.tier === "developer" ? "Manage" : "Upgrade →"}
                </Link>
              </div>

              {/* Publisher */}
              <div className={`rounded-card border p-4 ${apiKey.tier === "publisher" ? "border-human bg-human/5" : "border-border-warm"}`}>
                {apiKey.tier === "publisher" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-human bg-human/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                    Current Plan
                  </span>
                )}
                <h3 className="font-serif text-lg font-semibold text-navy mb-1">Unlimited</h3>
                <p className="text-2xl font-bold text-navy mb-3">$29<span className="text-sm font-normal text-grey">/mo</span></p>
                <ul className="space-y-1.5 text-xs text-grey mb-4">
                  <li>Unlimited checks</li>
                  <li>All Pro features</li>
                  <li>Priority processing</li>
                </ul>
                <Link href="/dashboard/billing" className="block w-full text-center px-4 py-2 rounded-btn text-xs font-semibold bg-navy text-white hover:bg-navy-light transition-colors">
                  {apiKey.tier === "publisher" ? "Manage" : "Upgrade →"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-card border border-border-warm rounded-card shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light bg-paper/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-grey">Quick Links</p>
          </div>
          <div className="divide-y divide-border-light">
            {[
              { href: "/transparency", label: "Transparency Report", desc: "How the algorithm works, bias monitoring" },
              { href: "/supporters", label: "Support Spot AI Content", desc: "Help keep the project running" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between px-6 py-4 hover:bg-highlight/30 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-navy">{link.label}</p>
                  <p className="text-xs text-grey mt-0.5">{link.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-grey group-hover:text-human transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
