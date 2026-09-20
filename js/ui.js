// ---------- HUD ----------
const $ = (id) => document.getElementById(id);
const scoreEl = $("score"),
  msgEl = $("msg"),
  feedEl = $("feed"),
  vignetteEl = $("vignette");
const hpfillEl = $("hpfill"),
  hptextEl = $("hptext"),
  stamfillEl = $("stamfill"),
  equipEl = $("equip");
const weaponEl = $("weapon"),
  ammoEl = $("ammo"),
  reloadEl = $("reload");
const MINC = $("minimap"),
  CHG = $("chargeCv");
const overlay = $("overlay");

let msgT = 0;
function showMsg(t, sec) {
  msgEl.textContent = t;
  msgEl.style.opacity = "1";
  msgT = sec || 2.2;
}
function feed(text) {
  const d = document.createElement("div");
  d.className = "feeditem";
  d.textContent = text;
  feedEl.prepend(d);
  while (feedEl.children.length > 5) feedEl.lastChild.remove();
  setTimeout(() => {
    if (d.parentNode) d.remove();
  }, 4500);
}

function drawCharge() {
  const cc = CHG.getContext("2d");
  cc.clearRect(0, 0, 56, 56);
  const w = WEAPONS[wi];
  if (w.type === "bow" && charge > 0.01) {
    cc.strokeStyle = "rgba(255,215,130,.95)";
    cc.lineWidth = 3;
    cc.beginPath();
    cc.arc(28, 28, 21, -Math.PI / 2, -Math.PI / 2 + charge * Math.PI * 2);
    cc.stroke();
  }
}

function drawMinimap() {
  const W = 150,
    H = 160,
    ctx2 = MINC.getContext("2d");
  ctx2.clearRect(0, 0, W, H);
  ctx2.fillStyle = "rgba(22,28,18,.88)";
  ctx2.fillRect(0, 0, W, H);
  const mx = (x) => ((x + 120) / 240) * W,
    mz = (z) => ((z + 130) / 260) * H;
  ctx2.fillStyle = "rgba(138,115,85,.35)";
  ctx2.fillRect(mx(-4.5), 0, mx(4.5) - mx(-4.5), H);
  ctx2.fillRect(0, mz(-4.5), W, mz(4.5) - mz(-4.5));
  ctx2.fillStyle = "rgba(176,58,46,.4)";
  ctx2.fillRect(mx(-15), mz(99), mx(15) - mx(-15), mz(114) - mz(99));
  ctx2.fillStyle = "rgba(46,109,180,.4)";
  ctx2.fillRect(mx(-15), mz(-114), mx(15) - mx(-15), mz(-99) - mz(-114));
  ctx2.fillStyle = "rgba(150,156,168,.55)";
  ctx2.fillRect(mx(-7), mz(-7), mx(7) - mx(-7), mz(7) - mz(-7));
  for (const t of ["red", "blue", "gold"]) {
    const f = FLAGS[t],
      px = mx(f.pos.x),
      py = mz(f.pos.z);
    ctx2.fillStyle =
      t === "red" ? "#ff7b6e" : t === "blue" ? "#6ea8ff" : "#ffd98a";
    ctx2.fillRect(px - 3, py - 3, 6, 6);
    ctx2.strokeStyle = "#fff";
    ctx2.strokeRect(px - 3, py - 3, 6, 6);
  }
  for (const c of CHARS) {
    if (!c.alive) continue;
    const px = mx(c.pos.x),
      py = mz(c.pos.z);
    if (c.isPlayer) {
      ctx2.strokeStyle = "#fff";
      ctx2.lineWidth = 2;
      ctx2.beginPath();
      ctx2.moveTo(px, py);
      ctx2.lineTo(px - Math.sin(c.yaw) * 9, py - Math.cos(c.yaw) * 9);
      ctx2.stroke();
      ctx2.fillStyle = "#fff";
      ctx2.beginPath();
      ctx2.arc(px, py, 3, 0, 7);
      ctx2.fill();
    } else {
      ctx2.fillStyle = c.team === "red" ? "#e0574a" : "#5a9ce0";
      ctx2.beginPath();
      ctx2.arc(px, py, 2.5, 0, 7);
      ctx2.fill();
    }
  }
}

function updateHUD() {
  const p = PLAYER;
  hpfillEl.style.width = clamp(p.hp, 0, 100) + "%";
  hpfillEl.style.background =
    p.hp > 60
      ? "linear-gradient(#8ed05e,#549c34)"
      : p.hp > 30
        ? "linear-gradient(#e0b34e,#b07d2a)"
        : "linear-gradient(#d05e5e,#9c3434)";
  hptextEl.textContent = Math.max(0, Math.ceil(p.hp));
  stamfillEl.style.width = Math.round(clamp(stamina, 0, 100)) + "%";
  const w = WEAPONS[wi];
  weaponEl.textContent = w.name + " — " + w.desc;
  ammoEl.textContent = w.type === "bow" ? ammo[wi] + " / " + w.quiver : "—";
  reloadEl.textContent =
    reloadT > 0
      ? "RELOADING…"
      : w.type === "bow" && ammo[wi] <= 0
        ? "EMPTY — press R"
        : "";
  const e = EQUIP[p.equip];
  equipEl.textContent =
    e.name +
    " · Speed " +
    Math.round(e.speed * 100) +
    "% · Dmg taken " +
    Math.round(e.armor * 100) +
    "%";
  scoreEl.innerHTML =
    '<span class="r">RED ' +
    SCORE.red +
    '</span> : <span class="b">' +
    SCORE.blue +
    " BLUE</span>";
  vignetteEl.style.opacity = dmgFlash;
  drawCharge();
  drawMinimap();
}

// ---------- Overlay / state ----------
let state = "start";
const keys = new Set();
let mouseDX = 0,
  mouseDY = 0,
  fireHeld = false,
  drawing = false;

function showOverlay(title, sub, note, btn) {
  $("ovTitle").textContent = title;
  $("ovSub").textContent = sub || "";
  $("ovNote").innerHTML = note || "";
  $("ovBtn").textContent = btn || "";
  overlay.classList.remove("hidden");
}
function showStart() {
  showOverlay(
    "⚔ BOWS & BANNERS ⚔",
    "A medieval CTF — Red vs Blue. First to 3 flag captures wins.",
    'You fight for <span style="color:#ff7b6e">RED</span>. Steal the <span style="color:#6ea8ff">BLUE</span> flag — or seize the <span style="color:#ffd98a">GOLD</span> banner from the central keep — and carry it to your banner.',
    "CLICK TO TAKE UP ARMS",
  );
  const oc = $("ovControls");
  oc.innerHTML =
    "<b>WASD</b> move · <b>Shift</b> sprint · <b>Space</b> jump · Mouse aim<br>" +
    "<b>Left click</b> fire / swing · <b>Hold right click</b> draw bow (power)<br>" +
    "<b>1</b> Shortbow (rapid) · <b>2</b> Greatbow (3-arrow volley) · <b>3</b> Crossbow (heavy bolt) · <b>4</b> Sword<br>" +
    "<b>R</b> reload · <b>E / Tab</b> switch equipment (5 armor sets, speed &amp; protection change)<br>\n" +
    "Sword: hold <b>right click</b> to guard (slower, −75% dmg) · <b>M</b> sound on/off<br>\n" +
    "Sprinting drains stamina · find <b>elixirs</b> (+40 HP) and <b>arrow pouches</b> on the field<br>\n" +
    "Esc pauses · HP 100 for all · arrows do 30–90 damage";
}
function pauseGame() {
  state = "pause";
  showOverlay("PAUSED", "The battle awaits your return", "", "CLICK TO RESUME");
}
function requestLock() {
  const p = canvas.requestPointerLock();
  if (p && typeof p.catch === "function") p.catch(() => pauseGame());
}
function startGame() {
  AudioSys.init();
  AudioSys.startWind();
  AudioSys.startMusic();
  state = "play";
  overlay.classList.add("hidden");
  requestLock();
  showMsg("Steal the BLUE flag — 3 captures to win!", 3);
}

overlay.addEventListener("click", () => {
  if (state === "start") startGame();
  else if (state === "pause") {
    state = "play";
    overlay.classList.add("hidden");
    requestLock();
  } else if (state === "end") window.location.reload();
});

document.addEventListener("pointerlockchange", () => {
  if (!document.pointerLockElement && state === "play") pauseGame();
});
window.addEventListener("blur", () => {
  if (state === "play") pauseGame();
  keys.clear();
  fireHeld = false;
  drawing = false;
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Tab") e.preventDefault();
  if (e.code === "KeyM") {
    AudioSys.toggleMute();
    showMsg(AudioSys.muted ? "Sound off" : "Sound on", 1);
    return;
  }
  keys.add(e.code);
  if (e.repeat) return;
  if (state === "play") {
    if (e.code === "Digit1") selectWeapon(0);
    else if (e.code === "Digit2") selectWeapon(1);
    else if (e.code === "Digit3") selectWeapon(2);
    else if (e.code === "Digit4") selectWeapon(3);
    else if (e.code === "KeyR") startReload();
    else if (e.code === "KeyE" || e.code === "Tab") cycleEquip();
  }
  if (state === "end" && (e.code === "KeyR" || e.code === "Enter"))
    window.location.reload();
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
document.addEventListener("mousemove", (e) => {
  if (state === "play" && document.pointerLockElement === canvas) {
    mouseDX += e.movementX;
    mouseDY += e.movementY;
  }
});
document.addEventListener("mousedown", (e) => {
  if (state === "play" && !document.pointerLockElement) {
    requestLock();
    return;
  }
  if (state === "play" && document.pointerLockElement === canvas) {
    if (e.button === 0) fireHeld = true;
    if (e.button === 2) drawing = true;
  }
});
document.addEventListener("mouseup", (e) => {
  if (e.button === 0) fireHeld = false;
  if (e.button === 2) drawing = false;
});
window.addEventListener("wheel", (e) => {
  if (state === "play") selectWeapon((wi + (e.deltaY > 0 ? 1 : 3)) % 4);
});
document.addEventListener("contextmenu", (e) => e.preventDefault());
