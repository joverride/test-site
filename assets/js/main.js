(() => {
  const root = document.documentElement;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Scroll progress: one rAF per frame at most, writes a single custom property */
  const progress = document.querySelector(".progress");
  let scrollQueued = false;

  const updateProgress = () => {
    scrollQueued = false;
    const max = root.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    root.style.setProperty("--p", p.toFixed(4));
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

  /* Pointer spotlight on catalog rows, batched with rAF */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".item-link").forEach((row) => {
      let frame = 0;
      let x = 0;
      let y = 0;

      row.addEventListener("pointermove", (e) => {
        const rect = row.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
        if (!frame) {
          frame = requestAnimationFrame(() => {
            frame = 0;
            row.style.setProperty("--mx", x + "px");
            row.style.setProperty("--my", y + "px");
          });
        }
      });
    });
  }

  updateProgress();
})();
