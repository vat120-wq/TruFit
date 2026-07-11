# TruFit

TruFit is a mobile-first, privacy-friendly calorie, macro, weigh-in, and workout coach with sustainable and high-output training protocols. It runs as a static Progressive Web App, so it can be hosted on GitHub Pages and installed on a phone home screen.

## Features

- Conservative starting calorie and macro estimates based on onboarding data
- A focused daily action list and context-aware coaching prompts
- Meal logging with common foods and custom entries
- Weigh-in history, trend charts, and small evidence-gated weekly adjustments
- Progressive 2-, 3-, or 4-day base programs plus warned 4-day Overdrive and 5-day Neon Hybrid protocols
- Deload, Standard, and Push session output with exercise-specific load, rep, effort, and conditioning progression
- Local-only personal data and offline support after the first visit

## Run locally

No build step is required:

```powershell
python -m http.server 8080
```

Open `http://localhost:8080`.

## Deploy

GitHub Pages publishes the repository root directly from `main`. Updates pushed to that branch are deployed automatically without a build step.

## Optional encrypted cloud sync

TruFit can use Supabase email OTP authentication to sync the already encrypted browser payload. The server never receives the PIN or plaintext health data.

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor.
2. In **Authentication → Email Templates**, use `{{ .Token }}` so emails contain an OTP code.
3. Put the project URL and browser-safe publishable key in [`cloud-config.js`](cloud-config.js).
4. Add `https://vat120-wq.github.io/TruFit/` as the Auth site URL/allowed redirect URL.

The publishable key is intended for browser use. Row-level security restricts every sync row to its authenticated owner.

## Privacy and safety

Personal health data stays encrypted in the current browser and is not synced to a server. TruFit provides educational estimates, not medical diagnosis or treatment.
