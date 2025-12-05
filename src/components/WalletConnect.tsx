"use client";

import { useState } from "react";

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);

    // Simulated wallet connection - replace with actual RainbowKit/wagmi integration
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock address for demo
    const mockAddress = "0x" + Math.random().toString(16).slice(2, 10) + "...";
    setAddress(mockAddress);
    setIsConnected(true);
    setIsConnecting(false);
    onConnect?.(mockAddress);
  };

  const handleDisconnect = () => {
    setAddress(null);
    setIsConnected(false);
    onDisconnect?.();
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 13) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="pixel-panel border-pixel-magenta">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-pixel text-pixel-magenta text-xs mb-1">
            💎 CRYPTO BONUS
          </h3>
          <p className="font-pixel text-pixel-silver text-[9px]">
            {isConnected
              ? "WALLET CONNECTED - DISCOUNTS ACTIVE"
              : "CONNECT FOR UP TO 20% OFF"}
          </p>
        </div>

        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={`
              pixel-btn bg-pixel-magenta text-pixel-white
              ${isConnecting ? "animate-pulse" : ""}
            `}
          >
            {isConnecting ? (
              <span className="animate-blink">CONNECTING...</span>
            ) : (
              "CONNECT WALLET"
            )}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="pixel-panel border-pixel-green py-2 px-3">
              <span className="font-pixel text-pixel-green text-xs">
                {truncateAddress(address || "")}
              </span>
            </div>
            <button
              onClick={handleDisconnect}
              className="pixel-btn bg-pixel-red text-pixel-white text-xs py-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Bonus breakdown */}
      {isConnected && (
        <div className="mt-4 pt-4 border-t-2 border-pixel-magenta/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
            <div>
              <span className="font-pixel text-orange-500 text-[10px]">BRONZE</span>
              <div className="font-pixel text-pixel-green text-xs">5% OFF</div>
            </div>
            <div>
              <span className="font-pixel text-gray-400 text-[10px]">SILVER</span>
              <div className="font-pixel text-pixel-green text-xs">10% OFF</div>
            </div>
            <div>
              <span className="font-pixel text-yellow-400 text-[10px]">GOLD</span>
              <div className="font-pixel text-pixel-green text-xs">15% OFF</div>
            </div>
            <div>
              <span className="font-pixel text-cyan-400 text-[10px]">DIAMOND</span>
              <div className="font-pixel text-pixel-green text-xs">20% OFF</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
