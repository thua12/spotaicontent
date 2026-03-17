import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Zap, ArrowRight, User } from "lucide-react";

export const dynamic = "force-dynamic";

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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { checksThisMonth: true, lastCheckReset: true },
  });

  const tier = (session.user as { tier?: string }).tier ?? "free";
  const checksLimit = tier === "pro" ? 100 : tier === "unlimited" ? Infinity : 3;
  const checksUsed = user?.checksThisMonth ?? 0;
  const checksPct = checksLimit === Infinity ? 0 : Math.min(100, Math.round((checksUsed / checksLimit) * 100));

  return (
    <div className="min-h-screen bg-paper px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          {session.user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="w-12 h-12 rounded-full border border-border-warm" />
          )}
          <div>
            <h1 className="font-serif text-3xl font-semibold text-navy">Your Dashboard</h1>
            <p className="text-grey text-sm">{session.user.name ?? session.user.email}</p>
          </div>
        </div>

        {/* Usage Card */}
        <div className="bg-card border border-border-warm rounded-card shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light bg-paper/50 flex items-center gap-2">
            <User className="w-4 h-4 text-human" />
            <p className="text-xs font-semibold uppercase tracking-widest text-grey">Your Plan</p>
          </div>
          <div className="px-6 py-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border capitalize ${TIER_COLORS[tier] ?? TIER_COLORS.free}`}>
                {tier}
              </span>
            </div>
            {checksLimit !== Infinity && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-grey">
                    Checks used: <span className="font-semibold text-navy">{checksUsed}</span> / {checksLimit}
                  </span>
                  <span className="text-xs font-mono text-grey">{checksPct}%</span>
                </div>
                <div className="h-2 bg-border-light rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${checksPct > 85 ? "bg-ai" : checksPct > 60 ? "bg-middle" : "bg-human"}`}
                    style={{ width: `${checksPct}%` }}
                  />
                </div>
                <p className="text-xs text-grey mt-1.5">Resets monthly</p>
              </div>
            )}
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
              <div className={`rounded-card border p-4 ${tier === "free" ? "border-human bg-human/5" : "border-border-warm"}`}>
                {tier === "free" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-human bg-human/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                    Current Plan
                  </span>
                )}
                <h3 className="font-serif text-lg font-semibold text-navy mb-1">Free</h3>
                <p className="text-2xl font-bold text-navy mb-3">$0<span className="text-sm font-normal text-grey">/mo</span></p>
                <ul className="space-y-1.5 text-xs text-grey mb-4">
                  <li>3 content checks/month</li>
                  <li>Unlimited voting</li>
                  <li>Community feed</li>
                </ul>
                <span className="block w-full text-center px-4 py-2 rounded-btn text-xs font-semibold bg-paper border border-border-warm text-grey">
                  {tier === "free" ? "Current plan" : "Downgrade"}
                </span>
              </div>

              {/* Pro */}
              <div className={`rounded-card border p-4 ${tier === "developer" ? "border-human bg-human/5" : "border-border-warm"}`}>
                {tier === "developer" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-human bg-human/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                    Current Plan
                  </span>
                )}
                <h3 className="font-serif text-lg font-semibold text-navy mb-1">Pro</h3>
                <p className="text-2xl font-bold text-navy mb-3">$9<span className="text-sm font-normal text-grey">/mo</span></p>
                <ul className="space-y-1.5 text-xs text-grey mb-4">
                  <li>100 content checks/month</li>
                  <li>Sentence analysis</li>
                  <li>Certificates</li>
                </ul>
                <Link href="/dashboard/billing" className="block w-full text-center px-4 py-2 rounded-btn text-xs font-semibold bg-navy text-white hover:bg-navy-light transition-colors">
                  {tier === "developer" ? "Manage" : "Upgrade →"}
                </Link>
              </div>

              {/* Unlimited */}
              <div className={`rounded-card border p-4 ${tier === "publisher" ? "border-human bg-human/5" : "border-border-warm"}`}>
                {tier === "publisher" && (
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
                  {tier === "publisher" ? "Manage" : "Upgrade →"}
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
