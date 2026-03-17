"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  user: { name: string | null; image: string | null };
}

interface CommentSectionProps {
  contentId: string;
  initial: Comment[];
  isLoggedIn: boolean;
}

export default function CommentSection({ contentId, initial, isLoggedIn }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initial);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!body.trim() || loading) return;
    setLoading(true);
    const res = await fetch("/api/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId, body }),
    });
    if (res.ok) {
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setBody("");
    }
    setLoading(false);
  };

  return (
    <div className="bg-card border border-border-warm rounded-card overflow-hidden shadow-card">
      <div className="px-6 py-4 border-b border-border-light">
        <p className="text-xs font-semibold uppercase tracking-widest text-grey">
          Discussion ({comments.length})
        </p>
      </div>

      <div className="divide-y divide-border-light">
        {comments.length === 0 && (
          <p className="px-6 py-6 text-sm text-grey text-center">
            No comments yet. Be the first to weigh in.
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="px-6 py-4 flex gap-3">
            {c.user.image ? (
              <Image src={c.user.image} alt="" width={32} height={32} className="w-8 h-8 rounded-full shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-highlight shrink-0 flex items-center justify-center text-xs font-bold text-navy">
                {c.user.name?.[0] ?? "?"}
              </div>
            )}
            <div>
              <p className="text-xs text-grey mb-1">
                <span className="font-semibold text-navy">{c.user.name ?? "Anonymous"}</span>
                {" · "}
                {new Date(c.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-navy leading-relaxed">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border-light bg-paper/50">
        {isLoggedIn ? (
          <div className="flex gap-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add your analysis…"
              rows={2}
              className="flex-1 bg-paper border border-border-warm rounded-btn px-4 py-2.5 text-sm text-navy placeholder:text-grey focus:outline-none focus:border-human resize-none transition"
            />
            <button
              onClick={submit}
              disabled={!body.trim() || loading}
              className="shrink-0 px-4 py-2.5 rounded-btn bg-navy text-white text-sm font-semibold disabled:opacity-40 self-end hover:bg-navy-light transition-colors"
            >
              Post
            </button>
          </div>
        ) : (
          <p className="text-sm text-grey text-center">
            <Link href="/api/auth/signin" className="text-human hover:underline">Sign in</Link>{" "}
            to join the discussion
          </p>
        )}
      </div>
    </div>
  );
}
