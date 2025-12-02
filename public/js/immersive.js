// Immersive GSAP Section Logic
// Requires GSAP, ScrollTrigger, Lenis loaded via CDN in index.html

(function initImmersive() {
  function start() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined")
      return;
    gsap.registerPlugin(ScrollTrigger);

    // Lenis (optional smooth scroll)
    if (typeof Lenis !== "undefined") {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: "vertical",
        smooth: true,
      });
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    const blocks = document.querySelectorAll(".content-block");
    const images = document.querySelectorAll(".visual-img");
    const visualCol = document.querySelector(".visual-col");

    // Initial clip setup
    images.forEach((img, i) => {
      gsap.set(img, {
        clipPath: i === 0 ? "inset(0% 0 0 0)" : "inset(100% 0 0 0)",
      });
    });

    // Refresh after load for layout correctness
    window.addEventListener("load", () => ScrollTrigger.refresh());

    blocks.forEach((block, i) => {
      // Active block indicator + background color tween
      ScrollTrigger.create({
        trigger: block,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => {
          if (self.isActive) {
            block.classList.add("active");
            gsap.to(visualCol, {
              backgroundColor: block.dataset.color,
              duration: 0.5,
            });
          } else {
            block.classList.remove("active");
          }
        },
      });

      // Reveal subsequent images via scroll scrub
      if (i > 0) {
        const target = images[i];
        gsap.to(target, {
          clipPath: "inset(0% 0 0 0)",
          ease: "none",
          scrollTrigger: {
            trigger: block,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
      }
    });
  }

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    start();
  } else {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  }
})();
