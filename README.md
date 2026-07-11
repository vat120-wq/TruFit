# TruFit

TruFit is a mobile-first, privacy-friendly calorie, macro, weigh-in, and workout coach with sustainable and high-output training protocols. It runs as a static Progressive Web App, so it can be hosted on GitHub Pages and installed on a phone home screen.

## Features

- Conservative starting calorie and macro estimates based on onboarding data
- A focused daily action list and context-aware coaching prompts
- Meal logging with common foods and custom entries
- Weigh-in history, trend charts, and small evidence-gated weekly adjustments
- Progressive 2-, 3-, or 4-day base programs plus warned 4-day Overdrive and 5-day Neon Hybrid protocols
- Local-only personal data and offline support after the first visit

## Run locally

No build step is required:

```powershell
python -m http.server 8080
```

Open `http://localhost:8080`.

## Deploy

GitHub Pages publishes the repository root directly from `main`. Updates pushed to that branch are deployed automatically without a build step.

## Privacy and safety

Personal health data stays encrypted in the current browser and is not synced to a server. TruFit provides educational estimates, not medical diagnosis or treatment.
