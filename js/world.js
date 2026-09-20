// ---------- World building ----------
const obstacles = []; // {x1,x2,z1,z2,h}

function addBox(x, y, z, w, h, d, color, map, rx, ry) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    map
      ? new THREE.MeshLambertMaterial({ map: cloneTex(map, rx, ry) })
      : new THREE.MeshLambertMaterial({ color: color }),
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  obstacles.push({
    x1: x - w / 2,
    x2: x + w / 2,
    z1: z - d / 2,
    z2: z + d / 2,
    h: y + h / 2,
  });
  return m;
}
function addCyl(x, y, z, rTop, rBot, h, color, seg, solid, map, rx, ry) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, h, seg || 8),
    map
      ? new THREE.MeshLambertMaterial({ map: cloneTex(map, rx, ry) })
      : new THREE.MeshLambertMaterial({ color: color }),
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  if (solid) {
    const r = Math.max(rTop, rBot);
    obstacles.push({
      x1: x - r,
      x2: x + r,
      z1: z - r,
      z2: z + r,
      h: y + h / 2,
    });
  }
  return m;
}
function addCone(x, y, z, r, h, color, seg, map, rx, ry) {
  const m = new THREE.Mesh(
    new THREE.ConeGeometry(r, h, seg || 8),
    map
      ? new THREE.MeshLambertMaterial({ map: cloneTex(map, rx, ry) })
      : new THREE.MeshLambertMaterial({ color: color }),
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  scene.add(m);
  return m;
}
function addBoulder(x, z) {
  const s = rand(0.7, 1.3);
  const m = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1.1 * s, 0),
    new THREE.MeshLambertMaterial({
      color: [0x8a919c, 0x7f8791, 0x949ba6][randInt(0, 2)],
      flatShading: true,
    }),
  );
  m.position.set(x, 0.45 * s, z);
  m.rotation.set(rand(0, 6.283), rand(0, 6.283), rand(0, 6.283));
  m.scale.set(1, rand(0.6, 0.8), rand(0.8, 1.15));
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  obstacles.push({
    x1: x - 1.15 * s,
    x2: x + 1.15 * s,
    z1: z - 1.15 * s,
    z2: z + 1.15 * s,
    h: 1.3 * s,
  });
}
function addHouse(x, z) {
  const s = rand(0.9, 1.12);
  addBox(x, 2.25 * s, z, 7 * s, 4.5 * s, 6 * s, 0xffffff, TEX.timber, 2, 1.4);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(5.7 * s, 3 * s, 4),
    new THREE.MeshLambertMaterial({ map: cloneTex(TEX.roof, 3, 2) }),
  );
  roof.position.set(x, 5.9 * s, z);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  scene.add(roof);
  // door facing the map center
  const len = Math.hypot(x, z) || 1;
  const dx = -x / len,
    dz = -z / len;
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 2.3, 0.2),
    new THREE.MeshLambertMaterial({
      map: cloneTex(TEX.bark, 1, 1),
      color: 0x9a7b52,
    }),
  );
  door.position.set(x + dx * 3.05 * s, 1.15 * s, z + dz * 3.05 * s);
  door.rotation.y = Math.atan2(dx, dz);
  door.castShadow = true;
  scene.add(door);
  // chimney toward the back
  addBox(
    x - dx * 3.2 * s,
    5.5 * s,
    z - dz * 3.2 * s,
    0.9,
    1.6,
    0.9,
    0xffffff,
    TEX.stone,
    0.5,
    0.8,
  );
}

const FLAGS = {};

function makeBannerPole(x, z, team) {
  addCyl(x, 1.75, z, 0.08, 0.1, 3.5, 0x5a4630, 5);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.8),
    new THREE.MeshLambertMaterial({
      map: bannerTex(team),
      side: THREE.DoubleSide,
    }),
  );
  const s = Math.sign(x) || 1;
  m.position.set(x + s * 0.06, 2.3, z);
  m.rotation.y = (s * Math.PI) / 2;
  scene.add(m);
}

function buildBase(team) {
  const zs = team === "red" ? 1 : -1;
  const c = team === "red" ? 0xb03a2e : 0x2e6db4;
  const Z = 100 * zs;
  // U-shaped walled compound, open toward the map center
  addBox(0, 2.5, Z + 13 * zs, 30, 5, 2.5, 0xffffff, TEX.stone, 10, 1.8); // back wall
  addBox(-14, 2.5, Z + 6.5 * zs, 2.5, 5, 13, 0xffffff, TEX.stone, 4.5, 1.8); // left wall
  addBox(14, 2.5, Z + 6.5 * zs, 2.5, 5, 13, 0xffffff, TEX.stone, 4.5, 1.8); // right wall
  addBox(-14, 3, Z, 2.5, 6, 2.5, 0xffffff, TEX.stone, 1, 2); // gate pillars
  addBox(14, 3, Z, 2.5, 6, 2.5, 0xffffff, TEX.stone, 1, 2);
  addBox(-9, 2.5, Z - 1 * zs, 10, 5, 2, 0xffffff, TEX.stone, 3.5, 1.8); // gate walls (narrow entry)
  addBox(9, 2.5, Z - 1 * zs, 10, 5, 2, 0xffffff, TEX.stone, 3.5, 1.8);
  for (let i = -13; i <= 13; i += 4)
    addBox(i, 5.4, Z + 13 * zs, 1.1, 0.8, 1.6, 0xffffff, TEX.stone, 0.5, 0.4);
  for (let k = 0; k < 3; k++) {
    const zz = Z + (2 + 4 * k) * zs;
    addBox(-14, 5.4, zz, 1.6, 0.8, 1.1, 0xffffff, TEX.stone, 0.6, 0.4);
    addBox(14, 5.4, zz, 1.6, 0.8, 1.1, 0xffffff, TEX.stone, 0.6, 0.4);
  }
  // base zone ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(3, 3.5, 40),
    new THREE.MeshBasicMaterial({
      color: c,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 0.04, Z + 6 * zs);
  scene.add(ring);
  // flagpole + banner
  addCyl(0, 3.5, Z + 6 * zs, 0.12, 0.12, 7, 0x5a4630, 6, true);
  const zone = new THREE.Vector3(0, 0, Z + 6 * zs);
  const rest = new THREE.Vector3(0, 5.1, Z + 6 * zs);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 2.6),
    new THREE.MeshLambertMaterial({
      map: bannerTex(team),
      side: THREE.DoubleSide,
    }),
  );
  mesh.position.copy(rest);
  if (team === "red") mesh.rotation.y = Math.PI;
  scene.add(mesh);
  FLAGS[team] = {
    team: team,
    zone: zone,
    rest: rest,
    pos: rest.clone(),
    state: "base",
    carrier: null,
    mesh: mesh,
  };
}

function buildCenterFlag() {
  const zone = new THREE.Vector3(0, 0, 0);
  const rest = new THREE.Vector3(0, 5.1, 0);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 2.7, 40),
    new THREE.MeshBasicMaterial({
      color: 0xd9a441,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 0.04, 0);
  scene.add(ring);
  addCyl(0, 3.5, 0, 0.12, 0.12, 7, 0x6b5416, 6, true);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 2.6),
    new THREE.MeshLambertMaterial({
      map: bannerTex("gold"),
      side: THREE.DoubleSide,
    }),
  );
  mesh.position.copy(rest);
  scene.add(mesh);
  FLAGS.gold = {
    team: "gold",
    zone: zone,
    rest: rest,
    pos: rest.clone(),
    state: "base",
    carrier: null,
    mesh: mesh,
  };
}

function buildWorld() {
  const gt = cloneTex(TEX.grass, 48, 52);
  gt.anisotropy = 8;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(620, 640),
    new THREE.MeshLambertMaterial({ map: gt }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  // packed dirt roads with wheel ruts running along their length
  const roadT = cloneTex(TEX.dirt, 1, 40);
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 560),
    new THREE.MeshLambertMaterial({ map: roadT }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.02;
  road.receiveShadow = true;
  scene.add(road);
  const road2T = cloneTex(TEX.dirt, 40, 1);
  road2T.rotation = Math.PI / 2;
  road2T.center.set(0.5, 0.5);
  const road2 = new THREE.Mesh(
    new THREE.PlaneGeometry(560, 9),
    new THREE.MeshLambertMaterial({ map: road2T }),
  );
  road2.rotation.x = -Math.PI / 2;
  road2.position.y = 0.02;
  road2.receiveShadow = true;
  scene.add(road2);
  // boundary hedges
  addBox(0, 1, 130, 246, 2, 2, 0xffffff, TEX.bush, 24, 1);
  addBox(0, 1, -130, 246, 2, 2, 0xffffff, TEX.bush, 24, 1);
  addBox(122, 1, 0, 2, 2, 262, 0xffffff, TEX.bush, 26, 1);
  addBox(-122, 1, 0, 2, 2, 262, 0xffffff, TEX.bush, 26, 1);
  // central keep — walled courtyard holding the gold banner
  for (const sz of [-4.5, 4.5]) {
    addBox(-4.2, 3, sz, 3.6, 6, 3, 0xffffff, TEX.stone, 1.2, 2); // N/S wall segments (gate gap)
    addBox(4.2, 3, sz, 3.6, 6, 3, 0xffffff, TEX.stone, 1.2, 2);
  }
  addBox(-4.5, 3, 0, 3, 6, 12, 0xffffff, TEX.stone, 4, 2); // west wall
  addBox(4.5, 3, 0, 3, 6, 12, 0xffffff, TEX.stone, 4, 2); // east wall
  for (const sx of [-5.4, 5.4])
    for (const sz of [-5.4, 5.4]) {
      addCyl(sx, 4, sz, 1.7, 1.9, 8, 0xffffff, 8, true, TEX.stone, 2, 3);
      addBox(sx, 8.6, sz, 3, 0.7, 3, 0xffffff, TEX.stone, 1, 0.3);
    }
  // side watchtowers on the east-west road
  for (const sx of [52, -52]) {
    addCyl(sx, 4.5, 0, 2.2, 2.6, 9, 0xffffff, 10, true, TEX.stone, 2.5, 4);
    addCone(sx, 10.2, 0, 3.2, 2.4, 0xffffff, 8, TEX.roof, 3, 1);
  }
  // gate towers
  for (const sx of [-26, 26])
    for (const sz of [-26, 26]) {
      addCyl(sx, 4.5, sz, 2.6, 3, 9, 0xffffff, 10, true, TEX.stone, 3, 4);
      addCone(sx, 10.3, sz, 3.6, 2.6, 0xffffff, 8, TEX.roof, 3, 1);
    }
  // ruined walls (cover)
  addBox(38, 1.25, 45, 1, 2.5, 14, 0xffffff, TEX.stone, 5, 1);
  addBox(-38, 1.25, 45, 1, 2.5, 14, 0xffffff, TEX.stone, 5, 1);
  addBox(38, 1.25, -45, 1, 2.5, 14, 0xffffff, TEX.stone, 5, 1);
  addBox(-38, 1.25, -45, 1, 2.5, 14, 0xffffff, TEX.stone, 5, 1);
  // diagonal ruins breaking up the approach to the keep
  for (const p of [
    [14, 30],
    [-14, -30],
    [30, 14],
    [-30, -14],
  ])
    addBox(p[0], 1.25, p[1], 1, 2.5, 10, 0xffffff, TEX.stone, 3.5, 1);
  // houses
  for (const p of [
    [55, 45],
    [-55, 45],
    [55, -45],
    [-55, -45],
    [70, 8],
    [-70, -8],
    [66, 28],
    [-66, -28],
    [66, -28],
    [-66, 28],
  ])
    addHouse(p[0], p[1]);
  // trees
  for (const p of [
    [80, 70],
    [-85, 65],
    [88, -60],
    [-80, -70],
    [60, 22],
    [-62, -25],
    [95, 5],
    [-95, 25],
    [45, 80],
    [-48, -82],
    [75, -90],
    [-78, 88],
    [30, 70],
    [-32, -68],
    [90, 95],
    [-92, -95],
    [38, -12],
    [-38, 12],
    [85, 42],
    [-85, -42],
    [88, -38],
    [-88, 38],
    [48, -48],
    [-48, 48],
    [16, -58],
    [-16, 58],
    [55, -62],
    [-55, 62],
    [25, 88],
    [-25, -88],
    [-25, 88],
    [25, -88],
  ]) {
    const s = rand(0.85, 1.25);
    addCyl(
      p[0],
      1.1 * s,
      p[1],
      0.24,
      0.34,
      2.2 * s,
      0xffffff,
      6,
      true,
      TEX.bark,
      1,
      1,
    );
    const leaf = [0x2e5d31, 0x356a3a, 0x2a5530][randInt(0, 2)];
    addCone(p[0], 2.6 * s, p[1], 1.9 * s, 3 * s, leaf, 7);
    addCone(p[0], 2.2 * s + 1.9, p[1], 1.3 * s, 2.2 * s, 0x3d7040, 7);
  }
  // road banners
  makeBannerPole(7, 55, "red");
  makeBannerPole(-7, 55, "red");
  makeBannerPole(7, -55, "blue");
  makeBannerPole(-7, -55, "blue");
  // cover boulders
  for (const p of [
    [10, 35],
    [-10, -35],
    [22, 60],
    [-22, -60],
    [15, -25],
    [-15, 25],
    [26, -6],
    [-26, 6],
    [4, 9],
    [-4, -9],
    [4, -9],
    [-4, 9],
    [7, 93],
    [-7, -93],
    [7, -93],
    [-7, 93],
  ])
    addBoulder(p[0], p[1]);
  buildBase("red");
  buildBase("blue");
  buildCenterFlag();
}

// ---------- Battlefield pickups ----------
const PICKUPS = [];

function makePickupMesh(kind) {
  const g = new THREE.Group();
  if (kind === "elixir") {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 0.26, 10),
      new THREE.MeshLambertMaterial({
        color: 0x9fd8ea,
        transparent: true,
        opacity: 0.9,
      }),
    );
    const cork = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.09, 8),
      new THREE.MeshLambertMaterial({ color: 0x6b4a2f }),
    );
    cork.position.y = 0.17;
    g.add(body, cork);
  } else {
    const pouch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.2, 0.3, 10),
      new THREE.MeshLambertMaterial({ color: 0x6e4a2f }),
    );
    pouch.position.y = -0.06;
    g.add(pouch);
    for (let i = 0; i < 3; i++) {
      const shaft = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.45, 0.03),
        new THREE.MeshLambertMaterial({ color: 0x8a6a3a }),
      );
      shaft.position.set(
        Math.cos(i * 2.1) * 0.07,
        0.12,
        Math.sin(i * 2.1) * 0.07,
      );
      shaft.rotation.set(Math.sin(i * 2.1) * 0.3, 0, -Math.cos(i * 2.1) * 0.3);
      g.add(shaft);
    }
  }
  return g;
}

function buildPickups() {
  const spots = [
    ["elixir", 0, 42],
    ["elixir", 0, -42],
    ["elixir", 34, 24],
    ["elixir", -34, -24],
    ["pouch", 44, 0],
    ["pouch", -44, 0],
    ["pouch", 0, 4.2],
    ["pouch", 0, -4.2],
  ];
  for (const [kind, x, z] of spots) {
    const mesh = makePickupMesh(kind);
    mesh.position.set(x, 0.9, z);
    scene.add(mesh);
    PICKUPS.push({
      kind,
      pos: new THREE.Vector3(x, 0, z),
      mesh: mesh,
      active: true,
      t: rand(0, 6),
    });
  }
}

function tryPickup(p) {
  if (p.kind === "elixir") {
    if (PLAYER.hp >= 100) return;
    PLAYER.hp = Math.min(100, PLAYER.hp + 40);
    AudioSys.pickup(1);
    feed("✚ Elixir — +40 HP");
  } else {
    let any = false;
    for (let i = 0; i < 3; i++) if (ammo[i] < WEAPONS[i].quiver) any = true;
    if (!any) return;
    for (let i = 0; i < 3; i++) ammo[i] = WEAPONS[i].quiver;
    AudioSys.pickup(1);
    feed("➹ Arrow pouch — quivers refilled");
  }
  p.active = false;
  p.t = 0;
  p.mesh.visible = false;
}

function updatePickups(dt) {
  for (const p of PICKUPS) {
    p.t += dt;
    if (p.active) {
      p.mesh.position.y = 0.9 + Math.sin(p.t * 2) * 0.08;
      p.mesh.rotation.y += dt * 1.4;
      if (PLAYER.alive) {
        const dx = PLAYER.pos.x - p.pos.x,
          dz = PLAYER.pos.z - p.pos.z;
        if (dx * dx + dz * dz < 1.6) tryPickup(p);
      }
    } else if (p.t > 20) {
      p.t = 0;
      p.active = true;
      p.mesh.visible = true;
    }
  }
}

// ---------- Line of sight ----------
function segBox(A, B, o) {
  const mn = [o.x1, 0, o.z1],
    mx = [o.x2, o.h, o.z2];
  const A3 = [A.x, A.y, A.z],
    B3 = [B.x, B.y, B.z];
  let tmin = 0,
    tmax = 1;
  for (let i = 0; i < 3; i++) {
    const d = B3[i] - A3[i];
    if (Math.abs(d) < 1e-9) {
      if (A3[i] < mn[i] || A3[i] > mx[i]) return false;
    } else {
      let t1 = (mn[i] - A3[i]) / d,
        t2 = (mx[i] - A3[i]) / d;
      if (t1 > t2) {
        const t = t1;
        t1 = t2;
        t2 = t;
      }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
  }
  return true;
}
function hasLOS(a, b) {
  const A = new THREE.Vector3(a.pos.x, a.pos.y + 1.5, a.pos.z);
  const B = new THREE.Vector3(b.pos.x, b.pos.y + 1.5, b.pos.z);
  for (const o of obstacles) if (segBox(A, B, o)) return false;
  return true;
}
