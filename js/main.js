// ---------- Spawns ----------
function spawnBots() {
  const redNames = ["Aldric", "Bjorn", "Cedric", "Ewan"];
  const redRoles = ["raider", "guard", "flank", "skirm"];
  const blueNames = ["Garrick", "Hector", "Ivan", "Jorik", "Knut"];
  const blueRoles = ["raider", "guard", "flank", "guard", "skirm"];
  redNames.forEach((n, i) => BOTS.push(new Bot("red", n, redRoles[i])));
  blueNames.forEach((n, i) => BOTS.push(new Bot("blue", n, blueRoles[i])));
  BOTS.forEach((b) => {
    CHARS.push(b);
    respawnCharacter(b);
  });
}

// ---------- Main loop ----------
function frame() {
  requestAnimationFrame(frame);
  const now = performance.now();
  let dt = Math.min(0.05, (now - (frame.last || now)) / 1000);
  frame.last = now;
  if (state === "play") {
    time += dt;
    if (PLAYER.alive) updatePlayer(dt);
    else {
      PLAYER.respawnT -= dt;
      if (PLAYER.respawnT <= 0) respawnCharacter(PLAYER);
    }
    for (const b of BOTS) b.update(dt);
    updateArrows(dt);
    updateFlags(dt);
    updatePickups(dt);
    separate();
    AudioSys.musicTick();
    dmgFlash = Math.max(0, dmgFlash - 1.8 * dt);
    if (msgT > 0) {
      msgT -= dt;
      if (msgT < 0.4) msgEl.style.opacity = String(Math.max(0, msgT / 0.4));
    }
    updateHUD();
  }
  renderer.render(scene, camera);
}

// ---------- Init ----------
buildWorld();
buildPickups();
buildViewModel();
rebuildPlayerModel();
spawnBots();
updateHUD();
showStart();
frame();
