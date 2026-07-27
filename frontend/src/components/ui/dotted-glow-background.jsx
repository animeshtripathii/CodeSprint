import React, { useEffect, useRef, useState } from "react";

export const DottedGlowBackground = ({
  className,
  gap = 14,
  radius = 1.8,
  color = "rgba(255, 255, 255, 0.25)",
  darkColor = "rgba(255, 255, 255, 0.25)",
  glowColor = "rgba(255, 255, 255, 0.6)",
  darkGlowColor = "rgba(255, 255, 255, 0.6)",
  colorLightVar,
  colorDarkVar,
  glowColorLightVar,
  glowColorDarkVar,
  opacity = 0.85,
  backgroundOpacity = 0,
  speedMin = 0.4,
  speedMax = 1.4,
  speedScale = 1,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [resolvedColor, setResolvedColor] = useState(color);
  const [resolvedGlowColor, setResolvedGlowColor] = useState(glowColor);

  const resolveCssVariable = (el, variableName) => {
    if (!variableName) return null;
    const normalized = variableName.startsWith("--")
      ? variableName
      : `--${variableName}`;
    const fromEl = getComputedStyle(el)
      .getPropertyValue(normalized)
      .trim();
    if (fromEl) return fromEl;
    const root = document.documentElement;
    const fromRoot = getComputedStyle(root).getPropertyValue(normalized).trim();
    return fromRoot || null;
  };

  const detectDarkMode = () => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) return true;
    if (root.classList.contains("light")) return false;
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  };

  useEffect(() => {
    const container = containerRef.current ?? document.documentElement;

    const compute = () => {
      const isDark = detectDarkMode();

      let nextColor = color;
      let nextGlow = glowColor;

      if (isDark) {
        const varDot = resolveCssVariable(container, colorDarkVar);
        const varGlow = resolveCssVariable(container, glowColorDarkVar);
        nextColor = varDot || darkColor || nextColor;
        nextGlow = varGlow || darkGlowColor || nextGlow;
      } else {
        const varDot = resolveCssVariable(container, colorLightVar);
        const varGlow = resolveCssVariable(container, glowColorLightVar);
        nextColor = varDot || nextColor;
        nextGlow = varGlow || nextGlow;
      }

      setResolvedColor(nextColor);
      setResolvedGlowColor(nextGlow);
    };

    compute();

    const mql = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
    const handleMql = () => compute();
    mql?.addEventListener?.("change", handleMql);

    const mo = new MutationObserver(() => compute());
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      mql?.removeEventListener?.("change", handleMql);
      mo.disconnect();
    };
  }, [
    color,
    darkColor,
    glowColor,
    darkGlowColor,
    colorLightVar,
    colorDarkVar,
    glowColorLightVar,
    glowColorDarkVar,
  ]);

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const ctx = el.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let stopped = false;
    let isVisible = true;

    const dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 2);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      el.width = Math.max(1, Math.floor(width * dpr));
      el.height = Math.max(1, Math.floor(height * dpr));
      el.style.width = `${Math.floor(width)}px`;
      el.style.height = `${Math.floor(height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    let dots = [];

    const regenDots = () => {
      dots = [];
      const { width, height } = container.getBoundingClientRect();
      const cols = Math.ceil(width / gap) + 2;
      const rows = Math.ceil(height / gap) + 2;
      const min = Math.min(speedMin, speedMax);
      const max = Math.max(speedMin, speedMax);
      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const x = i * gap + (j % 2 === 0 ? 0 : gap * 0.5);
          const y = j * gap;
          const phase = Math.random() * Math.PI * 2;
          const span = Math.max(max - min, 0);
          const speed = min + Math.random() * span;
          dots.push({ x, y, phase, speed });
        }
      }
    };

    regenDots();

    let last = performance.now();

    const draw = (now) => {
      if (stopped) return;
      if (!isVisible) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const dt = (now - last) / 1000;
      last = now;
      const { width, height } = container.getBoundingClientRect();

      ctx.clearRect(0, 0, el.width, el.height);

      if (backgroundOpacity > 0) {
        const grad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.4,
          Math.min(width, height) * 0.1,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.7,
        );
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(
          1,
          `rgba(0,0,0,${Math.min(Math.max(backgroundOpacity, 0), 1)})`,
        );
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.save();
      ctx.fillStyle = resolvedColor;

      const time = (now / 1000) * Math.max(speedScale, 0);
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const mod = (time * d.speed + d.phase) % 2;
        const lin = mod < 1 ? mod : 2 - mod;
        const a = 0.2 + 0.7 * lin;

        if (a > 0.5) {
          const glow = (a - 0.5) / 0.5;
          ctx.shadowColor = resolvedGlowColor;
          ctx.shadowBlur = 8 * glow;
        } else {
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = a * opacity;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      resize();
      regenDots();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.1 },
    );
    observer.observe(container);

    window.addEventListener("resize", handleResize);
    raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      ro.disconnect();
    };
  }, [
    gap,
    radius,
    resolvedColor,
    resolvedGlowColor,
    opacity,
    backgroundOpacity,
    speedMin,
    speedMax,
    speedScale,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
};
