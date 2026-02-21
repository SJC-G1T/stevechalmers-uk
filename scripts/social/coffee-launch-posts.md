# Coffee Calculator — Launch Week Posts

Schedule: Monday ship day → Wednesday stat → Friday behind the scenes.
Platform: Twitter/X and Bluesky (same copy works on both).

---

## Monday — Ship Day

```
Built a coffee brew calculator.

Pick your method (V60, French Press, AeroPress, Moka Pot, Chemex), enter coffee and water weights, get the right ratio and exact step-by-step instructions.

No signup. Works offline. Saves your ratio for next time.

stevechalmers.uk/coffee

Built with Claude Code.
```

---

## Wednesday — Insight / Stats

```
A week of stevechalmers.uk/coffee data:

Most used method: [fill in after launch]
Most common ratio: [fill in after launch]
Rarest method in the wild: probably Chemex

Built this in an afternoon. Zero ongoing cost to run.

Next up: run pace calculator (splits, target times, any distance).
```

Note: fill in the stats with real numbers from Cloudflare Analytics before posting.
If you have no data yet, post this instead:

```
Quick note on why I built the coffee calculator in vanilla HTML rather than React:

No build step. No node_modules. The whole thing is one file.
Loads in under a second on 3G. Works offline as a PWA.

For a tool this focused, a framework would have added complexity with zero user benefit.

stevechalmers.uk/coffee — try it.
```

---

## Friday — Behind the Scenes

```
How I built the coffee calculator with Claude Code:

→ Described the spec in plain English (brew methods, ratio logic, localStorage, PWA)
→ Claude wrote the full HTML/CSS/JS in one shot
→ I reviewed, tested all 5 brew methods, adjusted the step copy
→ Deployed via Cloudflare Pages — auto-deploys on every git push

Total time: ~3 hours including tweaks and deploy setup.
Hosting cost: £0/month.

Code: github.com/SJC-G1T/stevechalmers-uk
```
