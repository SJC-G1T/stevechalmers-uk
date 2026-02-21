# App Plan — stevechalmers.uk

Stack for every app: vanilla HTML + CSS + JS, single `index.html`, Cloudflare Pages, GitHub. No framework, no build step, no backend, zero ongoing cost.

---

## 1. Coffee Brew Calculator — `/coffee`
Calculate the right ratio and get step-by-step brew instructions for V60, French Press, AeroPress, Moka Pot, and Chemex. Saves your preferred ratio in localStorage.
**Estimated build:** 2–3 hours | **Status:** ✅ Built

---

## 2. Run Pace Calculator — `/pace`
Enter a target time or pace, pick a distance (5K, 10K, half, full, custom), and get per-km/mile splits plus a finish time. Works the other way too — enter finish time, get required pace.
**Estimated build:** 2 hours | **Status:** Coming soon

---

## 3. Tech Debt Estimator — `/debt`
Paste in a rough description of a piece of code or a project situation. Get a structured breakdown of technical debt categories, risk level, and a prioritised fix order. Runs entirely client-side using a simple scoring model — no AI API needed.
**Estimated build:** 2–3 hours | **Status:** Coming soon

---

## 4. Watch Battery Tracker — `/watch`
Log your watches and their last battery change date. Get estimated next change date based on movement type (quartz, solar, kinetic). Stores everything in localStorage. No account, no sync — just a local reference.
**Estimated build:** 2 hours | **Status:** Coming soon

---

## 5. Match Day Budget — `/matchday`
Enter your season ticket cost, travel, food, and merch spend. Split across home games to see what each match actually costs you. Export as a text summary to share or screenshot.
**Estimated build:** 1.5 hours | **Status:** Coming soon

---

## 6. One-Page Budget Snapshot — `/budget`
Monthly income in, fixed costs out, variable costs out — get a clear breakdown showing what's left, savings rate, and a simple spending breakdown. No data leaves the browser, no accounts, no tracking.
**Estimated build:** 2 hours | **Status:** Coming soon

---

## Notes
- Each app lives at `/appname/index.html` in the same GitHub repo
- Homepage app grid card is added on ship day, not before
- Social post files generated immediately after each ship (see `scripts/social/post-template.md`)
