export interface TeamData {
  name: string;
  slug: string;
  code: string;
  group: string;
  flag: string;
  primaryColor: [number, number, number];
}

// Grouped per the real 2026 World Cup draw. Slugs/codes/flags/colors are
// stable identities (logos are keyed by slug); only `group` membership
// reflects the draw. Names match groups.ts and ratings.ts exactly.
export const TEAMS: TeamData[] = [
  // Group A
  { name: 'Mexico', slug: 'mexico', code: 'MEX', group: 'A', flag: '🇲🇽', primaryColor: [0.0, 0.39, 0.25] },
  { name: 'South Africa', slug: 'south-africa', code: 'RSA', group: 'A', flag: '🇿🇦', primaryColor: [0.0, 0.53, 0.32] },
  { name: 'South Korea', slug: 'south-korea', code: 'KOR', group: 'A', flag: '🇰🇷', primaryColor: [0.87, 0.16, 0.22] },
  { name: 'Czechia', slug: 'czechia', code: 'CZE', group: 'A', flag: '🇨🇿', primaryColor: [0.85, 0.13, 0.15] },

  // Group B
  { name: 'Canada', slug: 'canada', code: 'CAN', group: 'B', flag: '🇨🇦', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Bosnia', slug: 'bosnia-herzegovina', code: 'BIH', group: 'B', flag: '🇧🇦', primaryColor: [0.0, 0.34, 0.71] },
  { name: 'Qatar', slug: 'qatar', code: 'QAT', group: 'B', flag: '🇶🇦', primaryColor: [0.56, 0.08, 0.18] },
  { name: 'Switzerland', slug: 'switzerland', code: 'SUI', group: 'B', flag: '🇨🇭', primaryColor: [0.87, 0.12, 0.15] },

  // Group C
  { name: 'Brazil', slug: 'brazil', code: 'BRA', group: 'C', flag: '🇧🇷', primaryColor: [1.0, 0.84, 0.0] },
  { name: 'Morocco', slug: 'morocco', code: 'MAR', group: 'C', flag: '🇲🇦', primaryColor: [0.76, 0.12, 0.15] },
  { name: 'Haiti', slug: 'haiti', code: 'HAI', group: 'C', flag: '🇭🇹', primaryColor: [0.0, 0.14, 0.58] },
  { name: 'Scotland', slug: 'scotland', code: 'SCO', group: 'C', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', primaryColor: [0.0, 0.14, 0.47] },

  // Group D
  { name: 'USA', slug: 'united-states', code: 'USA', group: 'D', flag: '🇺🇸', primaryColor: [0.0, 0.14, 0.42] },
  { name: 'Paraguay', slug: 'paraguay', code: 'PAR', group: 'D', flag: '🇵🇾', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Australia', slug: 'australia', code: 'AUS', group: 'D', flag: '🇦🇺', primaryColor: [1.0, 0.84, 0.0] },
  { name: 'Turkey', slug: 'turkiye', code: 'TUR', group: 'D', flag: '🇹🇷', primaryColor: [0.87, 0.12, 0.15] },

  // Group E
  { name: 'Germany', slug: 'germany', code: 'GER', group: 'E', flag: '🇩🇪', primaryColor: [0.0, 0.0, 0.0] },
  { name: 'Curacao', slug: 'curacao', code: 'CUW', group: 'E', flag: '🇨🇼', primaryColor: [0.0, 0.18, 0.52] },
  { name: "Ivory Coast", slug: 'cote-d-ivoire', code: 'CIV', group: 'E', flag: '🇨🇮', primaryColor: [1.0, 0.53, 0.0] },
  { name: 'Ecuador', slug: 'ecuador', code: 'ECU', group: 'E', flag: '🇪🇨', primaryColor: [1.0, 0.84, 0.0] },

  // Group F
  { name: 'Netherlands', slug: 'netherlands', code: 'NED', group: 'F', flag: '🇳🇱', primaryColor: [1.0, 0.47, 0.0] },
  { name: 'Japan', slug: 'japan', code: 'JPN', group: 'F', flag: '🇯🇵', primaryColor: [0.0, 0.14, 0.58] },
  { name: 'Sweden', slug: 'sweden', code: 'SWE', group: 'F', flag: '🇸🇪', primaryColor: [0.0, 0.41, 0.71] },
  { name: 'Tunisia', slug: 'tunisia', code: 'TUN', group: 'F', flag: '🇹🇳', primaryColor: [0.87, 0.12, 0.15] },

  // Group G
  { name: 'Belgium', slug: 'belgium', code: 'BEL', group: 'G', flag: '🇧🇪', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Egypt', slug: 'egypt', code: 'EGY', group: 'G', flag: '🇪🇬', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Iran', slug: 'iran', code: 'IRN', group: 'G', flag: '🇮🇷', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'New Zealand', slug: 'new-zealand', code: 'NZL', group: 'G', flag: '🇳🇿', primaryColor: [0.0, 0.0, 0.0] },

  // Group H
  { name: 'Spain', slug: 'spain', code: 'ESP', group: 'H', flag: '🇪🇸', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Cabo Verde', slug: 'cabo-verde', code: 'CPV', group: 'H', flag: '🇨🇻', primaryColor: [0.0, 0.18, 0.52] },
  { name: 'Saudi Arabia', slug: 'saudi-arabia', code: 'KSA', group: 'H', flag: '🇸🇦', primaryColor: [0.0, 0.44, 0.24] },
  { name: 'Uruguay', slug: 'uruguay', code: 'URU', group: 'H', flag: '🇺🇾', primaryColor: [0.0, 0.31, 0.65] },

  // Group I
  { name: 'France', slug: 'france', code: 'FRA', group: 'I', flag: '🇫🇷', primaryColor: [0.0, 0.14, 0.58] },
  { name: 'Senegal', slug: 'senegal', code: 'SEN', group: 'I', flag: '🇸🇳', primaryColor: [0.0, 0.53, 0.32] },
  { name: 'Iraq', slug: 'iraq', code: 'IRQ', group: 'I', flag: '🇮🇶', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Norway', slug: 'norway', code: 'NOR', group: 'I', flag: '🇳🇴', primaryColor: [0.87, 0.12, 0.15] },

  // Group J
  { name: 'Argentina', slug: 'argentina', code: 'ARG', group: 'J', flag: '🇦🇷', primaryColor: [0.45, 0.72, 0.89] },
  { name: 'Algeria', slug: 'algeria', code: 'ALG', group: 'J', flag: '🇩🇿', primaryColor: [0.0, 0.44, 0.24] },
  { name: 'Austria', slug: 'austria', code: 'AUT', group: 'J', flag: '🇦🇹', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Jordan', slug: 'jordan', code: 'JOR', group: 'J', flag: '🇯🇴', primaryColor: [0.0, 0.44, 0.24] },

  // Group K
  { name: 'Portugal', slug: 'portugal', code: 'POR', group: 'K', flag: '🇵🇹', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Dr Congo', slug: 'dr-congo', code: 'COD', group: 'K', flag: '🇨🇩', primaryColor: [0.16, 0.69, 0.96] },
  { name: 'Uzbekistan', slug: 'uzbekistan', code: 'UZB', group: 'K', flag: '🇺🇿', primaryColor: [0.0, 0.44, 0.73] },
  { name: 'Colombia', slug: 'colombia', code: 'COL', group: 'K', flag: '🇨🇴', primaryColor: [1.0, 0.8, 0.0] },

  // Group L
  { name: 'England', slug: 'england', code: 'ENG', group: 'L', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', primaryColor: [1.0, 1.0, 1.0] },
  { name: 'Croatia', slug: 'croatia', code: 'CRO', group: 'L', flag: '🇭🇷', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Ghana', slug: 'ghana', code: 'GHA', group: 'L', flag: '🇬🇭', primaryColor: [1.0, 0.84, 0.0] },
  { name: 'Panama', slug: 'panama', code: 'PAN', group: 'L', flag: '🇵🇦', primaryColor: [0.87, 0.12, 0.15] },
];

/**
 * A display-safe accent color for a nation, derived from primaryColor.
 * Very dark (e.g. Germany) or near-white (e.g. England) flags have no usable
 * accent, so they fall back to the brand green. Mid-tone colors are lightly
 * lifted so they read on both the dark and light themes.
 */
export function teamAccent(team: TeamData): string {
  const [r, g, b] = team.primaryColor;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lum < 0.16 || lum > 0.9) return 'var(--green)';
  // lift toward a vivid mid-tone for legibility on either background
  const lift = (c: number) => Math.round(Math.min(1, c * 0.78 + 0.22) * 255);
  return `rgb(${lift(r)}, ${lift(g)}, ${lift(b)})`;
}

export function getTeamBySlug(slug: string): TeamData | undefined {
  return TEAMS.find(t => t.slug === slug);
}

export function getTeamByName(name: string): TeamData | undefined {
  return TEAMS.find(t => t.name === name);
}

export function getTeamByCode(code: string): TeamData | undefined {
  return TEAMS.find(t => t.code === code);
}

export function getTeamsByGroup(group: string): TeamData[] {
  return TEAMS.filter(t => t.group === group);
}
