import React, { useState, useEffect } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "py-3 border-b border-white/10 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700/95 backdrop-blur-xl shadow-lg"
          : "py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Brand with enhanced design */}
          <div className="flex items-center gap-3 group cursor-pointer">
            {/* Animated logo container */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white/20 to-white/5 ring-1 ring-white/30 backdrop-blur-sm transform group-hover:scale-105 transition-transform duration-300">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-white relative z-10 transform group-hover:rotate-12 transition-transform duration-300"
                >
                  <path d="M3 3v18h18" />
                  <path d="M18 17V9" />
                  <path d="M13 17V5" />
                  <path d="M8 17v-3" />
                </svg>
              </div>
            </div>

            {/* Enhanced text with gradient */}
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight text-white antialiased">
                <span className="bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                  PRICING ENGINE
                </span>
              </h1>
              <p className="text-xs font-medium tracking-wider text-white/80 opacity-90 transform -translate-y-1">
                DASHBOARD
              </p>
            </div>
          </div>

          {/* Navigation and actions */}
          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse"></div>
              <span className="text-sm font-medium text-white/90">Live</span>
            </div>

            {/* User profile/action button */}
            <div className="flex items-center gap-2">
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 backdrop-blur-sm ring-1 ring-white/20 transition-all duration-200 hover:ring-white/30 active:scale-95">
                <span className="text-sm font-medium text-white">
                  Refresh Data
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-x {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </header>
  );
}
