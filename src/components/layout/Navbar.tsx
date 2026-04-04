"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Menu, X, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Fix: create supabase client once with a ref — not on every render
  // Previously: const supabase = createClient() inside component body
  // caused useEffect([supabase]) to re-fire on every render = repeated getUser() calls
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Only runs once on mount — not on every render
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const navLinks = user
    ? [
        { name: "Home", href: "/" },
        { name: "AI Coach", href: "/coach" },
        { name: "Anatomy", href: "/anatomy" },
        { name: "Exercises", href: "/exercises" },
        { name: "Profile", href: "/profile" },
      ]
    : [
        { name: "Home", href: "/" },
        { name: "Features", href: "/#features" },
        { name: "AI Coach", href: "/coach" },
        { name: "Anatomy", href: "/anatomy" },
        { name: "Exercises", href: "/exercises" },
        { name: "Pricing", href: "/#pricing" },
      ];

  return (
    <nav className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-4 py-4 md:px-8", scrolled ? "py-2" : "py-6")}>
      <div className={cn("max-w-7xl mx-auto rounded-2xl transition-all duration-500", scrolled ? "glass-panel px-6 py-3" : "px-2 py-2")}>
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 box-glow group-hover:bg-cyan-500/20 transition-colors">
              <Activity className="h-6 w-6 text-cyan-400" />
            </div>
            <span className="text-xl font-bold tracking-widest uppercase text-white group-hover:text-glow transition-all">
              FitMentor AI
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href}
                className={cn("relative text-sm font-medium uppercase tracking-wide transition-colors group",
                  pathname === link.href ? "text-cyan-400" : "text-slate-300 hover:text-cyan-400")}>
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-cyan-400 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
              </span>
              <span className="text-xs uppercase tracking-wider text-cyan-100/70">AI Coach Online</span>
            </div>

            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl glass-panel hover:bg-slate-800/60 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <User className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="text-sm text-slate-200 max-w-[120px] truncate">{user.email?.split("@")[0]}</span>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 mt-2 w-52 glass-panel rounded-xl overflow-hidden shadow-xl">
                      <div className="px-4 py-3 border-b border-cyan-500/10">
                        <p className="text-xs text-slate-500">Signed in as</p>
                        <p className="text-sm text-white font-medium truncate">{user.email}</p>
                      </div>
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/5 transition-colors">
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-white hover:text-cyan-400 transition-colors">Log In</Link>
                <Link href="/auth/signup"
                  className="px-5 py-2.5 rounded-full bg-cyan-500 text-slate-950 font-semibold text-sm hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-4 right-4 mt-2 glass-panel rounded-2xl p-4 overflow-hidden">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href} onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:text-cyan-400 p-3 rounded-lg transition-colors font-medium border-b border-white/5 text-sm uppercase tracking-wide">
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                {user ? (
                  <>
                    <p className="text-xs text-slate-500 px-1">{user.email}</p>
                    <button onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-red-400 font-medium text-sm">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3 rounded-xl border border-white/10 text-white font-medium text-center text-sm">
                      Log In
                    </Link>
                    <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm box-glow">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;