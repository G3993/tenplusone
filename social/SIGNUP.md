# iFC Accounts — the 15-minute human task

I can't create the email or the social accounts (phone verification, CAPTCHA,
and ToS acceptance all require you, and automating signups gets accounts
insta-banned). Here's the exact recipe so it's fast and consistent.

## 1. One email to own everything (do this first)
Create a single dedicated email so every platform + the aggregator all live in
one inbox you control.
- **Recommended:** a brand mailbox on your domain → `hello@internetfc.com`
  (set up via Google Workspace, ~$7/mo, or a free forwarder). Most legit.
- **Fastest free option:** a Gmail like `internetfc.club@gmail.com`
  (plain `internetfc@gmail.com` is likely taken).
- Use a password manager; turn on 2FA. The aggregator/API setup later needs
  this account to be the admin everywhere.

## 2. Claim the handle on all 5 (same handle everywhere)
Consistency matters more than the exact string. Priority order:
1. `@internetfc`  (matches the domain internetfc.com — first choice)
2. `@internetsoccerclub`  (matches the Shopify store handle)
3. `@internet.fc` / `@theinternetfc`  (fallbacks)

Pick the FIRST one available on **all five** so the brand is identical
cross-platform. Check all before committing to one.

| Platform | Where | Account type to choose |
|---|---|---|
| Instagram | instagram.com signup | **Professional → Creator or Business** (required for API posting) |
| Facebook | create a **Page** (not just a profile), link it to the IG account | Page |
| TikTok | tiktok.com signup | **Business** account |
| X | x.com signup | standard (note: write API = paid tier later) |
| YouTube | studio.youtube.com → create channel under the Google account | Brand channel named "internet football club" |

## 3. Profile kit (same on all 5)
- **avatar:** the iFC pixel mark (`frontend/public/favicon.svg` → export 1024px,
  or the print master). lowercase i = the soccer ball.
- **handle:** the one you claimed
- **display name:** `internet football club`
- **bio:** `the home for soccer online. a united world wide web. owned by the
  people, not by them. 🌐⚽`
- **link:** internetfc.com

## 4. Then tell me
Once the email + 5 handles exist, come back and we wire the aggregator API
(one integration → posts to all 5) on top of the content engine, with the
human-approve gate. That's when "fully automated" becomes real.

> Heads-up: link IG to the Facebook Page during setup — Meta's API needs that
> pairing to post to either one later.
