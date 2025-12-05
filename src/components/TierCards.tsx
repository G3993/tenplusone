"use client";

import { GEAR_TIERS } from "@/lib/constants";

interface TierCardsProps {
  selectedTier?: string | null;
  onTierSelect?: (tierId: string) => void;
  cryptoConnected?: boolean;
}

const tierStyles: Record<string, string> = {
  bronze: "border-orange-500 hover:border-orange-400",
  silver: "border-gray-400 hover:border-gray-300",
  gold: "border-yellow-500 hover:border-yellow-400",
  cyan: "border-cyan-400 hover:border-cyan-300",
};

const tierGlows: Record<string, string> = {
  bronze: "shadow-[0_0_20px_rgba(249,115,22,0.3)]",
  silver: "shadow-[0_0_20px_rgba(156,163,175,0.3)]",
  gold: "shadow-[0_0_20px_rgba(234,179,8,0.5)]",
  cyan: "shadow-[0_0_20px_rgba(34,211,238,0.5)]",
};

const tierTextColors: Record<string, string> = {
  bronze: "text-orange-500",
  silver: "text-gray-300",
  gold: "text-yellow-400",
  cyan: "text-cyan-400",
};

export function TierCards({ selectedTier, onTierSelect, cryptoConnected }: TierCardsProps) {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-pixel text-pixel-green text-sm md:text-base mb-2">
          🎰 PLACE YOUR BET 🎰
        </h2>
        <p className="font-pixel text-pixel-silver text-[10px]">
          HIGHER STAKES = BETTER GEAR
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {GEAR_TIERS.map((tier) => {
          const isSelected = selectedTier === tier.id;
          const discountedPrice = cryptoConnected
            ? tier.price * (1 - tier.cryptoDiscount / 100)
            : tier.price;

          return (
            <button
              key={tier.id}
              onClick={() => onTierSelect?.(tier.id)}
              className={`
                pixel-panel border-4 ${tierStyles[tier.color]}
                ${isSelected ? tierGlows[tier.color] : ""}
                transition-all duration-200 hover:scale-105
                text-left flex flex-col
              `}
            >
              {/* Tier Header */}
              <div className="text-center border-b-2 border-current pb-3 mb-3">
                <h3 className={`font-pixel text-sm ${tierTextColors[tier.color]}`}>
                  {tier.name}
                </h3>
                <p className="font-pixel text-pixel-white text-[10px] mt-1">
                  {tier.description}
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-4">
                {cryptoConnected && (
                  <span className="font-pixel text-pixel-red line-through text-xs">
                    ${tier.price}
                  </span>
                )}
                <div className={`font-pixel text-2xl ${tierTextColors[tier.color]} text-glow`}>
                  ${discountedPrice.toFixed(0)}
                </div>
                {cryptoConnected && (
                  <span className="font-pixel text-pixel-green text-[10px]">
                    {tier.cryptoDiscount}% CRYPTO DISCOUNT
                  </span>
                )}
              </div>

              {/* Items */}
              <div className="flex-grow">
                <ul className="space-y-1">
                  {tier.items.map((item, i) => (
                    <li
                      key={i}
                      className="font-pixel text-[9px] text-pixel-cyan flex items-start gap-2"
                    >
                      <span className="text-pixel-green">►</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Select Button */}
              <div className="mt-4 pt-3 border-t-2 border-pixel-green">
                <div
                  className={`
                    w-full py-2 text-center font-pixel text-xs
                    ${isSelected
                      ? "bg-pixel-green text-pixel-black"
                      : "bg-pixel-black text-pixel-green border-2 border-pixel-green"
                    }
                  `}
                >
                  {isSelected ? "✓ SELECTED" : "SELECT BET"}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Crypto bonus callout */}
      {!cryptoConnected && (
        <div className="mt-6 text-center pixel-panel border-pixel-magenta">
          <p className="font-pixel text-pixel-magenta text-xs animate-pulse">
            💎 CONNECT WALLET FOR UP TO 20% OFF 💎
          </p>
        </div>
      )}
    </div>
  );
}
