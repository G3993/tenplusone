# iFC Social Operation

The people-owned social engine for internet football club. This folder is the
control room for everything we post across Instagram, TikTok, Facebook, X, and
YouTube. It is plain markdown + assets on purpose, so it doubles as an Obsidian
vault and stays readable forever.

## Map

```
social/
├── VOICE.md                  ← brand voice playbook (read this first)
├── README.md                 ← you are here
├── SIGNUP.md                 ← the 15-min human task: email + claim 5 handles
├── content-engine/           ← the printing press
│   ├── README.md             ← how the pipeline works
│   ├── pillars/              ← the 6 content pillars (what we make)
│   ├── templates/            ← caption + visual templates
│   ├── calendar/             ← posting schedule mapped to the WC fixtures
│   └── queue/                ← the human-approve gate
│       ├── drafts/           ← generated, awaiting approval
│       ├── approved/         ← approved, ready to post
│       └── posted/           ← archive of what went live
├── platforms/                ← per-platform specs (sizes, rules, voice notes)
└── teams/                    ← (built in Obsidian) one dossier per WC nation
```

## The flow (human-in-the-loop)

```
logo library + match data
        │
        ▼
  content-engine  ──generates──▶  queue/drafts/   (graphic/video + caption)
        │                              │
        │                         human taps approve
        │                              ▼
        │                        queue/approved/
        │                              │
        │                     scheduler / aggregator API
        │                              ▼
        │                    IG · TikTok · FB · X · YouTube
        │                              │
        ▼                              ▼
  Higgsfield (b-roll,           queue/posted/  (archive + performance notes)
   motion, hero shots)
```

Nothing posts itself. A person approves the day's queue first. We earn
autonomy by proving the output, then loosen the gate (see VOICE + the
autonomy plan).

## Inputs the engine draws from

- **Crest library:** `frontend/public/logos/` (48 nations) + the print masters
  in `frontend/public/logos/print/`
- **Match data:** `frontend/src/data/matches.ts` (104 fixtures, dates, venues,
  synthetic odds) and `groups.ts`
- **Motion system:** the 11 stat-driven pixel effects (see the pixel-logos
  Remotion project)
- **Higgsfield:** AI image/video generation for hero shots, b-roll, and
  cinematic crest reveals
