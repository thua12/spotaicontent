import DetectTool from "@/components/DetectTool";

export const metadata = {
  title: "Detect AI Content — Spot AI Content",
  description:
    "Upload an image, video, or paste text to find out if it was created by AI or a human.",
};

export default function DetectPage() {
  return (
    <div className="min-h-screen bg-paper px-4 py-16">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-navy tracking-tight mb-4">
          Analyze Content
        </h1>
        <p className="text-grey text-lg">
          Upload a file or paste a URL. We&apos;ll tell you if it was made by a human or AI —
          and certify it with a badge if it passes.
        </p>
      </div>
      <DetectTool />
    </div>
  );
}
