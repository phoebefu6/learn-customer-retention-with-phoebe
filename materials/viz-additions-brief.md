# Viz additions brief - real computed numbers (2026-08-28)

All numbers below were computed from the repo's own data (data/*.csv) unless marked
ILLUSTRATIVE. SVGs must use these values verbatim. Multi-series categorical palette,
validated (six checks, surface #FDF9F5): series1 #C2410C (ember), series2 #0D9488 (teal),
series3 #A16207 (bronze). Sequential stays the ember ramp. Negative stays #FEF2F2/#FCA5A5/#991B1B.
Neutral #D3C4B8 is for grid/faded context only, NEVER a data series.

## MAU composition by month (ecommerce, retail+wholesale actives; use 2025-06..2026-05)
month: new / retained / resurrected
2025-06: 331 / 0 / 0
2025-07: 380 / 193 / 0
2025-08: 359 / 346 / 24
2025-09: 334 / 438 / 47
2025-10: 315 / 531 / 78
2025-11: 329 / 581 / 82
2025-12: 306 / 656 / 121
2026-01: 357 / 682 / 98
2026-02: 325 / 731 / 126
2026-03: 322 / 787 / 156
2026-04: 346 / 792 / 129
2026-05: 326 / 817 / 181
Story: new is flat (~330/mo), retained grows 0 to 817, resurrected grows to 181 - the
composition shifts from acquisition-driven to retention-driven as the base compounds.

## Game decay ladder (classic, from game_telemetry.csv, 8,000 players)
D1 27.9% / D7 13.6% / D14 9.1% / D30 6.9%
Benchmark bands to draw behind (from the course map, GameAnalytics 2025): median D1 22-27%,
top-quartile D1 >30%; median D7 3.4-3.9%, top-quartile 7-8%; 75% of games D28 < 3%.
Legacy 40/20/10 line drawn above as the folklore ceiling. This dataset sits above median,
below top quartile at D1; ABOVE top quartile at D7/D30.

## Time-to-churn (ecommerce retail churned customers, 90d inactivity, n=2,514)
Span from first to last order (days): [0,1): 1,241 · [1,30): 185 · [30,60): 427 ·
[60,90): 231 · [90,120): 141 · [120,180): 183 · [180,270): 90 · [270,400): 16
Headline: 1,241 of 2,514 (49%) never placed a second order - the day-0 cliff. The
histogram is why retention work front-loads onto the second purchase.

## RFM persona migration, Jan 2026 snapshot vs Jul 2026 snapshot (retail, same customers)
rows = Jan persona, cols = Jul persona (counts):
              At-Risk  Champions  Hibernating  Loyal  Regular
At-Risk           102          7            0      0       85
Champions         114        261            0    126       29
Hibernating         0          6          523      3        0
Loyal              93        159           49     73       92
Regular             2        106          295     69      130
Alarm cell: Champions -> At-Risk = 114 (your best customers going quiet). Good cells:
Loyal -> Champions 159, Regular -> Champions 106. Hibernating mostly stays (523).

## Jul persona totals (for stat tiles + R x F grid)
At-Risk 311 · Champions 539 · Hibernating 867 · Loyal 271 · Regular 336
(revenue share and QoQ deltas: mark ILLUSTRATIVE or compute in the notebook)

## ILLUSTRATIVE-ONLY visuals (data has no columns for these; label "illustrative" in the
figure's bottom note): activation funnel stages (install -> signup -> first core action ->
second visit), retention small-multiples by acquisition channel, 100-user weekly waterfall.
Keep illustrative values consistent with the real benchmarks above.
