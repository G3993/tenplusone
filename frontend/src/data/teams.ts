export interface TeamData {
  name: string;
  slug: string;
  code: string;
  group: string;
  flag: string;
  primaryColor: [number, number, number];
}

export const TEAMS: TeamData[] = [
  // Group A
  { name: 'Mexico', slug: 'mexico', code: 'MEX', group: 'A', flag: '\u{1F1F2}\u{1F1FD}', primaryColor: [0.0, 0.39, 0.25] },
  { name: 'South Africa', slug: 'south-africa', code: 'RSA', group: 'A', flag: '\u{1F1FF}\u{1F1E6}', primaryColor: [0.0, 0.53, 0.32] },
  { name: 'South Korea', slug: 'south-korea', code: 'KOR', group: 'A', flag: '\u{1F1F0}\u{1F1F7}', primaryColor: [0.87, 0.16, 0.22] },
  { name: 'TBD (UEFA Path D)', slug: 'tbd-uefa-d', code: 'TBD', group: 'A', flag: '\u{1F3F3}\u{FE0F}', primaryColor: [0.5, 0.5, 0.5] },

  // Group B
  { name: 'Canada', slug: 'canada', code: 'CAN', group: 'B', flag: '\u{1F1E8}\u{1F1E6}', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'TBD (UEFA Path A)', slug: 'tbd-uefa-a', code: 'TBD', group: 'B', flag: '\u{1F3F3}\u{FE0F}', primaryColor: [0.5, 0.5, 0.5] },
  { name: 'Switzerland', slug: 'switzerland', code: 'SUI', group: 'B', flag: '\u{1F1E8}\u{1F1ED}', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Qatar', slug: 'qatar', code: 'QAT', group: 'B', flag: '\u{1F1F6}\u{1F1E6}', primaryColor: [0.56, 0.08, 0.18] },

  // Group C
  { name: 'Brazil', slug: 'brazil', code: 'BRA', group: 'C', flag: '\u{1F1E7}\u{1F1F7}', primaryColor: [1.0, 0.84, 0.0] },
  { name: 'Morocco', slug: 'morocco', code: 'MAR', group: 'C', flag: '\u{1F1F2}\u{1F1E6}', primaryColor: [0.76, 0.12, 0.15] },
  { name: 'Haiti', slug: 'haiti', code: 'HAI', group: 'C', flag: '\u{1F1ED}\u{1F1F9}', primaryColor: [0.0, 0.14, 0.58] },
  { name: 'Scotland', slug: 'scotland', code: 'SCO', group: 'C', flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}', primaryColor: [0.0, 0.14, 0.47] },

  // Group D
  { name: 'United States', slug: 'united-states', code: 'USA', group: 'D', flag: '\u{1F1FA}\u{1F1F8}', primaryColor: [0.0, 0.14, 0.42] },
  { name: 'Paraguay', slug: 'paraguay', code: 'PAR', group: 'D', flag: '\u{1F1F5}\u{1F1FE}', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Australia', slug: 'australia', code: 'AUS', group: 'D', flag: '\u{1F1E6}\u{1F1FA}', primaryColor: [1.0, 0.84, 0.0] },
  { name: 'TBD (UEFA Path C)', slug: 'tbd-uefa-c', code: 'TBD', group: 'D', flag: '\u{1F3F3}\u{FE0F}', primaryColor: [0.5, 0.5, 0.5] },

  // Group E
  { name: 'Germany', slug: 'germany', code: 'GER', group: 'E', flag: '\u{1F1E9}\u{1F1EA}', primaryColor: [0.0, 0.0, 0.0] },
  { name: 'Cura\u00e7ao', slug: 'curacao', code: 'CUW', group: 'E', flag: '\u{1F1E8}\u{1F1FC}', primaryColor: [0.0, 0.18, 0.52] },
  { name: "C\u00f4te d'Ivoire", slug: 'cote-d-ivoire', code: 'CIV', group: 'E', flag: '\u{1F1E8}\u{1F1EE}', primaryColor: [1.0, 0.53, 0.0] },
  { name: 'Ecuador', slug: 'ecuador', code: 'ECU', group: 'E', flag: '\u{1F1EA}\u{1F1E8}', primaryColor: [1.0, 0.84, 0.0] },

  // Group F
  { name: 'Netherlands', slug: 'netherlands', code: 'NED', group: 'F', flag: '\u{1F1F3}\u{1F1F1}', primaryColor: [1.0, 0.47, 0.0] },
  { name: 'Japan', slug: 'japan', code: 'JPN', group: 'F', flag: '\u{1F1EF}\u{1F1F5}', primaryColor: [0.0, 0.14, 0.58] },
  { name: 'Tunisia', slug: 'tunisia', code: 'TUN', group: 'F', flag: '\u{1F1F9}\u{1F1F3}', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'TBD (UEFA Path B)', slug: 'tbd-uefa-b', code: 'TBD', group: 'F', flag: '\u{1F3F3}\u{FE0F}', primaryColor: [0.5, 0.5, 0.5] },

  // Group G
  { name: 'Belgium', slug: 'belgium', code: 'BEL', group: 'G', flag: '\u{1F1E7}\u{1F1EA}', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Egypt', slug: 'egypt', code: 'EGY', group: 'G', flag: '\u{1F1EA}\u{1F1EC}', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Iran', slug: 'iran', code: 'IRN', group: 'G', flag: '\u{1F1EE}\u{1F1F7}', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'New Zealand', slug: 'new-zealand', code: 'NZL', group: 'G', flag: '\u{1F1F3}\u{1F1FF}', primaryColor: [0.0, 0.0, 0.0] },

  // Group H
  { name: 'Spain', slug: 'spain', code: 'ESP', group: 'H', flag: '\u{1F1EA}\u{1F1F8}', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Cabo Verde', slug: 'cabo-verde', code: 'CPV', group: 'H', flag: '\u{1F1E8}\u{1F1FB}', primaryColor: [0.0, 0.18, 0.52] },
  { name: 'Saudi Arabia', slug: 'saudi-arabia', code: 'KSA', group: 'H', flag: '\u{1F1F8}\u{1F1E6}', primaryColor: [0.0, 0.44, 0.24] },
  { name: 'Uruguay', slug: 'uruguay', code: 'URU', group: 'H', flag: '\u{1F1FA}\u{1F1FE}', primaryColor: [0.0, 0.31, 0.65] },

  // Group I
  { name: 'France', slug: 'france', code: 'FRA', group: 'I', flag: '\u{1F1EB}\u{1F1F7}', primaryColor: [0.0, 0.14, 0.58] },
  { name: 'Senegal', slug: 'senegal', code: 'SEN', group: 'I', flag: '\u{1F1F8}\u{1F1F3}', primaryColor: [0.0, 0.53, 0.32] },
  { name: 'Norway', slug: 'norway', code: 'NOR', group: 'I', flag: '\u{1F1F3}\u{1F1F4}', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'TBD (IC Playoff 2)', slug: 'tbd-ic-playoff-2', code: 'TBD', group: 'I', flag: '\u{1F3F3}\u{FE0F}', primaryColor: [0.5, 0.5, 0.5] },

  // Group J
  { name: 'Argentina', slug: 'argentina', code: 'ARG', group: 'J', flag: '\u{1F1E6}\u{1F1F7}', primaryColor: [0.45, 0.72, 0.89] },
  { name: 'Algeria', slug: 'algeria', code: 'ALG', group: 'J', flag: '\u{1F1E9}\u{1F1FF}', primaryColor: [0.0, 0.44, 0.24] },
  { name: 'Austria', slug: 'austria', code: 'AUT', group: 'J', flag: '\u{1F1E6}\u{1F1F9}', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Jordan', slug: 'jordan', code: 'JOR', group: 'J', flag: '\u{1F1EF}\u{1F1F4}', primaryColor: [0.0, 0.44, 0.24] },

  // Group K
  { name: 'Portugal', slug: 'portugal', code: 'POR', group: 'K', flag: '\u{1F1F5}\u{1F1F9}', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Colombia', slug: 'colombia', code: 'COL', group: 'K', flag: '\u{1F1E8}\u{1F1F4}', primaryColor: [1.0, 0.8, 0.0] },
  { name: 'Uzbekistan', slug: 'uzbekistan', code: 'UZB', group: 'K', flag: '\u{1F1FA}\u{1F1FF}', primaryColor: [0.0, 0.44, 0.73] },
  { name: 'TBD (IC Playoff 1)', slug: 'tbd-ic-playoff-1', code: 'TBD', group: 'K', flag: '\u{1F3F3}\u{FE0F}', primaryColor: [0.5, 0.5, 0.5] },

  // Group L
  { name: 'England', slug: 'england', code: 'ENG', group: 'L', flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', primaryColor: [1.0, 1.0, 1.0] },
  { name: 'Croatia', slug: 'croatia', code: 'CRO', group: 'L', flag: '\u{1F1ED}\u{1F1F7}', primaryColor: [0.87, 0.12, 0.15] },
  { name: 'Ghana', slug: 'ghana', code: 'GHA', group: 'L', flag: '\u{1F1EC}\u{1F1ED}', primaryColor: [1.0, 0.84, 0.0] },
  { name: 'Panama', slug: 'panama', code: 'PAN', group: 'L', flag: '\u{1F1F5}\u{1F1E6}', primaryColor: [0.87, 0.12, 0.15] },
];

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
