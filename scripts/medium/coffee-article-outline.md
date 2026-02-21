# Medium Article Outline

**Title:** I built an AI-assisted coffee calculator in one afternoon. Here's exactly how.

**Target publication:** Medium (self-publish or submit to Better Programming / UX Collective)
**Audience:** Tech-curious professionals and non-coders interested in AI-assisted development
**Estimated read time:** 6–8 minutes
**When to publish:** After coffee app has been live 1 week (real usage to reference)

---

## Structure

### 1. What I built and why (2 paragraphs)
- I wanted a coffee calculator that didn't require an app download or account
- Decided to build it myself — AI made that a realistic afternoon project
- Brief description of the end result: what it does, where it lives
- Honest framing: "I'm not a professional developer. I used Claude Code."

### 2. The stack — and why this, not React/Next.js
- Single HTML file. No build step. No node_modules.
- Loads in under a second. Works offline via service worker.
- For a focused single-purpose tool, a framework adds complexity with no user benefit.
- Cloudflare Pages: free, fast, deploys from GitHub on every push.
- Total ongoing cost: £0/month.

### 3. The Claude Code workflow
- How to describe what you want: write a spec in plain English, be specific about inputs/outputs/edge cases
- What Claude produces: full working code, not snippets
- How to review it: run it in a browser, test every path, read the logic
- What I changed after first draft: brew step copy, mobile layout tweaks, ratio live-update
- Common misconception: "Claude does everything." Reality: you still make product decisions.

### 4. What surprised me
- How much of the work is *product thinking*, not code — what should save, what the steps should say, what the share text should be
- The service worker and PWA setup took 10 minutes. Adding it to a React project would have taken longer.
- First version was usable in about 45 minutes. Refinement took another 2 hours.

### 5. Link + close
- Try it: stevechalmers.uk/coffee
- Source code: github.com/SJC-G1T/stevechalmers-uk
- What's next: run pace calculator

---

## Writing notes
- Write in first person, past tense, conversational but professional
- No hype, no "game changer" language
- Include one or two short code snippets (the ratio calculation, the localStorage save) — readers appreciate concrete examples
- Screenshot of the finished app at the top
- Can ask Claude to draft any section — just paste the outline point and say "write this section"
