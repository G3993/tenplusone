// World Cup 2026 - June 11, 2026 (Opening match)
export const WORLD_CUP_DATE = new Date("2026-06-11T00:00:00Z");

// Pre-order deadline (3 months before for production + shipping)
export const PREORDER_DEADLINE = new Date("2026-03-11T23:59:59Z");

// All 48 teams for World Cup 2026 (expanded format)
export const WORLD_CUP_TEAMS = [
  // Group A-L (48 teams in 12 groups)
  { code: "USA", name: "United States", emoji: "🇺🇸", group: "A" },
  { code: "MEX", name: "Mexico", emoji: "🇲🇽", group: "A" },
  { code: "CAN", name: "Canada", emoji: "🇨🇦", group: "A" },
  { code: "ARG", name: "Argentina", emoji: "🇦🇷", group: "B" },
  { code: "BRA", name: "Brazil", emoji: "🇧🇷", group: "B" },
  { code: "COL", name: "Colombia", emoji: "🇨🇴", group: "B" },
  { code: "URU", name: "Uruguay", emoji: "🇺🇾", group: "B" },
  { code: "FRA", name: "France", emoji: "🇫🇷", group: "C" },
  { code: "GER", name: "Germany", emoji: "🇩🇪", group: "C" },
  { code: "ESP", name: "Spain", emoji: "🇪🇸", group: "C" },
  { code: "ENG", name: "England", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "D" },
  { code: "NED", name: "Netherlands", emoji: "🇳🇱", group: "D" },
  { code: "BEL", name: "Belgium", emoji: "🇧🇪", group: "D" },
  { code: "POR", name: "Portugal", emoji: "🇵🇹", group: "E" },
  { code: "ITA", name: "Italy", emoji: "🇮🇹", group: "E" },
  { code: "CRO", name: "Croatia", emoji: "🇭🇷", group: "E" },
  { code: "DEN", name: "Denmark", emoji: "🇩🇰", group: "F" },
  { code: "SUI", name: "Switzerland", emoji: "🇨🇭", group: "F" },
  { code: "AUT", name: "Austria", emoji: "🇦🇹", group: "F" },
  { code: "POL", name: "Poland", emoji: "🇵🇱", group: "G" },
  { code: "SRB", name: "Serbia", emoji: "🇷🇸", group: "G" },
  { code: "UKR", name: "Ukraine", emoji: "🇺🇦", group: "G" },
  { code: "JPN", name: "Japan", emoji: "🇯🇵", group: "H" },
  { code: "KOR", name: "South Korea", emoji: "🇰🇷", group: "H" },
  { code: "AUS", name: "Australia", emoji: "🇦🇺", group: "H" },
  { code: "IRN", name: "Iran", emoji: "🇮🇷", group: "I" },
  { code: "KSA", name: "Saudi Arabia", emoji: "🇸🇦", group: "I" },
  { code: "QAT", name: "Qatar", emoji: "🇶🇦", group: "I" },
  { code: "MAR", name: "Morocco", emoji: "🇲🇦", group: "J" },
  { code: "SEN", name: "Senegal", emoji: "🇸🇳", group: "J" },
  { code: "NGA", name: "Nigeria", emoji: "🇳🇬", group: "J" },
  { code: "GHA", name: "Ghana", emoji: "🇬🇭", group: "J" },
  { code: "EGY", name: "Egypt", emoji: "🇪🇬", group: "K" },
  { code: "CMR", name: "Cameroon", emoji: "🇨🇲", group: "K" },
  { code: "CIV", name: "Ivory Coast", emoji: "🇨🇮", group: "K" },
  { code: "TUN", name: "Tunisia", emoji: "🇹🇳", group: "K" },
  { code: "ECU", name: "Ecuador", emoji: "🇪🇨", group: "L" },
  { code: "CHI", name: "Chile", emoji: "🇨🇱", group: "L" },
  { code: "PER", name: "Peru", emoji: "🇵🇪", group: "L" },
  { code: "PAR", name: "Paraguay", emoji: "🇵🇾", group: "L" },
  { code: "WAL", name: "Wales", emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", group: "M" },
  { code: "SCO", name: "Scotland", emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "M" },
  { code: "CZE", name: "Czech Republic", emoji: "🇨🇿", group: "M" },
  { code: "SWE", name: "Sweden", emoji: "🇸🇪", group: "M" },
  { code: "NOR", name: "Norway", emoji: "🇳🇴", group: "N" },
  { code: "TUR", name: "Turkey", emoji: "🇹🇷", group: "N" },
  { code: "GRE", name: "Greece", emoji: "🇬🇷", group: "N" },
  { code: "CRC", name: "Costa Rica", emoji: "🇨🇷", group: "N" },
];

// Gear tiers with "bet" levels
export const GEAR_TIERS = [
  {
    id: "bronze",
    name: "BRONZE BET",
    price: 29,
    description: "Basic Fan Kit",
    items: ["Team Sticker Pack", "Digital Wallpaper", "Basic Tee"],
    color: "orange",
    cryptoDiscount: 5,
  },
  {
    id: "silver",
    name: "SILVER BET",
    price: 79,
    description: "True Supporter Kit",
    items: ["Team Jersey Replica", "Scarf", "Pin Set", "All Bronze Items"],
    color: "silver",
    cryptoDiscount: 10,
  },
  {
    id: "gold",
    name: "GOLD BET",
    price: 149,
    description: "Ultimate Fan Package",
    items: ["Premium Jersey", "Jacket", "Cap", "Full Accessory Set", "All Silver Items"],
    color: "gold",
    cryptoDiscount: 15,
  },
  {
    id: "diamond",
    name: "DIAMOND BET",
    price: 299,
    description: "VIP Superfan Bundle",
    items: ["Limited Edition Jersey", "Full Kit", "Signed Memorabilia", "Exclusive NFT", "All Gold Items"],
    color: "cyan",
    cryptoDiscount: 20,
  },
];

// Winner discount (for the betting feature)
export const WINNER_DISCOUNT = 50; // 50% off if your team wins!
