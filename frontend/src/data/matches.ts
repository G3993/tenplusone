import { projectOdds } from '../lib/ratings';

export interface Match {
  id: string;
  /** Display date, e.g. "Jun 11". */
  d: string;
  /** Local kickoff as an ISO-ish string, e.g. "2026-06-11T13:00". */
  iso: string;
  /** Group letter A–L, or knockout round (R32/R16/QF/SF/3rd/F). */
  grp: string;
  /** Home team name, or bracket slot for knockouts (e.g. "1A", "W74"). */
  h: string;
  /** Away team name, or bracket slot. */
  a: string;
  /** Local kickoff time + zone, e.g. "13:00 CST". */
  t: string;
  /** Venue, e.g. "Estadio Azteca · Mexico City". */
  v: string;
  city: string;
  /**
   * Projected 1X2 decimal odds [home, draw, away]. Derived from a team
   * strength model (see lib/ratings) until a live market prices the game;
   * the UI labels these as a projection. Knockout slots use neutral odds.
   */
  odds: [number, number, number];
}

// Official 2026 FIFA World Cup schedule (FIFA media release + cross-checked
// sources). Each row: [matchNo, group, home, away, MM-DD, kickoff, tz, venue, city].
// All times are STADIUM-LOCAL (Mexican venues are CST/UTC-6 — no DST).
type Row = [number, string, string, string, string, string, string, string, string];

const GROUP_STAGE: Row[] = [
  [1, 'A', 'Mexico', 'South Africa', '06-11', '13:00', 'CST', 'Estadio Azteca', 'Mexico City'],
  [2, 'A', 'South Korea', 'Czechia', '06-11', '20:00', 'CST', 'Estadio Akron', 'Guadalajara'],
  [3, 'B', 'Canada', 'Bosnia', '06-12', '15:00', 'EDT', 'BMO Field', 'Toronto'],
  [4, 'D', 'USA', 'Paraguay', '06-12', '18:00', 'PDT', 'SoFi Stadium', 'Los Angeles'],
  [5, 'B', 'Qatar', 'Switzerland', '06-13', '12:00', 'PDT', "Levi's Stadium", 'San Francisco'],
  [6, 'C', 'Brazil', 'Morocco', '06-13', '18:00', 'EDT', 'MetLife Stadium', 'New York'],
  [7, 'C', 'Haiti', 'Scotland', '06-13', '21:00', 'EDT', 'Gillette Stadium', 'Boston'],
  [8, 'D', 'Australia', 'Turkey', '06-13', '18:00', 'PDT', 'BC Place', 'Vancouver'],
  [9, 'E', 'Germany', 'Curacao', '06-14', '12:00', 'CDT', 'NRG Stadium', 'Houston'],
  [10, 'F', 'Netherlands', 'Japan', '06-14', '15:00', 'CDT', 'AT&T Stadium', 'Dallas'],
  [11, 'E', 'Ivory Coast', 'Ecuador', '06-14', '19:00', 'EDT', 'Lincoln Financial Field', 'Philadelphia'],
  [12, 'F', 'Sweden', 'Tunisia', '06-14', '20:00', 'CST', 'Estadio BBVA', 'Monterrey'],
  [13, 'H', 'Spain', 'Cabo Verde', '06-15', '12:00', 'EDT', 'Mercedes-Benz Stadium', 'Atlanta'],
  [14, 'G', 'Belgium', 'Egypt', '06-15', '12:00', 'PDT', 'BC Place', 'Vancouver'],
  [15, 'H', 'Saudi Arabia', 'Uruguay', '06-15', '18:00', 'EDT', 'Hard Rock Stadium', 'Miami'],
  [16, 'G', 'Iran', 'New Zealand', '06-15', '18:00', 'PDT', 'SoFi Stadium', 'Los Angeles'],
  [17, 'I', 'France', 'Senegal', '06-16', '15:00', 'EDT', 'MetLife Stadium', 'New York'],
  [18, 'I', 'Iraq', 'Norway', '06-16', '18:00', 'EDT', 'Gillette Stadium', 'Boston'],
  [19, 'J', 'Argentina', 'Algeria', '06-16', '20:00', 'CDT', 'Arrowhead Stadium', 'Kansas City'],
  [20, 'J', 'Austria', 'Jordan', '06-16', '21:00', 'PDT', "Levi's Stadium", 'San Francisco'],
  [21, 'K', 'Portugal', 'Dr Congo', '06-17', '12:00', 'CDT', 'NRG Stadium', 'Houston'],
  [22, 'L', 'England', 'Croatia', '06-17', '15:00', 'CDT', 'AT&T Stadium', 'Dallas'],
  [23, 'L', 'Ghana', 'Panama', '06-17', '19:00', 'EDT', 'BMO Field', 'Toronto'],
  [24, 'K', 'Uzbekistan', 'Colombia', '06-17', '20:00', 'CST', 'Estadio Azteca', 'Mexico City'],
  [25, 'A', 'Czechia', 'South Africa', '06-18', '12:00', 'EDT', 'Mercedes-Benz Stadium', 'Atlanta'],
  [26, 'B', 'Switzerland', 'Bosnia', '06-18', '12:00', 'PDT', 'SoFi Stadium', 'Los Angeles'],
  [27, 'B', 'Canada', 'Qatar', '06-18', '15:00', 'PDT', 'BC Place', 'Vancouver'],
  [28, 'A', 'Mexico', 'South Korea', '06-18', '20:00', 'CST', 'Estadio Akron', 'Guadalajara'],
  [29, 'D', 'USA', 'Australia', '06-19', '12:00', 'PDT', 'Lumen Field', 'Seattle'],
  [30, 'C', 'Scotland', 'Morocco', '06-19', '18:00', 'EDT', 'Gillette Stadium', 'Boston'],
  [31, 'C', 'Brazil', 'Haiti', '06-19', '21:00', 'EDT', 'Lincoln Financial Field', 'Philadelphia'],
  [32, 'D', 'Turkey', 'Paraguay', '06-19', '21:00', 'PDT', "Levi's Stadium", 'San Francisco'],
  [33, 'F', 'Netherlands', 'Sweden', '06-20', '12:00', 'CDT', 'NRG Stadium', 'Houston'],
  [34, 'E', 'Germany', 'Ivory Coast', '06-20', '16:00', 'EDT', 'BMO Field', 'Toronto'],
  [35, 'E', 'Ecuador', 'Curacao', '06-20', '19:00', 'CDT', 'Arrowhead Stadium', 'Kansas City'],
  [36, 'F', 'Tunisia', 'Japan', '06-20', '22:00', 'CST', 'Estadio BBVA', 'Monterrey'],
  [37, 'H', 'Spain', 'Saudi Arabia', '06-21', '12:00', 'EDT', 'Mercedes-Benz Stadium', 'Atlanta'],
  [38, 'G', 'Belgium', 'Iran', '06-21', '12:00', 'PDT', 'SoFi Stadium', 'Los Angeles'],
  [39, 'H', 'Uruguay', 'Cabo Verde', '06-21', '18:00', 'EDT', 'Hard Rock Stadium', 'Miami'],
  [40, 'G', 'New Zealand', 'Egypt', '06-21', '18:00', 'PDT', 'BC Place', 'Vancouver'],
  [41, 'J', 'Argentina', 'Austria', '06-22', '12:00', 'CDT', 'AT&T Stadium', 'Dallas'],
  [42, 'I', 'France', 'Iraq', '06-22', '17:00', 'EDT', 'Lincoln Financial Field', 'Philadelphia'],
  [43, 'I', 'Norway', 'Senegal', '06-22', '20:00', 'EDT', 'MetLife Stadium', 'New York'],
  [44, 'J', 'Jordan', 'Algeria', '06-22', '20:00', 'PDT', "Levi's Stadium", 'San Francisco'],
  [45, 'K', 'Portugal', 'Uzbekistan', '06-23', '12:00', 'CDT', 'NRG Stadium', 'Houston'],
  [46, 'L', 'England', 'Ghana', '06-23', '16:00', 'EDT', 'Gillette Stadium', 'Boston'],
  [47, 'L', 'Panama', 'Croatia', '06-23', '19:00', 'EDT', 'BMO Field', 'Toronto'],
  [48, 'K', 'Colombia', 'Dr Congo', '06-23', '20:00', 'CST', 'Estadio Akron', 'Guadalajara'],
  [49, 'B', 'Switzerland', 'Canada', '06-24', '12:00', 'PDT', 'BC Place', 'Vancouver'],
  [50, 'B', 'Bosnia', 'Qatar', '06-24', '12:00', 'PDT', 'Lumen Field', 'Seattle'],
  [51, 'C', 'Scotland', 'Brazil', '06-24', '18:00', 'EDT', 'Hard Rock Stadium', 'Miami'],
  [52, 'C', 'Morocco', 'Haiti', '06-24', '18:00', 'EDT', 'Mercedes-Benz Stadium', 'Atlanta'],
  [53, 'A', 'Czechia', 'Mexico', '06-24', '20:00', 'CST', 'Estadio Azteca', 'Mexico City'],
  [54, 'A', 'South Africa', 'South Korea', '06-24', '20:00', 'CST', 'Estadio BBVA', 'Monterrey'],
  [55, 'E', 'Ecuador', 'Germany', '06-25', '16:00', 'EDT', 'MetLife Stadium', 'New York'],
  [56, 'E', 'Curacao', 'Ivory Coast', '06-25', '16:00', 'EDT', 'Lincoln Financial Field', 'Philadelphia'],
  [57, 'F', 'Japan', 'Sweden', '06-25', '18:00', 'CDT', 'AT&T Stadium', 'Dallas'],
  [58, 'F', 'Tunisia', 'Netherlands', '06-25', '18:00', 'CDT', 'Arrowhead Stadium', 'Kansas City'],
  [59, 'D', 'Turkey', 'USA', '06-25', '19:00', 'PDT', 'SoFi Stadium', 'Los Angeles'],
  [60, 'D', 'Paraguay', 'Australia', '06-25', '19:00', 'PDT', "Levi's Stadium", 'San Francisco'],
  [61, 'I', 'Norway', 'France', '06-26', '15:00', 'EDT', 'Gillette Stadium', 'Boston'],
  [62, 'I', 'Senegal', 'Iraq', '06-26', '15:00', 'EDT', 'BMO Field', 'Toronto'],
  [63, 'H', 'Cabo Verde', 'Saudi Arabia', '06-26', '19:00', 'CDT', 'NRG Stadium', 'Houston'],
  [64, 'H', 'Uruguay', 'Spain', '06-26', '19:00', 'CST', 'Estadio Akron', 'Guadalajara'],
  [65, 'G', 'Egypt', 'Iran', '06-26', '20:00', 'PDT', 'Lumen Field', 'Seattle'],
  [66, 'G', 'New Zealand', 'Belgium', '06-26', '20:00', 'PDT', 'BC Place', 'Vancouver'],
  [67, 'L', 'Panama', 'England', '06-27', '17:00', 'EDT', 'MetLife Stadium', 'New York'],
  [68, 'L', 'Croatia', 'Ghana', '06-27', '17:00', 'EDT', 'Lincoln Financial Field', 'Philadelphia'],
  [69, 'K', 'Colombia', 'Portugal', '06-27', '19:30', 'EDT', 'Hard Rock Stadium', 'Miami'],
  [70, 'K', 'Dr Congo', 'Uzbekistan', '06-27', '19:30', 'EDT', 'Mercedes-Benz Stadium', 'Atlanta'],
  [71, 'J', 'Algeria', 'Austria', '06-27', '21:00', 'CDT', 'Arrowhead Stadium', 'Kansas City'],
  [72, 'J', 'Jordan', 'Argentina', '06-27', '21:00', 'CDT', 'AT&T Stadium', 'Dallas'],
];

// Knockout rounds. Home/away are FIFA bracket slot labels (resolve after the
// group stage). Third-place opponents use FIFA's combination labels.
const KNOCKOUT: Row[] = [
  [73, 'R32', '2A', '2B', '06-28', '12:00', 'PDT', 'SoFi Stadium', 'Los Angeles'],
  [74, 'R32', '1E', '3A/B/C/D/F', '06-29', '16:30', 'EDT', 'Gillette Stadium', 'Boston'],
  [75, 'R32', '1F', '2C', '06-29', '18:00', 'CST', 'Estadio BBVA', 'Monterrey'],
  [76, 'R32', '1C', '2F', '06-29', '12:00', 'CDT', 'NRG Stadium', 'Houston'],
  [77, 'R32', '1I', '3C/D/F/G/H', '06-30', '17:00', 'EDT', 'MetLife Stadium', 'New York'],
  [78, 'R32', '2E', '2I', '06-30', '12:00', 'CDT', 'AT&T Stadium', 'Dallas'],
  [79, 'R32', '1A', '3C/E/F/H/I', '06-30', '19:00', 'CST', 'Estadio Azteca', 'Mexico City'],
  [80, 'R32', '1L', '3E/H/I/J/K', '07-01', '12:00', 'EDT', 'Mercedes-Benz Stadium', 'Atlanta'],
  [81, 'R32', '1D', '3B/E/F/I/J', '07-01', '17:00', 'PDT', "Levi's Stadium", 'San Francisco'],
  [82, 'R32', '1G', '3A/E/H/I/J', '07-01', '13:00', 'PDT', 'Lumen Field', 'Seattle'],
  [83, 'R32', '2K', '2L', '07-02', '19:00', 'EDT', 'BMO Field', 'Toronto'],
  [84, 'R32', '1H', '2J', '07-02', '12:00', 'PDT', 'SoFi Stadium', 'Los Angeles'],
  [85, 'R32', '1B', '3E/F/G/I/J', '07-02', '17:00', 'PDT', 'BC Place', 'Vancouver'],
  [86, 'R32', '1J', '2H', '07-03', '18:00', 'EDT', 'Hard Rock Stadium', 'Miami'],
  [87, 'R32', '1K', '3D/E/I/J/L', '07-03', '19:30', 'CDT', 'Arrowhead Stadium', 'Kansas City'],
  [88, 'R32', '2D', '2G', '07-03', '12:00', 'CDT', 'AT&T Stadium', 'Dallas'],
  [89, 'R16', 'W74', 'W77', '07-04', '17:00', 'EDT', 'Lincoln Financial Field', 'Philadelphia'],
  [90, 'R16', 'W73', 'W75', '07-04', '12:00', 'CDT', 'NRG Stadium', 'Houston'],
  [91, 'R16', 'W76', 'W78', '07-05', '16:00', 'EDT', 'MetLife Stadium', 'New York'],
  [92, 'R16', 'W79', 'W80', '07-05', '18:00', 'CST', 'Estadio Azteca', 'Mexico City'],
  [93, 'R16', 'W83', 'W84', '07-06', '14:00', 'CDT', 'AT&T Stadium', 'Dallas'],
  [94, 'R16', 'W81', 'W82', '07-06', '17:00', 'PDT', 'Lumen Field', 'Seattle'],
  [95, 'R16', 'W86', 'W88', '07-07', '12:00', 'EDT', 'Mercedes-Benz Stadium', 'Atlanta'],
  [96, 'R16', 'W85', 'W87', '07-07', '13:00', 'PDT', 'BC Place', 'Vancouver'],
  [97, 'QF', 'W89', 'W90', '07-09', '16:00', 'EDT', 'Gillette Stadium', 'Boston'],
  [98, 'QF', 'W93', 'W94', '07-10', '12:00', 'PDT', 'SoFi Stadium', 'Los Angeles'],
  [99, 'QF', 'W91', 'W92', '07-11', '17:00', 'EDT', 'Hard Rock Stadium', 'Miami'],
  [100, 'QF', 'W95', 'W96', '07-11', '20:00', 'CDT', 'Arrowhead Stadium', 'Kansas City'],
  [101, 'SF', 'W97', 'W98', '07-14', '14:00', 'CDT', 'AT&T Stadium', 'Dallas'],
  [102, 'SF', 'W99', 'W100', '07-15', '15:00', 'EDT', 'Mercedes-Benz Stadium', 'Atlanta'],
  [103, '3rd', 'L101', 'L102', '07-18', '17:00', 'EDT', 'Hard Rock Stadium', 'Miami'],
  [104, 'FIN', 'W101', 'W102', '07-19', '15:00', 'EDT', 'MetLife Stadium', 'New York'],
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dispDate(mmdd: string): string {
  const [m, d] = mmdd.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
}

function toMatch(r: Row, knockout: boolean): Match {
  const [num, grp, h, a, mmdd, time, tz, venue, city] = r;
  return {
    id: `m${num}`,
    d: dispDate(mmdd),
    iso: `2026-${mmdd}T${time}`,
    grp,
    h,
    a,
    t: `${time} ${tz}`,
    v: `${venue} · ${city}`,
    city,
    // group stage gets a small home nudge; knockout slots are neutral
    odds: projectOdds(h, a, knockout ? 0 : 2.5),
  };
}

export const MATCHES: Match[] = [
  ...GROUP_STAGE.map((r) => toMatch(r, false)),
  ...KNOCKOUT.map((r) => toMatch(r, true)),
];

export interface Outright {
  team: string;
  flag?: string;
  odds: string;
}

// Winner ("to lift the trophy") market for all 48 nations, ordered by implied
// probability. American moneyline — shorter price = stronger favourite. These
// mirror consensus WC2026 outright boards; the live sparkline derives an
// implied win % from each price via americanToProb().
export const OUTRIGHTS: Outright[] = [
  { team: 'Spain', odds: '+450' },
  { team: 'France', odds: '+550' },
  { team: 'England', odds: '+650' },
  { team: 'Brazil', odds: '+700' },
  { team: 'Argentina', odds: '+800' },
  { team: 'Germany', odds: '+1100' },
  { team: 'Portugal', odds: '+1400' },
  { team: 'Netherlands', odds: '+1800' },
  { team: 'Belgium', odds: '+2800' },
  { team: 'Croatia', odds: '+4000' },
  { team: 'Uruguay', odds: '+4500' },
  { team: 'Colombia', odds: '+5500' },
  { team: 'Morocco', odds: '+6000' },
  { team: 'Japan', odds: '+8000' },
  { team: 'USA', odds: '+8000' },
  { team: 'Switzerland', odds: '+10000' },
  { team: 'Senegal', odds: '+10000' },
  { team: 'Mexico', odds: '+12000' },
  { team: 'Norway', odds: '+13000' },
  { team: 'Ecuador', odds: '+15000' },
  { team: 'Turkey', odds: '+16000' },
  { team: 'Austria', odds: '+18000' },
  { team: 'Sweden', odds: '+20000' },
  { team: 'South Korea', odds: '+22000' },
  { team: 'Egypt', odds: '+25000' },
  { team: 'Iran', odds: '+28000' },
  { team: 'Algeria', odds: '+30000' },
  { team: 'Czechia', odds: '+30000' },
  { team: 'Canada', odds: '+33000' },
  { team: 'Scotland', odds: '+33000' },
  { team: 'Dr Congo', odds: '+40000' },
  { team: 'Ghana', odds: '+40000' },
  { team: 'Bosnia', odds: '+45000' },
  { team: 'Australia', odds: '+50000' },
  { team: 'Paraguay', odds: '+50000' },
  { team: 'Tunisia', odds: '+50000' },
  { team: 'South Africa', odds: '+60000' },
  { team: 'Qatar', odds: '+66000' },
  { team: 'Saudi Arabia', odds: '+66000' },
  { team: 'Uzbekistan', odds: '+80000' },
  { team: 'Iraq', odds: '+80000' },
  { team: 'Cabo Verde', odds: '+100000' },
  { team: 'Panama', odds: '+100000' },
  { team: 'New Zealand', odds: '+100000' },
  { team: 'Jordan', odds: '+125000' },
  { team: 'Haiti', odds: '+150000' },
  { team: 'Curacao', odds: '+200000' },
];

export interface MerchSpec {
  label: string;
  value: string;
}

export interface MerchItem {
  id: string;
  name: string;
  /** Short one-line blurb shown on the product card. */
  short: string;
  /** Full multi-paragraph description shown on the product page. */
  desc: string;
  /** Structured spec rows shown below the description. */
  specs: MerchSpec[];
  price: number;
}

export const MERCH: MerchItem[] = [
  {
    id: 'p1',
    name: 'World Cup Mug',
    short: '12 oz stoneware. All 48 crests, kiln-fired.',
    desc: 'A 12 oz stoneware mug with every nation in the tournament rendered on our pixel grid and wrapped in tournament order around the body. The iFC mark sits centered on the base. Dishwasher and microwave safe, built for the morning of a knockout round.',
    specs: [
      { label: 'Material', value: 'Ceramic stoneware' },
      { label: 'Capacity', value: '12 oz (355 ml)' },
      { label: 'Print', value: 'Full-wrap ceramic transfer, kiln-fired' },
      { label: 'Handle', value: 'Comfort C-curve' },
      { label: 'Care', value: 'Dishwasher and microwave safe' },
      { label: 'Origin', value: 'Kiln-fired in North Carolina' },
    ],
    price: 1800,
  },
  {
    id: 'p2',
    name: 'Terminal Tee',
    short: '6.5 oz combed cotton. Pre-shrunk, runs true.',
    desc: 'A heavyweight cotton tee built for matchday and the day after. The front carries the iFC wordmark set in our pixel monospace; the back is a clean canvas. Pre-shrunk and reinforced at the shoulders so it holds shape after fifty wash cycles.',
    specs: [
      { label: 'Fabric', value: '100% combed ringspun cotton' },
      { label: 'Weight', value: '6.5 oz' },
      { label: 'Fit', value: 'Classic, runs true' },
      { label: 'Print', value: 'Water-based ink, front chest' },
      { label: 'Sizes', value: 'S · M · L · XL' },
      { label: 'Origin', value: 'Pre-shrunk and printed in Brooklyn, NY' },
    ],
    price: 2800,
  },
  {
    id: 'p3',
    name: 'Team Scarf',
    short: 'Jacquard knit, fringed ends. 64 inches long.',
    desc: 'Jacquard-knit in a heavyweight acrylic-wool blend with the team wordmark woven (not printed) into both bar ends. Long enough to wrap twice on a cold matchday at MetLife, soft enough to wear on the train home.',
    specs: [
      { label: 'Fabric', value: '80% acrylic, 20% wool' },
      { label: 'Dimensions', value: '64" × 7"' },
      { label: 'Weave', value: 'Jacquard, double-sided' },
      { label: 'Detail', value: 'Fringed bar ends, woven wordmark' },
      { label: 'Sizes', value: 'One size' },
      { label: 'Care', value: 'Hand wash cold, lay flat to dry' },
    ],
    price: 2400,
  },
  {
    id: 'p4',
    name: 'Team Cap',
    short: 'Unstructured six-panel. 12,000-stitch embroidered crest.',
    desc: 'An unstructured six-panel cap with the team crest stitched on the front and the iFC wordmark embroidered on the back closure. Low buckram so the crown breaks in by the second wear; brass buckle so it sits flat under a hood.',
    specs: [
      { label: 'Fabric', value: 'Brushed cotton twill' },
      { label: 'Crown', value: 'Unstructured, low-profile' },
      { label: 'Embroidery', value: '12,000-stitch crest, twill backing' },
      { label: 'Closure', value: 'Brass adjustable buckle' },
      { label: 'Sizes', value: 'One size (adjustable)' },
      { label: 'Origin', value: 'Embroidered in Los Angeles, CA' },
    ],
    price: 2200,
  },
  {
    id: 'p5',
    name: 'Sticker Pack',
    short: '49 die-cut vinyl crests. Waterproof, scratch-resistant.',
    desc: 'Forty-eight die-cut vinyl crests, all sized to the same pixel grid, plus one iFC wordmark. Weatherproof, UV-laminated, and kiss-cut on a single 4×5 inch backing so the set ships flat.',
    specs: [
      { label: 'Material', value: 'Weatherproof vinyl' },
      { label: 'Finish', value: 'Matte, lay-flat' },
      { label: 'Cut', value: 'Kiss-cut on 4" × 5" backing' },
      { label: 'Count', value: '49 stickers (48 crests + 1 wordmark)' },
      { label: 'Detail', value: 'UV-laminated, dishwasher-safe' },
      { label: 'Origin', value: 'Printed in Pittsburgh, PA' },
    ],
    price: 800,
  },
  {
    id: 'p6',
    name: 'Team Jersey',
    short: '5.4 oz recycled poly mesh. Fan cut, not athlete cut.',
    desc: 'A replica home kit cut for fans, not athletes. Looser through the shoulder, longer in the body, with a soft mesh that breathes on the train and at the bar. Crest heat-sealed at the chest, three-stripe sleeve detail, iFC tag at the back hem.',
    specs: [
      { label: 'Fabric', value: '100% recycled polyester mesh' },
      { label: 'Weight', value: '5.4 oz' },
      { label: 'Fit', value: 'Relaxed sport' },
      { label: 'Print', value: 'Heat-sealed crest, screen-printed sleeves' },
      { label: 'Sizes', value: 'S · M · L · XL' },
      { label: 'Origin', value: 'Knit and assembled in Portugal' },
    ],
    price: 4500,
  },
  {
    id: 'p7',
    name: 'Match Poster',
    short: '18×24 archival giclée. Made-to-order per fixture.',
    desc: 'An 18×24 archival print of any one of the 104 fixtures. Headline set in our display weight, kickoff and venue in mono, both crests rendered against a hairline pixel grid. Printed the moment your bracket survives the round, then shipped rolled in a kraft tube.',
    specs: [
      { label: 'Paper', value: '100 lb matte archival cover stock' },
      { label: 'Size', value: '18" × 24"' },
      { label: 'Print', value: '4-color giclée, archival pigment ink' },
      { label: 'Finish', value: 'Rolled, shipped in a kraft tube' },
      { label: 'Sizes', value: '18 × 24 (standard)' },
      { label: 'Origin', value: 'Printed on demand in Brooklyn, NY' },
    ],
    price: 2000,
  },
];
