"use client";

import { useState, useEffect } from "react";
import { WORLD_CUP_DATE, PREORDER_DEADLINE } from "@/lib/constants";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(WORLD_CUP_DATE));
  const [preorderTimeLeft, setPreorderTimeLeft] = useState<TimeLeft>(
    calculateTimeLeft(PREORDER_DEADLINE)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(WORLD_CUP_DATE));
      setPreorderTimeLeft(calculateTimeLeft(PREORDER_DEADLINE));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Main World Cup Countdown */}
      <div className="pixel-panel text-center">
        <h2 className="font-pixel text-pixel-yellow text-sm md:text-base mb-4 animate-pulse">
          ⚽ WORLD CUP 2026 ⚽
        </h2>

        <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
          <div className="countdown-digit">
            <div>{formatNumber(timeLeft.days)}</div>
            <div className="text-xs mt-2 text-pixel-cyan">DAYS</div>
          </div>
          <div className="countdown-digit">
            <div>{formatNumber(timeLeft.hours)}</div>
            <div className="text-xs mt-2 text-pixel-cyan">HRS</div>
          </div>
          <div className="countdown-digit">
            <div>{formatNumber(timeLeft.minutes)}</div>
            <div className="text-xs mt-2 text-pixel-cyan">MIN</div>
          </div>
          <div className="countdown-digit">
            <div className="animate-blink">{formatNumber(timeLeft.seconds)}</div>
            <div className="text-xs mt-2 text-pixel-cyan">SEC</div>
          </div>
        </div>

        <p className="font-pixel text-pixel-white text-xs mt-4">
          UNTIL KICKOFF IN USA/MEX/CAN
        </p>
      </div>

      {/* Pre-order Deadline Warning */}
      <div className="pixel-panel border-pixel-yellow text-center">
        <h3 className="font-pixel text-pixel-red text-xs md:text-sm mb-2 animate-blink">
          ⚠️ PRE-ORDER DEADLINE ⚠️
        </h3>
        <div className="flex justify-center gap-2 text-pixel-yellow font-pixel text-lg md:text-2xl">
          <span>{preorderTimeLeft.days}D</span>
          <span>:</span>
          <span>{formatNumber(preorderTimeLeft.hours)}H</span>
          <span>:</span>
          <span>{formatNumber(preorderTimeLeft.minutes)}M</span>
        </div>
        <p className="font-pixel text-pixel-silver text-[10px] mt-2">
          ORDER NOW FOR GUARANTEED DELIVERY BEFORE WORLD CUP
        </p>
      </div>
    </div>
  );
}
