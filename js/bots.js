// ---------- Bots ----------
class Bot extends Character {
  constructor(team, name, role) {
    super(team, false, name, randInt(1, 3));
    this.role = role;
    this.side = team === "red" ? 1 : -1;
    this.guardOff = new THREE.Vector3(rand(-5, 5), 0, rand(-5, 5));
    this.goal = null;
    this.thinkT = rand(0, 0.4);
    this.attackT = rand(0.5, 1.5);
    this.meleeT = 0;
    this.combatT = rand(0, 0.15);
    this.drawT = 0;
    this.swingT = 0;
    this.stuckT = 0;
    this.detourT = 0;
    this.detour = null;
    this.combatTarget = null;
    this.sprint = false;
    this.group = buildBotModel(this);
    scene.add(this.group);
  }
  moveSpeed() {
    return this.speed * (this.sprint ? 1.4 : 1);
  }
  decide() {
    const foe = this.team === "red" ? "blue" : "red";
    const myF = FLAGS[this.team],
      foeF = FLAGS[foe],
      gF = FLAGS.gold,
      Z = myF.zone;
    this.sprint = false;
    let g = null;
    if (this.carriesFlag) {
      // carrying an enemy or gold flag — run it home
      g = Z.clone();
      this.sprint = true;
    } else {
      const allyCarry =
        myF.carrier ||
        (gF.carrier && gF.carrier.team === this.team ? gF.carrier : null);
      const foeCarry =
        (foeF.carrier && foeF.carrier.team === foe ? foeF.carrier : null) ||
        (gF.carrier && gF.carrier.team === foe ? gF.carrier : null);
      if (allyCarry) {
        g = allyCarry.pos.clone();
        this.sprint = allyCarry.pos.distanceTo(Z) > 30;
      } else if (foeCarry) {
        if (this.role === "raider" || this.role === "flank") {
          g = foeCarry.pos.clone();
          this.sprint = true;
        } else if (this.role === "guard") g = Z.clone().add(this.guardOff);
        else g = new THREE.Vector3(this.side * rand(8, 34), 0, rand(-45, 45));
      } else if (this.role === "raider") {
        this.sprint = true;
        const wp = new THREE.Vector3(this.side * 20, 0, 0);
        if (this.pos.distanceTo(wp) > 12) g = wp;
        else
          g = (
            this.pos.distanceTo(foeF.pos) < this.pos.distanceTo(gF.pos)
              ? foeF
              : gF
          ).pos.clone();
      } else if (this.role === "guard") g = Z.clone().add(this.guardOff);
      else if (this.role === "flank")
        g = new THREE.Vector3(this.side * 42, 0, foeF.pos.z * 0.45);
      else g = new THREE.Vector3(this.side * rand(8, 34), 0, rand(-45, 45));
    }
    if (this.hp < 30 && !this.carriesFlag) {
      g = Z.clone().add(this.guardOff);
      this.sprint = false;
    }
    if (g) {
      g.x = clamp(g.x, -112, 112);
      g.z = clamp(g.z, -124, 124);
    }
    this.goal = g;
  }
  tryCombat() {
    let best = null,
      bd = 1e9;
    for (const c of CHARS) {
      if (c === this || !c.alive || c.team === this.team) continue;
      const d = this.pos.distanceTo(c.pos);
      if (d < 48 && d < bd && hasLOS(this, c)) {
        best = c;
        bd = d;
      }
    }
    this.combatTarget = best;
    if (!best) return;
    if (bd < 2.8) {
      if (this.meleeT <= 0) {
        this.meleeT = 0.8;
        this.swingT = 0.3;
        if (bd < 2.4) damageCharacter(best, 13 + rand(9), this);
      }
    } else if (this.attackT <= 0) {
      this.attackT = rand(0.9, 1.7);
      this.drawT = 0.45;
      const t = bd / 55,
        up = 0.5 * 18 * t * t;
      const aim = new THREE.Vector3(
        best.pos.x,
        best.pos.y + 1.2 + up,
        best.pos.z,
      );
      const from = new THREE.Vector3(this.pos.x, this.pos.y + 1.5, this.pos.z);
      const dir = aim.sub(from).normalize();
      const err = 0.05 + bd * 0.0012;
      dir.x += rand(-err, err);
      dir.y += rand(-err, err) * 0.4;
      dir.z += rand(-err, err);
      dir.normalize();
      fireArrow(from, dir, 55, 15 + rand(28), this.team, this);
      AudioSys.shoot(from.distanceTo(PLAYER.pos));
    }
  }
  update(dt) {
    if (!this.alive) {
      this.respawnT -= dt;
      if (this.respawnT <= 0) respawnCharacter(this);
      return;
    }
    this.inv = Math.max(0, this.inv - dt);
    this.thinkT -= dt;
    if (this.thinkT <= 0) {
      this.thinkT = 0.2 + rand(0.2);
      this.decide();
    }
    this.combatT -= dt;
    if (this.combatT <= 0) {
      this.combatT = 0.15;
      this.tryCombat();
    }
    this.meleeT -= dt;
    this.attackT -= dt;
    this.drawT -= dt;
    this.swingT -= dt;
    this.detourT -= dt;
    // steering
    let tgt = this.detourT > 0 ? this.detour : this.goal;
    const des = new THREE.Vector3();
    if (tgt) {
      const to = new THREE.Vector3(tgt.x - this.pos.x, 0, tgt.z - this.pos.z);
      const d = to.length();
      if (d > 1.3) des.copy(to).multiplyScalar(this.moveSpeed() / d);
    }
    const k = 1 - Math.exp(-8 * dt);
    this.vel.x = lerp(this.vel.x, des.x, k);
    this.vel.z = lerp(this.vel.z, des.z, k);
    this.vel.y -= 22 * dt;
    this.pos.addScaledVector(this.vel, dt);
    if (this.pos.y <= 0) {
      this.pos.y = 0;
      this.vel.y = 0;
      this.onGround = true;
    }
    collideWorld(this);
    // stuck detection
    const sp2 = this.vel.x * this.vel.x + this.vel.z * this.vel.z;
    if (
      this.goal &&
      this.pos.distanceTo(this.goal) > 8 &&
      sp2 < 0.8 &&
      this.onGround
    ) {
      this.stuckT += dt;
      if (this.stuckT > 0.6) {
        const to = new THREE.Vector3(
          this.goal.x - this.pos.x,
          0,
          this.goal.z - this.pos.z,
        ).normalize();
        const perp = new THREE.Vector3(-to.z, 0, to.x).multiplyScalar(
          (Math.random() < 0.5 ? -1 : 1) * rand(5, 9),
        );
        this.detour = this.pos.clone().add(perp);
        this.detourT = 1.3;
        this.stuckT = 0;
      }
    } else this.stuckT = 0;
    // facing
    if (this.combatTarget)
      this.yaw = approachAngle(
        this.yaw,
        yawTo(this.pos, this.combatTarget.pos),
        8 * dt,
      );
    else if (this.goal)
      this.yaw = approachAngle(this.yaw, yawTo(this.pos, this.goal), 4 * dt);
    // heal in own base
    if (this.pos.distanceTo(FLAGS[this.team].zone) < 5.5)
      this.hp = Math.min(100, this.hp + 12 * dt);
    // transform + animation
    const sp = Math.sqrt(sp2);
    if (sp > 0.5) this.walkPhase += dt * sp * 1.7;
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.yaw;
    const p = this.parts,
      t = Math.sin(this.walkPhase),
      amp = sp > 0.5 ? 0.55 : 0;
    p.legL.rotation.x = lerp(p.legL.rotation.x, t * amp, 0.35);
    p.legR.rotation.x = lerp(p.legR.rotation.x, -t * amp, 0.35);
    let aL = -t * amp * 0.5,
      aR = t * amp * 0.5;
    if (this.drawT > 0) {
      aR = -1.25;
      aL = -0.9;
    }
    if (this.swingT > 0) aR = -1.7;
    p.armL.rotation.x = lerp(p.armL.rotation.x, aL, 0.35);
    p.armR.rotation.x = lerp(p.armR.rotation.x, aR, 0.35);
    p.bow.visible = this.drawT > 0;
    p.sword.visible = this.swingT > 0;
  }
}
