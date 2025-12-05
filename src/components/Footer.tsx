"use client";

export function Footer() {
  return (
    <footer className="w-full border-t-4 border-pixel-green bg-pixel-black mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-pixel-green border-2 border-pixel-black flex items-center justify-center">
                <span className="font-pixel text-pixel-black text-sm">10</span>
              </div>
              <div>
                <h3 className="font-pixel text-pixel-green text-xs">TEN PLUS ONE</h3>
                <p className="font-pixel text-pixel-cyan text-[8px]">INTERNET SOCCER CLUB</p>
              </div>
            </div>
            <p className="font-pixel text-pixel-silver text-[9px]">
              THE ULTIMATE WORLD CUP FAN GEAR EXPERIENCE.
              BET ON YOUR TEAM, WIN BIG.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-pixel text-pixel-green text-xs mb-4">LINKS</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="font-pixel text-pixel-silver text-[10px] hover:text-pixel-cyan">
                  ► SHOPIFY STORE
                </a>
              </li>
              <li>
                <a href="#" className="font-pixel text-pixel-silver text-[10px] hover:text-pixel-cyan">
                  ► TERMS & CONDITIONS
                </a>
              </li>
              <li>
                <a href="#" className="font-pixel text-pixel-silver text-[10px] hover:text-pixel-cyan">
                  ► PRIVACY POLICY
                </a>
              </li>
              <li>
                <a href="#" className="font-pixel text-pixel-silver text-[10px] hover:text-pixel-cyan">
                  ► CONTACT US
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-pixel text-pixel-green text-xs mb-4">CONNECT</h4>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 bg-pixel-black border-2 border-pixel-green flex items-center justify-center hover:bg-pixel-green hover:text-pixel-black transition-colors"
              >
                <span className="font-pixel text-xs">X</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-pixel-black border-2 border-pixel-green flex items-center justify-center hover:bg-pixel-green hover:text-pixel-black transition-colors"
              >
                <span className="font-pixel text-xs">DC</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-pixel-black border-2 border-pixel-green flex items-center justify-center hover:bg-pixel-green hover:text-pixel-black transition-colors"
              >
                <span className="font-pixel text-xs">TG</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-4 border-t border-pixel-green/30 text-center">
          <p className="font-pixel text-pixel-silver text-[8px]">
            © 2024-2026 TEN PLUS ONE. ALL RIGHTS RESERVED.
          </p>
          <p className="font-pixel text-pixel-green text-[8px] mt-2 animate-blink">
            ⚽ SEE YOU AT WORLD CUP 2026 ⚽
          </p>
        </div>
      </div>
    </footer>
  );
}
