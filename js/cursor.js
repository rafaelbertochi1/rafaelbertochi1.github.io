/* Rastro de pixels atrás do cursor (só com mouse e sem "reduzir movimento"). */
(function () {
  "use strict";

  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (document.documentElement.classList.contains("direto")) return;

  const COLORS = ["#5ce1e6", "#ffcc4d", "#7ee787"];
  const MAX = 24;
  const layer = document.createElement("div");
  layer.className = "trail";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  const pool = [];
  let lastX = -99;
  let lastY = -99;
  let n = 0;

  window.addEventListener("mousemove", (e) => {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (dx * dx + dy * dy < 120) return; // um pixel a cada ~11px de movimento
    lastX = e.clientX;
    lastY = e.clientY;

    const px = pool.length >= MAX ? pool.shift() : document.createElement("i");
    const size = n % 3 === 0 ? 6 : 4;
    // encaixa numa grade de 2px para manter o visual pixelado
    const x = Math.round(e.clientX / 2) * 2 - size / 2;
    const y = Math.round(e.clientY / 2) * 2 - size / 2;
    px.className = "trail__px";
    px.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${COLORS[n % COLORS.length]}`;
    void px.offsetWidth; // reinicia a animação quando o pixel é reaproveitado
    px.className = "trail__px is-on";
    if (!px.parentNode) layer.appendChild(px);
    pool.push(px);
    n++;
  }, { passive: true });
})();
