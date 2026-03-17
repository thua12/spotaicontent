"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteContentButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.preventDefault()}>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-semibold text-white bg-ai px-2.5 py-1 rounded-btn hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Delete
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-grey hover:text-navy transition-colors px-1"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); setConfirming(true); }}
      className="shrink-0 p-1.5 rounded hover:bg-red-50 text-grey hover:text-ai transition-colors opacity-0 group-hover:opacity-100"
      aria-label="Delete"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
