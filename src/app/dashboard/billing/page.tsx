import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ArrowLeft, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

const TIER_COLORS: Record<string, string> = {
  free: "text-grey border-grey/30 bg-grey/10",
  developer: "text-human border-human/30 bg-human/10",
  publisher: "text-navy border-navy/30 bg-navy/10",
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const userId = session.user.id;
  const apiKey = await prisma.apiKey.findFirst({ where: { userId } });
  const currentTier = apiKey?.tier ?? "free";

  return (
    <div className="min-h-screen bg-paper px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-grey hover:text-human transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div>
          <h1 className="font-serif text-4xl font-semibold text-navy mb-2">Billing &amp; Plans</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-grey">Current plan:</span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border capitalize ${TIER_COLORS[currentTier] ?? TIER_COLORS.free}`}
            >
              {currentTier}
            </span>
          </div>
        </div>

        {/* Coming soon notice */}
        <div className="bg-highlight/40 border border-middle/30 rounded-card p-5 flex items-start gap-3">
          <Mail className="w-5 h-5 text-middle mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-navy mb-1">Stripe integration coming soon</p>
            <p className="text-sm text-grey">
              We&apos;re finishing our billing setup. Email{" "}
              <a href="mailto:hello@spotaicontent.com" className="text-human hover:underline font-medium">
                hello@spotaicontent.com
              </a>{" "}
              to upgrade early — we&apos;ll set you up manually.
            </p>
          </div>
        </div>

        {/* Plan comparison */}
        <div className="bg-card border border-border-warm rounded-card shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light bg-paper/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-grey">Plan Comparison</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Free */}
              <div className={`rounded-card border p-5 ${currentTier === "free" ? "border-human bg-human/5" : "border-border-warm"}`}>
                {currentTier === "free" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-human bg-human/10 px-2 py-0.5 rounded-full mb-3 inline-block">
                    Current Plan
                  </span>
                )}
                <h3 className="font-serif text-xl font-semibold text-navy mb-1">Free</h3>
                <p className="text-3xl font-bold text-navy mb-4">$0<span className="text-sm font-normal text-grey">/mo</span></p>
                <ul className="space-y-2 text-sm text-grey mb-5">
                  <li className="flex items-center gap-2"><span className="text-human">✓</span> 10 content checks/month</li>
                  <li className="flex items-center gap-2"><span className="text-human">✓</span> Unlimited voting</li>
                  <li className="flex items-center gap-2"><span className="text-human">✓</span> Save history</li>
                </ul>
                <span className="block w-full text-center px-4 py-2.5 rounded-btn text-sm font-semibold bg-paper border border-border-warm text-grey">
                  {currentTier === "free" ? "Current plan" : "Downgrade"}
                </span>
              </div>

              {/* Developer */}
              <div className={`rounded-card border p-5 ${currentTier === "developer" ? "border-human bg-human/5" : "border-border-warm"}`}>
                {currentTier === "developer" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-human bg-human/10 px-2 py-0.5 rounded-full mb-3 inline-block">
                    Current Plan
                  </span>
                )}
                <h3 className="font-serif text-xl font-semibold text-navy mb-1">Pro</h3>
                <p className="text-3xl font-bold text-navy mb-4">$9<span className="text-sm font-normal text-grey">/mo</span></p>
                <ul className="space-y-2 text-sm text-grey mb-5">
                  <li className="flex items-center gap-2"><span className="text-human">✓</span> 100 content checks/month</li>
                  <li className="flex items-center gap-2"><span className="text-human">✓</span> Sentence analysis</li>
                  <li className="flex items-center gap-2"><span className="text-human">✓</span> Certificates · Unlimited voting</li>
                </ul>
                <a
                  href="mailto:hello@spotaicontent.com?subject=Developer Plan Upgrade"
                  className="block w-full text-center px-4 py-2.5 rounded-btn text-sm font-semibold bg-navy text-white hover:bg-navy-light transition-colors"
                >
                  {currentTier === "developer" ? "Manage" : "Email to upgrade →"}
                </a>
              </div>

              {/* Publisher */}
              <div className={`rounded-card border p-5 ${currentTier === "publisher" ? "border-human bg-human/5" : "border-border-warm"}`}>
                {currentTier === "publisher" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-human bg-human/10 px-2 py-0.5 rounded-full mb-3 inline-block">
                    Current Plan
                  </span>
                )}
                <h3 className="font-serif text-xl font-semibold text-navy mb-1">Unlimited</h3>
                <p className="text-3xl font-bold text-navy mb-4">$29<span className="text-sm font-normal text-grey">/mo</span></p>
                <ul className="space-y-2 text-sm text-grey mb-5">
                  <li className="flex items-center gap-2"><span className="text-human">✓</span> Unlimited checks</li>
                  <li className="flex items-center gap-2"><span className="text-human">✓</span> All Pro features</li>
                  <li className="flex items-center gap-2"><span className="text-human">✓</span> Priority processing</li>
                </ul>
                <a
                  href="mailto:hello@spotaicontent.com?subject=Publisher Plan Upgrade"
                  className="block w-full text-center px-4 py-2.5 rounded-btn text-sm font-semibold bg-navy text-white hover:bg-navy-light transition-colors"
                >
                  {currentTier === "publisher" ? "Manage" : "Email to upgrade →"}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="text-center py-4">
          <p className="text-sm text-grey">
            Questions about billing?{" "}
            <a href="mailto:hello@spotaicontent.com" className="text-human hover:underline">
              hello@spotaicontent.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
