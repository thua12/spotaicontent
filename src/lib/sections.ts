export interface Section {
  id: string;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

export const SECTIONS: Section[] = [
  { id: "general",       label: "General",               emoji: "🌐", description: "All content",                                 color: "#00d4ff" },
  { id: "news",          label: "News & Current Affairs", emoji: "📰", description: "Journalism, wire services, bylined reporting", color: "#3b82f6" },
  { id: "entertainment", label: "Entertainment",          emoji: "🎬", description: "Celebrity, movies, music, culture",            color: "#a855f7" },
  { id: "viral",         label: "Viral Social",           emoji: "📱", description: "Trending tweets, Reddit, LinkedIn posts",      color: "#f59e0b" },
  { id: "food",          label: "Recipes & Food",         emoji: "🍳", description: "Food blogs, recipe sites",                    color: "#22c55e" },
  { id: "business",      label: "Business & Finance",     emoji: "💼", description: "Press releases, earnings, corporate blogs",   color: "#0ea5e9" },
  { id: "academic",      label: "Academic & Education",   emoji: "🎓", description: "Research, explainers, educational content",   color: "#8b5cf6" },
  { id: "creative",      label: "Creative Writing",       emoji: "✍️",  description: "Short stories, poetry, essays",              color: "#ec4899" },
  { id: "health",        label: "Health & Wellness",      emoji: "🏥", description: "Medical advice, nutrition, wellness",         color: "#10b981" },
];

export function getSection(id: string): Section {
  return SECTIONS.find((s) => s.id === id) ?? SECTIONS[0];
}
