# Prompt for Claude v2 — critique my Israeli election SEAT-LEVEL Monte Carlo

(v2, after your earlier critique of the linear pool. I rebuilt the model as you and Gemini suggested. Please critique the NEW version below with the same brutality — what is still wrong?)

## The question

P(either bloc reaches 61+ of 120 Knesset seats alone), split P(right 61+) / P(center 61+). Israeli election day, 27 Oct 2026; no new polls by law since 23 Oct; only pre-22:00 public data allowed (polls, live official turnout, betting markets as benchmark only).

## Current headline

P(right 61+) = 12.5%, P(center 61+) = 0.3%, P(any) = 12.8%. Expected seats: right 52.4 / center 52.3 / Arab lists 14.7.

## The Monte Carlo (100k draws)

Per draw:
1. **Prior = polls.** Pick ONE of the 6 final polls uniformly (preserves house effects). Poll seats → vote shares; sub-threshold lists get assumed shares (judgment): Winter 2.6%, Reservists/Hendel-Zelicha 2.8%, Noam 1.8%, "Haredi Public" (Litner) 1.8%.
   Poll seat totals (party order: Yashar, Likud, Beyahad/Bennett, Democrats, Joint List, Shas, UTJ, RelZionism, Otzma, Beiteinu, Ra'am):
   - Ch12: 23/21/15/10/9/8/7/6/8/8/5 (right 52, center 56)
   - Ch13: 22/19/14/10/9/7/8/8/8/8/7 (right 50, center 52)
   - Ch14: 20/30/11/8/8/9/8/7/8/5/6 (right 62!, center 44) ← the outlier house
   - Kan: 22/20/14/8/9/7/8/7/8/8/5 + Reservists 4 (right 50, center 52)
   - i24: 21/26/12/8/9/8/7/6/8/6/5 + Winter 4 (right 55, center 47)
   - Walla: 23/19/14/9/8/8/7/6/8/8/6 + Reservists 4 (right 48, center 54)
2. **Turnout update (live CEC data via Votes26).** Sector delta d_s = projected-EOD-2026 / final-2022 − 1. Currently: general +16.3%, Haredi −1.1%, Judea&Samaria +14.4%, Arab +19.3%, Christian +11.1%, Druze −11.6%. Each party's votes × (1 + Σ_s exposure_{p,s}·d_s), then renormalized. Exposure matrix is judgment from historical voting patterns (e.g., UTJ 93% Haredi-sector, Joint List 78% Arab + 13% Christian, Religious Zionism 22% J&S). This mechanically fixes the earlier sign bug: high Arab turnout adds Arab-list seats at BOTH blocs' expense.
3. **Noise.** Correlated bloc swing δ~N(0,2%) applied +right/−center multiplicatively, plus independent party noise ×N(1,6% relative).
4. **Double envelopes (soldiers/diplomats/prisoners, counted later):** right parties ×1.008. Direction verified from 2022 coverage (soldiers lean Religious Zionism/Otzma); size is judgment.
5. **Threshold 3.25%**, then **Bader-Ofer** over 120 seats with verified 2026 surplus agreements: Likud–RelZionism, Shas–UTJ, Yashar–Democrats, Beyahad–Beiteinu, Ra'am–Joint List. Otzma has no partner.
6. Count bloc sums. Split comes from the simulation, no fixed ratio.

## Sensitivity (honest)

The tail is driven by the single Channel 14 outlier poll (Likud 30, right bloc 62 already in-poll). All 6 polls equal-weighted: P(any)=12.8%. Without it: 1.4%. The thin "any coalition majority" market (~15.5%) sits between. I report the 1.5–13% band openly.

## Markets are benchmark-only

Not blended (they update from the same CEC turnout feed = double counting). Displayed next to the simulation.

## What I want now

1. Is the ch14 treatment right? Equal-weight draws give one partisan house 1/6 of the prior mass and it alone produces most of the right-61 tail. Better: shrink house effects toward the mean? Trim? Model house bias explicitly (I have no 2026 house-bias ground truth)?
2. My turnout update assumes polls priced "2022-like" turnout patterns, so I apply the full live delta. If pollsters already priced the turnout surge, I double-count. How should I discount (e.g., apply half the delta)?
3. The exposure matrix is my judgment. Cheapest way to ground it in real 2022 locality-level results?
4. Party noise 6% relative + bloc swing 2% — sanity? Should intra-bloc parties be correlated (Likud↔Otzma voters move together)?
5. Double-envelope ×1.008 on right — size check.
6. Sub-threshold share assumptions (Winter 2.6% etc.) — reasonable given polls show 0–4 seats?
7. Anything structurally wrong remaining? What would you change before 22:00?

Be brutal and specific.
