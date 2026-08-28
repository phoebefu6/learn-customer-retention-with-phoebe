/* retention-live.js - real in-browser cohort retention engine for
   learn-customer-retention-with-phoebe. Three widgets:
     1. #rl-sim      - the flatten-the-curve simulator (a3, s2 embed)
     2. #rl-variants - classic vs rolling vs bracket D7 switcher (a1)
     3. #rl-mixshift - the mix-shift / Simpson's paradox trap (s4, a3)
   Honesty rail: user BEHAVIOR is simulated (a known churn model with fixed seed);
   the cohort MATH on top is real - the same counting you write in pandas.
   All numbers are deterministic for a given lever combination. */
(function () {
  "use strict";

  /* ---------- seeded RNG (mulberry32) ---------- */
  function rng(seed) {
    var t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Kumaraswamy(a,b) draw - analytic inverse, stands in for a Beta churn prob */
  function drawTheta(u, a, b) {
    return Math.pow(1 - Math.pow(1 - u, 1 / b), 1 / a);
  }

  /* =====================================================================
     WIDGET 1 - the cohort simulator
     12 monthly registration cohorts, per-user heterogeneous churn (sBG-style).
     Levers change the GENERATING model; the triangle is then counted for real.
     ===================================================================== */
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var N_COHORTS = 12, N_PERIODS = 12, BASE_N = 1000, ARPU = 6;

  function simulate(levers) {
    var size = levers.adspend ? Math.round(BASE_N * 1.8) : BASE_N;
    /* counts[c][p] = users of cohort c active in period p (period 0 = join month) */
    var counts = [], mau = [];
    for (var c = 0; c < N_COHORTS; c++) {
      counts.push(new Array(N_PERIODS).fill(0));
    }
    for (c = 0; c < N_COHORTS; c++) {
      var r = rng(4242 + c * 97); /* seed per cohort, independent of levers */
      var horizon = N_COHORTS - c; /* periods observable before "today" (end of Dec) */
      for (var i = 0; i < size; i++) {
        var theta = drawTheta(r(), 0.65, 1.7);
        if (levers.habit) theta *= 0.72;
        var alive = true, activated = levers.ftue ? true : (r() > 0.28);
        counts[c][0]++;
        for (var p = 1; p < horizon; p++) {
          if (alive) {
            if (p === 1 && !activated) { alive = false; }
            else {
              var th = theta;
              if (levers.loyalty && p > 3) th *= 0.4;
              if (r() < th) alive = false;
            }
          } else if (levers.winback && r() < 0.06) {
            alive = true;            /* resurrected this month */
            theta *= 0.9;
          }
          if (alive) counts[c][p]++;
        }
      }
    }
    /* MAU per calendar month m = sum over cohorts c<=m of counts[c][m-c] */
    for (var m = 0; m < N_COHORTS; m++) {
      var tot = 0;
      for (c = 0; c <= m; c++) tot += counts[c][m - c];
      mau.push(tot);
    }
    return { counts: counts, mau: mau, size: size };
  }

  function retentionMatrix(sim) {
    var ret = [];
    for (var c = 0; c < N_COHORTS; c++) {
      var row = [];
      for (var p = 0; p < N_PERIODS; p++) {
        row.push(p < N_COHORTS - c ? sim.counts[c][p] / sim.counts[c][0] : null);
      }
      ret.push(row);
    }
    return ret;
  }

  function heatColor(v) {
    /* white -> ember ramp; returns [bg, ink] */
    var stops = [
      [1.00, "#FDF9F5"], [0.85, "#FBE3D2"], [0.65, "#F6C39E"],
      [0.45, "#EE9A66"], [0.30, "#E06A2E"], [0.18, "#C2410C"],
      [0.08, "#9A3412"], [0.00, "#7C2D12"]
    ];
    var t = Math.max(0, Math.min(1, v));
    for (var i = 0; i < stops.length - 1; i++) {
      if (t <= stops[i][0] && t >= stops[i + 1][0]) {
        return [t >= 0.5 ? stops[i][1] : stops[i + 1][1], t < 0.28 ? "#FFFFFF" : "#241A12"];
      }
    }
    return ["#FDF9F5", "#241A12"];
  }

  function fmtPct(v) { return v === null ? "" : Math.round(v * 100) + "%"; }

  function renderSim(root) {
    var levers = { ftue: false, habit: false, loyalty: false, winback: false, adspend: false };
    var LEVER_DEFS = [
      ["ftue", "Fix onboarding (FTUE)", "Every new user reaches the core action in session one. Moves month-1 retention: the D1 lever."],
      ["habit", "Habit hook (streaks + triggers)", "A reason to come back this week. Lowers everyone's monthly churn probability: the D7 lever."],
      ["loyalty", "Loyalty program", "Users who make it past month 3 get locked in. Raises the ASYMPTOTE, the flat part of the curve."],
      ["winback", "Winback campaign", "Churned users get a reactivation nudge each month. Resurrection: the only lever that bends the curve back UP."]
    ];
    root.innerHTML = "";
    var head = el("div", "rl-head");
    var hl = el("div", "rl-headline");
    head.appendChild(hl);
    root.appendChild(head);

    var bar = el("div", "rl-levers");
    LEVER_DEFS.forEach(function (d) {
      bar.appendChild(leverBtn(d[0], d[1], d[2], false));
    });
    bar.appendChild(leverBtn("adspend", "Double ad spend", "Buys 80% more signups per cohort. Watch which of the two numbers it moves - and which it cannot.", true));
    root.appendChild(bar);

    var grid = el("div", "rl-gridwrap");
    root.appendChild(grid);
    var curveWrap = el("div", "rl-curvewrap");
    root.appendChild(curveWrap);
    var note = el("p", "rl-note");
    note.textContent = "User behavior is simulated from a fixed-seed churn model so every lever combination gives the same numbers; the cohort table above it is counted for real, exactly like your pandas pivot. Empty lower-right cells are cohorts whose window has not completed yet - immature, never 'low'.";
    root.appendChild(note);

    function leverBtn(key, label, tip, anti) {
      var b = el("button", "rl-lever" + (anti ? " rl-anti" : ""));
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = "<strong>" + label + "</strong><span>" + tip + "</span>";
      b.addEventListener("click", function () {
        levers[key] = !levers[key];
        b.setAttribute("aria-pressed", String(levers[key]));
        b.classList.toggle("rl-on", levers[key]);
        update();
      });
      return b;
    }

    function update() {
      var sim = simulate(levers);
      var ret = retentionMatrix(sim);
      /* headline: Jan-cohort month-6 retention + Dec MAU (the two-number headline) */
      var m6 = ret[0][6], mauDec = sim.mau[11];
      var money = Math.round(sim.counts[0][6] * ARPU);
      hl.innerHTML =
        "<div class='rl-big'><span class='rl-num'>" + Math.round(m6 * 100) + "%</span>" +
        "<span class='rl-lbl'>Jan cohort still active in month 6</span></div>" +
        "<div class='rl-big'><span class='rl-num'>" + mauDec.toLocaleString() + "</span>" +
        "<span class='rl-lbl'>MAU in December</span></div>" +
        "<div class='rl-big'><span class='rl-num'>$" + money.toLocaleString() + "</span>" +
        "<span class='rl-lbl'>Jan cohort revenue in month 6 (at $" + ARPU + " ARPU)</span></div>";

      /* heatmap */
      var h = "<table class='rl-grid'><thead><tr><th>Cohort</th><th>Size</th>";
      for (var p = 0; p < N_PERIODS; p++) h += "<th>M" + p + "</th>";
      h += "</tr></thead><tbody>";
      for (var c = 0; c < N_COHORTS; c++) {
        h += "<tr><th>" + MONTHS[c] + "</th><td class='rl-size'>" + sim.counts[c][0].toLocaleString() + "</td>";
        for (p = 0; p < N_PERIODS; p++) {
          var v = ret[c][p];
          if (v === null) { h += "<td class='rl-empty' title='window not completed yet'></td>"; }
          else {
            var col = heatColor(v);
            h += "<td style='background:" + col[0] + ";color:" + col[1] + "'>" + fmtPct(v) + "</td>";
          }
        }
        h += "</tr>";
      }
      h += "</tbody></table>";
      grid.innerHTML = h;

      /* curves: retention by period, one polyline per cohort with >=7 periods, plus Jan bold */
      var W = 560, H = 220, padL = 40, padB = 24, padT = 10;
      var sx = function (p) { return padL + p * ((W - padL - 8) / (N_PERIODS - 1)); };
      var sy = function (v) { return padT + (1 - v) * (H - padT - padB); };
      var svg = "<svg viewBox='0 0 " + W + " " + H + "' role='img' aria-label='Retention curves by cohort'>";
      [0, 0.25, 0.5, 0.75, 1].forEach(function (g) {
        svg += "<line x1='" + padL + "' y1='" + sy(g) + "' x2='" + (W - 8) + "' y2='" + sy(g) + "' stroke='#EFE2D6' stroke-width='1'/>" +
               "<text x='" + (padL - 6) + "' y='" + (sy(g) + 4) + "' text-anchor='end' font-size='10' fill='#6B5D52'>" + Math.round(g * 100) + "%</text>";
      });
      for (var cc = 5; cc >= 0; cc--) {
        var pts = [];
        for (p = 0; p < N_COHORTS - cc; p++) pts.push(sx(p) + "," + sy(ret[cc][p]));
        svg += "<polyline points='" + pts.join(" ") + "' fill='none' stroke='" +
          (cc === 0 ? "#C2410C" : "#D3C4B8") + "' stroke-width='" + (cc === 0 ? 3 : 1.5) + "'/>";
      }
      for (p = 0; p < N_PERIODS; p += 2) {
        svg += "<text x='" + sx(p) + "' y='" + (H - 6) + "' text-anchor='middle' font-size='10' fill='#6B5D52'>M" + p + "</text>";
      }
      svg += "</svg>";
      curveWrap.innerHTML = "<div class='rl-curvecap'>Retention curve per cohort (Jan in ember, later cohorts in sand). The shape is the diagnosis: sloping to zero = leaky bucket, flattening = a durable base, bending up = resurrection.</div>" + svg;
    }
    update();
  }

  /* =====================================================================
     WIDGET 2 - classic vs rolling vs bracket: three different "D7"s
     One fixed simulated event log; three REAL computations over it.
     ===================================================================== */
  function computeVariants() {
    var N = 400, r = rng(777);
    /* generate: each user has activity days over 30 days from a per-user pattern */
    var users = [];
    for (var i = 0; i < N; i++) {
      var theta = drawTheta(r(), 0.7, 1.6);
      var days = [];
      for (var d = 1; d <= 30; d++) {
        var pBack = (1 - theta) * (d <= 3 ? 0.7 : d <= 10 ? 0.35 : 0.22);
        if (r() < pBack) days.push(d);
      }
      users.push(days);
    }
    return {
      N: N,
      classic: users.filter(function (u) { return u.indexOf(7) >= 0; }).length,
      rolling: users.filter(function (u) { return u.some(function (d) { return d >= 7; }); }).length,
      bracket: users.filter(function (u) { return u.some(function (d) { return d >= 1 && d <= 7; }); }).length
    };
  }

  function renderVariants(root) {
    var v0 = computeVariants();
    var N = v0.N, classic = v0.classic, rolling = v0.rolling, bracket = v0.bracket;
    var defs = [
      ["Classic D7", classic, "came back on exactly day 7", "The benchmark standard. Conservative: day 6 and day 8 visits do not count. FROZEN once day 7 passes - never restates."],
      ["Rolling D7", rolling, "came back on day 7 or ANY later day", "Always the biggest number - and it keeps GROWING retroactively: a user returning on day 45 flips history. Never use for reporting."],
      ["Bracket W1", bracket, "came back within days 1-7", "The window metric. Frozen once the window closes. Right choice when the product has a weekly cadence."]
    ];
    var html = "<div class='rl-vrow'>";
    defs.forEach(function (v, ix) {
      html += "<button type='button' class='rl-vcard" + (ix === 0 ? " rl-on" : "") + "' data-ix='" + ix + "'>" +
        "<span class='rl-vnum'>" + Math.round(v[1] / N * 100) + "%</span>" +
        "<strong>" + v[0] + "</strong><em>" + v[2] + "</em></button>";
    });
    html += "</div><p class='rl-vexpl'></p><p class='rl-note'>Same " + N + " simulated users, same fixed event log, three honest computations - and three different 'D7 retention' numbers. Whenever a stakeholder quotes retention, the first question is: which one?</p>";
    root.innerHTML = html;
    var expl = root.querySelector(".rl-vexpl");
    var cards = root.querySelectorAll(".rl-vcard");
    function pick(ix) {
      cards.forEach(function (c, j) { c.classList.toggle("rl-on", j === ix); });
      expl.textContent = defs[ix][3];
    }
    cards.forEach(function (c) {
      c.addEventListener("click", function () { pick(parseInt(c.getAttribute("data-ix"), 10)); });
    });
    pick(0);
  }

  /* =====================================================================
     WIDGET 3 - the mix-shift trap (Simpson's paradox)
     Blended retention RISES while BOTH segments fall.
     ===================================================================== */
  function renderMixshift(root) {
    var qs = ["Q1", "Q2", "Q3", "Q4"];
    var organicShare = [0.30, 0.45, 0.60, 0.70];
    var organicRet = [0.42, 0.41, 0.39, 0.38];
    var paidRet = [0.16, 0.15, 0.13, 0.12];
    var blended = qs.map(function (_, i) {
      return organicShare[i] * organicRet[i] + (1 - organicShare[i]) * paidRet[i];
    });
    var shown = false;
    root.innerHTML = "";
    var wrap = el("div", "rl-mix");
    root.appendChild(wrap);
    var btn = el("button", "rl-lever rl-mixbtn");
    btn.type = "button";
    btn.innerHTML = "<strong>Decompose by channel</strong><span>ask the question a good stakeholder always asks</span>";
    btn.addEventListener("click", function () { shown = !shown; draw(); btn.classList.toggle("rl-on", shown); });
    root.appendChild(btn);
    function bars(vals, color, label) {
      var out = "<div class='rl-mixrow'><span class='rl-mixlbl'>" + label + "</span><div class='rl-mixbars'>";
      vals.forEach(function (v, i) {
        out += "<div class='rl-mixbar'><i style='height:" + Math.round(v * 180) + "px;background:" + color + "'></i><b>" + Math.round(v * 100) + "%</b><u>" + qs[i] + "</u></div>";
      });
      return out + "</div></div>";
    }
    function draw() {
      var h = bars(blended, "#C2410C", "Blended M1 retention (what the dashboard shows)");
      if (shown) {
        h += bars(organicRet, "#0F766E", "Organic only - FALLING") + bars(paidRet, "#6B5D52", "Paid only - FALLING");
        h += "<p class='rl-vexpl'>Both channels got WORSE every quarter. The blended number rose only because the acquisition mix shifted toward organic (30% to 70% of signups), the stickier channel. Averages follow the mix, not the product. Always decompose before celebrating.</p>";
      } else {
        h += "<p class='rl-vexpl'>Retention improved four quarters straight. Ship the victory slide?</p>";
      }
      wrap.innerHTML = h;
    }
    draw();
  }

  /* ---------- helpers + mount ---------- */
  function el(tag, cls) { var e = document.createElement(tag); e.className = cls; return e; }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", function () {
      var s = document.getElementById("rl-sim");
      if (s) renderSim(s);
      var v = document.getElementById("rl-variants");
      if (v) renderVariants(v);
      var m = document.getElementById("rl-mixshift");
      if (m) renderMixshift(m);
    });
  } else {
    /* headless (node) test hook - lets the build verify canon numbers from the real engine */
    globalThis.RL = { simulate: simulate, retentionMatrix: retentionMatrix, rng: rng, drawTheta: drawTheta, computeVariants: computeVariants };
  }
})();
