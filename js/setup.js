// ---------- three.js setup ----------
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc4d2de);
scene.fog = new THREE.Fog(0xc4d2de, 150, 470);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  500,
);
camera.rotation.order = "YXZ";
scene.add(camera);

const hemi = new THREE.HemisphereLight(0xcfe5ff, 0x3f5a35, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d6, 1.0);
sun.position.set(70, 110, 50);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.left = -185;
sc.right = 185;
sc.top = 185;
sc.bottom = -185;
sc.near = 10;
sc.far = 360;
sun.shadow.bias = -0.0004;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x9fb8d8, 0.35);
fill.position.set(-60, 40, -80);
scene.add(fill);

// sky dome, sun glow and clouds (procedural — see textures.js)
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(480, 24, 16),
  new THREE.MeshBasicMaterial({
    map: TEX.sky,
    side: THREE.BackSide,
    fog: false,
  }),
);
scene.add(sky);
const sunDir = new THREE.Vector3(70, 110, 50).normalize();
const sunSpr = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: sunGlowTex(),
    fog: false,
    depthWrite: false,
  }),
);
sunSpr.position.copy(sunDir).multiplyScalar(430);
sunSpr.scale.set(220, 220, 1);
scene.add(sunSpr);
const cloudTexs = [makeCloudTex(), makeCloudTex(), makeCloudTex()];
for (let i = 0; i < 10; i++) {
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: cloudTexs[i % 3],
      transparent: true,
      opacity: rand(0.35, 0.65),
      fog: false,
      depthWrite: false,
    }),
  );
  const a = rand(0, Math.PI * 2),
    r = rand(80, 360);
  sp.position.set(Math.cos(a) * r, rand(150, 240), Math.sin(a) * r);
  sp.scale.set(rand(60, 130), rand(24, 46), 1);
  scene.add(sp);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
