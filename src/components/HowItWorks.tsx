"use client";

import { WINNER_DISCOUNT } from "@/lib/constants";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "PICK YOUR TEAM",
      description: "Choose from all 48 World Cup 2026 teams. This is your bet!",
      icon: "🏳️",
    },
    {
      number: "02",
      title: "SELECT YOUR TIER",
      description: "Bronze, Silver, Gold, or Diamond - higher stakes, better gear!",
      icon: "🎰",
    },
    {
      number: "03",
      title: "CONNECT WALLET",
      description: "Pay with crypto for extra 5-20% discount on your order.",
      icon: "💎",
    },
    {
      number: "04",
      title: "PRE-ORDER NOW",
      description: "Secure your gear before the deadline for guaranteed delivery.",
      icon: "📦",
    },
    {
      number: "05",
      title: "WATCH & WIN",
      description: `If your team wins the World Cup, get ${WINNER_DISCOUNT}% back!`,
      icon: "🏆",
    },
  ];

  return (
    <section id="how-it-works" className="w-full max-w-4xl mx-auto">
      <div className="pixel-panel">
        <h2 className="font-pixel text-pixel-green text-center text-sm md:text-base mb-8">
          🎮 HOW IT WORKS 🎮
        </h2>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="flex items-start gap-4 p-4 border-2 border-pixel-green/30 hover:border-pixel-green transition-colors"
            >
              {/* Step number */}
              <div className="w-12 h-12 bg-pixel-green text-pixel-black flex items-center justify-center flex-shrink-0">
                <span className="font-pixel text-sm">{step.number}</span>
              </div>

              {/* Content */}
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{step.icon}</span>
                  <h3 className="font-pixel text-pixel-cyan text-xs">
                    {step.title}
                  </h3>
                </div>
                <p className="font-pixel text-pixel-silver text-[10px]">
                  {step.description}
                </p>
              </div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <div className="hidden md:block font-pixel text-pixel-green text-xl">
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Crypto integration info */}
        <div className="mt-8 p-4 border-2 border-pixel-magenta bg-pixel-magenta/10">
          <h3 className="font-pixel text-pixel-magenta text-xs mb-3 text-center">
            💎 CRYPTO / PREDICTION MARKET INTEGRATION 💎
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-pixel text-pixel-cyan text-[10px] mb-2">
                WALLET PAYMENTS
              </h4>
              <ul className="space-y-1">
                <li className="font-pixel text-pixel-silver text-[9px]">
                  ► Pay with ETH, USDC, or other tokens
                </li>
                <li className="font-pixel text-pixel-silver text-[9px]">
                  ► Automatic discount applied at checkout
                </li>
                <li className="font-pixel text-pixel-silver text-[9px]">
                  ► Lower fees than credit cards
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-pixel text-pixel-cyan text-[10px] mb-2">
                PREDICTION MARKETS
              </h4>
              <ul className="space-y-1">
                <li className="font-pixel text-pixel-silver text-[9px]">
                  ► Your team pick = your prediction
                </li>
                <li className="font-pixel text-pixel-silver text-[9px]">
                  ► Smart contract tracks World Cup winner
                </li>
                <li className="font-pixel text-pixel-silver text-[9px]">
                  ► Auto-refund if your team wins
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
