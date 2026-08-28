# Official course map - learn-customer-retention-with-phoebe

Built 2026-08-27 from verified research (4 deep-research briefs: metric definitions, models/frameworks,
visualization + Python recipes, business value cases). Every substantive claim below carries its source.
Audience: Phoebe's data analysts (Analyst track, a1-a8) and business stakeholders (Stakeholder track, s1-s4).
Context examples: ecommerce and game loyalty/stickiness throughout.

## THE COURSE-WIDE METHODOLOGY LAW (Phoebe's standing decision, non-negotiable)

**Forward-looking cohort retention with frozen history.** Every retention number in this course is
computed as: fix a base cohort by a fixed anchor date (registration date, or actives on a fixed date
such as Aug 1), then look FORWARD x days (1 / 7 / 14 / 30) and count who came back.

- Once a cohort's measurement window has completed, its retention number is IMMUTABLE. It never
  restates. Only the current, incomplete window is still updating (and is always visibly marked
  as partial).
- BANNED as reporting metrics: trailing look-back windows ("last 7 days retention as of today") -
  the denominator changes every day so the number always restates; and rolling/unbounded retention
  ("returned on day N or later") - historical values rise retroactively when a dormant user returns.
  Both are taught as concepts ONLY, each with an explicit "never for reporting" warning.
- Every session that shows a retention number must be consistent with this law. The cohort heatmap
  marks immature cells as blank/partial, never as low retention.

Why this is the right side of the argument (evidence): Mixpanel's default "on or after" retention
and Amplitude's "unbounded" retention are documented to have historical values that keep rising as
time passes (devtodev, Amplitude docs) - unusable for trend reporting. Bounded/classic retention is
the industry standard for D1/D7/D30 benchmarks (GameAnalytics, Amplitude).

## Iron facts (verified, hard numbers pages may cite - do not invent others)

### Metric definitions
- Three counting variants of "day-N retention": classic/N-day (return exactly day N; Amplitude
  "N-Day", Mixpanel "On", GameAnalytics default), rolling/unbounded (day N or later; Mixpanel
  default; = 1 - churn-by-day-N; retroactively restates), bracket/range (within a custom window,
  each bracket independent; fits repurchase-interval products). Source: Amplitude + Mixpanel docs.
- Amplitude's trillion-event study: N-day retention underestimates users-who-ever-return ~3.5x.
- Day-boundary mechanics: rolling 24h windows from each user's start event (Amplitude default,
  timezone-independent) vs strict calendar dates in project timezone (Mixpanel). Calendar-day D1
  counts a 23:50 install returning 00:10 as retained 20 minutes later. This is why tool numbers
  disagree with your own SQL.
- Checkpoint diagnostics: D1 = onboarding/first-session value. D7 = habit formation (covers one
  full weekly cycle, neutralizes weekday effects). D14 = trial boundary / content depth. D30 =
  established habit + monetization horizon. Games often use D28 (exactly 4 weeks, avoids weekday mix).
- Stickiness = DAU/MAU. ~20% good consumer app; 50%+ = daily-habit (the Facebook legend; Andrew
  Chen "magic metric"); gaming 20-50%; SaaS 10-25%. Pitfalls: meaningless for non-daily-cadence
  products (use WAU/MAU, ~60%+ healthy for weekly SaaS); a ratio can RISE while the product declines
  (MAU shrinking faster than DAU); hides the distribution - fix is the L28 power-user curve.
- Ecommerce activity retention nearly meaningless - use purchase-based cohorts. Repeat purchase
  rate = customers with >=2 orders / all customers; cross-industry average ~28.2% (9.9% luxury to
  65% grocery); ~76% of second orders arrive within 90 days (Rivo/Opensend). Median inter-purchase
  interval 73-120 days sets the churn-window granularity.
- Non-subscription churn definitions: inactivity window (60/90/120d or a multiple of the customer's
  own inter-purchase time) or probabilistic P(alive) via BTYD.
- Amplitude Retention Lifecycle: actives = new + current + resurrected; each state gets its own
  retention curve. Growth accounting: MAU_t = new + retained + resurrected; delta MAU = new +
  resurrected - churned. Quick ratio (consumer) = (new + resurrected) / churned; 1.5-2.0 very good.

### Benchmarks (cite honestly, with vintage)
- Legacy game rule 40/20/10 (D1/D7/D30) - real long-standing heuristic, attribution murky
  (Flurry-era); TODAY marks top-quartile/decile, not average. Teach as folklore-with-real-use.
- GameAnalytics 2025 benchmarks (11,600 games, 1.48B MAU): median D1 ~22-27% (top quartile >30%,
  bottom ~10-11.5%); median D7 ~3.4-3.9% (top quartile 7-8%); 75% of games have D28 < 3%.
  A realistic "good" 2026 profile ~35/15/5. Puzzle genre ~31.9/12.2/5.4; hyper-casual leads D1,
  collapses by D30.
- Andrew Chen / Quettra: the average app loses 77% of DAU within 3 days, 90% within 30 days.

### Models
- Curve shapes: declining-to-asymptote = durable retained base (good); smile = resurrection (best);
  sloping-to-zero = leaky bucket, no PMF (Sequoia, Reforge). Casey Winters: flattened retention
  curve of the key action at the designated frequency + MoM new-customer growth = true PMF.
- Survival analysis: handles right-censoring (still-active customers). Kaplan-Meier S(t); Cox PH
  gives hazard ratios (e.g. "month-to-month contract = ~3x churn hazard" on Telco data). Python:
  lifelines (KaplanMeierFitter, CoxPHFitter, check_assumptions, C-index).
- BTYD for non-contractual: BG/NBD (Fader-Hardie-Lee 2005; Poisson purchasing, Beta dropout after
  each purchase), Pareto/NBD (1987), Gamma-Gamma for monetary value (assumes value independent of
  frequency - often violated, say so). Inputs recency/frequency/T; outputs P(alive), expected
  transactions, CLV. Failure modes: irreversible dropout breaks on resurrection/seasonality/promos;
  one-time buyers look "alive" under BG/NBD. The `lifetimes` library is ARCHIVED (maintenance mode)
  - teach its API but flag status; successor is PyMC-Marketing's CLV module.
- ML churn: feature window strictly precedes label window; overlap = leakage (including the
  cancellation event, post-cutoff activity). Logistic regression baseline then XGBoost/LightGBM.
  Imbalanced classes: precision-recall over accuracy; threshold from intervention economics. SHAP
  for drivers. CRITICAL caveat (Ascarza): prediction != prevention - highest-risk customers are
  often unpersuadable; uplift modeling targets persuadables; blanket discounts waste money on
  would-stay-anyway customers.
- RFM: quintile scores via qcut/NTILE(5), codes (555 = Champions), personas Champions/Loyal/
  At-Risk/Hibernating (Hughes 1994). Doubles as BTYD input.
- L28 power-user curve: histogram of active days per 28-day window; smile shape = hardcore daily
  segment exists; Facebook growth origin, popularized via a16z (Li Jin authored the a16z post;
  Andrew Chen hosts the related essay - do not conflate).
- LTV: simple = ARPU x margin / churn (constant-churn assumption OVERSTATES since churn falls with
  tenure); honest ground truth = cumulative cohort gross profit over 12-36 months. LTV:CAC 3:1
  classic benchmark (David Skok). SaaS quick ratio (Mamoon Hamid) = (New + Expansion MRR) /
  (Churned + Contraction MRR), >=4 investable. NRR > 100% = growth with zero new sales.

### Visualization
- Cohort triangle heatmap: rows = cohort month, cols = period number (period 0 = 100%), lower-right
  legitimately empty (immature, not missing). THREE scan directions: across a row = one cohort
  aging; down a column = cohorts compared at same age (cleanest onboarding-improvement read);
  diagonal = calendar time (vertical stripe = lifecycle-stage event e.g. month-2 paywall; diagonal
  stripe = calendar event: outage, price change, seasonality).
- Heatmap craft: single-hue sequential cmap anchored with vmin/vmax; annotate cells fmt='.0%';
  mask the future triangle (mask=pivot.isnull()); show cohort size alongside. Perceptually uniform
  + colorblind-safe cmaps: viridis/inferno/cividis/magma (cividis optimized for deuteranopia);
  single-hue Blues/Oranges fine for annotated tables. NEVER jet/rainbow; never red-green diverging
  (~8% of men; use blue-orange if diverging needed).
- Canonical pandas recipe (the course's spine code):
  cohort = groupby(customer).transform('min') on date -> to_period('M');
  period_number = (order_month - cohort).n;
  counts = pivot_table(index=cohort, columns=period_number, values=customer, aggfunc='nunique');
  retention = counts.divide(counts.iloc[:, 0], axis=0).
- Other charts: overlaid cohort curves (fade old grey, highlight newest 2-3); average curve only
  across cohorts old enough for that period (truncated-cohort bias otherwise - naive column means
  mix vintages); D1/D7/D30 trend-over-cohort-date lines with benchmark bands; layer-cake stacked
  revenue by cohort (investors read directly); growth-accounting waterfall (Jonathan Hsu / Social
  Capital) with quick-ratio rules at 1 and 4; KM survival curves; L28 histogram.
- Exec presentation: lead with ONE chart - layer-cake (revenue durability) or D30-by-cohort trend
  (are we improving?) - NOT the full triangle (analyst tool). Annotate the "so what" and event
  markers on the chart itself.

### Business cases (folklore-checked - use the labels)
- DOCUMENTED: Reichheld & Sasser HBR 1990 - cutting defections 5% raised profits 25-85% across
  studied industries (later Bain work stretched to 25-95%). Facebook "7 friends in 10 days"
  (Chamath, 2013 - with Mode's caveat: correlational threshold chosen for communicability, not
  causal). Slack "2,000 messages -> 93% stayed" (Butterfield, First Round Review). Duolingo: Jorge
  Mazal (ex-CPO) in Lenny's Newsletter - 7-bucket growth state machine (New/Current/Reactivated/
  Resurrected = DAU + At-risk WAU/At-risk MAU/Dormant), CURR (current-user retention rate) chosen
  as north star after sensitivity analysis showed ~5x the DAU impact of the next metric; CURR +21%,
  ~4.5x DAU over ~4 years; leaderboards lifted learning time +17%. Supercell soft-launch kills:
  Spooky Pop (2015), Smash Land (2015, killed despite positive feedback), 30+ titles total - judged
  against live-hit retention bars. Amazon Prime ~93% first-year renewal, ~98% after two years,
  members ~2x non-member spend (CIRP - THIRD-PARTY SURVEY estimates, partly selection effect: a
  teaching point). Sephora Beauty Insider ~46M members, ~80% of NA sales. Dollar Shave Club ~50%
  6-month retention (Second Measure transaction data), flattening cohort curves underpinned the
  $1B Unilever story. F2P economics: 2-5% of players ever pay; top 10% of payers ~64% of revenue,
  top 1% ~29% (Swrve) - retention precedes monetization.
- SEMI-FOLKLORE (teach flagged): "5-25x cheaper to retain than acquire" (HBR 2014 cites no study -
  a range, not a constant; the real mechanism is Reichheld 1990); Dropbox "one file in one folder"
  (no first-party writeup); 40/20/10 attribution; third-party Duolingo gamification stats
  ("12%->55%") are NOT first-party. "The Growth Handbook" is Intercom's book, NOT Duolingo's.
- McKinsey subscription ecommerce: ~40% of subscribers cancel, median ~125 days. Winback email
  reactivation realistically 10-30%. Returning customers ~21% of customers, ~44% of revenue.

### Stakeholder communication discipline
- Every retention readout answers: WHICH cohort, WHAT changed vs comparison cohort, MONEY impact
  (delta retention x cohort size x ARPU). Duolingo's sensitivity ranking is the model.
- Mix-shift / Simpson's paradox: blended retention can rise while every segment falls, if
  acquisition shifts toward a stickier channel. Always decompose before reporting a trend.
- Other traps: no denominator definition (all signups vs activated - different question);
  comparing calendar periods instead of cohort ages; celebrating D1 lifts that do not propagate
  to D30.

## Datasets

1. `data/game_telemetry.csv` + `data/ecommerce_orders.csv` - SYNTHETIC, generated by
   `data/generate_data.py` (seeded, reproducible). Player activity events with known
   shifted-beta-geometric ground truth (Fader-Hardie "How to Project Customer Retention") so
   curve shapes are controllable and answers checkable; ecommerce orders with repeat-purchase
   structure. Teach mechanics here first.
2. UCI Online Retail II (download link in pages; 1,067,371 rows, UK gift retailer, 2009-12 to
   2011-12). Real-world mess on purpose: C-prefix invoices = cancellations with negative Quantity;
   ~135k rows missing CustomerID (while the metadata claims none missing - itself a lesson); guest
   checkouts; wholesalers; a December-only first cohort. Used in a2/a8.
3. Cookie Cats (Kaggle, ~90k players, gate_30 vs gate_40, retention_1/retention_7) - referenced in
   a1/a7 for game D1/D7 and A/B framing. No event log, so no triangle from it.

## Session map

### Stakeholder track (s1-s4, 45 min each) - value-adding focus
| # | Title | Teaches | Sources |
|---|-------|---------|---------|
| s1 | Retention is the money metric | Leaky bucket vs compounding; Reichheld 1990 numbers; the honest version of "5-25x"; LTV:CAC, quick ratio, NRR in plain language; retention precedes monetization (F2P economics) | Reichheld/HBR, Skok, Hamid, Swrve |
| s2 | Read the chart, read the business | Cohort triangle 3 scan directions; curve shapes = PMF; benchmarks with vintage (40/20/10 vs 2025 medians); the frozen-history law in stakeholder terms; which ONE chart to ask for | Sequoia, Reforge, GameAnalytics 2025 |
| s3 | Levers that move retention | Duolingo CURR case end-to-end; Supercell kill gates; Prime/Sephora/DSC loyalty economics; winback; folklore scorecard (what is documented vs legend) | Lenny's/Mazal, PocketGamer, CIRP, Second Measure |
| s4 | Asking the right questions of your DA | Which-cohort/what-changed/money-impact framing; mix-shift trap (interactive); denominator questions; decision gates; what to demand in every readout | Brief 4 sec 6, Mode caveat |

### Analyst track (a1-a8, 45 min each) - Python build-along; running artifact = the retention report
| # | Title | Teaches | Interactive |
|---|-------|---------|-------------|
| a1 | Retention metrics, precisely | D1/7/14/30 forward-looking definitions; classic vs rolling vs bracket (with the frozen-history law and why rolling is banned for reporting); day boundaries/timezones; stickiness DAU/MAU + WAU/MAU; denominators | Metric-variant switcher: same events, 3 different "D7"s |
| a2 | The cohort table and heatmap (TEMPLATE PAGE) | Registration-month cohorts, month 0-10 retention; the canonical pandas recipe; seaborn heatmap craft (annot, mask, cmap); reading the triangle; immature-cell masking | Build-along on synthetic + Online Retail II |
| a3 | The retention viz gallery (SIMULATOR PAGE) | Overlaid curves; truncated-cohort bias; D30 trend lines; layer-cake; growth accounting + quick ratio; L28; exec-chart rules | retention-live.js: real in-browser cohort engine, levers + ad-spend anti-lever |
| a4 | Segmentation: who is retained | RFM scoring + personas; behavioral vs acquisition cohorts; stickiness by segment; power-user curve build | RFM build-along |
| a5 | Survival analysis | Censoring; KM curves; log-rank; Cox PH hazard ratios; lifelines; when cohort tables suffice | KM build-along (Telco) |
| a6 | CLV and buy-till-you-die | BG/NBD intuition + P(alive); Gamma-Gamma; lifetimes API (flag archived; PyMC-Marketing successor); failure modes | P(alive) walkthrough |
| a7 | Churn prediction that helps | Label/feature windows; leakage traps; XGBoost + SHAP; precision-recall + threshold economics; uplift caveat (predict != prevent) | Leakage spot-the-bug |
| a8 | Capstone: the retention report | Full pipeline on Online Retail II -> the stakeholder one-pager: which cohort, what changed, money impact; frozen-history reporting pattern (snapshot tables) | Ship-or-not scorecard |

## Honest not-covered-by-design
- Real-time/streaming retention pipelines, warehouse/dbt implementation (pointer to
  learn-data-pipelines / learn-analytics-engineering).
- Experiment design for retention interventions beyond framing (pointer to learn-experimentation).
- Deep uplift modeling implementation (caveat taught; method referenced).
- Subscription contract-revenue retention (NRR taught at concept level only).

## Fast-moving-content note
Benchmarks (GameAnalytics, CIRP, McKinsey) carry their vintage in-page. Re-verify before any
future delivery-year update.
