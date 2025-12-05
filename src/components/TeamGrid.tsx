"use client";

import { useState } from "react";
import { WORLD_CUP_TEAMS } from "@/lib/constants";

interface TeamGridProps {
  onTeamSelect?: (teamCode: string) => void;
  selectedTeam?: string | null;
}

export function TeamGrid({ onTeamSelect, selectedTeam }: TeamGridProps) {
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);

  // Group teams by their group letter
  const groupedTeams = WORLD_CUP_TEAMS.reduce((acc, team) => {
    if (!acc[team.group]) {
      acc[team.group] = [];
    }
    acc[team.group].push(team);
    return acc;
  }, {} as Record<string, typeof WORLD_CUP_TEAMS>);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="pixel-panel">
        <h2 className="font-pixel text-pixel-green text-center text-sm md:text-base mb-6">
          🏆 SELECT YOUR TEAM 🏆
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {WORLD_CUP_TEAMS.map((team) => (
            <button
              key={team.code}
              onClick={() => onTeamSelect?.(team.code)}
              onMouseEnter={() => setHoveredTeam(team.code)}
              onMouseLeave={() => setHoveredTeam(null)}
              className={`
                team-flag
                ${selectedTeam === team.code ? "selected" : ""}
                ${hoveredTeam === team.code ? "bg-pixel-green/20" : "bg-pixel-black"}
              `}
              title={team.name}
            >
              <span className="text-3xl">{team.emoji}</span>
            </button>
          ))}
        </div>

        {/* Selected team display */}
        {selectedTeam && (
          <div className="mt-6 text-center border-t-4 border-pixel-green pt-4">
            <p className="font-pixel text-pixel-cyan text-xs mb-2">YOUR TEAM:</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-5xl">
                {WORLD_CUP_TEAMS.find((t) => t.code === selectedTeam)?.emoji}
              </span>
              <span className="font-pixel text-pixel-yellow text-lg">
                {WORLD_CUP_TEAMS.find((t) => t.code === selectedTeam)?.name.toUpperCase()}
              </span>
            </div>
            <p className="font-pixel text-pixel-magenta text-[10px] mt-4 animate-pulse">
              🎰 IF {WORLD_CUP_TEAMS.find((t) => t.code === selectedTeam)?.name.toUpperCase()} WINS, YOU GET 50% OFF! 🎰
            </p>
          </div>
        )}

        {!selectedTeam && (
          <p className="font-pixel text-pixel-silver text-center text-[10px] mt-4">
            CLICK A FLAG TO PLACE YOUR BET
          </p>
        )}
      </div>
    </div>
  );
}
