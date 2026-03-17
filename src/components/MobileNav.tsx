"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Rss, PlusCircle, Trophy, User } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/feed", icon: Rss, label: "Feed" },
  { href: "/", icon: PlusCircle, label: "Submit", isCenter: true },
  { href: "/leaderboard", icon: Trophy, label: "Leaders" },
  { href: "/api/auth/signin", icon: User, label: "Profile" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border-warm z-50 flex items-center justify-around px-2 py-2 md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        if (item.isCenter) {
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
              aria-label={item.label}
            >
              <div className="bg-navy text-white rounded-full p-2.5">
                <Icon className="w-6 h-6" />
              </div>
            </Link>
          );
        }

        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-btn transition-colors ${
              active ? "text-human bg-highlight/30" : "text-grey hover:text-navy"
            }`}
            aria-label={item.label}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
