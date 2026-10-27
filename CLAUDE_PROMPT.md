# Consultation prompt — critique my Israeli election seat-level Monte Carlo (round 2)

*(Round 1: you/Gemini/Grok killed my linear weighted pool - sign bug on Arab turnout, double-counted markets, arbitrary 4:5 split. I rebuilt it as a seat-level Monte Carlo. Now attack the new one. Be brutal and specific; give numbers, not vibes.)*

## The question

P(either bloc reaches 61+ of 120 Knesset seats alone), split P(right 61+) / P(center 61+). Israeli election day, 27 Oct 2026. By law no new polls since 23 Oct; only pre-22:00 public data (old polls, live official turnout reports, betting markets as benchmark only).

## Headline (27.10, ~15:50 IST)

**P(right 61+) = 12.2% · P(center 61+) = 0.3% · P(any) = 12.5%.**
Expected seats: right 52.4 / center 52.4 / Arab lists 14.7. Threshold-pass probability: Winter (Amcha Yisrael) 6%, Reservists (Hendel-Zelicha) 12%.

## The model (100,000 draws)

Per draw:
1. **Prior = polls.** Pick ONE of the 6 final polls uniformly (preserves house effects). Poll seats -> vote shares. Sub-threshold lists get assumed vote shares (judgment): Winter 2.6%, Reservists 2.8%, Noam 1.8%, "Haredi Public" (Litner) 1.8%.
   Poll seats (Yashar/Likud/Beyahad/Democrats/JointList/Shas/UTJ/RelZion/Otzma/Beiteinu/Ra'am):
   - Ch12: 23/21/15/10/9/8/7/6/8/8/5 -> right 52, center 56
   - Ch13: 22/19/14/10/9/7/8/8/8/8/7 -> right 50, center 52
   - Ch14: 20/30/11/8/8/9/8/7/8/5/6 -> right 62, center 44 <- outlier house
   - Kan: 22/20/14/8/9/7/8/7/8/8/5 (+Reservists 4) -> right 50, center 52
   - i24: 21/26/12/8/9/8/7/6/8/6/5 (+Winter 4) -> right 55, center 47
   - Walla: 23/19/14/9/8/8/7/6/8/8/6 (+Reservists 4) -> right 48, center 54
   Blocs: right = Likud+Shas+UTJ+RelZion+Otzma+Noam+Winter; center = Yashar+Beyahad+Democrats+Beiteinu; Arab = Joint List+Ra'am. Reservists, Haredi Public unaffiliated.
2. **Turnout update (live CEC data via Votes26, turnout view only).** Sector delta d_s = projected-EOD-2026 / final-2022 - 1, from the latest sectoral release (13:13 IST): general +16.3%, Haredi -1.1%, Judea&Samaria +14.4%, **Arab +19.3%**, Christian +11.1%, Druze -11.6%. Each party's votes x (1 + sum_s exposure_{p,s} * d_s), renormalized. Exposure matrix is judgment from historical voting patterns (UTJ 93% Haredi sector; Joint List 78% Arab + 13% Christian; RelZion 22% J&S; etc.). High Arab turnout now mechanically adds Arab-list seats at BOTH blocs' expense (the round-1 sign bug is gone structurally).
3. **Noise.** Correlated bloc swing delta ~ N(0, 2%) applied +right/-center multiplicatively; independent party noise x N(1, 6% relative).
4. **Double envelopes** (soldiers/diplomats/prisoners, counted after the main count): right parties x1.008. Direction verified from 2022 coverage (soldier ballots leaned Religious Zionism/Otzma; ~350-400k envelopes ~ 10 seats of vote volume); size is judgment.
5. **Threshold 3.25%** of valid votes; failing lists' votes discarded.
6. **Bader-Ofer** allocation of 120 seats with the verified 2026 surplus-vote agreements (sources: ynet surplus map, Kikar, Channel 14): Likud-RelZionism, Shas-UTJ, Yashar-Democrats, Beyahad-Beiteinu, Ra'am-Joint List. Otzma Yehudit has no partner.
7. Count bloc sums. The right/center split is read off the simulation - no fixed ratio.

## Sensitivity (honest, shown to users)

The right-61 tail is driven by ONE outlier house: Channel 14 already polls the right bloc at 62 (Likud 30 vs 19-26 elsewhere). All 6 houses equal-weighted: P(any) = 12.5%. Without Ch14: 1.4%. The thin "any coalition majority" Polymarket (~15.5%) sits between. I headline the all-houses number and show the trimmed one next to it; the stated band is 1.5-13%.

## Verified vs unverified

- VERIFIED: the 6 surplus agreements; double-envelope right lean (qualitative, 2022); sectoral deltas (live CEC feed); the 6 polls' seat numbers.
- UNVERIFIED LLM CLAIMS I rejected or downgraded: "Balad near threshold" (Balad is not a separate list in these 2026 polls - near-threshold lists are Winter and Reservists); specific double-envelope seat sizes (kept as tagged judgment x1.008); your round-1 "expect 6-9%" (you ignored that one in-poll house already shows 62 - explain why your number was right if you still think so).
- JUDGMENT (tagged as such on the page): exposure matrix, sub-threshold shares, swing/party noise SDs, double-envelope size.

## Markets are benchmark-only

Not blended into the simulation (they update off the same CEC feed = double counting). Displayed side by side: coalition-majority market 15.5% vs MC 12.5%; hung-parliament 37.5%.

## Questions for round 2

1. **The Ch14 problem.** Equal house weighting gives one partisan house 1/6 of the prior and it produces most of the right-61 tail. Shrink house effects toward the mean (by how much, on what basis?), trim, or keep equal weight with the sensitivity shown? I have no 2026 house-bias ground truth; 2022 house errors are recoverable if you think that transfers.
2. **Turnout double-count.** My update assumes polls priced "2022-like" turnout patterns, so I apply the full live delta. If pollsters already priced the surge, I double-count. Apply half? Estimate how much was priced? How?
3. **Exposure matrix.** Cheapest defensible way to ground it in real 2022 locality-level results instead of my judgment?
4. **Noise structure.** Party noise 6% relative independent + 2% correlated bloc swing: right shape? Should intra-bloc parties be positively correlated (Likud<->Otzma)? Does my variance match Israeli poll-error history?
5. **Double-envelope x1.008 on right only** - size and target parties (should it hit RelZion/Otzma specifically)?
6. **Sub-threshold shares** (Winter 2.6% etc. from 0-4 seat polls) - better reconstruction?
7. **What is still structurally wrong?** What single change most improves calibration against tonight's 22:00 exit polls?
