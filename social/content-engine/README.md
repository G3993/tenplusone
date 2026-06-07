# iFC Content Engine

A printing press for soccer content that nobody else can copy, because it runs
on our pixel crest system + the World Cup data + Higgsfield generation.

## How a post is born

1. **Trigger** — the calendar fires (a fixture tomorrow, a result tonight, a
   countdown milestone) or a manual prompt ("FIFA did X today").
2. **Pillar select** — the trigger maps to one of the 6 pillars in `pillars/`.
3. **Assemble** — the engine pulls the right crest(s), match facts, and a
   visual template; Higgsfield fills cinematic/b-roll where needed.
4. **Caption** — generated in the iFC voice using the formulas in `VOICE.md`,
   tailored per platform.
5. **Draft** — visual + caption + target platforms land in `queue/drafts/` as
   a single dated post folder.
6. **Approve** — a human reviews the day's drafts, moves keepers to
   `queue/approved/`.
7. **Distribute** — the scheduler / aggregator API posts approved items at the
   right time, then files them under `queue/posted/` with performance notes.

## Draft format

Each draft is a folder: `queue/drafts/YYYY-MM-DD__pillar__slug/`

```
2026-06-11__matchday__mex-vs-rsa/
├── post.md          # caption(s) per platform + metadata (front-matter)
├── visual.png       # or visual.mp4 for video/Shorts
└── notes.md         # why this, source data, approval checklist
```

`post.md` front-matter:

```yaml
---
pillar: matchday
date: 2026-06-11
time_local: "07:00"          # when to post
platforms: [instagram, tiktok, x, facebook]
status: draft                # draft | approved | posted
crest_refs: [mexico, south-africa]
fixture_id: m1
---
ig: |
  matchday. 🇲🇽 mexico vs south africa 🇿🇦
  12:00 ET · estadio azteca · group a
  100 years of waiting starts now.
x: |
  it begins. mexico vs south africa, azteca, 12:00 ET.
  the people's tournament is live.
tiktok: |
  the first whistle of the people's world cup 🌐⚽
```

## Build status

- [ ] pillar configs (`pillars/`) — defined
- [ ] platform specs (`platforms/`) — defined
- [ ] calendar generator (`calendar/schedule.md`) — fixture-mapped schedule
- [ ] visual generator — Remotion + crest library (reuse pixel-logos project)
- [ ] Higgsfield hook — cinematic b-roll + hero shots
- [ ] caption generator — voice-locked, per platform
- [ ] queue + approve flow — folders + a one-tap review step
- [ ] distribution — aggregator API to all 5 platforms

## Why an aggregator (recommendation)

Native APIs (Meta Graph, TikTok Content Posting, X v2, YouTube Data) each need
their own app review/audit and, for X, a paid write tier. One aggregator API
(Ayrshare / Postiz-style) posts to all 5 from a single integration in days, not
weeks. We keep the human-approve gate on top of it.
