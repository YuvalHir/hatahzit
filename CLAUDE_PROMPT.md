# Prompt for Claude — critique my Israeli election forecast model

I built a small probabilistic model that estimates whether either bloc in today's Israeli election (Knesset 26, election day 27 Oct 2026) reaches 61+ seats out of 120 on its own. I want your sharpest critique and better ideas. Please be specific and quantitative where you can; challenge my assumptions, my weights, and my math.

## The question

P(at least one bloc reaches 61+ seats alone), split into P(right bloc 61+) and P(center bloc 61+). Current headline: ~11.4% any bloc (right ~5.1%, center ~6.3%).

## Context you need

- Israel, Knesset 26. Two relevant blocs: the right bloc (Likud, Shas, United Torah Judaism, Religious Zionism/Otzma, Noam) and the center/anti-Netanyahu bloc (Yashar! led by Eizenkot, Yisrael Beiteinu, Democrats, etc.). Arab parties (Ra'am, Hadash-Ta'al, Balad) are outside both blocs.
- By law, no new polls may be published in the final ~4 days before the election, so the newest polls are 4-7 days old. Exit polls are illegal to publish before 22:00 local.
- Legal constraints mean the model uses only pre-22:00 public data: old polls, live betting markets, official turnout reports, search trends, FX.

## The model: weighted average of six sub-estimates of P(61+)

P(61+) = Σ weight_i × estimate_i. Then split right:center at a fixed judgment ratio of 4:5.

| # | Input | Source (all public) | Weight | Current value | Data or judgment? |
|---|---|---|---|---|---|
| 1 | Final TV polls (6 polls, 20-23 Oct) | Channel 12/13/14, Kan 11, i24NEWS, Walla | 28% | 10% | Data → judgment conversion |
| 2 | "Any coalition wins a majority" market | Polymarket, live, thin (~$30k/24h) | 20% | 15% (live price) | Data |
| 3 | Next-PM market + winning-party market | Polymarket, live, liquid (~$3.5M/24h) | 12% | 12% | Judgment conversion of live data |
| 4 | National + sectoral turnout | Central Elections Committee via Votes26, live | 18% | 8.5% | Judgment rule on live data |
| 5 | Arab-sector turnout (dedicated) | Same CEC sectoral feed, live | 10% | 14.0% | Judgment rule on live data |
| 6 | Sanity signals: Kalshi KXISRAELPM, Google Trends IL, USD/ILS, "hung parliament" market | Live | 12% | 10% (neutral) | Neutral placeholder |

### Conversion rules (the judgment parts)

1. **Polls → 10%.** Poll averages: right 52.5 seats (range 48-62), center 51.2 (range 44-56). 5 of 6 polls show no bloc above 56. A 8-10 seat gap from 61 exceeds typical sampling error (±3-4 seats per bloc), but Israeli polls have missed late swings before (2021 Haredi surge, 2022 Meretz/Balad threshold misses), so 10% rather than ~2%.
2. **Coalition-majority market → price directly.** It's literally the same question (15% at 15:25 IST, was 7.5% at 13:00, 11.5% at 11:24). Weight capped at 20% because the market is thin and a single trader can move it.
3. **PM market → fixed 12%.** Eizenkot 68.5% vs Netanyahu 19.5% says a lot about who forms a government but little about a bloc hitting 61 alone (a center PM can head a minority/rotation government). Fixed at 12% pending review.
4. **Turnout rule.** Base 7% (judgment). If Haredi projected end-of-day turnout vs 2022 final > -2pp: +1.5. If < -7pp: -1.5. Clamped [3%, 15%]. Currently Haredi projection 72.6% vs 73.5% in 2022 (-0.9) → 8.5%. Rationale: high national turnout (76.9% projected, highest since 1973) with sectoral skew toward center-left strongholds works against a right-bloc majority.
5. **Arab turnout rule (new, requested dedicated tracking).** Base 10% + 0.4pp per +1pp of projected end-of-day Arab turnout vs the 2022 final (52.7%). Clamped [4%, 20%]. Currently: Arabs 24.6% by 13:13, projected 62.8% (+10.1pp) → 14.0%. Rationale: each extra point of Arab turnout is almost entirely Arab-list votes, shrinking the right bloc's seat share; the 0.4 multiplier is a pure judgment call.
6. **Signals → fixed neutral 10%** unless a big divergence appears (Polymarket-Kalshi gap, one-sided trade waves).

### Current computation

P = 0.28×10 + 0.20×15.0 + 0.12×12 + 0.18×8.5 + 0.10×14.0 + 0.12×10 = **11.4%**

## What I want from you

1. **Missing factors.** What inputs or mechanisms am I not modeling that could move P(61+)? (I track but don't price: threshold risk for small parties like Balad (~4 seats swing at 3.25%), double-envelope ballots (~5-6 seats worth, counted later, historically right-leaning), surplus-vote agreements, systematic poll bias, same-day undecideds, election-day security/weather events, post-election coalition flexibility.)
2. **Weight sanity.** Are these weights defensible? Which would you change and why? Note the correlation problem: markets react to the same turnout news, so inputs 2-6 partly double-count.
3. **Correlations / double-counting.** How would you structure this to avoid double-counting (e.g., hierarchical model, conditioning, shrinkage)?
4. **Bloc math.** Is a direct probability-of-61+ blend reasonable, or should I build a seat-level model (party vote shares → Bader-Ofer seat allocation with threshold and surplus agreements → bloc sums → Monte Carlo)? If the latter, sketch the minimal version that beats what I have today, given I can't run new polls.
5. **The Arab-turnout rule.** Is 0.4pp per +1pp turnout defensible? What's a better way to translate a sectoral turnout delta into a P(61+) shift?
6. **Failure modes.** Where does this model break hardest? What single change most improves calibration by tonight's exit polls (22:00 IST)?
7. **The 4:5 right/center split.** Better way to derive it?

Be brutal. I'd rather hear the model is wrong in a specific way than that it's "interesting".
