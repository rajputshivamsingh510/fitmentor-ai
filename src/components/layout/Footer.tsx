import Link from "next/link";
import { Activity } from "lucide-react";

const footerLinks = {
  Product: [
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/#pricing" },
    { name: "AI Coach", href: "/coach" },
  ],
  Company: [
    { name: "About", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
  ],
  Legal: [
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
    { name: "Cookies", href: "#" },
  ],
};

export const Footer = () => {
  return (
    <footer className="relative border-t border-cyan-500/10 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                <Activity className="h-5 w-5 text-cyan-400" />
              </div>
              <span className="text-lg font-bold tracking-widest uppercase text-white">
                FitMentor AI
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              The next evolution of human performance. AI-powered precision coaching.
            </p>
            {/* Social icons as SVG shapes, no external library dependency */}
            <div className="flex gap-3 mt-5">
              {["X", "IG", "YT"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                {group}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} FitMentor AI. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-xs text-cyan-100/50 uppercase tracking-wider">
              AI Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
