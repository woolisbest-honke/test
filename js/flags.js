// ---------- Flags / scoring ----------
const SCORE = { red: 0, blue: 0 };

function updateFlags(dt) {
  for (const t of ["red", "blue", "gold"]) {
    const f = FLAGS[t];
    if (f.carrier && f.carrier.alive) {
      f.pos.copy(f.carrier.pos);
      if (f.carrier.team !== t) {
        const ownZone = FLAGS[f.carrier.team].zone;
        if (f.pos.distanceTo(ownZone) < 3.5) {
          const ct = f.carrier.team;
          f.carrier.carriesFlag = null;
          f.carrier = null;
          f.state = "base";
          f.pos.copy(f.rest);
          SCORE[ct]++;
          feed(
            "⚑ " +
              t.toUpperCase() +
              " flag captured by " +
              ct.toUpperCase() +
              "! (" +
              SCORE.red +
              "–" +
              SCORE.blue +
              ")",
          );
          if (PLAYER.team === ct)
            showMsg("FLAG CAPTURED! " + (3 - SCORE[ct]) + " to victory", 2.5);
          else showMsg("The " + t.toUpperCase() + " flag is taken!", 2.5);
          AudioSys.capture();
          if (SCORE[ct] >= 3) endGame(ct);
          continue;
        }
      }
    } else {
      for (const c of CHARS) {
        if (!c.alive || c.team === t || c.carriesFlag) continue;
        const ref = f.state === "base" ? f.zone : f.pos;
        if (c.pos.distanceTo(ref) < (f.state === "base" ? 2.2 : 1.8)) {
          f.carrier = c;
          c.carriesFlag = f;
          f.state = "carried";
          AudioSys.pickup(c.isPlayer ? 1 : 0.5);
          if (c.isPlayer)
            showMsg(
              "You carry the " + t.toUpperCase() + " flag — bring it home!",
              2.5,
            );
          feed("⚑ " + c.name + " took the " + t.toUpperCase() + " flag");
          break;
        }
      }
    }
  }
  for (const t of ["red", "blue", "gold"]) {
    const f = FLAGS[t],
      m = f.mesh;
    if (f.state === "carried" && f.carrier) {
      const c = f.carrier;
      m.position.set(
        c.pos.x + Math.sin(c.yaw) * 0.55,
        c.pos.y + 1.6,
        c.pos.z + Math.cos(c.yaw) * 0.55,
      );
      m.rotation.set(0, c.yaw, 0);
      m.scale.setScalar(0.8);
    } else if (f.state === "base") {
      m.position.copy(f.rest);
      m.rotation.set(
        0,
        t === "red" ? Math.PI : 0,
        Math.sin(time * 1.6 + (t === "blue" ? 1.3 : t === "gold" ? 2.6 : 0)) *
          0.05,
      );
      m.scale.setScalar(1);
    } else {
      m.position.set(f.pos.x, 1.3, f.pos.z);
      m.rotation.set(0, 0, 0);
      m.scale.setScalar(1);
    }
  }
}

function endGame(winner) {
  if (state === "end") return;
  state = "end";
  const won = winner === PLAYER.team;
  showOverlay(
    won ? "⚔ VICTORY ⚔" : "⚔ DEFEAT ⚔",
    winner.toUpperCase() + " wins " + SCORE.red + " – " + SCORE.blue,
    won
      ? "Your banner has prevailed over the field."
      : "The enemy has taken your banner.",
    "CLICK TO FIGHT AGAIN",
  );
  if (won) AudioSys.victory();
  else AudioSys.defeat();
  if (document.pointerLockElement) document.exitPointerLock();
}
