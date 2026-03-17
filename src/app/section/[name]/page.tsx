import { prisma } from "@/lib/db";
import { getSection } from "@/lib/sections";
import ContentCard from "@/components/ContentCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SECTION_COLORS: Record<string, string> = {
  general: "#1A1A2E", news: "#1A1A2E", entertainment: "#6B4E71",
  viral: "#E07A5F", food: "#6B9E78", business: "#4A6FA5",
  academic: "#2D6A4F", creative: "#C17B74", health: "#5B9E9E",
};

export default async function SectionPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const section = getSection(name);
  const headerColor = SECTION_COLORS[name] ?? "#1A1A2E";

  const items = await prisma.content.findMany({
    where: { section: name },
    include: { _count: { select: { votes: true, comments: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-paper">
      <div className="border-b border-border-warm bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{section.emoji}</span>
            <div>
              <h1 className="font-serif text-3xl font-semibold" style={{ color: headerColor }}>{section.label}</h1>
              <p className="text-grey mt-1">{section.description}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl mb-4 block">🦾</span>
            <p className="text-grey mb-4">No content in this section yet.</p>
            <Link href="/" className="text-human hover:underline text-sm">Submit the first piece →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(item => (
              <ContentCard key={item.id} id={item.id} contentType={item.contentType}
                section={item.section ?? "general"} excerpt={item.excerpt} url={item.url}
                algorithmScore={item.algorithmScore} communityScore={item.communityScore}
                voteCount={item._count.votes} commentCount={item._count.comments} createdAt={item.createdAt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
