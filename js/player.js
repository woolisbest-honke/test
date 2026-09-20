// ---------- Player state ----------
const PLAYER = new Character("red", true, "You", 2);
PLAYER.pos.set(0, 0, 103);
CHARS.push(PLAYER);

let wi = 1;
let ammo = WEAPONS.map((w) => w.quiver);
let stamina = 100;
let guarding = false;
let charge = 0,
  fireCD = 0,
  swingT = 0,
  swingCD = 0,
  hitDone = true,
  reloadT = 0;
let vmKick = 0,
  bobT = 0,
  dmgFlash = 0,
  shakeT = 0,
  time = 0;

// view model
let vmBow, vmSword, vmShield, stringA, stringB, arrowVM, leftHand;
const TIP_T = new THREE.Vector3(0, 0.6, -0.24),
  TIP_B = new THREE.Vector3(0, -0.6, -0.24);
const _up = new THREE.Vector3(0, 1, 0);

function setBar(mesh, a, b) {
  _d.subVectors(b, a);
  const len = _d.length();
  mesh.position.copy(a).addScaledVector(_d, 0.5);
  mesh.quaternion.setFromUnitVectors(_up, _d.normalize());
  mesh.scale.set(1, Math.max(0.001, len), 1);
}

function buildViewModel() {
  const wood = new THREE.MeshLambertMaterial({ map: cloneTex(TEX.bark, 1, 1) });
  const gold = new THREE.MeshLambertMaterial({ color: 0xc9a227 });
  const steel = new THREE.MeshLambertMaterial({ color: 0xc8ccd4 });
  const skin = new THREE.MeshLambertMaterial({ color: 0xd9a878 });
  const glove = new THREE.MeshLambertMaterial({
    map: cloneTex(TEX.leather, 1, 1),
  });
  const stringM = new THREE.MeshLambertMaterial({ color: 0xd8d2c0 });
  const B = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

  vmBow = new THREE.Group();
  let grip = B(0.05, 0.3, 0.07, wood);
  grip.position.set(0, 0, 0.02);
  vmBow.add(grip);
  let lt = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.55, 0.06).translate(0, 0.275, 0),
    wood,
  );
  lt.position.set(0, 0.12, 0.02);
  lt.rotation.x = -0.5;
  vmBow.add(lt);
  let lb = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.55, 0.06).translate(0, -0.275, 0),
    wood,
  );
  lb.position.set(0, -0.12, 0.02);
  lb.rotation.x = 0.5;
  vmBow.add(lb);
  stringA = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 1, 4),
    stringM,
  );
  vmBow.add(stringA);
  stringB = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 1, 4),
    stringM,
  );
  vmBow.add(stringB);
  setBar(stringA, TIP_T, new THREE.Vector3(0, 0, 0.12));
  setBar(stringB, TIP_B, new THREE.Vector3(0, 0, 0.12));
  arrowVM = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.024, 1.3), wood);
  shaft.position.z = -0.55;
  arrowVM.add(shaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 6), steel);
  head.rotation.x = -Math.PI / 2;
  head.position.z = -1.32;
  arrowVM.add(head);
  for (let i = 0; i < 3; i++) {
    const fl = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 0.11),
      new THREE.MeshLambertMaterial({
        color: 0xe8e4d8,
        side: THREE.DoubleSide,
      }),
    );
    fl.position.set(0, 0.02, 0.02);
    fl.rotation.y = (i * Math.PI * 2) / 3;
    fl.rotation.x = -0.4;
    arrowVM.add(fl);
  }
  arrowVM.position.set(0, 0, 0.12);
  arrowVM.visible = false;
  vmBow.add(arrowVM);
  const rh = B(0.13, 0.13, 0.16, skin);
  rh.position.set(0, -0.02, 0.1);
  vmBow.add(rh);
  const rbr = B(0.11, 0.24, 0.12, glove);
  rbr.position.set(0, -0.15, 0.05);
  vmBow.add(rbr);
  leftHand = B(0.13, 0.13, 0.14, skin);
  leftHand.position.set(0, 0, 0.18);
  vmBow.add(leftHand);
  const lbr = B(0.11, 0.22, 0.12, glove);
  lbr.position.set(0, -0.14, -0.02);
  leftHand.add(lbr);
  vmBow.position.set(0.3, -0.34, -0.72);
  vmBow.rotation.y = -0.1;
  camera.add(vmBow);

  vmSword = new THREE.Group();
  let sg = B(
    0.07,
    0.3,
    0.09,
    new THREE.MeshLambertMaterial({ color: 0x5a4630 }),
  );
  sg.position.y = 0.02;
  vmSword.add(sg);
  let grd = B(0.44, 0.07, 0.11, gold);
  grd.position.y = 0.2;
  vmSword.add(grd);
  let blade = B(0.14, 1.15, 0.05, steel);
  blade.position.y = 0.8;
  vmSword.add(blade);
  let tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 4), steel);
  tip.position.y = 1.42;
  vmSword.add(tip);
  let pom = B(0.1, 0.06, 0.1, gold);
  pom.position.y = -0.16;
  vmSword.add(pom);
  const sh = B(0.13, 0.13, 0.16, skin);
  sh.position.set(0, -0.05, 0.02);
  vmSword.add(sh);
  const sbr = B(0.11, 0.26, 0.12, glove);
  sbr.position.set(0, -0.17, 0);
  sh.add(sbr);
  vmSword.position.set(0.34, -0.45, -0.6);
  vmSword.rotation.x = -0.5;
  vmSword.visible = false;
  camera.add(vmSword);

  vmShield = new THREE.Group();
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.05, 18),
    gold,
  );
  rim.rotation.x = Math.PI / 2;
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.06, 18),
    new THREE.MeshLambertMaterial({ color: 0x9e2b20 }),
  );
  face.rotation.x = Math.PI / 2;
  const boss = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.09, 12),
    gold,
  );
  boss.rotation.x = Math.PI / 2;
  vmShield.add(rim, face, boss);
  vmShield.position.set(-0.4, -0.44, -0.55);
  vmShield.rotation.set(0.12, 0.2, 0.08);
  vmShield.visible = false;
  camera.add(vmShield);
}

function selectWeapon(i) {
  if (i === wi) return;
  wi = i;
  charge = 0;
  reloadT = 0;
  fireCD = 0.15;
}
function cycleEquip() {
  PLAYER.equip = (PLAYER.equip + 1) % EQUIP.length;
  rebuildPlayerModel();
  const e = EQUIP[PLAYER.equip];
  showMsg(
    e.name +
      " — speed " +
      Math.round(e.speed * 100) +
      "%, damage taken " +
      Math.round(e.armor * 100) +
      "%",
    2,
  );
}
function startReload() {
  if (
    wi < 3 &&
    WEAPONS[wi].type === "bow" &&
    ammo[wi] < WEAPONS[wi].quiver &&
    reloadT <= 0
  ) {
    reloadT = 1.2;
    AudioSys.reload();
  }
}

function tryFire() {
  const w = WEAPONS[wi];
  if (w.type === "melee") {
    if (swingCD <= 0) {
      swingT = 0.42;
      swingCD = 0.8;
      hitDone = false;
      AudioSys.swing(0);
    }
    return;
  }
  if (reloadT > 0 || fireCD > 0) return;
  if (ammo[wi] <= 0) {
    startReload();
    return;
  }
  if (charge < w.minCharge) charge = w.minCharge;
  fireCD = w.cd;
  const fwd = new THREE.Vector3();
  camera.getWorldDirection(fwd);
  const up = new THREE.Vector3(0, 1, 0);
  const rightV = new THREE.Vector3().crossVectors(fwd, up).normalize();
  const n = w.volley;
  for (let i = 0; i < n; i++) {
    const dir = fwd.clone();
    if (n > 1) dir.applyAxisAngle(up, (i - (n - 1) / 2) * w.volSpread);
    dir.applyAxisAngle(rightV, (Math.random() - 0.5) * 2 * w.spread);
    dir.applyAxisAngle(up, (Math.random() - 0.5) * 2 * w.spread);
    const dmg = w.dmg + w.dmgMax * charge;
    const spd = w.speed + w.speedMax * charge;
    const from = camera.position.clone().addScaledVector(fwd, 0.5);
    from.y -= 0.12;
    fireArrow(from, dir, spd, dmg, "red", PLAYER);
  }
  ammo[wi]--;
  charge = 0;
  vmKick = 0.16;
  if (ammo[wi] <= 0) startReload();
  if (w.snd === "cross") AudioSys.crossShot(0);
  else AudioSys.shoot(0);
}

function meleeHit() {
  const p = PLAYER;
  const fwd = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
  let hitAny = false;
  for (const c of CHARS) {
    if (!c.alive || c.team === "red") continue;
    const d = p.pos.distanceTo(c.pos);
    if (d < 2.5 && hasLOS(p, c)) {
      const dir = new THREE.Vector3()
        .subVectors(c.pos, p.pos)
        .setY(0)
        .normalize();
      if (dir.dot(fwd) > 0.25 || d < 1.2) {
        damageCharacter(c, WEAPONS[3].dmg * EQUIP[p.equip].melee, p);
        hitAny = true;
      }
    }
  }
  if (hitAny) AudioSys.meleeHit(0);
}

function updateViewModel(dt, bx, by) {
  if (wi < 3) {
    vmBow.visible = true;
    vmSword.visible = false;
    const nz = 0.12 + 0.35 * charge;
    setBar(stringA, TIP_T, new THREE.Vector3(0, 0, nz));
    setBar(stringB, TIP_B, new THREE.Vector3(0, 0, nz));
    arrowVM.position.z = nz;
    arrowVM.visible = charge > 0.03;
    leftHand.position.z = nz + 0.06;
    vmBow.position.set(
      0.3 + bx,
      -0.34 + by - (reloadT > 0 ? 0.18 : 0),
      -0.72 + vmKick,
    );
    vmBow.rotation.z = lerp(
      vmBow.rotation.z,
      reloadT > 0 ? -0.8 : 0,
      1 - Math.exp(-10 * dt),
    );
    vmBow.rotation.x = lerp(
      vmBow.rotation.x,
      -charge * 0.08,
      1 - Math.exp(-10 * dt),
    );
  } else {
    vmBow.visible = false;
    vmSword.visible = true;
    vmSword.position.set(0.34 + bx, -0.45 + by, -0.6 + vmKick * 0.5);
    if (swingT > 0) {
      const t = 1 - swingT / 0.42;
      const e = t * t * (3 - 2 * t);
      vmSword.rotation.x = -2.0 + 2.7 * e;
      vmSword.rotation.z = Math.sin(t * Math.PI) * 0.5;
    } else {
      vmSword.rotation.x = lerp(
        vmSword.rotation.x,
        -0.5,
        1 - Math.exp(-10 * dt),
      );
      vmSword.rotation.z = lerp(vmSword.rotation.z, 0, 1 - Math.exp(-10 * dt));
    }
  }
  vmShield.visible = guarding;
}

function updatePlayer(dt) {
  const p = PLAYER;
  p.yaw -= mouseDX * 0.0021;
  p.pitch = clamp(p.pitch - mouseDY * 0.0021, -1.45, 1.45);
  mouseDX = 0;
  mouseDY = 0;
  guarding = wi === 3 && drawing;
  // movement
  let fx = 0,
    fz = 0;
  if (keys.has("KeyW")) fz++;
  if (keys.has("KeyS")) fz--;
  if (keys.has("KeyD")) fx++;
  if (keys.has("KeyA")) fx--;
  const sprint = keys.has("ShiftLeft") && fz > 0 && stamina > 1;
  const moving = fx !== 0 || fz !== 0;
  const sp = p.speed * (sprint ? 1.45 : 1) * (guarding ? 0.55 : 1);
  const fwd = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
  const right = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
  const wish = new THREE.Vector3()
    .addScaledVector(fwd, fz)
    .addScaledVector(right, fx);
  if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(sp);
  const k = 1 - Math.exp(-11 * dt);
  p.vel.x = lerp(p.vel.x, wish.x, k);
  p.vel.z = lerp(p.vel.z, wish.z, k);
  if (keys.has("Space") && p.onGround) {
    p.vel.y = 7.6;
    p.onGround = false;
  }
  p.vel.y -= 22 * dt;
  p.pos.addScaledVector(p.vel, dt);
  if (sprint) stamina = Math.max(0, stamina - 20 * dt);
  else stamina = Math.min(100, stamina + 16 * dt);
  if (p.pos.y <= 0) {
    p.pos.y = 0;
    p.vel.y = 0;
    p.onGround = true;
  }
  collideWorld(p);
  if (p.pos.distanceTo(FLAGS.red.zone) < 5.5)
    p.hp = Math.min(100, p.hp + 12 * dt);
  p.inv = Math.max(0, p.inv - dt);
  // weapon
  fireCD -= dt;
  swingCD -= dt;
  const w = WEAPONS[wi];
  const isBow = w.type === "bow";
  if (isBow) {
    if (drawing && ammo[wi] > 0 && reloadT <= 0)
      charge = Math.min(1, charge + dt / w.chargeTime);
    else charge = Math.max(0, charge - dt * 5);
    if (reloadT > 0) {
      reloadT -= dt;
      if (reloadT <= 0) {
        reloadT = 0;
        ammo[wi] = w.quiver;
      }
    }
    if (fireHeld) tryFire();
  } else {
    charge = 0;
    if (fireHeld && !guarding) tryFire();
  }
  if (swingT > 0) {
    swingT -= dt;
    if (!hitDone && swingT < 0.28) {
      hitDone = true;
      meleeHit();
    }
  }
  // camera
  camera.position.set(p.pos.x, p.pos.y + 1.62, p.pos.z);
  camera.rotation.set(p.pitch, p.yaw, 0);
  if (shakeT > 0) {
    shakeT -= dt;
    camera.rotation.z = Math.sin(time * 55) * 0.035 * (shakeT / 0.25);
  } else camera.rotation.z = 0;
  // player body
  if (p.group) {
    p.group.position.copy(p.pos);
    p.group.rotation.y = p.yaw;
    const hs = Math.sqrt(p.vel.x * p.vel.x + p.vel.z * p.vel.z);
    if (hs > 0.5) p.walkPhase += dt * hs * 1.7;
    const wt = Math.sin(p.walkPhase);
    const wamp = hs > 0.5 ? 0.5 : 0;
    p.parts.legL.rotation.x = lerp(p.parts.legL.rotation.x, wt * wamp, 0.35);
    p.parts.legR.rotation.x = lerp(p.parts.legR.rotation.x, -wt * wamp, 0.35);
    p.parts.armR.rotation.x = lerp(
      p.parts.armR.rotation.x,
      swingT > 0 ? -1.7 : charge > 0.03 ? -0.95 : 0,
      0.35,
    );
    p.parts.armL.rotation.x = lerp(
      p.parts.armL.rotation.x,
      charge > 0.03 ? -1.2 : 0,
      0.35,
    );
  }
  const tFov = isBow && drawing && ammo[wi] > 0 ? 64 : 75;
  camera.fov = lerp(camera.fov, tFov, 1 - Math.exp(-9 * dt));
  camera.updateProjectionMatrix();
  // view model
  vmKick = Math.max(0, vmKick - 0.6 * dt);
  if (moving && p.onGround) bobT += dt * (sprint ? 1.5 : 1);
  const mv = moving ? 1 : 0.25;
  const bx = Math.cos(bobT * 3.4) * 0.01 * mv,
    by = Math.sin(bobT * 6.8) * 0.014 * mv;
  updateViewModel(dt, bx, by);
}
