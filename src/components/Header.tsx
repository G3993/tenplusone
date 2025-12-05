"use client";

export function Header() {
  return (
    <header className="w-full border-b-4 border-pixel-green bg-pixel-black/80 backdrop-blur-sm sticky top-0 z-40">
      {/* Marquee announcement */}
      <div className="bg-pixel-green text-pixel-black overflow-hidden py-1">
        <div className="animate-marquee whitespace-nowrap font-pixel text-[10px]">
          ⚽ WORLD CUP 2026 PRE-ORDERS NOW OPEN ⚽ • BET ON YOUR TEAM • WIN = 50% OFF •
          CRYPTO PAYMENTS = EXTRA DISCOUNTS • LIMITED EDITION GEAR •
          ⚽ WORLD CUP 2026 PRE-ORDERS NOW OPEN ⚽ • BET ON YOUR TEAM • WIN = 50% OFF •
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pixel-green border-4 border-pixel-black flex items-center justify-center">
              <span className="font-pixel text-pixel-black text-lg">10</span>
            </div>
            <div>
              <h1 className="font-pixel text-pixel-green text-sm md:text-base">
                TEN PLUS ONE
              </h1>
              <p className="font-pixel text-pixel-cyan text-[8px] md:text-[10px]">
                INTERNET SOCCER CLUB
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#teams" className="font-pixel text-pixel-white text-xs hover:text-pixel-green transition-colors">
              TEAMS
            </a>
            <a href="#gear" className="font-pixel text-pixel-white text-xs hover:text-pixel-green transition-colors">
              GEAR
            </a>
            <a href="#how-it-works" className="font-pixel text-pixel-white text-xs hover:text-pixel-green transition-colors">
              HOW IT WORKS
            </a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2">
            <span className="font-pixel text-pixel-yellow text-[10px] hidden sm:block animate-blink">
              🎰 BET NOW
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
