import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border-warm bg-card mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="relative w-8 h-5">
                <div className="absolute inset-0 rounded-full spectrum-bar opacity-90" />
                <div className="absolute top-1/2 left-[35%] -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-navy shadow-sm" />
              </div>
              <span className="font-serif text-xl font-semibold text-navy tracking-tight">Spot AI</span>
            </Link>
            <p className="text-grey text-sm max-w-xs leading-relaxed">
              Helping you navigate the AI-generated content landscape with
              cutting-edge detection technology. Stay informed, stay protected.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-btn text-grey hover:text-human hover:bg-highlight/50 transition-all"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-btn text-grey hover:text-human hover:bg-highlight/50 transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-navy mb-4 uppercase tracking-wider">
              Navigation
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/feed", label: "Feed" },
                { href: "/leaderboard", label: "Leaderboard" },
                { href: "/transparency", label: "Transparency" },
                { href: "/supporters", label: "Supporters" },
                { href: "/about", label: "About" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-grey hover:text-human transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-sm font-semibold text-navy mb-4 uppercase tracking-wider">
              Community
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/feed?section=news", label: "News" },
                { href: "/feed?section=entertainment", label: "Entertainment" },
                { href: "/feed?section=academic", label: "Academic" },
                { href: "/leaderboard", label: "Top Contributors" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-grey hover:text-human transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-grey text-xs">
            &copy; {new Date().getFullYear()} Spot AI Content. For educational and
            informational purposes only.
          </p>
          <p className="text-grey text-xs">
            Powered by{" "}
            <a
              href="https://thehive.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-human hover:underline"
            >
              Hive AI
            </a>{" "}
            &amp;{" "}
            <a
              href="https://gptzero.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-human hover:underline"
            >
              GPTZero
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
