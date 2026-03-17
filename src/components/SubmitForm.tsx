"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { Upload, Link, FileText, Film, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { SECTIONS } from "@/lib/sections";
import { useSession } from "next-auth/react";

type Tab = "image" | "video" | "text";

export default function SubmitForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("image");
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState("general");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetInput = () => { setUrl(""); setText(""); setFile(null); setError(null); };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const canSubmit =
    (tab === "text" && inputMode === "upload" && text.trim().length >= 50) ||
    (tab === "text" && inputMode === "url" && url.trim().length > 0) ||
    (tab === "video" && url.trim().length > 0) ||
    (tab === "image" && (inputMode === "url" ? url.trim().length > 0 : file !== null));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      let res: Response;
      if (tab === "image" && inputMode === "upload" && file) {
        const form = new FormData();
        form.append("type", "image");
        form.append("file", file);
        form.append("section", section);
        res = await fetch("/api/submit", { method: "POST", body: form });
      } else {
        res = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: tab,
            url: tab === "text" ? (inputMode === "url" ? url : undefined) : url,
            text: tab === "text" && inputMode === "upload" ? text : undefined,
            section,
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      router.push(`/result/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "image", label: "Image", icon: <ImageIcon className="w-4 h-4" /> },
    { id: "video", label: "Video", icon: <Film className="w-4 h-4" /> },
    { id: "text", label: "Text / Article", icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card border border-border-warm rounded-card mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); resetInput(); setInputMode("upload"); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-btn text-sm font-medium transition-all ${
              tab === t.id ? "bg-navy text-white" : "text-grey hover:text-navy hover:bg-highlight/50"
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Section selector */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-grey uppercase tracking-wider mb-1.5 block">
          Category
        </label>
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="w-full bg-paper border border-border-warm rounded-btn px-4 py-2.5 text-sm text-navy focus:outline-none focus:border-human transition appearance-none cursor-pointer"
        >
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id} className="bg-white">
              {s.emoji} {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-card border border-border-warm rounded-card shadow-card p-5">
        {/* Upload / URL toggle */}
        <div className="flex gap-2 mb-4">
          {tab === "text" ? (
            <>
              <button
                onClick={() => setInputMode("upload")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-btn text-sm font-medium transition-all ${inputMode === "upload" ? "bg-highlight text-navy" : "text-grey hover:text-navy hover:bg-highlight/50"}`}
              >
                <FileText className="w-3.5 h-3.5" /> Paste Text
              </button>
              <button
                onClick={() => { setInputMode("url"); setText(""); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-btn text-sm font-medium transition-all ${inputMode === "url" ? "bg-highlight text-navy" : "text-grey hover:text-navy hover:bg-highlight/50"}`}
              >
                <Link className="w-3.5 h-3.5" /> Article URL
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setInputMode("upload")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-btn text-sm font-medium transition-all ${inputMode === "upload" ? "bg-highlight text-navy" : "text-grey hover:text-navy hover:bg-highlight/50"}`}
              >
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
              <button
                onClick={() => setInputMode("url")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-btn text-sm font-medium transition-all ${inputMode === "url" ? "bg-highlight text-navy" : "text-grey hover:text-navy hover:bg-highlight/50"}`}
              >
                <Link className="w-3.5 h-3.5" /> URL
              </button>
            </>
          )}
        </div>

        {/* Drop zone */}
        {tab !== "text" && inputMode === "upload" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-btn p-8 text-center cursor-pointer transition-all ${dragging ? "drag-over" : file ? "border-human/40 bg-highlight/20" : "border-border-warm hover:border-human bg-paper"}`}
          >
            <input ref={fileInputRef} type="file" className="hidden" accept={tab === "image" ? "image/*" : "video/*"} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-human">{tab === "image" ? <ImageIcon className="w-5 h-5" /> : <Film className="w-5 h-5" />}</span>
                <span className="text-sm font-medium text-navy truncate max-w-xs">{file.name}</span>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="p-1 rounded hover:bg-highlight/50 text-grey"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div><Upload className="w-8 h-8 mx-auto text-grey mb-2" /><p className="text-sm text-navy">Drop {tab} here or click to browse</p></div>
            )}
          </div>
        )}

        {/* URL input */}
        {inputMode === "url" && (
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder={
              tab === "text" ? "https://example.com/article" :
              tab === "image" ? "https://example.com/image.jpg" :
              "https://youtube.com/watch?v=..."
            }
            className="w-full bg-paper border border-border-warm rounded-btn px-4 py-3 text-sm text-navy placeholder:text-grey focus:outline-none focus:border-human transition"
          />
        )}

        {/* Text area */}
        {tab === "text" && inputMode === "upload" && (
          <div>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Paste an article, blog post, comment, or any written content… (min 50 chars)"
              rows={6}
              className="w-full bg-paper border border-border-warm rounded-btn px-4 py-3 text-sm text-navy placeholder:text-grey focus:outline-none focus:border-human resize-none transition"
            />
            <p className="text-xs text-grey mt-1 text-right">{text.length} chars{text.length < 50 && <span className="text-middle"> · {50 - text.length} more needed</span>}</p>
          </div>
        )}

        {session ? (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="mt-4 w-full py-3.5 rounded-btn font-semibold text-sm text-white bg-navy hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing{tab === "video" ? " (~30s)" : ""}…</> : "Get Second Opinion"}
          </button>
        ) : (
          <NextLink
            href="/api/auth/signin"
            className="mt-4 w-full py-3.5 rounded-btn font-semibold text-sm text-white bg-navy hover:bg-navy-light transition-colors flex items-center justify-center gap-2"
          >
            Sign in to check content
          </NextLink>
        )}

        {error && (
          <div className="mt-3 px-4 py-3 rounded-btn bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
            {error.includes("upgrade") || error.includes("Upgrade") ? (
              <div className="mt-2">
                <NextLink href="/dashboard/billing" className="inline-flex px-3 py-1.5 rounded-btn bg-navy text-white text-xs font-semibold hover:bg-navy-light transition-colors">
                  Upgrade to Pro →
                </NextLink>
              </div>
            ) : null}
          </div>
        )}
      </div>
      {!session && (
        <p className="text-center text-xs text-grey mt-3">
          <NextLink href="/api/auth/signin" className="text-human hover:underline">Sign in</NextLink> to start checking content
        </p>
      )}
    </div>
  );
}
