"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Link, FileText, Film, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { BadgeData } from "@/lib/badge";
import ResultCard from "./ResultCard";
import BadgeCard from "./BadgeCard";

type Tab = "image" | "video" | "text";

interface DetectResult {
  humanScore: number;
  aiScore: number;
  sentences?: Array<{ sentence: string; generated_prob: number }>;
}

interface BadgeResult {
  token: string;
  verifyUrl: string;
  data: BadgeData;
}

export default function DetectTool() {
  const [tab, setTab] = useState<Tab>("image");
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectResult | null>(null);
  const [badge, setBadge] = useState<BadgeResult | null>(null);
  const [generatingBadge, setGeneratingBadge] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setResult(null);
    setBadge(null);
    setError(null);
    setFile(null);
    setUrl("");
    setText("");
  };

  const handleTabChange = (t: Tab) => {
    setTab(t);
    reset();
    setInputMode(t === "text" ? "url" : "upload");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleDetect = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setBadge(null);

    try {
      let res: Response;

      if (tab === "text") {
        res = await fetch("/api/detect-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      } else if (tab === "video") {
        res = await fetch("/api/detect-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
      } else {
        if (inputMode === "upload" && file) {
          const form = new FormData();
          form.append("file", file);
          res = await fetch("/api/detect-image", { method: "POST", body: form });
        } else {
          res = await fetch("/api/detect-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
        }
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Detection failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGetBadge = async () => {
    if (!result) return;
    setGeneratingBadge(true);

    try {
      const identifier =
        tab === "text" ? "text-submission" : file ? file.name : url;

      const res = await fetch("/api/badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: tab,
          contentIdentifier: identifier,
          humanScore: result.humanScore,
          aiScore: result.aiScore,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Badge generation failed");
      setBadge(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Badge generation failed");
    } finally {
      setGeneratingBadge(false);
    }
  };

  const canSubmit =
    (tab === "text" && text.trim().length >= 50) ||
    (tab === "video" && url.trim().length > 0) ||
    (tab === "image" && (inputMode === "url" ? url.trim().length > 0 : file !== null));

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "image", label: "Image", icon: <ImageIcon className="w-4 h-4" /> },
    { id: "video", label: "Video", icon: <Film className="w-4 h-4" /> },
    { id: "text", label: "Text / Article", icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card border border-border-warm rounded-card mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-btn text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-navy text-white"
                : "text-grey hover:text-navy hover:bg-highlight/50"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="bg-card border border-border-warm rounded-card shadow-card p-6">
        {tab !== "text" && (
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setInputMode("upload")}
              className={`flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-medium transition-all ${
                inputMode === "upload"
                  ? "bg-highlight text-navy"
                  : "text-grey hover:text-navy hover:bg-highlight/50"
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload File
            </button>
            <button
              onClick={() => setInputMode("url")}
              className={`flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-medium transition-all ${
                inputMode === "url"
                  ? "bg-highlight text-navy"
                  : "text-grey hover:text-navy hover:bg-highlight/50"
              }`}
            >
              <Link className="w-3.5 h-3.5" /> Paste URL
            </button>
          </div>
        )}

        {/* Upload zone */}
        {tab !== "text" && inputMode === "upload" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-btn p-10 text-center cursor-pointer transition-all ${
              dragging
                ? "drag-over"
                : file
                ? "border-human/40 bg-highlight/20"
                : "border-border-warm hover:border-human bg-paper"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={tab === "image" ? "image/*" : "video/*"}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="text-human">
                  {tab === "image" ? <ImageIcon className="w-6 h-6" /> : <Film className="w-6 h-6" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-navy truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-grey">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="p-1 rounded-btn hover:bg-highlight/50 text-grey"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-10 h-10 mx-auto text-grey mb-3" />
                <p className="text-sm font-medium text-navy">
                  Drop {tab === "image" ? "an image" : "a video"} here
                </p>
                <p className="text-xs text-grey mt-1">or click to browse</p>
              </div>
            )}
          </div>
        )}

        {/* URL input */}
        {tab !== "text" && inputMode === "url" && (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={
              tab === "image"
                ? "https://example.com/image.jpg"
                : "https://youtube.com/watch?v=... or direct video URL"
            }
            className="w-full bg-paper border border-border-warm rounded-btn px-4 py-3.5 text-sm text-navy placeholder:text-grey focus:outline-none focus:border-human transition"
          />
        )}

        {/* Text area */}
        {tab === "text" && (
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste an article, blog post, research paper, or any written content here... (minimum 50 characters)"
              rows={8}
              className="w-full bg-paper border border-border-warm rounded-btn px-4 py-3.5 text-sm text-navy placeholder:text-grey focus:outline-none focus:border-human transition resize-none"
            />
            <p className="text-xs text-grey mt-2 text-right">
              {text.length} chars {text.length < 50 && <span className="text-middle">· need {50 - text.length} more</span>}
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleDetect}
          disabled={!canSubmit || loading}
          className="mt-5 w-full py-3.5 rounded-btn font-semibold text-sm text-white bg-navy hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing{tab === "video" ? " (may take ~30s)" : ""}...
            </>
          ) : (
            "Analyze Content"
          )}
        </button>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-btn bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <ResultCard
          humanScore={result.humanScore}
          aiScore={result.aiScore}
          sentences={result.sentences}
          onGetBadge={handleGetBadge}
          isGeneratingBadge={generatingBadge}
        />
      )}

      {/* Badge */}
      {badge && <BadgeCard token={badge.token} verifyUrl={badge.verifyUrl} data={badge.data} />}
    </div>
  );
}
