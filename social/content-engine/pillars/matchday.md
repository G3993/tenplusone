---
pillar: matchday
cadence: every fixture (104 across the tournament)
dial: serious 70 / meme 25 / troll 5
platforms: [instagram, x, facebook, tiktok]
---

# Matchday

The dependable heartbeat. A head-to-head crest card the morning of every
fixture.

## Visual
- Battle-of-the-Pixels static frame: both crests on the hairline grid, vs in
  the center, kickoff + venue + group beneath.
- Source: crest library + `matches.ts` fixture data.

## Caption formula
`matchday. [home flag] [home] vs [away] [away flag]`
`[time] · [venue] · [stage]`
`[one-line stake or storyline].`

## Example
```
matchday. 🇧🇷 brazil vs morocco 🇲🇦
15:00 ET · soFi stadium · group c
five stars against the kings of the cup. let's go.
```

## Triggers
- T-18h: schedule the card
- T-1h: "kickoff in 60" countdown reply / story
