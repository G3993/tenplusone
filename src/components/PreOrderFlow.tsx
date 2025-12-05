"use client";

import { useState } from "react";
import { WORLD_CUP_TEAMS, GEAR_TIERS, PREORDER_DEADLINE, WINNER_DISCOUNT } from "@/lib/constants";

interface PreOrderFlowProps {
  selectedTeam: string | null;
  selectedTier: string | null;
  cryptoConnected: boolean;
  onClose?: () => void;
}

export function PreOrderFlow({
  selectedTeam,
  selectedTier,
  cryptoConnected,
  onClose,
}: PreOrderFlowProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const team = WORLD_CUP_TEAMS.find((t) => t.code === selectedTeam);
  const tier = GEAR_TIERS.find((t) => t.id === selectedTier);

  if (!team || !tier) {
    return null;
  }

  const basePrice = tier.price;
  const cryptoDiscount = cryptoConnected ? tier.cryptoDiscount : 0;
  const finalPrice = basePrice * (1 - cryptoDiscount / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-pixel-black/90 z-50 flex items-center justify-center p-4">
        <div className="pixel-panel border-pixel-green max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="font-pixel text-pixel-green text-base mb-4">
            PRE-ORDER CONFIRMED!
          </h2>
          <p className="font-pixel text-pixel-cyan text-xs mb-4">
            CHECK YOUR EMAIL FOR CONFIRMATION
          </p>

          <div className="pixel-panel border-pixel-yellow mb-4">
            <p className="font-pixel text-pixel-yellow text-[10px]">
              🎰 REMEMBER: IF {team.name.toUpperCase()} WINS THE WORLD CUP,
              YOU GET {WINNER_DISCOUNT}% REFUND! 🎰
            </p>
          </div>

          <div className="space-y-2 text-left mb-6">
            <div className="flex justify-between font-pixel text-xs">
              <span className="text-pixel-silver">TEAM:</span>
              <span className="text-pixel-white">{team.emoji} {team.name}</span>
            </div>
            <div className="flex justify-between font-pixel text-xs">
              <span className="text-pixel-silver">TIER:</span>
              <span className="text-pixel-white">{tier.name}</span>
            </div>
            <div className="flex justify-between font-pixel text-xs">
              <span className="text-pixel-silver">TOTAL:</span>
              <span className="text-pixel-green">${finalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button onClick={onClose} className="pixel-btn w-full">
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-pixel-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="pixel-panel border-pixel-cyan max-w-lg w-full my-8">
        <div className="flex justify-between items-start mb-6">
          <h2 className="font-pixel text-pixel-cyan text-sm">
            🛒 PRE-ORDER CHECKOUT
          </h2>
          <button
            onClick={onClose}
            className="font-pixel text-pixel-red hover:text-pixel-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Order Summary */}
        <div className="pixel-panel border-pixel-green mb-6">
          <h3 className="font-pixel text-pixel-green text-xs mb-4">ORDER SUMMARY</h3>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{team.emoji}</span>
            <div>
              <p className="font-pixel text-pixel-white text-sm">{team.name.toUpperCase()}</p>
              <p className="font-pixel text-pixel-silver text-[10px]">YOUR TEAM BET</p>
            </div>
          </div>

          <div className="border-t-2 border-pixel-green/50 pt-4 space-y-2">
            <div className="flex justify-between font-pixel text-xs">
              <span className="text-pixel-silver">{tier.name}</span>
              <span className="text-pixel-white">${basePrice.toFixed(2)}</span>
            </div>

            {cryptoConnected && (
              <div className="flex justify-between font-pixel text-xs">
                <span className="text-pixel-magenta">CRYPTO DISCOUNT ({cryptoDiscount}%)</span>
                <span className="text-pixel-green">-${(basePrice * cryptoDiscount / 100).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-pixel text-sm pt-2 border-t border-pixel-green/50">
              <span className="text-pixel-yellow">TOTAL</span>
              <span className="text-pixel-green text-glow">${finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Win Bonus Info */}
        <div className="pixel-panel border-pixel-gold mb-6">
          <p className="font-pixel text-pixel-gold text-[10px] text-center animate-pulse">
            🏆 IF {team.name.toUpperCase()} WINS THE WORLD CUP: 🏆
          </p>
          <p className="font-pixel text-pixel-white text-center text-lg mt-2">
            {WINNER_DISCOUNT}% REFUND!
          </p>
          <p className="font-pixel text-pixel-silver text-[9px] text-center mt-2">
            THAT&apos;S ONLY ${(finalPrice * 0.5).toFixed(2)} FOR YOUR GEAR!
          </p>
        </div>

        {/* Production Timeline */}
        <div className="pixel-panel border-pixel-silver mb-6">
          <h3 className="font-pixel text-pixel-silver text-xs mb-3">
            📦 PRODUCTION TIMELINE
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-pixel text-[10px]">
              <span className="text-pixel-green">✓</span>
              <span className="text-pixel-white">ORDER CONFIRMED</span>
              <span className="text-pixel-silver ml-auto">TODAY</span>
            </div>
            <div className="flex items-center gap-2 font-pixel text-[10px]">
              <span className="text-pixel-yellow">○</span>
              <span className="text-pixel-white">PRODUCTION STARTS</span>
              <span className="text-pixel-silver ml-auto">+2 WEEKS</span>
            </div>
            <div className="flex items-center gap-2 font-pixel text-[10px]">
              <span className="text-pixel-yellow">○</span>
              <span className="text-pixel-white">QUALITY CHECK</span>
              <span className="text-pixel-silver ml-auto">+6 WEEKS</span>
            </div>
            <div className="flex items-center gap-2 font-pixel text-[10px]">
              <span className="text-pixel-yellow">○</span>
              <span className="text-pixel-white">SHIPPED TO YOU</span>
              <span className="text-pixel-silver ml-auto">+8 WEEKS</span>
            </div>
            <div className="flex items-center gap-2 font-pixel text-[10px]">
              <span className="text-pixel-cyan">★</span>
              <span className="text-pixel-cyan">ARRIVES BEFORE WORLD CUP</span>
              <span className="text-pixel-green ml-auto">GUARANTEED</span>
            </div>
          </div>
        </div>

        {/* Pre-order Deadline */}
        <div className="pixel-panel border-pixel-red mb-6">
          <p className="font-pixel text-pixel-red text-[10px] text-center">
            ⚠️ PRE-ORDER DEADLINE: {PREORDER_DEADLINE.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }).toUpperCase()}
          </p>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="font-pixel text-pixel-cyan text-xs block mb-2">
              EMAIL FOR CONFIRMATION:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full bg-pixel-black border-4 border-pixel-cyan p-3
                       font-pixel text-pixel-white text-sm
                       focus:outline-none focus:border-pixel-green
                       placeholder:text-pixel-silver/50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email}
            className={`
              pixel-btn-gold w-full text-sm
              ${isSubmitting ? "animate-pulse" : ""}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isSubmitting ? (
              <span className="animate-blink">PROCESSING...</span>
            ) : (
              `PRE-ORDER NOW - $${finalPrice.toFixed(2)}`
            )}
          </button>

          <p className="font-pixel text-pixel-silver text-[8px] text-center mt-4">
            BY PRE-ORDERING YOU AGREE TO OUR TERMS. PAYMENT PROCESSED VIA SHOPIFY.
          </p>
        </form>
      </div>
    </div>
  );
}
