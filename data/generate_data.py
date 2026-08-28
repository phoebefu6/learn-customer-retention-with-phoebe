"""Generate the course's two synthetic datasets. Seeded and reproducible:
running this file always regenerates byte-identical CSVs.

  data/ecommerce_orders.csv  - 14 months of orders for a small shop, with
                               shifted-beta-geometric monthly churn (known ground
                               truth), a repeat-purchase structure, and a small
                               wholesaler segment (the a4 lesson: they eat averages).
  data/game_telemetry.csv    - 60 days of installs with daily activity events over
                               each player's first 30 days, built for D1/7/14/30.

Ground truth parameters are printed at the end so notebook answers can be checked.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from pathlib import Path

HERE = Path(__file__).parent
rng = np.random.default_rng(42)

# ---------------------------------------------------------------- ecommerce ---
# 4,000 retail customers joining across 12 months; while "alive" a customer
# orders in a month with probability p_order; after each month they churn with a
# personal theta drawn from Beta(a, b)  (sBG: Fader & Hardie, "How to Project
# Customer Retention"). 30 wholesalers order almost every month and rarely churn.
A_SBG, B_SBG = 1.1, 2.5
N_RETAIL, N_WHOLESALE = 4000, 30
START = pd.Timestamp("2025-06-01")
MONTHS = 14  # data window: 2025-06 .. 2026-07

rows = []
for cid in range(N_RETAIL):
    join_month = int(rng.integers(0, 12))
    theta = rng.beta(A_SBG, B_SBG)
    alive = True
    for m in range(join_month, MONTHS):
        if not alive:
            break
        n_orders = 1 if m == join_month else rng.binomial(2, 0.55)
        for _ in range(max(1, n_orders) if m == join_month else n_orders):
            day = int(rng.integers(0, 28))
            date = START + pd.DateOffset(months=m) + pd.Timedelta(days=day)
            value = float(np.round(rng.lognormal(3.55, 0.55), 2))
            rows.append((f"C{cid:05d}", date, value, "retail"))
        if rng.random() < theta:
            alive = False

for wid in range(N_WHOLESALE):
    join_month = int(rng.integers(0, 4))
    for m in range(join_month, MONTHS):
        for _ in range(int(rng.integers(3, 6))):
            day = int(rng.integers(0, 28))
            date = START + pd.DateOffset(months=m) + pd.Timedelta(days=day)
            value = float(np.round(rng.lognormal(5.4, 0.4), 2))
            rows.append((f"W{wid:03d}", date, value, "wholesale"))

orders = pd.DataFrame(rows, columns=["customer_id", "order_date", "order_value", "segment"])
orders = orders.sort_values(["order_date", "customer_id"]).reset_index(drop=True)
orders.to_csv(HERE / "ecommerce_orders.csv", index=False)

# ------------------------------------------------------------------- gaming ---
# 8,000 installs over 60 days. Day 0 is always active. Each player draws a
# per-day return propensity from Beta(0.9, 1.6); afterwards the daily return
# probability decays with age (habit fade), giving realistic D1/D7/D14/D30.
N_PLAYERS = 8000
G_START = pd.Timestamp("2026-06-01")

grows = []
for uid in range(N_PLAYERS):
    install = G_START + pd.Timedelta(days=int(rng.integers(0, 60)))
    stick = rng.beta(0.9, 1.6)          # per-player stickiness
    grows.append((f"P{uid:05d}", install, install, int(rng.integers(1, 6))))
    for d in range(1, 31):
        p_day = stick * (0.75 if d == 1 else 0.55 if d <= 3 else 0.38 if d <= 7 else 0.26 if d <= 14 else 0.18)
        if rng.random() < p_day:
            grows.append((f"P{uid:05d}", install, install + pd.Timedelta(days=d), int(rng.integers(1, 5))))

game = pd.DataFrame(grows, columns=["user_id", "install_date", "activity_date", "sessions"])
game = game.sort_values(["activity_date", "user_id"]).reset_index(drop=True)
game.to_csv(HERE / "game_telemetry.csv", index=False)

# --------------------------------------------------------------- ground truth -
print(f"ecommerce_orders.csv: {len(orders):,} rows, {orders.customer_id.nunique():,} customers "
      f"(sBG theta ~ Beta({A_SBG}, {B_SBG}); {N_WHOLESALE} wholesalers)")
print(f"game_telemetry.csv:   {len(game):,} rows, {game.user_id.nunique():,} players")
d1 = game.assign(day=(game.activity_date - game.install_date).dt.days)
base = game.user_id.nunique()
for n in (1, 7, 14, 30):
    print(f"  classic D{n}: {d1[d1.day == n].user_id.nunique() / base:.1%}")
