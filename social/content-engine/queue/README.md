# Queue — the human-approve gate

Nothing posts itself. Drafts flow left to right; a human approves in the middle.

```
drafts/     generated, awaiting review
   │  (human approves: move the folder)
   ▼
approved/   cleared, scheduled to post
   │  (scheduler posts at the set time)
   ▼
posted/     archive + performance notes
```

## Draft folder shape
`drafts/YYYY-MM-DD__pillar__slug/`
- `post.md`   — caption(s) per platform + front-matter (see content-engine/README.md)
- `visual.png` | `visual.mp4`
- `notes.md`  — source data + approval checklist

## Approval checklist (the gut check from VOICE.md §8)
- [ ] does this make a real fan feel seen?
- [ ] would they screenshot it?
- [ ] is the joke (if any) aimed at the suits, not the people?
- [ ] facts verified (crest lore / people's desk)?
- [ ] correct platform caption + aspect ratio?

All yes → move to `approved/`. Any no → fix or delete.

> People's Desk drafts are ALWAYS hand-approved, even after the gate loosens
> elsewhere.
