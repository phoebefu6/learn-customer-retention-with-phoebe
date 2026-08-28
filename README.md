# learn-customer-retention-with-phoebe

A two-track interactive course on customer retention analytics, by Phoebe Fu.

**Live site:** https://phoebefu6.github.io/learn-customer-retention-with-phoebe/

## Tracks

- **Stakeholder track (s1-s4)** - no code. Why retention is the money metric, how to read the
  cohort triangle and curve shapes, which levers are documented to work (Duolingo, Supercell,
  Amazon Prime - folklore-checked), and the questions that turn a readout into a decision.
- **Analyst track (a1-a8)** - Python build-alongs with a runnable notebook per session.
  D1/7/14/30 retention defined precisely, the registration-cohort table and heatmap in pandas,
  the retention viz gallery, RFM segmentation, survival analysis (lifelines), CLV with
  buy-till-you-die models (lifetimes), churn prediction (XGBoost + SHAP), and a capstone
  retention report.

## The course-wide law

Every number is **forward-looking cohort retention with frozen history**: fix a base cohort by a
fixed anchor date, look forward 1/7/14/30 days (or months), and never restate a completed
window. Trailing look-back windows and rolling "day N or later" retention are taught as
concepts and banned from reporting.

## Repo layout

- `courses/` - the 12 session pages (static HTML, no build step)
- `assets/retention-live.js` - the in-browser cohort engine: the flatten-the-curve simulator,
  the metric-variant switcher, and the mix-shift trap (all deterministic, fixed seed)
- `notebooks/` - 8 executed companion notebooks, one per analyst session
- `data/` - synthetic datasets with known ground truth + `generate_data.py` (seeded; rerunning
  reproduces the CSVs exactly)
- `materials/official-course-map.md` - the verified fact base every page draws from

Sessions also use the real UCI Online Retail II dataset (downloaded separately; link in the
pages) for the gloriously messy second pass.

Part of [Learn with Phoebe](https://phoebefu6.github.io/learn-with-phoebe/).
