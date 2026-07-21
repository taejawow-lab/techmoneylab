/* ============================================================
   테크머니랩 — 인터랙션
   ============================================================ */
(function () {
  "use strict";

  /* ---------- THEME ---------- */
  var root = document.documentElement;
  var stored = localStorage.getItem("tml-theme");
  if (stored) root.setAttribute("data-theme", stored);

  function toggleTheme() {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("tml-theme", next);
    syncThemeIcon();
  }
  function syncThemeIcon() {
    var dark = root.getAttribute("data-theme") === "dark";
    document.querySelectorAll("[data-theme-icon]").forEach(function (el) {
      el.querySelector(".i-sun").style.display = dark ? "block" : "none";
      el.querySelector(".i-moon").style.display = dark ? "none" : "block";
    });
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-theme-toggle]")) toggleTheme();
  });
  syncThemeIcon();

  /* ---------- BOOKMARKS ---------- */
  var saved = JSON.parse(localStorage.getItem("tml-saved") || "[]");
  function isSaved(id) { return saved.indexOf(id) !== -1; }
  function renderBookmarks() {
    document.querySelectorAll("[data-bm]").forEach(function (btn) {
      btn.classList.toggle("saved", isSaved(btn.getAttribute("data-bm")));
    });
    var counter = document.querySelector("[data-saved-count]");
    if (counter) counter.textContent = saved.length;
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-bm]");
    if (!btn) return;
    e.preventDefault();
    var id = btn.getAttribute("data-bm");
    var i = saved.indexOf(id);
    if (i === -1) saved.push(id); else saved.splice(i, 1);
    localStorage.setItem("tml-saved", JSON.stringify(saved));
    renderBookmarks();
  });
  renderBookmarks();

  /* ---------- CATEGORY FILTER ---------- */
  document.addEventListener("click", function (e) {
    var chip = e.target.closest("[data-filter]");
    if (!chip) return;
    var cat = chip.getAttribute("data-filter");
    document.querySelectorAll("[data-filter]").forEach(function (c) { c.classList.remove("active"); });
    chip.classList.add("active");
    var rows = document.querySelectorAll("[data-cat]");
    var n = 0;
    rows.forEach(function (r) {
      var show = cat === "all" || r.getAttribute("data-cat") === cat;
      r.classList.toggle("hidden", !show);
      if (show) { n++; var num = r.querySelector(".pr-num"); if (num) num.textContent = "№ " + String(n).padStart(2, "0"); }
    });
    var cnt = document.querySelector("[data-recent-count]");
    if (cnt) cnt.textContent = n;
  });

  /* ---------- COMPOUND CALCULATOR (USD) ---------- */
  function usd(n) {
    n = Math.round(n);
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, "") + "M";
    if (n >= 1e3) return "$" + Math.round(n / 1e3).toLocaleString("en-US") + "k";
    return "$" + n.toLocaleString("en-US");
  }
  function fullUsd(n) { return "$" + Math.round(n).toLocaleString("en-US"); }

  var initEl = document.getElementById("c-initial");
  if (initEl) {
    var monthlyEl = document.getElementById("c-monthly");
    var rateEl = document.getElementById("c-rate");
    var yearsEl = document.getElementById("c-years");

    function calc() {
      var P = +initEl.value;          // starting balance ($)
      var M = +monthlyEl.value;       // monthly contribution ($)
      var r = +rateEl.value / 100;    // annual return
      var Y = +yearsEl.value;         // years
      var months = Y * 12;
      var mr = r / 12;
      // future value of initial + future value of monthly contributions
      var fvInit = P * Math.pow(1 + mr, months);
      var fvMonthly = mr === 0 ? M * months : M * ((Math.pow(1 + mr, months) - 1) / mr);
      var total = fvInit + fvMonthly;
      var principal = P + M * months;
      var profit = total - principal;

      document.getElementById("c-initial-v").textContent = fullUsd(P);
      document.getElementById("c-monthly-v").textContent = fullUsd(M);
      document.getElementById("c-rate-v").textContent = (+rateEl.value).toFixed(1) + "%";
      document.getElementById("c-years-v").textContent = Y + " yrs";

      document.getElementById("c-result").textContent = usd(total);
      document.getElementById("c-principal").textContent = usd(principal);
      document.getElementById("c-profit").textContent = "+" + usd(profit);
      document.getElementById("c-full").textContent = fullUsd(total);

      // bars: snapshot at 4 milestones
      var stops = [Math.max(1, Math.round(Y * 0.25)), Math.max(1, Math.round(Y * 0.5)), Math.max(1, Math.round(Y * 0.75)), Y];
      var vals = stops.map(function (y) {
        var m = y * 12;
        var fi = P * Math.pow(1 + mr, m);
        var fm = mr === 0 ? M * m : M * ((Math.pow(1 + mr, m) - 1) / mr);
        return fi + fm;
      });
      var max = vals[3] || 1;
      var bars = document.querySelectorAll(".calc-bars .bar");
      bars.forEach(function (bar, i) {
        var pct = Math.max(6, (vals[i] / max) * 100);
        bar.querySelector(".fill").style.height = pct + "%";
        bar.querySelector("span").textContent = stops[i] + "y";
      });
    }
    [initEl, monthlyEl, rateEl, yearsEl].forEach(function (el) {
      el.addEventListener("input", calc);
    });
    calc();
  }

  /* ---------- REVEAL ON SCROLL ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- TOC (article) ---------- */
  var toc = document.querySelector("[data-toc]");
  if (toc) {
    var heads = document.querySelectorAll("[data-h], [data-article-body] h2[id], [data-article-body] h3[id]");
    var links = toc.querySelectorAll("a");
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var id = en.target.getAttribute("id");
          links.forEach(function (l) { l.classList.toggle("active", l.getAttribute("href") === "#" + id); });
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    heads.forEach(function (h) { tio.observe(h); });

    // reading progress
    var bar = document.querySelector("[data-progress]");
    if (bar) {
      window.addEventListener("scroll", function () {
        var art = document.querySelector("[data-article-body]");
        if (!art) return;
        var top = art.offsetTop;
        var h = art.offsetHeight - window.innerHeight;
        var p = Math.min(100, Math.max(0, ((window.scrollY - top) / h) * 100));
        bar.style.width = p + "%";
      }, { passive: true });
    }
  }

  /* ---------- MOBILE MENU ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-menu-toggle]");
    if (t) {
      var drawer = document.getElementById("mobile-nav");
      var open = drawer.classList.toggle("open");
      t.setAttribute("aria-expanded", open ? "true" : "false");
      var bars = t.querySelector(".i-bars"), x = t.querySelector(".i-x");
      if (bars && x) { bars.style.display = open ? "none" : "block"; x.style.display = open ? "block" : "none"; }
      return;
    }
    // close drawer when a link inside is tapped
    if (e.target.closest("#mobile-nav a")) {
      var d = document.getElementById("mobile-nav");
      if (d) d.classList.remove("open");
      var btn = document.querySelector("[data-menu-toggle]");
      if (btn) { btn.setAttribute("aria-expanded", "false"); btn.querySelector(".i-bars").style.display = "block"; btn.querySelector(".i-x").style.display = "none"; }
    }
  });

  /* ---------- LIVE DATE ---------- */
  document.querySelectorAll("[data-today]").forEach(function (el) {
    var d = new Date();
    el.textContent = d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  });
})();
