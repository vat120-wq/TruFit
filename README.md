# TruFit

TruFit is a mobile-first, privacy-friendly calorie, macro, weigh-in, and workout coach with sustainable and high-output training protocols. It runs as a static Progressive Web App, so it can be hosted on GitHub Pages and installed on a phone home screen.

## Features

- Conservative starting calorie and macro estimates based on onboarding data
- A focused daily action list and context-aware coaching prompts
- Fast multi-food logging with common foods, custom foods, recent items, and explicit USDA FoodData Central search
- Persistent recipe drafts and one-tap saved meals that work without an account
- Weigh-in history, trend charts, and small evidence-gated weekly adjustments
- Progressive 2-, 3-, or 4-day base programs plus warned 4-day Overdrive and 5-day Neon Hybrid protocols
- Deload, Standard, and Push session output with exercise-specific load, rep, effort, and conditioning progression
- PIN-encrypted personal data, optional encrypted cross-browser sync, and offline support after the first visit

## Run locally

No build step is required:

```powershell
python -m http.server 8080
```

Open `http://localhost:8080`.

## Deploy

GitHub Pages publishes the repository root directly from `main`. Updates pushed to that branch are deployed automatically without a build step.

## Optional encrypted cloud sync

TruFit can use an optional Supabase email-and-password account to sync the already encrypted browser payload. The app, food log, and recipe builder continue to work while signed out. The server never receives the PIN or plaintext health data.

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor.
2. In **Authentication → URL Configuration**, add `https://vat120-wq.github.io/TruFit/` as the site URL and allowed redirect URL.
3. Keep email/password enabled. Confirmation email and password-reset links return to the configured URL.
4. Put the project URL and browser-safe publishable key in [`cloud-config.js`](cloud-config.js).

The publishable key is intended for browser use. Row-level security restricts every sync row to its authenticated owner.

## Privacy and safety

Personal health data is encrypted before it is stored. If cloud sync is enabled, Supabase receives only the encrypted payload; the PIN remains on the device. TruFit provides educational estimates, not medical diagnosis or treatment.
