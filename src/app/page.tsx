"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Countdown } from "@/components/Countdown";
import { TeamGrid } from "@/components/TeamGrid";
import { TierCards } from "@/components/TierCards";
import { WalletConnect } from "@/components/WalletConnect";
import { PreOrderFlow } from "@/components/PreOrderFlow";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [cryptoConnected, setCryptoConnected] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const canCheckout = selectedTeam && selectedTier;

  const handleCheckout = () => {
    if (canCheckout) {
      setShowCheckout(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="font-pixel text-pixel-green text-xl md:text-3xl mb-4 text-glow">
              TEN PLUS ONE
            </h1>
            <p className="font-pixel text-pixel-cyan text-sm md:text-base mb-2">
              INTERNET SOCCER CLUB
            </p>
            <p className="font-pixel text-pixel-yellow text-xs animate-pulse">
              🎰 BET ON YOUR TEAM • WIN = 50% OFF 🎰
            </p>
          </div>

          {/* Countdown */}
          <Countdown />
        </section>

        {/* Team Selection */}
        <section id="teams" className="container mx-auto px-4 py-12">
          <TeamGrid
            selectedTeam={selectedTeam}
            onTeamSelect={setSelectedTeam}
          />
        </section>

        {/* Wallet Connect */}
        <section className="container mx-auto px-4 py-8 max-w-4xl">
          <WalletConnect
            onConnect={() => setCryptoConnected(true)}
            onDisconnect={() => setCryptoConnected(false)}
          />
        </section>

        {/* Tier Selection */}
        <section id="gear" className="container mx-auto px-4 py-12">
          <TierCards
            selectedTier={selectedTier}
            onTierSelect={setSelectedTier}
            cryptoConnected={cryptoConnected}
          />
        </section>

        {/* Checkout Button */}
        {canCheckout && (
          <section className="container mx-auto px-4 py-8 max-w-md">
            <button
              onClick={handleCheckout}
              className="pixel-btn-gold w-full text-lg py-4 animate-pulse90s"
            >
              🛒 PRE-ORDER NOW
            </button>
          </section>
        )}

        {/* How It Works */}
        <section className="container mx-auto px-4 py-12">
          <HowItWorks />
        </section>
      </main>

      <Footer />

      {/* Checkout Modal */}
      {showCheckout && (
        <PreOrderFlow
          selectedTeam={selectedTeam}
          selectedTier={selectedTier}
          cryptoConnected={cryptoConnected}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
