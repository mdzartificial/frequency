// ===== HAWKS SKYNET · ESCENA LOGIN ROJA =====
// Reemplaza TODO el contenido de tu último <script type="module"> por este archivo.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const container = document.getElementById('canvas-container');
const card = document.getElementById('login-floating-card');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const compact = matchMedia('(max-width: 760px)').matches;
const R = 2.3, TAU = Math.PI * 2;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact ? 1.4 : 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x040102, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camZ = () => (innerWidth / innerHeight < 0.8 ? 15 : 11.5);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 220);
camera.position.set(0, 0.4, camZ());

scene.add(new THREE.AmbientLight(0x6a2a2a, 1.3));
const sun = new THREE.DirectionalLight(0xffe2d0, 3.2); sun.position.set(-5, 3, 6); scene.add(sun);
const rim = new THREE.PointLight(0xff2a2a, 40, 30); rim.position.set(5, -2, -4); scene.add(rim);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.75, 0.55, 0.15));
composer.addPass(new OutputPass());

// ---------- Estrellas ----------
{
  const n = compact ? 3000 : 5000, a = new Float32Array(n * 3), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) { v.randomDirection().multiplyScalar(40 + Math.random() * 60); a.set([v.x, v.y, v.z], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffd0c8, size: 0.12, transparent: true, opacity: 0.85, depthWrite: false })));
}

// ---------- Globo ----------
const globe = new THREE.Group(); scene.add(globe);
const ll = (lat, lon, r = R) => {
  const p = (90 - lat) * Math.PI / 180, t = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t));
};

globe.add(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), new THREE.MeshStandardMaterial({ color: 0x0c0204, roughness: 0.85, metalness: 0.2 })));

{ // puntos de "continentes"
  const N = compact ? 4500 : 8000, pos = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), th = i * 2.399963, x = Math.cos(th) * r, z = Math.sin(th) * r;
    const m = Math.sin(x * 3.1 + 1.3) * Math.cos(y * 3.7) + Math.sin(z * 4.2 - 0.7) * Math.cos(x * 2.3 + y * 1.9) + Math.sin(y * 5.1 + z * 2.7) * 0.6;
    if (m > 0.25) pos.push(x * R * 1.004, y * R * 1.004, z * R * 1.004);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  globe.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xff3030, size: 0.024, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })));
}

{ // paralelos y meridianos
  const s = [], seg = 64;
  for (let lat = -60; lat <= 60; lat += 30) for (let i = 0; i < seg; i++) { const a = ll(lat, i / seg * 360 - 180, R * 1.001), b = ll(lat, (i + 1) / seg * 360 - 180, R * 1.001); s.push(a.x, a.y, a.z, b.x, b.y, b.z); }
  for (let lon = -180; lon < 180; lon += 30) for (let i = 0; i < seg; i++) { const a = ll(-90 + i / seg * 180, lon, R * 1.001), b = ll(-90 + (i + 1) / seg * 180, lon, R * 1.001); s.push(a.x, a.y, a.z, b.x, b.y, b.z); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(s, 3));
  globe.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.13 })));
}

// Atmósfera (halo rojo por fresnel)
scene.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 64, 48), new THREE.ShaderMaterial({
  vertexShader: 'varying vec3 vN,vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader: 'varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.6);gl_FragColor=vec4(1.,.16,.12,1.)*f*1.3;}',
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
})));

// ---------- Ciudades y conexiones (hub: Lima) ----------
const LIMA = [-12.05, -77.04];
const CITIES = [[40.7, -74], [34, -118], [51.5, -0.1], [40.4, -3.7], [-23.5, -46.6], [30, 31.2], [25.2, 55.3], [19, 73], [35.7, 139.7], [-33.9, 151.2], [55.7, 37.6], [-26.2, 28], [6.5, 3.4]];
const limaPos = ll(...LIMA);
const arcMat = new THREE.LineBasicMaterial({ color: 0xff4a3a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
const pulseGeo = new THREE.SphereGeometry(0.035, 10, 10), pulseMat = new THREE.MeshBasicMaterial({ color: 0xffd2c2 });
const dotGeo = new THREE.SphereGeometry(0.03, 10, 10), dotMat = new THREE.MeshBasicMaterial({ color: 0xffb199 });
const pulses = [];

function arc(a, b) {
  const A = ll(...a), B = ll(...b), d = A.distanceTo(B);
  const M = A.clone().add(B).multiplyScalar(0.5).normalize().multiplyScalar(R + 0.35 + d * 0.16);
  const c = new THREE.QuadraticBezierCurve3(A, M, B);
  globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(60)), arcMat));
  const p = new THREE.Mesh(pulseGeo, pulseMat); globe.add(p);
  pulses.push({ c, p, t: Math.random(), s: 0.1 + Math.random() * 0.1 });
}
CITIES.forEach(c => { arc(LIMA, c); const m = new THREE.Mesh(dotGeo, dotMat); m.position.copy(ll(...c, R * 1.003)); globe.add(m); });
[[CITIES[0], CITIES[2]], [CITIES[8], CITIES[9]], [CITIES[6], CITIES[7]], [CITIES[3], CITIES[4]], [CITIES[2], CITIES[5]]].forEach(([a, b]) => arc(a, b));

const hub = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
hub.position.copy(limaPos.clone().multiplyScalar(1.003)); globe.add(hub);
const hubRing = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.11, 40), new THREE.MeshBasicMaterial({ color: 0xff3030, side: THREE.DoubleSide, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
hubRing.position.copy(limaPos.clone().multiplyScalar(1.004)); hubRing.lookAt(limaPos.clone().multiplyScalar(2)); globe.add(hubRing);

// ---------- Satélites con antena ----------
const foil = new THREE.MeshStandardMaterial({ color: 0xb8862f, metalness: 0.9, roughness: 0.35 });
const silver = new THREE.MeshStandardMaterial({ color: 0xdadada, metalness: 0.85, roughness: 0.25, side: THREE.DoubleSide });
const panel = new THREE.MeshStandardMaterial({ color: 0x1c0709, emissive: 0x3a0508, metalness: 0.6, roughness: 0.3 });

function makeSat() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.28), foil));
  [-1, 1].forEach(s => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.012, 0.2), panel); w.position.x = s * 0.38; g.add(w);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 6), silver); arm.rotation.z = Math.PI / 2; arm.position.x = s * 0.12; g.add(arm);
  });
  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.07, 24, 1, true), silver);
  dish.rotation.x = -Math.PI / 2; dish.position.z = 0.2; g.add(dish);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2020 }));
  led.position.set(0.07, 0.1, -0.12); g.add(led); g.userData.led = led;
  g.scale.setScalar(1.4); return g;
}

const ORBITS = [
  { r: 3.4, tilt: [0.5, 0, 0.3], sp: 0.22, ph: 0 },
  { r: 3.9, tilt: [-0.6, 0, 0.5], sp: -0.17, ph: 2 },
  { r: 4.4, tilt: [0.9, 0, -0.4], sp: 0.13, ph: 4 },
  { r: 3.7, tilt: [0.1, 0, -0.9], sp: -0.2, ph: 5.5 }
];
const sats = ORBITS.map(o => {
  const grp = new THREE.Group(); grp.rotation.set(...o.tilt); scene.add(grp);
  const pts = []; for (let i = 0; i < 128; i++) pts.push(new THREE.Vector3(Math.cos(i / 128 * TAU) * o.r, 0, Math.sin(i / 128 * TAU) * o.r));
  grp.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.12 })));
  const mesh = makeSat(); grp.add(mesh);
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const beam = new THREE.Line(bg, new THREE.LineBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  beam.frustumCulled = false; scene.add(beam);
  return { ...o, mesh, beam };
});

// ---------- Astronauta flotando (amarrado a un satélite) ----------
function makeAstronaut() {
  const g = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color: 0xf3f1ef, roughness: 0.55, metalness: 0.05 });
  const gray = new THREE.MeshStandardMaterial({ color: 0xcfcfd2, roughness: 0.5, metalness: 0.2 });
  const visor = new THREE.MeshStandardMaterial({ color: 0x1a0a05, metalness: 1, roughness: 0.08, emissive: 0x3a0505 });
  const red = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
  const add = (geo, mat, x, y, z, rx = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); g.add(m); return m; };
  add(new THREE.CapsuleGeometry(0.17, 0.26, 6, 12), suit, 0, 0, 0);
  add(new THREE.SphereGeometry(0.19, 20, 16), suit, 0, 0.4, 0);
  const v = add(new THREE.SphereGeometry(0.15, 20, 16), visor, 0, 0.4, 0.09); v.scale.set(1, 0.85, 0.7);
  add(new THREE.BoxGeometry(0.3, 0.38, 0.16), gray, 0, 0.02, -0.17);
  add(new THREE.BoxGeometry(0.12, 0.05, 0.02), red, 0, 0.08, 0.17);
  add(new THREE.CapsuleGeometry(0.06, 0.24, 4, 8), suit, -0.26, 0.05, 0.08, 0.5, 0.5);
  add(new THREE.CapsuleGeometry(0.06, 0.24, 4, 8), suit, 0.26, 0.1, 0.1, 0.8, -0.7);
  add(new THREE.CapsuleGeometry(0.075, 0.28, 4, 8), suit, -0.1, -0.42, 0.04, 0.3, 0);
  add(new THREE.CapsuleGeometry(0.075, 0.28, 4, 8), suit, 0.1, -0.46, -0.02, -0.2, 0);
  g.scale.setScalar(0.9); return g;
}
const astro = makeAstronaut(); scene.add(astro);
const tetherGeo = new THREE.BufferGeometry(); tetherGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
const tether = new THREE.Line(tetherGeo, new THREE.LineBasicMaterial({ color: 0xffd0c8, transparent: true, opacity: 0.55 }));
tether.frustumCulled = false; scene.add(tether);

// ---------- Interacción ----------
const mouse = { x: 0, y: 0 };
addEventListener('mousemove', e => {
  mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1;
  if (card) { const r = card.getBoundingClientRect(); card.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100) + '%'); card.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100) + '%'); }
}, { passive: true });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.position.z = camZ(); camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
}, { passive: true });

// ---------- Loop ----------
const clock = new THREE.Clock(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), zero = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  if (!document.body.classList.contains('hunter-preauth')) return;
  const dt = Math.min(clock.getDelta(), 0.04), t = clock.elapsedTime, k = reduce ? 0.3 : 1;

  globe.rotation.y += dt * 0.06 * k;
  globe.updateMatrixWorld(true);
  hubRing.scale.setScalar(1 + ((t * 0.8) % 1) * 2.2); hubRing.material.opacity = 0.9 * (1 - ((t * 0.8) % 1));
  pulses.forEach(p => { p.t = (p.t + dt * p.s * k) % 1; p.p.position.copy(p.c.getPoint(p.t)); });

  const limaW = globe.localToWorld(limaPos.clone()), nrm = limaW.clone().normalize();
  sats.forEach((s, i) => {
    const a = t * s.sp * k + s.ph;
    s.mesh.position.set(Math.cos(a) * s.r, 0, Math.sin(a) * s.r);
    s.mesh.lookAt(zero);
    s.mesh.userData.led.visible = Math.sin(t * 5 + i * 2) > 0;
    s.mesh.getWorldPosition(v1);
    const vis = nrm.dot(v2.copy(v1).sub(limaW).normalize());
    const pa = s.beam.geometry.attributes.position;
    pa.setXYZ(0, v1.x, v1.y, v1.z); pa.setXYZ(1, limaW.x, limaW.y, limaW.z); pa.needsUpdate = true;
    s.beam.material.opacity = vis > 0.2 ? 0.35 + 0.35 * Math.sin(t * 6 + i) : 0;
  });

  const asp = innerWidth / innerHeight;
  astro.position.set((asp > 1 ? 4.6 : 2.6) + Math.sin(t * 0.4) * 0.25, 1.4 + Math.sin(t * 0.55) * 0.3, 1.6);
  astro.rotation.set(Math.sin(t * 0.3) * 0.5, t * 0.25 * k, Math.sin(t * 0.2) * 0.4);
  astro.localToWorld(v3.set(0, 0, -0.2));
  sats[0].mesh.getWorldPosition(v1);
  const ta = tether.geometry.attributes.position; ta.setXYZ(0, v3.x, v3.y, v3.z); ta.setXYZ(1, v1.x, v1.y, v1.z); ta.needsUpdate = true;

  camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.03;
  camera.position.y += (0.4 - mouse.y * 0.4 - camera.position.y) * 0.03;
  camera.lookAt(0, 0, 0);
  composer.render();
}
animate();
