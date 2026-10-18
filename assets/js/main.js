(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* Scroll progress: at most one rAF per frame, one custom property */
  let scrollQueued = false;

  const updateProgress = () => {
    scrollQueued = false;
    const max = root.scrollHeight - window.innerHeight;
    root.style.setProperty("--p", (max > 0 ? window.scrollY / max : 0).toFixed(4));
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollQueued) {
        scrollQueued = true;
        requestAnimationFrame(updateProgress);
      }
    },
    { passive: true }
  );

  /* Ambient animations run only while visible and while the tab is in front */
  const liveObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => e.target.classList.toggle("is-live", e.isIntersecting));
    },
    { rootMargin: "80px" }
  );
  document.querySelectorAll("[data-live]").forEach((el) => liveObserver.observe(el));

  document.addEventListener("visibilitychange", () => {
    root.classList.toggle("is-hidden", document.hidden);
  });

  /* Vision text: wrap words so CSS scroll-driven animation can light them up */
  document.querySelectorAll("[data-words]").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((word, i) => {
      const span = document.createElement("span");
      span.className = "w";
      span.textContent = word;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  });

  /* Dental Journey: build the dental arches from a few trigonometric lines */
  const arch = document.querySelector(".arch");
  const NS = "http://www.w3.org/2000/svg";

  if (arch) {
    const teeth = 16;
    /* Parabolic arches: upper (side -1) and lower (side 1), 16 teeth each */
    [-1, 1].forEach((side) => {
      for (let i = 0; i < teeth; i++) {
        const t = (i + 0.5) / teeth;
        const u = 2 * t - 1;
        const x = 300 + 250 * u;
        const y = 180 + side * (16 + 112 * (1 - u * u));
        const angle = (Math.atan2(-side * 2 * 112 * u, 250) * 180) / Math.PI;
        const w = 18 + 10 * u * u;
        const h = 34 - 4 * u * u;

        const g = document.createElementNS(NS, "g");
        g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})`);

        const r = document.createElementNS(NS, "rect");
        r.setAttribute("class", "tooth");
        r.setAttribute("x", (-w / 2).toFixed(1));
        r.setAttribute("y", (-h / 2).toFixed(1));
        r.setAttribute("width", w.toFixed(1));
        r.setAttribute("height", h.toFixed(1));
        r.setAttribute("rx", "7");
        r.dataset.g = String(Math.min(5, Math.floor(t * 5) + 1));

        g.appendChild(r);
        arch.appendChild(g);
      }
    });

    /* Active stage follows the viewport centre */
    const story = document.querySelector(".story");
    const stages = Array.from(document.querySelectorAll(".stage"));

    const stageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const n = Number(e.target.dataset.n);
          story.dataset.stage = String(n);
          stages.forEach((s) => {
            const sn = Number(s.dataset.n);
            s.classList.toggle("is-active", sn === n);
            s.classList.toggle("is-done", sn < n);
          });
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    stages.forEach((s) => stageObserver.observe(s));
    stages[0].classList.add("is-active");
  }

  if (finePointer && !reduceMotion) {
    /* Hero: pointer parallax and glow, active only while the hero is on screen */
    const hero = document.querySelector(".hero");
    let heroFrame = 0;
    let hx = 0;
    let hy = 0;

    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      hx = e.clientX - r.left;
      hy = e.clientY - r.top;
      if (!heroFrame) {
        heroFrame = requestAnimationFrame(() => {
          heroFrame = 0;
          hero.style.setProperty("--gx", hx + "px");
          hero.style.setProperty("--gy", hy + "px");
          hero.style.setProperty("--px", (hx / r.width - 0.5).toFixed(3));
          hero.style.setProperty("--py", (hy / r.height - 0.5).toFixed(3));
        });
      }
    });

    /* Featured product tile: tilt and light that follow the pointer */
    document.querySelectorAll("[data-tilt]").forEach((tile) => {
      let frame = 0;
      let nx = 0;
      let ny = 0;

      tile.addEventListener("pointermove", (e) => {
        const r = tile.getBoundingClientRect();
        nx = (e.clientX - r.left) / r.width;
        ny = (e.clientY - r.top) / r.height;
        if (!frame) {
          frame = requestAnimationFrame(() => {
            frame = 0;
            tile.style.setProperty("--rx", ((0.5 - ny) * 6).toFixed(2) + "deg");
            tile.style.setProperty("--ry", ((nx - 0.5) * 8).toFixed(2) + "deg");
            tile.style.setProperty("--sx", (nx * 100).toFixed(1) + "%");
            tile.style.setProperty("--sy", (ny * 100).toFixed(1) + "%");
          });
        }
      });

      tile.addEventListener("pointerleave", () => {
        tile.style.setProperty("--rx", "0deg");
        tile.style.setProperty("--ry", "0deg");
      });
    });
  }

  updateProgress();
})();
