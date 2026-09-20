// ---------- Procedural textures (canvas-generated, fully offline) ----------
const TEX = {};

function makeTex(w, h, draw) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}
function cloneTex(src, rx, ry) {
  const t = src.clone();
  t.repeat.set(rx || 1, ry || 1);
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}
function speckle(c, w, h, n, cols, rMin, rMax, alpha) {
  for (let i = 0; i < n; i++) {
    c.fillStyle = cols[randInt(0, cols.length - 1)];
    c.globalAlpha = alpha * rand(0.35, 1);
    c.beginPath();
    c.ellipse(
      rand(w),
      rand(h),
      rand(rMin, rMax),
      rand(rMin, rMax) * rand(0.4, 1.2),
      rand(0, 6.283),
      0,
      6.283,
    );
    c.fill();
  }
  c.globalAlpha = 1;
}

// grass — mottled green with individual blades
TEX.grass = makeTex(256, 256, (c, w, h) => {
  c.fillStyle = "#5c7d4a";
  c.fillRect(0, 0, w, h);
  speckle(
    c,
    w,
    h,
    500,
    ["#547544", "#648a50", "#4c6e3e", "#6b9455", "#5f824b"],
    2,
    9,
    0.5,
  );
  c.lineWidth = 1;
  for (let i = 0; i < 350; i++) {
    c.strokeStyle = i % 2 ? "#6b9455" : "#49683c";
    c.globalAlpha = 0.5;
    const x = rand(w),
      y = rand(h),
      l = rand(2, 5);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + rand(-1.5, 1.5), y - l);
    c.stroke();
  }
  c.globalAlpha = 1;
});

// packed dirt road with wheel ruts and pebbles
TEX.dirt = makeTex(128, 256, (c, w, h) => {
  c.fillStyle = "#8a7355";
  c.fillRect(0, 0, w, h);
  speckle(
    c,
    w,
    h,
    300,
    ["#7d684c", "#94805f", "#6f5c43", "#9c8a68"],
    1.5,
    6,
    0.5,
  );
  for (let i = 0; i < 24; i++) {
    c.fillStyle = i % 2 ? "#808893" : "#6f7681";
    c.globalAlpha = 0.7;
    c.beginPath();
    c.ellipse(
      rand(w),
      rand(h),
      rand(2, 5),
      rand(1.5, 3.5),
      rand(0, 3),
      0,
      6.283,
    );
    c.fill();
  }
  c.globalAlpha = 0.28;
  c.fillStyle = "#4c3f2e";
  c.fillRect(w * 0.28, 0, 7, h);
  c.fillRect(w * 0.62, 0, 7, h);
  c.globalAlpha = 1;
});

// stone masonry — running-bond blocks with shading and cracks
TEX.stone = makeTex(256, 256, (c, w, h) => {
  c.fillStyle = "#7d838e"; // mortar
  c.fillRect(0, 0, w, h);
  const bh = 42,
    bw = 84;
  for (let y = 0, row = 0; y < h; y += bh, row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let x = -bw; x < w + bw; x += bw) {
      const bx = x + off;
      const v = randInt(-14, 14);
      c.fillStyle =
        "rgb(" + (152 + v) + "," + (160 + v) + "," + (172 + v) + ")";
      c.fillRect(bx + 2, y + 2, bw - 4, bh - 4);
      c.fillStyle = "rgba(255,255,255,0.08)";
      c.fillRect(bx + 2, y + 2, bw - 4, 6);
      c.fillStyle = "rgba(0,0,0,0.10)";
      c.fillRect(bx + 2, y + bh - 8, bw - 4, 6);
    }
  }
  c.strokeStyle = "rgba(40,44,52,0.35)";
  c.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    let x = rand(w),
      y = rand(h);
    c.beginPath();
    c.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      x += rand(-14, 14);
      y += rand(4, 12);
      c.lineTo(x, y);
    }
    c.stroke();
  }
});

// half-timbered house wall — plaster with dark timber frame
TEX.timber = makeTex(256, 256, (c, w, h) => {
  c.fillStyle = "#cfc0a0";
  c.fillRect(0, 0, w, h);
  speckle(c, w, h, 400, ["#c4b595", "#d8cbae", "#bdb08e"], 2, 8, 0.4);
  c.strokeStyle = "rgba(120,105,80,0.4)";
  c.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    let x = rand(w),
      y = rand(h);
    c.beginPath();
    c.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      x += rand(-12, 12);
      y += rand(6, 14);
      c.lineTo(x, y);
    }
    c.stroke();
  }
  c.fillStyle = "#5a4630";
  c.fillRect(0, 0, w, 10);
  c.fillRect(0, h - 10, w, 10);
  c.fillRect(0, 0, 10, h);
  c.fillRect(w - 10, 0, 10, h);
  c.fillRect(w / 2 - 5, 10, 10, h - 20);
  c.fillRect(0, h / 2 - 5, w, 10);
  c.strokeStyle = "#5a4630";
  c.lineWidth = 8;
  c.beginPath();
  c.moveTo(10, 10);
  c.lineTo(w / 2 - 5, h / 2 - 5);
  c.stroke();
  c.beginPath();
  c.moveTo(w - 10, 10);
  c.lineTo(w / 2 + 5, h / 2 - 5);
  c.stroke();
});

// roof shingles in scalloped courses
TEX.roof = makeTex(128, 128, (c, w, h) => {
  c.fillStyle = "#6d4a30";
  c.fillRect(0, 0, w, h);
  const rh = 16,
    rw = 21;
  for (let y = 0, row = 0; y < h; y += rh, row++) {
    const off = row % 2 ? rw / 2 : 0;
    for (let x = -rw; x < w + rw; x += rw) {
      const v = randInt(-16, 16);
      c.fillStyle = "rgb(" + (109 + v) + "," + (74 + v) + "," + (48 + v) + ")";
      c.beginPath();
      c.arc(x + off + rw / 2, y + rh, rw / 2, Math.PI, 0);
      c.fill();
    }
  }
});

// tree bark — vertical grain
TEX.bark = makeTex(64, 128, (c, w, h) => {
  c.fillStyle = "#6b4a2f";
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    c.strokeStyle = i % 2 ? "rgba(0,0,0,0.22)" : "rgba(255,220,180,0.12)";
    c.lineWidth = rand(1, 3);
    const x = rand(w);
    c.beginPath();
    c.moveTo(x, 0);
    c.bezierCurveTo(
      x + rand(-6, 6),
      h / 3,
      x + rand(-6, 6),
      (h / 3) * 2,
      x + rand(-6, 6),
      h,
    );
    c.stroke();
  }
});

// leather with mottling and stitching
TEX.leather = makeTex(128, 128, (c, w, h) => {
  c.fillStyle = "#6e4a2f";
  c.fillRect(0, 0, w, h);
  speckle(c, w, h, 220, ["#654329", "#7a5535", "#5c3d26"], 2, 7, 0.5);
  c.strokeStyle = "rgba(230,210,170,0.35)";
  c.setLineDash([4, 4]);
  c.lineWidth = 1;
  c.strokeRect(8, 8, w - 16, h - 16);
  c.setLineDash([]);
});

// chainmail rings
TEX.chain = makeTex(128, 128, (c, w, h) => {
  c.fillStyle = "#8f95a1";
  c.fillRect(0, 0, w, h);
  const s = 10;
  for (let y = 0, row = 0; y < h + s; y += s, row++) {
    for (let x = 0; x < w + s; x += s) {
      const off = row % 2 ? s / 2 : 0;
      c.strokeStyle = "rgba(60,64,74,0.8)";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x + off, y, s * 0.42, 0, 6.283);
      c.stroke();
      c.strokeStyle = "rgba(220,228,240,0.35)";
      c.lineWidth = 1;
      c.beginPath();
      c.arc(x + off - 1, y - 1, s * 0.3, 0, 6.283);
      c.stroke();
    }
  }
});

// plain cloth — white base so it can be tinted by material.color
TEX.cloth = makeTex(128, 128, (c, w, h) => {
  c.fillStyle = "#e8e2d2";
  c.fillRect(0, 0, w, h);
  speckle(c, w, h, 500, ["#dcd5c2", "#f0ead8", "#d2cbb6"], 1, 4, 0.6);
  c.strokeStyle = "rgba(0,0,0,0.05)";
  c.lineWidth = 1;
  for (let y = 0; y < h; y += 3) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
});

// sky gradient — zenith blue to warm horizon haze
TEX.sky = makeTex(16, 256, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#3f6db5");
  g.addColorStop(0.45, "#7fa6d6");
  g.addColorStop(0.78, "#c8d8e2");
  g.addColorStop(1, "#e6e2cf");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
});

// round heraldic shield face (corners transparent)
TEX.shield = makeTex(128, 128, (c, w, h) => {
  c.clearRect(0, 0, w, h);
  c.fillStyle = "#c9a227";
  c.beginPath();
  c.arc(64, 64, 62, 0, 6.283);
  c.fill();
  c.fillStyle = "#9e2b20";
  c.beginPath();
  c.arc(64, 64, 54, 0, 6.283);
  c.fill();
  c.fillStyle = "#f0ead8";
  c.fillRect(56, 14, 16, 100);
  c.fillRect(14, 56, 100, 16);
  c.fillStyle = "#c9a227";
  c.beginPath();
  c.arc(64, 64, 12, 0, 6.283);
  c.fill();
});

// heraldic banner for flags (red / blue / gold)
function bannerTex(team) {
  const field =
    team === "red" ? "#b03a2e" : team === "blue" ? "#2e6db4" : "#d9a441";
  const acc =
    team === "red" ? "#f0ead8" : team === "blue" ? "#ffd98a" : "#7a1f16";
  return makeTex(128, 192, (c, w, h) => {
    c.fillStyle = field;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 12; i++) {
      c.fillStyle = "rgba(0,0,0,0.06)";
      c.fillRect(i * 11, 0, 5, h);
    }
    c.strokeStyle = acc;
    c.lineWidth = 8;
    c.strokeRect(4, 4, w - 8, h - 8);
    c.fillStyle = acc;
    c.fillRect(w / 2 - 11, 16, 22, h - 32);
    c.fillRect(16, h / 2 - 11, w - 32, 22);
  });
}

// soft sun glow sprite
function sunGlowTex() {
  return makeTex(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, "rgba(255,250,235,1)");
    g.addColorStop(0.25, "rgba(255,240,200,0.9)");
    g.addColorStop(1, "rgba(255,240,200,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });
}

// bush — dense foliage for the boundary hedges
TEX.bush = makeTex(128, 128, (c, w, h) => {
  c.fillStyle = "#3a5c34";
  c.fillRect(0, 0, w, h);
  speckle(
    c,
    w,
    h,
    700,
    ["#33552e", "#436a3a", "#2c4a28", "#4a7442", "#3e6236"],
    1,
    5,
    0.7,
  );
});

// plate armor — riveted steel panels
TEX.plate = makeTex(128, 128, (c, w, h) => {
  c.fillStyle = "#c6ccd6";
  c.fillRect(0, 0, w, h);
  speckle(c, w, h, 300, ["#bfc5d0", "#d3d8e0", "#b4bac6"], 1, 5, 0.5);
  c.strokeStyle = "rgba(70,78,92,0.5)";
  c.lineWidth = 2;
  c.strokeRect(4, 4, w - 8, h - 8);
  c.beginPath();
  c.moveTo(w / 2, 6);
  c.lineTo(w / 2, h - 6);
  c.stroke();
  c.fillStyle = "rgba(90,98,112,0.8)";
  for (const [x, y] of [
    [12, 12],
    [w - 12, 12],
    [12, h - 12],
    [w - 12, h - 12],
    [w / 2, 16],
    [w / 2, h - 16],
  ]) {
    c.beginPath();
    c.arc(x, y, 2.4, 0, 6.283);
    c.fill();
  }
});

// puffy cloud (white with soft edges)
function makeCloudTex() {
  return makeTex(256, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      const x = rand(20, w - 20),
        y = rand(30, h - 24),
        r = rand(16, 42);
      const g = c.createRadialGradient(x, y, 1, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,0.85)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r, 0, 6.283);
      c.fill();
    }
  });
}
