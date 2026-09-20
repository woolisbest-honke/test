// ---------- Characters ----------
const CHARS = [];
const BOTS = [];

class Character {
  constructor(team, isPlayer, name, equip) {
    this.team = team;
    this.isPlayer = isPlayer;
    this.name = name;
    this.equip = equip == null ? 1 : equip;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.hp = 100;
    this.alive = true;
    this.inv = 0;
    this.respawnT = 0;
    this.onGround = true;
    this.carriesFlag = null;
    this.walkPhase = 0;
    this.streak = 0;
  }
  get speed() {
    return 6.5 * EQUIP[this.equip].speed;
  }
}

function collideWorld(ch) {
  const r = 0.45;
  for (const b of obstacles) {
    if (
      ch.pos.x < b.x1 - r - 0.3 ||
      ch.pos.x > b.x2 + r + 0.3 ||
      ch.pos.z < b.z1 - r - 0.3 ||
      ch.pos.z > b.z2 + r + 0.3
    )
      continue;
    if (ch.pos.y > b.h - 0.05) continue;
    const cx = clamp(ch.pos.x, b.x1, b.x2),
      cz = clamp(ch.pos.z, b.z1, b.z2);
    let dx = ch.pos.x - cx,
      dz = ch.pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2);
        ch.pos.x = cx + (dx / d) * r;
        ch.pos.z = cz + (dz / d) * r;
      } else {
        const oL = ch.pos.x - b.x1 + r,
          oR = b.x2 - ch.pos.x + r,
          oB = ch.pos.z - b.z1 + r,
          oF = b.z2 - ch.pos.z + r;
        const m = Math.min(oL, oR, oB, oF);
        if (m === oL) ch.pos.x = b.x1 - r;
        else if (m === oR) ch.pos.x = b.x2 + r;
        else if (m === oB) ch.pos.z = b.z1 - r;
        else ch.pos.z = b.z2 + r;
      }
    }
  }
  ch.pos.x = clamp(ch.pos.x, -119, 119);
  ch.pos.z = clamp(ch.pos.z, -127, 127);
}

function separate() {
  const list = CHARS.filter((c) => c.alive);
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i],
        b = list[j];
      const dx = b.pos.x - a.pos.x,
        dz = b.pos.z - a.pos.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < 0.72) {
        if (d2 > 1e-6) {
          const d = Math.sqrt(d2),
            push = (0.85 - d) / 2,
            nx = dx / d,
            nz = dz / d;
          a.pos.x -= nx * push;
          a.pos.z -= nz * push;
          b.pos.x += nx * push;
          b.pos.z += nz * push;
        } else b.pos.x += 0.1;
      }
    }
}

// ---------- Character models ----------
function makeHpBar(ch) {
  const cv = document.createElement("canvas");
  cv.width = 64;
  cv.height = 8;
  const tex = new THREE.CanvasTexture(cv);
  const spr = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, depthTest: false }),
  );
  spr.scale.set(0.9, 0.11, 1);
  spr.position.set(0, 2.55, 0);
  ch.hpbarCtx = cv.getContext("2d");
  ch.hpbarTex = tex;
  drawHpBar(ch);
  return spr;
}
function drawHpBar(ch) {
  const c = ch.hpbarCtx;
  if (!c) return;
  c.clearRect(0, 0, 64, 8);
  c.fillStyle = "rgba(0,0,0,0.6)";
  c.fillRect(0, 0, 64, 8);
  c.fillStyle = ch.team === "red" ? "#e0574a" : "#5a9ce0";
  c.fillRect(1, 1, 62 * clamp(ch.hp / 100, 0, 1), 6);
  ch.hpbarTex.needsUpdate = true;
}

// armor and cloth materials driven by the equipment set
function clothMat(color) {
  return new THREE.MeshLambertMaterial({
    map: cloneTex(TEX.cloth, 1, 1),
    color: color,
  });
}
function armorMat(equip) {
  if (equip === 1)
    return new THREE.MeshLambertMaterial({ map: cloneTex(TEX.leather, 1, 1) });
  if (equip === 2)
    return new THREE.MeshLambertMaterial({ map: cloneTex(TEX.chain, 2, 2) });
  if (equip === 3)
    return new THREE.MeshLambertMaterial({ map: cloneTex(TEX.plate, 1, 1) });
  if (equip === 4) return new THREE.MeshLambertMaterial({ color: 0xd9dde6 });
  return clothMat(0x8a6a45); // Traveler — plain cloth
}

function buildBotModel(ch) {
  const g = new THREE.Group();
  const tunic = ch.team === "red" ? 0x9e2b20 : 0x2456a6;
  const clothC = ch.team === "red" ? 0x6e1a13 : 0x1a3a70;
  const armor = armorMat(ch.equip);
  const mail = new THREE.MeshLambertMaterial({
    map: cloneTex(TEX.chain, 2, 2),
  });
  function part(geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  }
  const legL = part(
    new THREE.BoxGeometry(0.24, 0.85, 0.28).translate(0, -0.425, 0),
    clothMat(clothC),
    -0.17,
    0.85,
    0,
  );
  const legR = part(
    new THREE.BoxGeometry(0.24, 0.85, 0.28).translate(0, -0.425, 0),
    clothMat(clothC),
    0.17,
    0.85,
    0,
  );
  part(new THREE.BoxGeometry(0.66, 0.75, 0.38), armor, 0, 1.2, 0);
  part(
    new THREE.BoxGeometry(0.7, 0.18, 0.42),
    new THREE.MeshLambertMaterial({ map: cloneTex(TEX.leather, 1, 1) }),
    0,
    1.42,
    0,
  );
  const armL = part(
    new THREE.BoxGeometry(0.2, 0.62, 0.24).translate(0, -0.31, 0),
    armor,
    -0.45,
    1.6,
    0.02,
  );
  const armR = part(
    new THREE.BoxGeometry(0.2, 0.62, 0.24).translate(0, -0.31, 0),
    armor,
    0.45,
    1.6,
    0.02,
  );
  part(
    new THREE.BoxGeometry(0.4, 0.42, 0.4),
    new THREE.MeshLambertMaterial({ color: 0xd9a878 }),
    0,
    1.93,
    0,
  );
  // headgear by armor class: hood / mail coif / steel helm
  if (ch.equip === 0 || ch.equip === 1)
    part(new THREE.BoxGeometry(0.46, 0.24, 0.46), clothMat(clothC), 0, 2.12, 0);
  else if (ch.equip === 2) {
    part(new THREE.BoxGeometry(0.46, 0.28, 0.46), mail, 0, 2.13, 0);
    part(new THREE.BoxGeometry(0.09, 0.3, 0.05), mail, 0, 1.96, -0.23);
  } else {
    part(new THREE.BoxGeometry(0.46, 0.26, 0.46), armor, 0, 2.14, 0);
    part(new THREE.BoxGeometry(0.09, 0.3, 0.05), armor, 0, 1.96, -0.23);
  }
  // cloak and quiver
  const cape = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 1.15),
    new THREE.MeshLambertMaterial({
      map: cloneTex(TEX.cloth, 1, 1),
      color: tunic,
      side: THREE.DoubleSide,
    }),
  );
  cape.position.set(0, 1.25, 0.26);
  cape.rotation.x = 0.1;
  g.add(cape);
  const qv = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.12, 0.55, 8),
    new THREE.MeshLambertMaterial({ map: cloneTex(TEX.leather, 1, 1) }),
  );
  qv.position.set(0.22, 1.75, 0.26);
  qv.rotation.x = 0.35;
  qv.castShadow = true;
  g.add(qv);
  if (ch.role === "guard") {
    const sh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.05, 16),
      new THREE.MeshLambertMaterial({ map: TEX.shield, transparent: true }),
    );
    sh.rotation.x = Math.PI / 2;
    sh.position.set(-0.52, 1.35, -0.12);
    g.add(sh);
  }
  const bow = new THREE.Group();
  bow.position.set(0.45, 1.5, 0.15);
  const bowBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.95, 0.04),
    new THREE.MeshLambertMaterial({ color: 0x6b4a2f }),
  );
  bowBar.position.z = 0.28;
  bow.add(bowBar);
  bow.visible = false;
  g.add(bow);
  const sword = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.95, 0.03),
    new THREE.MeshLambertMaterial({ color: 0xc8ccd4 }),
  );
  sword.position.set(0.45, 1.35, -0.15);
  sword.rotation.x = 0.9;
  sword.visible = false;
  g.add(sword);
  g.add(makeHpBar(ch));
  ch.parts = {
    legL: legL,
    legR: legR,
    armL: armL,
    armR: armR,
    bow: bow,
    sword: sword,
  };
  return g;
}

// player model (skin follows equipment)
function buildPlayerModel(ch) {
  const g = new THREE.Group();
  const tunic = 0x9e2b20;
  const clothC = 0x6e1a13;
  const armor = armorMat(ch.equip);
  function part(geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  }
  const legL = part(
    new THREE.BoxGeometry(0.24, 0.85, 0.28).translate(0, -0.425, 0),
    clothMat(clothC),
    -0.17,
    0.85,
    0,
  );
  const legR = part(
    new THREE.BoxGeometry(0.24, 0.85, 0.28).translate(0, -0.425, 0),
    clothMat(clothC),
    0.17,
    0.85,
    0,
  );
  part(new THREE.BoxGeometry(0.66, 0.75, 0.38), armor, 0, 1.2, 0);
  part(new THREE.BoxGeometry(0.5, 0.62, 0.03), clothMat(tunic), 0, 1.16, 0.2); // red tabard
  part(
    new THREE.BoxGeometry(0.14, 0.14, 0.03),
    new THREE.MeshLambertMaterial({ color: 0xc9a227 }),
    0,
    1.32,
    0.22,
  ); // emblem
  part(
    new THREE.BoxGeometry(0.7, 0.18, 0.44),
    ch.equip === 4
      ? new THREE.MeshLambertMaterial({ color: 0xc9a227 })
      : new THREE.MeshLambertMaterial({ map: cloneTex(TEX.leather, 1, 1) }),
    0,
    1.42,
    0,
  );
  const armL = part(
    new THREE.BoxGeometry(0.2, 0.62, 0.24).translate(0, -0.31, 0),
    armor,
    -0.45,
    1.6,
    0.02,
  );
  const armR = part(
    new THREE.BoxGeometry(0.2, 0.62, 0.24).translate(0, -0.31, 0),
    armor,
    0.45,
    1.6,
    0.02,
  );
  // no head: the camera sits at eye level, so a head would clip the view
  ch.parts = { legL: legL, legR: legR, armL: armL, armR: armR };
  return g;
}
function rebuildPlayerModel() {
  if (PLAYER.group) {
    scene.remove(PLAYER.group);
    PLAYER.group.traverse((o) => {
      if (o.isMesh) {
        o.geometry.dispose();
        o.material.dispose();
      }
    });
  }
  PLAYER.group = buildPlayerModel(PLAYER);
  // The player's own body is intentionally NOT added to the scene: the
  // camera is first-person at eye level, so the torso/belt would clip
  // the bottom of the view. Bots keep their models.
}

// ---------- Damage / death / respawn ----------
function damageCharacter(v, dmg, atk) {
  if (!v || !v.alive || v.inv > 0) return;
  dmg *= EQUIP[v.equip].armor;
  if (v.isPlayer && guarding) dmg *= 0.25;
  v.hp -= dmg;
  if (v.isPlayer) {
    dmgFlash = Math.min(0.75, dmgFlash + 0.35);
    shakeT = 0.25;
    AudioSys.hurt();
  }
  if (v.hp <= 0) killCharacter(v, atk);
  else if (v.hpbarTex) drawHpBar(v);
}

function killCharacter(v, atk) {
  v.alive = false;
  v.hp = 100;
  v.respawnT = 3;
  v.streak = 0;
  if (atk && atk !== v) {
    atk.streak++;
    const t = TITLES[atk.streak];
    if (t) feed(atk.isPlayer ? "⚔ You are " + t : "⚔ " + atk.name + " — " + t);
    if (atk.isPlayer) showMsg(t, 2);
  }
  if (v.group) v.group.visible = false;
  if (v.carriesFlag) {
    const f = v.carriesFlag;
    f.carrier = null;
    f.state = "dropped";
    f.pos.copy(v.pos);
    v.carriesFlag = null;
    feed("⚑ " + v.name + " fell — " + f.team.toUpperCase() + " flag dropped");
  }
  if (atk && atk.isPlayer) feed("⚔ You slew " + v.name);
  else if (v.isPlayer && atk && atk.name) feed("⚔ " + atk.name + " slew you");
  else if (atk && atk.name && v.name && atk !== v)
    feed(atk.name + " ⚔ " + v.name);
  if (v.isPlayer) showMsg("You have fallen…", 2.5);
  AudioSys.death(v.isPlayer ? 0 : v.pos.distanceTo(PLAYER.pos));
}

function respawnCharacter(c) {
  c.alive = true;
  c.hp = 100;
  c.inv = 2;
  c.vel.set(0, 0, 0);
  const z = c.team === "red" ? 103 : -103;
  c.pos.set(rand(-5, 5), 0, z + rand(-1.5, 1.5));
  c.yaw = c.team === "red" ? 0 : Math.PI;
  c.pitch = 0;
  if (c.group) c.group.visible = true;
  if (c.hpbarTex) drawHpBar(c);
  if (c.isPlayer) {
    charge = 0;
    fireCD = 0.5;
    stamina = 100;
    swingT = 0;
    swingCD = 0.5;
    // discard mouse deltas accumulated while dead so the view doesn't whip
    mouseDX = 0;
    mouseDY = 0;
    showMsg("You take up arms again", 1.5);
  }
}
