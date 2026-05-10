export interface MockProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  productType: string;
  images: { url: string; altText: string }[];
  variants: {
    id: string;
    title: string;
    price: string;
    availableForSale: boolean;
  }[];
  tags: string[];
}

interface MerchType {
  type: string;
  label: string;
  mockup: string;
  basePrice: number;
  variants: { title: string; price?: number }[];
}

const SIZES = [{ title: 'S' }, { title: 'M' }, { title: 'L' }, { title: 'XL' }];

const MERCH_TYPES: MerchType[] = [
  {
    type: 'tshirt',
    label: 'T-Shirt',
    mockup: '/shirt-white.png',
    basePrice: 35,
    variants: SIZES,
  },
  {
    type: 'crew',
    label: 'Crewneck',
    mockup: '/crew-white.png',
    basePrice: 55,
    variants: SIZES,
  },
  {
    type: 'hoodie',
    label: 'Hoodie',
    mockup: '/mockups/hoodie.svg',
    basePrice: 75,
    variants: SIZES,
  },
  {
    type: 'shorts',
    label: 'Shorts',
    mockup: '/shorts-white.png',
    basePrice: 40,
    variants: SIZES,
  },
  {
    type: 'cap',
    label: 'Cap',
    mockup: '/cap-white.png',
    basePrice: 30,
    variants: [{ title: 'One Size' }],
  },
  {
    type: 'beanie',
    label: 'Beanie',
    mockup: '/beanie-white.png',
    basePrice: 25,
    variants: [{ title: 'One Size' }],
  },
  {
    type: 'scarf',
    label: 'Scarf',
    mockup: '/scarf-white.png',
    basePrice: 28,
    variants: [{ title: 'One Size' }],
  },
  {
    type: 'poster',
    label: 'Poster',
    mockup: '/mockups/poster.svg',
    basePrice: 25,
    variants: [{ title: '18x24"' }, { title: '24x36"', price: 35 }],
  },
  {
    type: 'mug',
    label: 'Mug',
    mockup: '/mockups/mug.svg',
    basePrice: 18,
    variants: [{ title: '11oz' }, { title: '15oz', price: 22 }],
  },
];

interface TeamInfo {
  name: string;
  slug: string;
  code: string;
}

const FEATURED_TEAMS: TeamInfo[] = [
  { name: 'Australia', slug: 'australia', code: 'AUS' },
  { name: 'Belgium', slug: 'belgium', code: 'BEL' },
  { name: 'Brazil', slug: 'brazil', code: 'BRA' },
  { name: 'Canada', slug: 'canada', code: 'CAN' },
  { name: 'Colombia', slug: 'colombia', code: 'COL' },
  { name: 'Ecuador', slug: 'ecuador', code: 'ECU' },
  { name: 'England', slug: 'england', code: 'ENG' },
  { name: 'France', slug: 'france', code: 'FRA' },
  { name: 'Germany', slug: 'germany', code: 'GER' },
  { name: 'Japan', slug: 'japan', code: 'JPN' },
  { name: 'Jordan', slug: 'jordan', code: 'JOR' },
  { name: 'South Korea', slug: 'south-korea', code: 'KOR' },
  { name: 'Mexico', slug: 'mexico', code: 'MEX' },
  { name: 'Netherlands', slug: 'netherlands', code: 'NED' },
  { name: 'New Zealand', slug: 'new-zealand', code: 'NZL' },
  { name: 'Norway', slug: 'norway', code: 'NOR' },
  { name: 'Panama', slug: 'panama', code: 'PAN' },
  { name: 'Paraguay', slug: 'paraguay', code: 'PAR' },
  { name: 'Portugal', slug: 'portugal', code: 'POR' },
  { name: 'Saudi Arabia', slug: 'saudi-arabia', code: 'KSA' },
  { name: 'Spain', slug: 'spain', code: 'ESP' },
  { name: 'Uruguay', slug: 'uruguay', code: 'URU' },
  { name: 'United States', slug: 'united-states', code: 'USA' },
];

function generateProducts(): MockProduct[] {
  const products: MockProduct[] = [];
  let idCounter = 1;

  for (const team of FEATURED_TEAMS) {
    for (const merch of MERCH_TYPES) {
      const productId = `mock-${idCounter++}`;
      const handle = `${team.slug}-${merch.type}`;

      products.push({
        id: productId,
        title: `${team.name} ${merch.label}`,
        handle,
        description: `Official iFC World Cup 2026 ${merch.label.toLowerCase()} — ${team.name} edition. Limited run.`,
        productType: merch.type,
        images: [
          {
            url: merch.mockup,
            altText: `${team.name} ${merch.label} mockup`,
          },
        ],
        variants: merch.variants.map((v, i) => ({
          id: `${productId}-v${i + 1}`,
          title: v.title,
          price: (v.price ?? merch.basePrice).toFixed(2),
          availableForSale: true,
        })),
        tags: [
          team.slug,
          team.code.toLowerCase(),
          merch.type,
          'world-cup-2026',
        ],
      });
    }
  }

  return products;
}

export const MOCK_PRODUCTS: MockProduct[] = generateProducts();

/** Get all products matching a team slug */
export function getProductsByTeam(teamSlug: string): MockProduct[] {
  return MOCK_PRODUCTS.filter((p) => p.tags.includes(teamSlug));
}

/** Get all products matching a product type */
export function getProductsByType(type: string): MockProduct[] {
  return MOCK_PRODUCTS.filter((p) => p.productType === type);
}

/** Get a single product by handle */
export function getProductByHandle(handle: string): MockProduct | undefined {
  return MOCK_PRODUCTS.find((p) => p.handle === handle);
}

/** List of featured team slugs for UI filters */
export const FEATURED_TEAM_SLUGS = FEATURED_TEAMS.map((t) => ({
  slug: t.slug,
  name: t.name,
  code: t.code,
}));

/** List of merch type keys for UI filters */
export const MERCH_TYPE_KEYS = MERCH_TYPES.map((m) => ({
  type: m.type,
  label: m.label,
}));
