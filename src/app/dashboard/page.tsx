import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ArrowRight, FileText, Image as ImageIcon, Film, ThumbsUp } from "lucide-react";
import { scoreLabel, scoreColor, clamp } from "@/lib/scoring";
import DeleteContentButton from "@/components/DeleteContentButton";
import { CHECK_LIMITS } from "@/lib/check-limit";

export const dynamic = "force-dynamic";

function ContentTypeIcon({ type }: { type: string }) {
  if (type === "image") return <ImageIcon className="w-4 h-4" />;
  if (type === "video") return <Film className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin");

  const userId = session.user.id;

  const [submittedContent, votes, user] = await Promise.all([
    prisma.content.findMany({
      where: { submittedById: userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, contentType: true, title: true, excerpt: true, algorithmScore: true, createdAt: true },
    }),
    prisma.vote.findMany({
      where: { userId },
      include: { content: { select: { id: true, contentType: true, title: true, excerpt: true, algorithmScore: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { checksThisMonth: true, email: true },
    }),
  ]);

  const tier = (session.user as { tier?: string }).tier ?? "free";
  const checksLimit = tier === "pro" ? CHECK_LIMITS.pro : tier === "unlimited" ? Infinity : CHECK_LIMITS.free;
  const checksUsed = user?.checksThisMonth ?? 0;
  const checksPct = checksLimit === Infinity ? 0 : Math.min(100, Math.round((checksUsed / (checksLimit as number)) * 100));

  return (
    <div className="min-h-screen bg-paper px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex items-center gap-4">
          {session.user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="w-14 h-14 rounded-full border border-border-warm" />
          )}
          <div>
            <h1 className="font-serif text-3xl font-semibold text-navy">{session.user.name ?? "Your Account"}</h1>
            <p className="text-grey text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Plan + usage */}
        <div className="bg-card border border-border-warm rounded-card shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-grey mb-1">Plan</p>
              <span className="text-sm font-semibold text-navy capitalize">{tier}</span>
            </div>
            <Link href="/dashboard/billing" className="text-sm text-human hover:underline">Upgrade →</Link>
          </div>
          {checksLimit !== Infinity && (
            <div>
              <div className="flex justify-between text-xs text-grey mb-1.5">
                <span>Checks this month: <span className="font-semibold text-navy">{checksUsed}</span> / {checksLimit as number}</span>
                <span>{checksPct}%</span>
              </div>
              <div className="h-2 bg-border-light rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${checksPct > 85 ? "bg-ai" : checksPct > 60 ? "bg-middle" : "bg-human"}`}
                  style={{ width: `${checksPct}%` }}
                />
              </div>
              <p className="text-xs text-grey mt-1">Resets monthly</p>
            </div>
          )}
        </div>

        {/* Content I checked */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-navy mb-4">Content You Checked</h2>
          {submittedContent.length === 0 ? (
            <div className="bg-card border border-border-warm rounded-card p-8 text-center">
              <p className="text-grey text-sm mb-3">You haven&apos;t checked any content yet.</p>
              <Link href="/" className="text-sm text-human hover:underline">Check your first piece of content →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {submittedContent.map((item) => {
                const score = clamp(item.algorithmScore);
                const color = scoreColor(score);
                const label = scoreLabel(score);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-card border border-border-warm rounded-card px-5 py-4 hover:border-human/40 hover:bg-highlight/20 transition-all group"
                  >
                    <Link href={`/result/${item.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-grey shrink-0"><ContentTypeIcon type={item.contentType} /></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy truncate">{item.title ?? item.contentType}</p>
                        <p className="text-xs text-grey mt-0.5">{new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                      <div className="shrink-0 text-right mr-1">
                        <p className="text-base font-bold font-mono tabular-nums" style={{ color }}>{score}%</p>
                        <p className="text-xs font-medium" style={{ color }}>{label}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-grey group-hover:text-human transition-colors shrink-0" />
                    </Link>
                    <DeleteContentButton id={item.id} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Content I voted on */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-navy mb-4">Content You Voted On</h2>
          {votes.length === 0 ? (
            <div className="bg-card border border-border-warm rounded-card p-8 text-center">
              <p className="text-grey text-sm mb-3">You haven&apos;t voted on any content yet.</p>
              <Link href="/feed" className="text-sm text-human hover:underline">Browse the feed to vote →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {votes.map((vote) => {
                const score = clamp(vote.content.algorithmScore);
                const color = scoreColor(score);
                const label = scoreLabel(score);
                return (
                  <Link
                    key={vote.id}
                    href={`/result/${vote.content.id}`}
                    className="flex items-center gap-4 bg-card border border-border-warm rounded-card px-5 py-4 hover:border-human/40 hover:bg-highlight/20 transition-all group"
                  >
                    <span className="text-grey shrink-0"><ContentTypeIcon type={vote.content.contentType} /></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{vote.content.title ?? vote.content.contentType}</p>
                      <p className="text-xs text-grey mt-0.5">{new Date(vote.content.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-highlight text-navy font-medium shrink-0 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> {vote.verdict}
                    </span>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-bold font-mono tabular-nums" style={{ color }}>{score}%</p>
                      <p className="text-xs font-medium" style={{ color }}>{label}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-grey group-hover:text-human transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Account settings */}
        <div className="bg-card border border-border-warm rounded-card shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light bg-paper/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-grey">Account</p>
          </div>
          <div className="divide-y divide-border-light">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy">Name</p>
                <p className="text-xs text-grey mt-0.5">{session.user.name ?? "—"}</p>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy">Email</p>
                <p className="text-xs text-grey mt-0.5">{user?.email ?? "—"}</p>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy">Sign in method</p>
                <p className="text-xs text-grey mt-0.5">Google</p>
              </div>
            </div>
            <Link
              href="/api/auth/signout"
              className="flex items-center justify-between px-6 py-4 hover:bg-red-50 transition-colors group"
            >
              <p className="text-sm font-medium text-ai">Sign out</p>
              <ArrowRight className="w-4 h-4 text-ai shrink-0" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
