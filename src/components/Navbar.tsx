"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import LiveCounter from "./LiveCounter";

const navLinks = [
  { href: "/", label: "Detect" },
  { href: "/feed", label: "Feed" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/transparency", label: "Transparency" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border-warm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              {/* Spectrum logo mark */}
              <div className="relative w-8 h-5">
                <div className="absolute inset-0 rounded-full spectrum-bar opacity-90" />
                <div className="absolute top-1/2 left-[35%] -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-navy shadow-sm" />
              </div>
              <span className="font-serif text-xl font-semibold text-navy tracking-tight">Spot AI</span>
            </Link>
            <LiveCounter />
          </div>
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href}
                  className={`px-4 py-2 rounded-btn text-sm font-medium transition-colors ${active ? "bg-highlight text-human font-semibold" : "text-grey hover:text-navy hover:bg-highlight/50"}`}>
                  {link.label}
                </Link>
              );
            })}
            {session?.user ? (
              <Link href="/dashboard"
                className={`px-4 py-2 rounded-btn text-sm font-medium transition-colors ${pathname.startsWith("/dashboard") ? "bg-highlight text-human font-semibold" : "text-grey hover:text-navy hover:bg-highlight/50"}`}>
                Dashboard
              </Link>
            ) : null}
            {session?.user ? (
              <Link href="/api/auth/signout" className="ml-3 px-4 py-2 rounded-btn text-sm font-semibold border border-border-warm text-navy hover:bg-highlight/50 transition-colors">
                Sign Out
              </Link>
            ) : (
              <Link href="/api/auth/signin" className="ml-3 px-4 py-2 rounded-btn text-sm font-semibold bg-navy text-white hover:bg-navy-light transition-colors">
                Sign In
              </Link>
            )}
          </div>
          <button className="md:hidden p-2 rounded-btn text-grey hover:text-navy hover:bg-highlight/50 transition" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border-warm bg-card">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                className="block px-4 py-2.5 rounded-btn text-sm font-medium text-grey hover:text-navy hover:bg-highlight/50 transition">
                {link.label}
              </Link>
            ))}
            {session?.user && (
              <Link href="/dashboard" onClick={() => setOpen(false)}
                className="block px-4 py-2.5 rounded-btn text-sm font-medium text-grey hover:text-navy hover:bg-highlight/50 transition">
                Dashboard
              </Link>
            )}
            {session?.user ? (
              <Link href="/api/auth/signout" onClick={() => setOpen(false)}
                className="block px-4 py-2.5 rounded-btn text-sm font-semibold text-center border border-border-warm text-navy mt-2">
                Sign Out
              </Link>
            ) : (
              <Link href="/api/auth/signin" onClick={() => setOpen(false)}
                className="block px-4 py-2.5 rounded-btn text-sm font-semibold text-center bg-navy text-white mt-2">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
