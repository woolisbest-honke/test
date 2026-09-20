// ---------- Arrows ----------
const ARROWS = [];

function makeArrowMesh() {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.024, 1.5),
    new THREE.MeshLambertMaterial({ color: 0x9a7b4f }),
  );
  g.add(shaft);
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.16, 6),
    new THREE.MeshLambertMaterial({ color: 0x9aa0aa }),
  );
  head.rotation.x = -Math.PI / 2;
  head.position.z = -0.83;
  g.add(head);
  for (let i = 0; i < 3; i++) {
    const fl = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 0.11),
      new THREE.MeshLambertMaterial({
        color: 0xe8e4d8,
        side: THREE.DoubleSide,
      }),
    );
    fl.position.set(0, 0.02, 0.62);
    fl.rotation.y = (i * Math.PI * 2) / 3;
    g.add(fl);
  }
  g.visible = false;
  scene.add(g);
  return g;
}
for (let i = 0; i < 90; i++)
  ARROWS.push({
    mesh: makeArrowMesh(),
    active: false,
    stuck: false,
    life: 0,
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    dmg: 0,
    team: "red",
    owner: null,
  });

function fireArrow(pos, dir, speed, dmg, team, owner) {
  let a = null;
  for (const x of ARROWS)
    if (!x.active) {
      a = x;
      break;
    }
  if (!a) a = ARROWS[0];
  a.active = true;
  a.stuck = false;
  a.life = 0;
  a.dmg = dmg;
  a.team = team;
  a.owner = owner;
  a.pos.copy(pos);
  a.vel.copy(dir).normalize().multiplyScalar(speed);
  a.mesh.visible = true;
  a.mesh.position.copy(pos);
}

function updateArrows(dt) {
  for (const a of ARROWS) {
    if (!a.active) continue;
    if (a.stuck) {
      a.life -= dt;
      if (a.life <= 0) {
        a.active = false;
        a.mesh.visible = false;
      }
      continue;
    }
    a.vel.y -= 18 * dt;
    const sp = a.vel.length();
    const steps = Math.max(1, Math.ceil((sp * dt) / 0.2));
    let done = false;
    for (let i = 0; i < steps && !done; i++) {
      a.pos.addScaledVector(a.vel, dt / steps);
      if (a.pos.y < 0.05) {
        a.pos.y = 0.05;
        a.stuck = true;
        a.life = 2.5;
        done = true;
        continue;
      }
      if (a.pos.x < -125 || a.pos.x > 125 || a.pos.z < -135 || a.pos.z > 135) {
        a.active = false;
        a.mesh.visible = false;
        break;
      }
      for (const b of obstacles) {
        if (
          a.pos.x > b.x1 &&
          a.pos.x < b.x2 &&
          a.pos.z > b.z1 &&
          a.pos.z < b.z2 &&
          a.pos.y < b.h
        ) {
          a.stuck = true;
          a.life = 2.5;
          done = true;
          break;
        }
      }
      if (done) continue;
      for (const c of CHARS) {
        if (!c.alive || c === a.owner || c.team === a.team) continue;
        const dx = a.pos.x - c.pos.x,
          dz = a.pos.z - c.pos.z;
        const dy1 = a.pos.y - (c.pos.y + 1.2),
          dy2 = a.pos.y - (c.pos.y + 1.85);
        if (
          dx * dx + dy1 * dy1 + dz * dz < 0.3 ||
          dx * dx + dy2 * dy2 + dz * dz < 0.12
        ) {
          damageCharacter(c, a.dmg, a.owner);
          a.stuck = true;
          a.life = 2.5;
          AudioSys.hit(a.pos.distanceTo(PLAYER.pos));
          done = true;
          break;
        }
      }
    }
    if (a.active) {
      a.mesh.position.copy(a.pos);
      // The tip sits at -z while Object3D.lookAt points +z at the given
      // point, so aim at the point behind us to fly tip-first.
      a.mesh.lookAt(a.pos.x - a.vel.x, a.pos.y - a.vel.y, a.pos.z - a.vel.z);
    }
  }
}
