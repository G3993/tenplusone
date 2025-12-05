# TEN PLUS ONE 🎰⚽

**Internet Soccer Club** - World Cup 2026 Fan Gear with Prediction Market Integration

## Overview

A 90s pixel-style landing page for pre-ordering World Cup 2026 fan gear with unique features:

- **Team Betting**: Pick your team - if they win the World Cup, you get 50% refund!
- **Tier System**: Bronze, Silver, Gold, Diamond tiers with different gear levels
- **Crypto Discounts**: Connect wallet for 5-20% off depending on tier
- **Pre-Order System**: Guaranteed delivery before World Cup with production timeline

## Features

### 🎰 The "Bet" System
Users select a team and a gear tier. The tier acts as their "bet":
- Higher tier = more/better gear
- If their selected team wins the World Cup, they receive a 50% refund

### 💎 Crypto Integration
- Connect wallet for instant discounts (5-20% based on tier)
- Future: Smart contract for automatic winner refunds
- Future: NFT verification for special editions

### ⏰ Pre-Order Timeline
- 3-month deadline before World Cup for production
- 8-week production + shipping pipeline
- Countdown timer to World Cup and pre-order deadline

### 🎨 90s Pixel Style
- Press Start 2P pixel font
- CRT scanline effects
- Neon color palette (green, cyan, magenta)
- Pixel-perfect borders and shadows

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom pixel theme
- **Crypto**: RainbowKit + Wagmi (prepared for integration)
- **Store**: Shopify (for actual checkout)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## Shopify Integration

To connect to your Shopify store:

1. Create products for each tier (Bronze, Silver, Gold, Diamond)
2. Create variants for each team
3. Use Shopify Buy SDK or Storefront API for checkout
4. Add discount codes for crypto payments
5. Set up webhook for World Cup winner refund processing

## Crypto/Prediction Market Integration

### Option 1: Simple Wallet Verification
- Connect wallet to verify ownership
- Apply discount codes automatically
- Manual refund process if team wins

### Option 2: Smart Contract (Advanced)
- Deploy prediction market contract
- Lock funds until World Cup ends
- Automatic refund to winners

### Option 3: Polymarket Integration
- Link team selection to Polymarket positions
- Use Polymarket odds for dynamic pricing
- Settlement based on Polymarket resolution

## File Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout with metadata
│   └── page.tsx         # Main landing page
├── components/
│   ├── Countdown.tsx    # World Cup & pre-order countdown
│   ├── TeamGrid.tsx     # Team selection grid
│   ├── TierCards.tsx    # Gear tier selection
│   ├── WalletConnect.tsx# Crypto wallet connection
│   ├── PreOrderFlow.tsx # Checkout modal
│   ├── HowItWorks.tsx   # Feature explanation
│   ├── Header.tsx       # Site header with marquee
│   └── Footer.tsx       # Site footer
├── lib/
│   └── constants.ts     # Teams, tiers, dates config
└── styles/
    └── globals.css      # Pixel theme and effects
```

## Next Steps

1. [ ] Add real Shopify checkout integration
2. [ ] Implement RainbowKit wallet connection
3. [ ] Create team-specific product images
4. [ ] Add more animations and effects
5. [ ] Deploy smart contract for winner refunds
6. [ ] Add email capture with Mailchimp/Klaviyo
7. [ ] Set up analytics tracking

## License

MIT
