// Own drawn art for the cover, all painted in code: retro sun, palm silhouettes,
// skyline, halftone dots, film grain and vignette. No borrowed artwork anywhere.

/** Draws a retro sun: a disc cut by horizontal slits, low over the horizon. */
export function drawRetroSun(ctx, cx, cy, r, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const glow = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  glow.addColorStop(0, grade.sunCore);
  glow.addColorStop(0.55, grade.sun);
  glow.addColorStop(1, grade.skyMid);
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = grade.band;
  let y = cy + r * 0.05;
  let gap = r * 0.07;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap * 2.4;
    gap *= 1.35;
  }
  ctx.restore();
}

/** Draws one palm tree silhouette: a curved trunk and drooping fronds. */
export function drawPalm(ctx, x, y, h, lean, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  const topX = x + lean * h;
  const topY = y - h;
  ctx.lineWidth = Math.max(2, h * 0.035);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * h * 0.4, y - h * 0.55, topX, topY);
  ctx.stroke();
  const fronds = 7;
  for (let i = 0; i < fronds; i++) {
    const a = (-Math.PI * 0.08) - (i / (fronds - 1)) * Math.PI * 0.84;
    const len = h * (0.42 + 0.1 * Math.sin(i * 2.1));
    const fx = topX + Math.cos(a) * len;
    const fy = topY + Math.sin(a) * len * 0.55 + len * 0.28;
    ctx.lineWidth = Math.max(1.5, h * 0.02);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.5, topY + Math.sin(a) * len * 0.3, fx, fy);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX, topY, h * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draws a row of palms along a baseline, tallest at the edges, one small one mid-frame for depth. */
export function drawPalmRow(ctx, w, baseline, maxH, color, seed = 0) {
  const spots = [0.02, 0.10, 0.90, 0.97];
  spots.forEach((fx, i) => {
    const h = maxH * (0.62 + 0.38 * Math.abs(Math.sin(seed + i * 1.7)));
    drawPalm(ctx, fx * w, baseline, h, i % 2 === 0 ? 0.14 : -0.14, color);
  });
  drawPalm(ctx, 0.47 * w, baseline, maxH * 0.42, -0.1, color);
}

/** Draws a flat-roofed skyline silhouette with a few lit windows. */
export function drawSkyline(ctx, x, y, w, h, color, lit) {
  ctx.save();
  ctx.fillStyle = color;
  let bx = x;
  let i = 0;
  while (bx < x + w) {
    const bw = w * (0.06 + 0.05 * Math.abs(Math.sin(i * 2.3 + 1)));
    const bh = h * (0.35 + 0.6 * Math.abs(Math.sin(i * 1.3)));
    ctx.fillRect(bx, y - bh, bw, bh);
    if (i % 3 === 0) ctx.fillRect(bx + bw * 0.3, y - bh - h * 0.12, bw * 0.4, h * 0.12);
    bx += bw + w * 0.015;
    i++;
  }
  ctx.fillStyle = lit;
  for (let k = 0; k < 14; k++) {
    const wx = x + ((k * 0.37 + 0.11) % 1) * w;
    const wy = y - h * (0.2 + ((k * 0.53) % 0.6));
    ctx.fillRect(wx, wy, Math.max(2, w * 0.006), Math.max(2, h * 0.03));
  }
  ctx.restore();
}

/** Draws halftone dots fading down across a band. */
export function drawHalftone(ctx, x, y, w, h, color, maxR) {
  ctx.save();
  ctx.fillStyle = color;
  const step = maxR * 3.2;
  for (let py = y; py < y + h; py += step) {
    const fade = 1 - (py - y) / h;
    for (let px = x + ((Math.round(py / step) % 2) * step) / 2; px < x + w; px += step) {
      const r = Math.max(0.4, maxR * fade);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

let grainTile = null;
/** Tiles a pre-rendered noise pattern over the frame for film grain. */
export function drawGrain(ctx, w, h, alpha) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 128;
    grainTile.height = 128;
    const g = grainTile.getContext('2d');
    const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(grainTile, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Darkens the frame edges so the middle pops. */
export function drawVignette(ctx, w, h, strength) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
