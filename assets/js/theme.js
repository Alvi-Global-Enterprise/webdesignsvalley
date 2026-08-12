// Pause ALL videos (keep sources; just stop playback)
function pauseAllVideos(swiper) {
  swiper.slides.forEach((slide) => {
    const video = slide.querySelector("video");
    if (video) video.pause();
    slide.classList.remove("is-playing");
  });
}

// Play ONLY active video (lazy-attach source the first time)
function playActiveVideo(swiper) {
  const activeSlide = swiper.slides[swiper.activeIndex];
  if (!activeSlide) return;

  const video = activeSlide.querySelector("video");
  if (!video) return;

  const source = video.querySelector("source");
  if (source) {
    if (!source.dataset.src && source.getAttribute("src")) {
      source.dataset.src = source.getAttribute("src");
    }
    if (source.dataset.src && !source.getAttribute("src")) {
      source.setAttribute("src", source.dataset.src);
      video.load();
    }
  }

  video.play()
    .then(() => {
      activeSlide.classList.add("is-playing");
    })
    .catch(() => {});
}

let aboutSlider = null;
if (document.querySelector(".about-slider")) {
  aboutSlider = new Swiper(".about-slider", {
    slidesPerView: 2,
    centeredSlides: false,
    loop: true,
    speed: 700,
    navigation: {
      nextEl: ".about-next",
      prevEl: ".about-prev",
    },
    breakpoints: {
      0: { slidesPerView: 1 },
      768: { slidesPerView: 1.3 },
      992: { slidesPerView: 2 }
    },
    on: {
      init: function () {
        // stash sources as data-src so inactive slides don't download video
        this.slides.forEach((slide, i) => {
          const source = slide.querySelector("video source");
          if (!source) return;
          if (!source.dataset.src) source.dataset.src = source.getAttribute("src") || "";
          if (i !== this.activeIndex) {
            source.removeAttribute("src");
            const v = slide.querySelector("video");
            if (v) v.load();
          }
        });
        playActiveVideo(this);
      },
      slideChangeTransitionStart: function () {
        pauseAllVideos(this);
      },
      slideChangeTransitionEnd: function () {
        playActiveVideo(this);
      }
    }
  });
}

const services = document.querySelectorAll(".service-item");

services.forEach(item => {

  item.addEventListener("mouseenter", () => {

    services.forEach(el => el.classList.remove("active"));

    item.classList.add("active");

  });

});

// ============================================================
// 7. PRICING SWIPER
// ============================================================
const swiperConfig = {
  slidesPerView: 1.1,
  spaceBetween: 18,
  pagination: { el: '.swiper-pagination', clickable: true },
  navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
  breakpoints: {
    320: { slidesPerView: 1, spaceBetween: 0 },
    575: { slidesPerView: 2, spaceBetween: 15 },
    768: { slidesPerView: 2.2, spaceBetween: 18 },
    992: { slidesPerView: 2.5, spaceBetween: 22 },
    1200: { slidesPerView: 3, spaceBetween: 20 }
  }
};
const swipers = {};
function ensurePricingSwiper(paneId) {
  if (swipers[paneId]) return swipers[paneId];
  const pane = document.getElementById(paneId);
  if (!pane) return null;
  const el = pane.querySelector('.pricing-swiper');
  if (!el) return null;
  swipers[paneId] = new Swiper(el, swiperConfig);
  return swipers[paneId];
}
// Only boot the visible pricing tab up-front
document.querySelectorAll('.tab-pane.active .pricing-swiper, .tab-pane.show .pricing-swiper').forEach((el) => {
  const pane = el.closest('.tab-pane');
  if (pane && pane.id) ensurePricingSwiper(pane.id);
});
// Fallback: first pricing swiper if none marked active
if (!Object.keys(swipers).length) {
  const first = document.querySelector('.tab-pane .pricing-swiper');
  if (first) {
    const pane = first.closest('.tab-pane');
    if (pane && pane.id) ensurePricingSwiper(pane.id);
  }
}

document.querySelectorAll('button[data-bs-toggle="tab"]').forEach((tabBtn) => {
  tabBtn.addEventListener('shown.bs.tab', (e) => {
    const targetSelector = e.target.getAttribute('data-bs-target');
    const paneId = targetSelector.replace('#', '');
    const sw = ensurePricingSwiper(paneId);
    if (sw) {
      sw.update();
      sw.slideTo(0, 0);
    }
  });
});

let testSlider = null;
if (document.querySelector(".testslider")) {
  testSlider = new Swiper(".testslider", {
    loop: true,
    centeredSlides: true,
    grabCursor: true,
    speed: 800,
    slidesPerView: 1.3,
    spaceBetween: -60,
    breakpoints: {
      768: { slidesPerView: 2.5, spaceBetween: -80 },
      1200: { slidesPerView: 3.5, spaceBetween: -130 }
    },
    autoplay: {
      delay: 3500,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    }
  });
}

(function () {
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------------- SMOOTH SCROLL (Lenis + GSAP sync) ---------------- */
  var ddlLenis = null;
  var preferReduced =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(max-width: 991px)").matches;
  function initLenis() {
    // Skip Lenis on mobile / reduced-motion — native scroll is much smoother/cheaper
    if (preferReduced || typeof Lenis === "undefined") return;
    ddlLenis = new Lenis({
      duration: 0.85,
      smoothWheel: true
    });

    ddlLenis.on("scroll", function () {
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.update();
    });

    if (typeof gsap !== "undefined") {
      gsap.ticker.add(function (time) {
        if (ddlLenis) ddlLenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(500, 33);
    } else {
      requestAnimationFrame(function raf(time) {
        if (ddlLenis) ddlLenis.raf(time);
        requestAnimationFrame(raf);
      });
    }
  }
  initLenis();

  /* ---------------- PRELOADER ---------------- */
  function initPreloader() {
    var logoText = document.getElementById("ddlLogoText");
    var counterEl = document.getElementById("ddlCounter");
    var bar = document.getElementById("ddlBar");
    var mask = document.getElementById("ddlMask");
    var preloader = document.getElementById("ddlPreloader");
    if (!preloader) return;

    document.documentElement.classList.add("ddl-loading");

    // split logo text into animated chars
    if (logoText) {
      var text = logoText.textContent;
      logoText.textContent = "";
      text.split("").forEach(function (ch) {
        var span = document.createElement("span");
        span.className = "ddl-char" + (ch === " " ? " space" : "");
        span.textContent = ch === " " ? "\u00A0" : ch;
        logoText.appendChild(span);
      });
    }

    var counter = { val: 0 };
    var chars = logoText ? logoText.querySelectorAll(".ddl-char") : [];
    if (chars.length) gsap.set(chars, { yPercent: 110 });

    var ring = document.querySelector(".ddl-preloader-ring");
    if (ring) {
      gsap.to(ring, { rotation: 360, duration: 6, ease: "none", repeat: -1, transformOrigin: "50% 50%" });
    }

    var tl = gsap.timeline({
      onComplete: function () {
        document.documentElement.classList.remove("ddl-loading");
        document.body.classList.add("ddl-loaded");
        if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
        if (mask && mask.parentNode) mask.parentNode.removeChild(mask);
      }
    });

    // Shorter preloader so first paint feels fast
    tl.to(chars, {
      yPercent: 0,
      duration: 0.35,
      ease: "power3.out",
      stagger: 0.018
    })
      .to(
        counter,
        {
          val: 100,
          duration: 0.7,
          ease: "power1.inOut",
          onUpdate: function () {
            if (counterEl) counterEl.textContent = Math.round(counter.val);
          }
        },
        "<"
      )
      .to(
        bar,
        {
          width: "100%",
          duration: 0.7,
          ease: "power1.inOut"
        },
        "<"
      )
      .to(chars, {
        yPercent: -110,
        duration: 0.25,
        ease: "power2.in",
        stagger: 0.012
      })
      .to(
        mask,
        {
          clipPath: "circle(0% at 50% 50%)",
          duration: 0.55,
          ease: "power4.inOut"
        },
        "-=0.05"
      )
      .to(
        preloader,
        {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out"
        },
        "<"
      )
      .fromTo(
        ".wrapper",
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: "power2.out" },
        "<"
      )
      .add(playHeroAnimation, "-=0.35");
  }

  // Don't wait for every image/video — start as soon as DOM + CSS/JS are ready
  if (document.readyState === "interactive" || document.readyState === "complete") {
    requestAnimationFrame(initPreloader);
  } else {
    document.addEventListener("DOMContentLoaded", initPreloader);
  }

  /* ---------------- HERO / BANNER ENTRANCE ---------------- */
  function playHeroAnimation() {
    if (typeof gsap === "undefined") return;

    var tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.to(".banner-bg img", {
      scale: 1,
      duration: 1.6,
      ease: "power2.out"
    })
      .from(
        ".banner_head h1",
        { yPercent: 110, opacity: 0, duration: 1, stagger: 0.05 },
        "-=1.3"
      )
      .from(
        ".banner_head p",
        { y: 30, opacity: 0, duration: 0.9 },
        "-=0.7"
      )
      .from(
        ".banner_head .banner-btn",
        { y: 20, opacity: 0, duration: 0.8 },
        "-=0.6"
      )
      .from(
        ".banner-content-img",
        { opacity: 0, scale: 0.85, duration: 1.2, ease: "power3.out" },
        "-=1"
      )
      .from(
        ".ban-logo .trusted-image .img",
        { y: 20, opacity: 0, stagger: 0.06, duration: 0.6 },
        "-=0.5"
      );

    // Skip endless hero loops on mobile / reduced-motion (saves GPU continuously)
    if (!preferReduced) {
      gsap.to(".banner-content-img img", {
        y: 12,
        duration: 4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        force3D: true
      });
    }
  }

  /* ---------------- CUSTOM CURSOR ---------------- */
  function initCursor() {
    var dot = document.getElementById("ddlCursorDot");
    var ring = document.getElementById("ddlCursorRing");
    if (!dot || !ring) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    var hasGsap = typeof gsap !== "undefined";
    var dotX = hasGsap ? gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" }) : null;
    var dotY = hasGsap ? gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" }) : null;
    var ringX = hasGsap ? gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3.out" }) : null;
    var ringY = hasGsap ? gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3.out" }) : null;

    window.addEventListener("mousemove", function (e) {
      if (hasGsap) {
        dotX(e.clientX);
        dotY(e.clientY);
        ringX(e.clientX);
        ringY(e.clientY);
      } else {
        dot.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px) translate(-50%,-50%)";
        ring.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px) translate(-50%,-50%)";
      }
    });

    document.addEventListener("mouseleave", function () {
      ring.classList.add("is-hidden");
      dot.classList.add("is-hidden");
    });
    document.addEventListener("mouseenter", function () {
      ring.classList.remove("is-hidden");
      dot.classList.remove("is-hidden");
    });

    var linkTargets = "a, button, .web-btn, input, textarea, [data-tilt]";
    var viewTargets = ".showcase-card, .work-img, .blog-main, .about-video";

    document.addEventListener("mouseover", function (e) {
      var viewEl = e.target.closest ? e.target.closest(viewTargets) : null;
      var linkEl = e.target.closest ? e.target.closest(linkTargets) : null;
      if (viewEl) {
        ring.classList.add("is-view");
        ring.classList.remove("is-link");
      } else if (linkEl) {
        ring.classList.add("is-link");
        ring.classList.remove("is-view");
      }
    });
    document.addEventListener("mouseout", function (e) {
      var toEl = e.relatedTarget;
      var stillOverInteractive =
        toEl && toEl.closest && (toEl.closest(linkTargets) || toEl.closest(viewTargets));
      if (!stillOverInteractive) {
        ring.classList.remove("is-link", "is-view");
      }
    });

    if (hasGsap) {
      window.addEventListener("mousedown", function () {
        gsap.to(ring, { scale: 0.8, duration: 0.2, ease: "power2.out" });
      });
      window.addEventListener("mouseup", function () {
        gsap.to(ring, { scale: 1, duration: 0.35, ease: "power3.out" });
      });
    }
  }
  initCursor();

  /* ---------------- MAGNETIC BUTTONS ---------------- */
  function initMagnetic() {
    if (typeof gsap === "undefined") return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    var magnets = document.querySelectorAll(".web-btn, .service-item .icon, .down-arrow");

    magnets.forEach(function (el) {
      var moveX = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
      var moveY = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        var relX = e.clientX - (rect.left + rect.width / 2);
        var relY = e.clientY - (rect.top + rect.height / 2);
        moveX(relX * 0.3);
        moveY(relY * 0.3);
      });
      el.addEventListener("mouseleave", function () {
        moveX(0);
        moveY(0);
      });
    });
  }
  initMagnetic();

  /* ---------------- 3D TILT ON HOVER ---------------- */
  function initTilt() {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    // Avoid attaching tilt to every pricing card (dozens of mousemove handlers)
    var tiltEls = document.querySelectorAll(
      "[data-tilt], .process-item, .service-item"
    );

    tiltEls.forEach(function (el) {
      el.style.transformStyle = "preserve-3d";
      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        var rotY = px * 10;
        var rotX = py * -10;
        if (typeof gsap !== "undefined") {
          gsap.to(el, {
            rotationX: rotX,
            rotationY: rotY,
            transformPerspective: 900,
            duration: 0.5,
            ease: "power2.out"
          });
        } else {
          el.style.transform =
            "perspective(900px) rotateX(" + rotX + "deg) rotateY(" + rotY + "deg)";
        }
      });
      el.addEventListener("mouseleave", function () {
        if (typeof gsap !== "undefined") {
          gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.6, ease: "power3.out" });
        } else {
          el.style.transform = "none";
        }
      });
    });
  }
  initTilt();

  /* ---------------- SCROLL REVEALS ---------------- */
  function initScrollReveals() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    // Generic reveal for anything explicitly flagged
    gsap.utils.toArray("[data-ddl-reveal]").forEach(function (el) {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 60 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" }
        }
      );
    });

    /* ---------- SITE-WIDE REVEALS (headings, cards, images, footer) ---------- */
    var revealGroups = [
      ".about .web-title, .about > .container > .row > .col-lg-4 p",
      ".services-head, .services-list .service-item",
      ".pricing-head",
      ".package-item",
      ".process-item",
      ".testi-box",
      ".info-item",
      ".trusted-image .img",
      ".about-slider-wrap",
      ".form-head, .contact-form-wrapper .form-group",
      ".footer .site-logo, .footer .info-item, .footer .social-links"
    ];

    revealGroups.forEach(function (selector) {
      var items = gsap.utils.toArray(selector);
      if (!items.length) return;
      ScrollTrigger.batch(items, {
        start: "top 88%",
        onEnter: function (batch) {
          gsap.fromTo(
            batch,
            { autoAlpha: 0, y: 50 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
              stagger: 0.1,
              overwrite: true
            }
          );
        },
        once: true
      });
      // avoid FOUC before ScrollTrigger evaluates
      gsap.set(items, { autoAlpha: 0, y: 50 });
    });

    // re-check batches after everything is set
    ScrollTrigger.refresh();
  }
  window.addEventListener("load", initScrollReveals);

  /* ---------------- PINNED 3-CARD HORIZONTAL SLIDER ---------------- */
  function initShowcaseSlider() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    var wrap = document.getElementById("showcasePinWrap");
    var track = document.getElementById("showcaseTrack");
    var dots = document.querySelectorAll("#showcaseDots span");
    if (!wrap || !track) return;

    ScrollTrigger.matchMedia({
      // Desktop / tablet-landscape: pin the section and slide 3 cards horizontally
      "(min-width: 992px)": function () {
        var slides = track.querySelectorAll(".showcase-slide");
        var total = slides.length;

        var st = ScrollTrigger.create({
          trigger: wrap,
          start: "top top+=90",
          end: function () {
            return "+=" + wrap.offsetWidth * (total - 1) * 0.9;
          },
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: function (self) {
            var idx = Math.min(total - 1, Math.round(self.progress * (total - 1)));
            dots.forEach(function (d, i) {
              d.classList.toggle("active", i === idx);
            });
          }
        });

        gsap.to(track, {
          xPercent: -100 * ((total - 1) / total),
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            start: "top top+=90",
            end: function () {
              return "+=" + wrap.offsetWidth * (total - 1) * 0.9;
            },
            scrub: 1
          }
        });

        return function () {
          st.kill();
        };
      },

      // Mobile / small tablet: simple stacked fade-in, no pin
      "(max-width: 991px)": function () {
        var slides = gsap.utils.toArray(".showcase-slide");
        slides.forEach(function (slide) {
          gsap.fromTo(
            slide,
            { autoAlpha: 0, y: 60 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: slide, start: "top 88%" }
            }
          );
        });
      }
    });
  }
  window.addEventListener("load", initShowcaseSlider);

  /* ---------------- FORM SECTION SVG ANIMATION ---------------- */
  function initFormSvgAnimation() {
    if (typeof gsap === "undefined") return;
    var svg = document.querySelector(".from-bg svg");
    if (!svg) return;
    var circles = svg.querySelectorAll("path");

    // continuous slow floating/breathing motion so it always reads as "alive"
    circles.forEach(function (c, i) {
      gsap.to(c, {
        y: (i % 2 === 0 ? -1 : 1) * (14 + (i % 5) * 4),
        x: (i % 3 === 0 ? 1 : -1) * (8 + (i % 4) * 3),
        duration: 4 + (i % 5),
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: i * 0.05
      });
    });

    // slow continuous rotation of the whole cluster
    gsap.to(svg, {
      rotation: 360,
      transformOrigin: "50% 50%",
      duration: 120,
      ease: "none",
      repeat: -1
    });

    // scroll-linked parallax drift as the form section is scrolled through
    if (typeof ScrollTrigger !== "undefined") {
      gsap.to(".from-bg", {
        y: -120,
        ease: "none",
        scrollTrigger: {
          trigger: "section.form",
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      });
    }
  }
  window.addEventListener("load", initFormSvgAnimation);

  /* ---------------- SMOOTH STICKY HEADER + SCROLL PROGRESS + BACK-TO-TOP ---------------- */
  function initScrollUI() {
    var header = document.querySelector(".header");
    var progress = document.getElementById("ddlScrollProgress");
    var toTop = document.getElementById("ddlToTop");
    var lastY = window.scrollY || 0;
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docH > 0 ? (y / docH) * 100 : 0;

      if (progress) progress.style.width = pct + "%";

      if (header) {
        if (y > 80) {
          header.classList.add("ddl-sticky");
          // hide header on fast scroll-down, reveal on scroll-up (smooth, non-jumpy)
          if (y > lastY + 4) {
            header.classList.add("ddl-hide");
          } else if (y < lastY - 4) {
            header.classList.remove("ddl-hide");
          }
        } else {
          header.classList.remove("ddl-sticky", "ddl-hide");
        }
      }

      if (toTop) {
        if (y > 500) toTop.classList.add("show");
        else toTop.classList.remove("show");
      }

      lastY = y;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();

    if (toTop) {
      toTop.addEventListener("click", function () {
        if (ddlLenis) {
          ddlLenis.scrollTo(0, { duration: 1.2 });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }
  }
  initScrollUI();

  /* ---------------- MENU LINK HOVER (sliding duplicate text) ---------------- */
  function initMenuHover() {
    var links = document.querySelectorAll(".ddl-nav-link span");
    links.forEach(function (span) {
      if (span.querySelector(".ddl-menu-inner")) return;
      var label = span.textContent;
      span.innerHTML =
        '<span class="ddl-menu-inner"><span>' +
        label +
        "</span><span>" +
        label +
        "</span></span>";
    });
  }
  initMenuHover();
})();
/* ---------------- COUNTER-UP FOR STAT NUMBERS (inner pages) ---------------- */
(function () {
  function animateCounter(el) {
    var raw = el.getAttribute("data-count") || el.textContent;
    var suffix = raw.replace(/[0-9]/g, "");
    var target = parseInt(raw.replace(/[^0-9]/g, ""), 10) || 0;
    var obj = { val: 0 };
    if (typeof gsap !== "undefined") {
      gsap.to(obj, {
        val: target,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: function () {
          el.textContent = Math.round(obj.val) + suffix;
        }
      });
    } else {
      el.textContent = target + suffix;
    }
  }

  function initCounters() {
    var items = document.querySelectorAll(".stat-item h3, [data-counter]");
    if (!items.length || typeof IntersectionObserver === "undefined") return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    items.forEach(function (el) {
      if (!el.hasAttribute("data-count")) {
        el.setAttribute("data-count", el.textContent.trim());
      }
      io.observe(el);
    });
  }
  window.addEventListener("load", initCounters);
})();

(function () {
  var burger = document.getElementById('ddlBurger');
  var closeBtn = document.getElementById('ddlMobileClose');
  var nav = document.getElementById('ddlMobileNav');
  var overlay = document.getElementById('ddlMobileOverlay');
  if (!burger || !nav || !overlay) return;

  function openNav() {
    nav.classList.add('is-open');
    overlay.classList.add('is-open');
    burger.classList.add('is-active');
    burger.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('ddl-nav-open');
  }

  function closeNav() {
    nav.classList.remove('is-open');
    overlay.classList.remove('is-open');
    burger.classList.remove('is-active');
    burger.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('ddl-nav-open');
  }

  burger.addEventListener('click', function () {
    nav.classList.contains('is-open') ? closeNav() : openNav();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeNav);
  overlay.addEventListener('click', closeNav);

  var links = nav.querySelectorAll('a');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', closeNav);
  }
  window.addEventListener('resize', function () {
    if (window.innerWidth > 991) closeNav();
  });
})();