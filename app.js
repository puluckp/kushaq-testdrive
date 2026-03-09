// ═══════════════════════════════════════════════════
// ŠKODA KUSHAQ 2026 — Virtual Test Drive
// Three.js + Interactive Controls + Haptics + Audio
// ═══════════════════════════════════════════════════

// ──────────────────────────────────────────────────
// CONFIGURATION — EDIT THESE
// ──────────────────────────────────────────────────
const CONFIG = {
  // Path to your GLB/GLTF file (relative to index.html)
  modelPath: 'model.glb',

  // Model adjustments
  modelScale: 1,
  modelRotationY: 90,       // rotate so front faces camera
  modelPositionY: 0,

  // Mapped mesh names from the actual Kushaq model
  meshNames: {
    doorFL: 'door_interior144',          // driver door exterior
    doorFR: 'door_interior144003',       // passenger door
    sunroofExt: 'Plane020',              // EXT_ROOF_OPEN_GLASS
    sunroofInt: 'Plane037',              // INT_ROOF_OPEN_GLASS
    headlightL: 'Plane009',             // EXT_Head_light_glow
    headlightR: 'Plane032',             // EXT_Head_light_glow
    headlightGlassL: 'Plane013',        // Ext_Headlight_Glass
    headlightGlassR: 'Plane027',        // Ext_Headlight_Glass
    taillightGlowL: 'Plane002',         // tail_lamp_Tex_glow
    taillightGlowR: 'Plane004',         // tail_lamp_Tex_glow
    taillightRedL: 'polySurface9',      // TL_COVER_RED
    taillightRedR: 'polySurface3451001', // TL_COVER_RED
    body: 'kushaq_ext_body8001',        // main body - EXT_carpanit
    infotainment: 'Plane136',           // infotainment screen
    steeringLogo: 'DSAAD12604',         // steering wheel
    interior: '',
  },

  // Camera positions (adjusted for auto-scaled model ~0.01)
  cameras: {
    hero:  { x: 3.5, y: 1.8, z: 3.5 },
    front: { x: 0,   y: 1.2, z: 5 },
    side:  { x: 5,   y: 1.2, z: 0 },
    rear:  { x: 0,   y: 1.2, z: -5 },
    top:   { x: 0,   y: 5,   z: 0.1 },
    interior: { x: 0, y: 1.0, z: 0.3 },
  }
};


// ──────────────────────────────────────────────────
// THREE.JS SETUP
// ──────────────────────────────────────────────────
let scene, camera, renderer, controls, carModel;
let ambientLight, dirLight1, dirLight2, fillLight, groundLight;
let headlightsL, headlightsR, taillightsL, taillightsR;
let mixer, clock;

function initThree() {
  const canvas = document.getElementById('threeCanvas');
  const section = document.getElementById('canvasSection');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050807);
  scene.fog = new THREE.Fog(0x050807, 15, 25);

  // Camera
  camera = new THREE.PerspectiveCamera(40, section.clientWidth / section.clientHeight, 0.1, 100);
  camera.position.set(CONFIG.cameras.hero.x, CONFIG.cameras.hero.y, CONFIG.cameras.hero.z);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setSize(section.clientWidth, section.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Controls
  controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 1.5;
  controls.maxDistance = 12;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.target.set(0, 0.8, 0);
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.5;

  // ── Lights — Studio Setup (bright) ──
  // Ambient — raised for overall visibility
  ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  // Key light (main studio light — top right, bright)
  dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight1.position.set(5, 8, 3);
  dirLight1.castShadow = true;
  dirLight1.shadow.mapSize.set(2048, 2048);
  dirLight1.shadow.camera.near = 0.5;
  dirLight1.shadow.camera.far = 20;
  dirLight1.shadow.camera.left = -5;
  dirLight1.shadow.camera.right = 5;
  dirLight1.shadow.camera.top = 5;
  dirLight1.shadow.camera.bottom = -5;
  scene.add(dirLight1);

  // Fill light (from left)
  dirLight2 = new THREE.DirectionalLight(0xc0d8ff, 0.8);
  dirLight2.position.set(-4, 4, -2);
  scene.add(dirLight2);

  // Back light (from behind, for rim/edge highlight)
  fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
  fillLight.position.set(0, 3, -6);
  scene.add(fillLight);

  // Front fill light
  var frontFill = new THREE.DirectionalLight(0xffffff, 0.5);
  frontFill.position.set(0, 2, 6);
  scene.add(frontFill);

  // Ground bounce light — hemisphere
  groundLight = new THREE.HemisphereLight(0xffffff, 0x333333, 0.5);
  scene.add(groundLight);

  // ── Ground plane ──
  const groundGeo = new THREE.PlaneGeometry(30, 30);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0a0f0a,
    roughness: 0.85,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  // Green accent line on ground
  const lineGeo = new THREE.PlaneGeometry(8, 0.005);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x4DB848, transparent: true, opacity: 0.2 });
  const greenLine = new THREE.Mesh(lineGeo, lineMat);
  greenLine.rotation.x = -Math.PI / 2;
  greenLine.position.y = 0.001;
  scene.add(greenLine);

  // ── Car headlight point lights (off by default) ──
  headlightsL = new THREE.SpotLight(0xffffff, 0, 10, Math.PI / 6, 0.5, 1);
  headlightsL.position.set(-0.8, 0.7, 2.2);
  headlightsL.target.position.set(-0.8, 0, 6);
  scene.add(headlightsL);
  scene.add(headlightsL.target);

  headlightsR = new THREE.SpotLight(0xffffff, 0, 10, Math.PI / 6, 0.5, 1);
  headlightsR.position.set(0.8, 0.7, 2.2);
  headlightsR.target.position.set(0.8, 0, 6);
  scene.add(headlightsR);
  scene.add(headlightsR.target);

  taillightsL = new THREE.PointLight(0xff2020, 0, 3);
  taillightsL.position.set(-0.7, 0.7, -2.2);
  scene.add(taillightsL);

  taillightsR = new THREE.PointLight(0xff2020, 0, 3);
  taillightsR.position.set(0.7, 0.7, -2.2);
  scene.add(taillightsR);

  // Clock for animations
  clock = new THREE.Clock();

  // Handle resize
  window.addEventListener('resize', onResize);

  // Start render loop
  animate();
}

function onResize() {
  const section = document.getElementById('canvasSection');
  camera.aspect = section.clientWidth / section.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(section.clientWidth, section.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Engine vibration
  if (state.engine && carModel) {
    carModel.position.x = (Math.random() - 0.5) * 0.001;
    carModel.position.z = (Math.random() - 0.5) * 0.001;
  }

  // Animation mixer
  if (mixer) {
    mixer.update(clock.getDelta());
  }

  renderer.render(scene, camera);
}


// ──────────────────────────────────────────────────
// MODEL LOADING
// ──────────────────────────────────────────────────
function loadModel() {
  const loader = new THREE.GLTFLoader();

  // Setup DRACO decoder for compressed models
  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    CONFIG.modelPath,

    // onLoad
    function (gltf) {
      carModel = gltf.scene;

      // Apply config
      carModel.scale.setScalar(CONFIG.modelScale);
      carModel.rotation.y = THREE.MathUtils.degToRad(CONFIG.modelRotationY);
      carModel.position.y = CONFIG.modelPositionY;

      // Enable shadows on all meshes
      carModel.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Improve materials
          if (child.material) {
            child.material.envMapIntensity = 1.0;
          }
        }
      });

      // Log all mesh names to console for debugging
      console.log('═══ MODEL MESH NAMES ═══');
      carModel.traverse(function (child) {
        if (child.isMesh) {
          console.log('  Mesh:', child.name, '| Material:', child.material?.name || 'unnamed');
        }
      });
      console.log('═══════════════════════');
      console.log('Total meshes found. Check names above and update CONFIG.meshNames in app.js');

      // Auto-center model
      const box = new THREE.Box3().setFromObject(carModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      console.log('Model size:', size);
      console.log('Model center:', center);

      // If model is very large, auto-scale it
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 10) {
        const autoScale = 4 / maxDim;
        carModel.scale.setScalar(autoScale);
        console.log('Auto-scaled model by:', autoScale);
        // Recalculate after scaling
        box.setFromObject(carModel);
        box.getCenter(center);
        box.getSize(size);
      }

      // Center horizontally, sit on ground
      carModel.position.x -= center.x;
      carModel.position.z -= center.z;
      carModel.position.y -= box.min.y; // sit on ground

      scene.add(carModel);

      // Setup animations if present
      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(carModel);
        console.log('Animations found:', gltf.animations.map(a => a.name));
      }

      // Update orbit target to model center
      controls.target.set(0, size.y * 0.4, 0);
      controls.update();

      // Loading complete
      onModelLoaded();
    },

    // onProgress
    function (xhr) {
      if (xhr.lengthComputable) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        updateLoader(pct);
      }
    },

    // onError
    function (error) {
      console.error('Error loading model:', error);
      document.getElementById('loaderPct').textContent = 'Error loading model — check console';
      document.getElementById('loaderFill').style.background = '#E03040';
    }
  );
}

function updateLoader(pct) {
  document.getElementById('loaderFill').style.width = pct + '%';
  document.getElementById('loaderPct').textContent = pct + '%';
}

function onModelLoaded() {
  updateLoader(100);
  setTimeout(function () {
    document.getElementById('loader').classList.add('hide');
    document.getElementById('opening').style.display = 'flex';
  }, 600);
}


// ──────────────────────────────────────────────────
// OPENING → MAIN TRANSITION
// ──────────────────────────────────────────────────
document.getElementById('startBtn').addEventListener('click', function () {
  haptic('medium');
  document.getElementById('opening').classList.add('hide');
  document.getElementById('main').style.display = 'block';
  requestAnimationFrame(function () {
    document.getElementById('main').classList.add('show');
  });
  setTimeout(function () {
    document.getElementById('opening').style.display = 'none';
    // Start slow auto-rotate
    controls.autoRotate = true;
  }, 900);

  // Hide hint after 4 seconds
  setTimeout(function () {
    const hint = document.getElementById('canvasHint');
    if (hint) hint.style.opacity = '0';
  }, 4000);
});

// Stop auto-rotate when user interacts
document.getElementById('threeCanvas').addEventListener('pointerdown', function () {
  controls.autoRotate = false;
});


// ──────────────────────────────────────────────────
// CAMERA PRESETS
// ──────────────────────────────────────────────────
function setCam(name) {
  haptic('click');
  const pos = CONFIG.cameras[name];
  if (!pos) return;

  // Update active button
  document.querySelectorAll('.cam-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.cam === name);
  });

  // Smooth camera transition
  controls.autoRotate = false;
  animateCamera(pos.x, pos.y, pos.z);
}

function animateCamera(tx, ty, tz) {
  const start = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  const duration = 800;
  const startTime = Date.now();

  function step() {
    const elapsed = Date.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - t, 3);

    camera.position.x = start.x + (tx - start.x) * ease;
    camera.position.y = start.y + (ty - start.y) * ease;
    camera.position.z = start.z + (tz - start.z) * ease;

    if (t < 1) requestAnimationFrame(step);
  }
  step();
}


// ──────────────────────────────────────────────────
// HAPTICS
// ──────────────────────────────────────────────────
function haptic(style) {
  if (!navigator.vibrate) return;
  switch (style) {
    case 'light': navigator.vibrate(10); break;
    case 'medium': navigator.vibrate(25); break;
    case 'heavy': navigator.vibrate([30, 20, 50]); break;
    case 'engine': navigator.vibrate([20, 10, 30, 10, 60]); break;
    case 'horn': navigator.vibrate([40, 15, 40]); break;
    case 'click': navigator.vibrate(8); break;
    case 'door': navigator.vibrate([15, 8, 30]); break;
  }
}


// ──────────────────────────────────────────────────
// AUDIO (Web Audio API)
// ──────────────────────────────────────────────────
let audioCtx = null;
function ac() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function sndEngine(on) {
  const c = ac(), t = c.currentTime;
  if (on) {
    const s = c.createOscillator(), sg = c.createGain();
    s.type = 'sawtooth'; s.frequency.setValueAtTime(120, t); s.frequency.linearRampToValueAtTime(200, t + 0.3);
    sg.gain.setValueAtTime(0.06, t); sg.gain.linearRampToValueAtTime(0.1, t + 0.15); sg.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    s.connect(sg).connect(c.destination); s.start(t); s.stop(t + 0.55);

    const e = c.createOscillator(), eg = c.createGain();
    e.type = 'sawtooth'; e.frequency.setValueAtTime(80, t + 0.4); e.frequency.linearRampToValueAtTime(140, t + 0.7); e.frequency.linearRampToValueAtTime(100, t + 1.2);
    eg.gain.setValueAtTime(0.001, t + 0.4); eg.gain.linearRampToValueAtTime(0.12, t + 0.7); eg.gain.linearRampToValueAtTime(0.06, t + 1.5); eg.gain.exponentialRampToValueAtTime(0.001, t + 2);
    e.connect(eg).connect(c.destination); e.start(t + 0.4); e.stop(t + 2.1);

    const r = c.createOscillator(), rg = c.createGain();
    r.type = 'sine'; r.frequency.setValueAtTime(35, t + 0.5);
    rg.gain.setValueAtTime(0.001, t + 0.5); rg.gain.linearRampToValueAtTime(0.15, t + 0.9); rg.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
    r.connect(rg).connect(c.destination); r.start(t + 0.5); r.stop(t + 2.3);
  } else {
    const e = c.createOscillator(), eg = c.createGain();
    e.type = 'sawtooth'; e.frequency.setValueAtTime(100, t); e.frequency.exponentialRampToValueAtTime(40, t + 0.6);
    eg.gain.setValueAtTime(0.08, t); eg.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    e.connect(eg).connect(c.destination); e.start(t); e.stop(t + 0.8);
  }
}

function sndDoor(opening) {
  const c = ac(), t = c.currentTime;
  const click = c.createOscillator(), cg = c.createGain();
  click.type = 'square'; click.frequency.setValueAtTime(opening ? 180 : 220, t);
  click.frequency.exponentialRampToValueAtTime(80, t + 0.08);
  cg.gain.setValueAtTime(0.12, t); cg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  click.connect(cg).connect(c.destination); click.start(t); click.stop(t + 0.15);

  const thud = c.createOscillator(), tg = c.createGain();
  thud.type = 'sine'; thud.frequency.setValueAtTime(opening ? 60 : 90, t + 0.05);
  thud.frequency.exponentialRampToValueAtTime(30, t + 0.25);
  tg.gain.setValueAtTime(opening ? 0.2 : 0.3, t + 0.05); tg.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  thud.connect(tg).connect(c.destination); thud.start(t + 0.05); thud.stop(t + 0.4);
}

function sndHorn() {
  const c = ac(), t = c.currentTime;
  [420, 520].forEach(function (f) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.08, t); g.gain.setValueAtTime(0.08, t + 0.3); g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.5);
  });
}

function sndSunroof() {
  const c = ac(), t = c.currentTime;
  const w = c.createOscillator(), wg = c.createGain();
  w.type = 'triangle'; w.frequency.setValueAtTime(300, t); w.frequency.linearRampToValueAtTime(280, t + 0.8);
  wg.gain.setValueAtTime(0.04, t); wg.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
  w.connect(wg).connect(c.destination); w.start(t); w.stop(t + 1);
}


// ──────────────────────────────────────────────────
// STATE & INTERACTIONS
// ──────────────────────────────────────────────────
const state = {
  engine: false,
  lights: false,
  door: false,
  sunroof: false,
  ambient: false,
  ambColor: 'green',
};

const ambColors = {
  green:   { r: 77, g: 184, b: 72 },
  ice:     { r: 96, g: 192, b: 224 },
  amber:   { r: 240, g: 160, b: 48 },
  warm:    { r: 255, g: 240, b: 208 },
  crimson: { r: 224, g: 48, b: 64 },
};

// Toast
let toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2000);
}

function flashWave(id, dur) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('on');
  setTimeout(function () { el.classList.remove('on'); }, dur);
}

// ── ENGINE ──
function toggleEngine() {
  state.engine = !state.engine;
  haptic(state.engine ? 'engine' : 'medium');
  document.getElementById('btnEngine').classList.toggle('on', state.engine);
  if (state.engine) flashWave('waveEngine', 2200);
  else document.getElementById('waveEngine').classList.remove('on');
  sndEngine(state.engine);
  toast(state.engine ? '1.5L TSI Engine — 150 PS' : 'Engine stopped');
}

// ── LIGHTS ──
function toggleLights() {
  state.lights = !state.lights;
  haptic('light');
  document.getElementById('btnLights').classList.toggle('on', state.lights);

  // Toggle 3D spot/point lights
  const intensity = state.lights ? 2 : 0;
  headlightsL.intensity = intensity;
  headlightsR.intensity = intensity;
  taillightsL.intensity = state.lights ? 1.5 : 0;
  taillightsR.intensity = state.lights ? 1.5 : 0;

  // Make headlight/taillight glow meshes emissive
  if (carModel) {
    var glowMeshes = ['Plane009','Plane032','Plane002','Plane004'];
    var glowColor = state.lights ? new THREE.Color(2, 2, 1.8) : new THREE.Color(0, 0, 0);
    glowMeshes.forEach(function(name) {
      var mesh = carModel.getObjectByName(name);
      if (mesh && mesh.material) {
        mesh.material.emissive = glowColor;
        mesh.material.emissiveIntensity = state.lights ? 1.5 : 0;
      }
    });
    // Red glow for taillights
    var tailMeshes = ['polySurface9','polySurface3451001','Plane162','Plane165'];
    var redGlow = state.lights ? new THREE.Color(1.5, 0.1, 0.1) : new THREE.Color(0, 0, 0);
    tailMeshes.forEach(function(name) {
      var mesh = carModel.getObjectByName(name);
      if (mesh && mesh.material) {
        mesh.material.emissive = redGlow;
        mesh.material.emissiveIntensity = state.lights ? 1.2 : 0;
      }
    });
  }

  toast(state.lights ? 'LED DRL & Headlights on' : 'Lights off');
}

// ── DOOR ──
function toggleDoor() {
  state.door = !state.door;
  haptic('door');
  document.getElementById('btnDoor').classList.toggle('on', state.door);
  flashWave('waveDoor', 500);
  sndDoor(state.door);

  // Try to animate door mesh if name is configured
  if (CONFIG.meshNames.doorFL && carModel) {
    const door = carModel.getObjectByName(CONFIG.meshNames.doorFL);
    if (door) {
      // Animate door rotation
      animateMeshRotation(door, 'y', state.door ? -Math.PI / 3 : 0, 600);
    }
  }

  toast(state.door ? 'Driver door opened' : 'Door closed securely');
}

// ── SUNROOF ──
function toggleSunroof() {
  state.sunroof = !state.sunroof;
  haptic('medium');
  document.getElementById('btnSunroof').classList.toggle('on', state.sunroof);
  sndSunroof();

  // Animate both exterior and interior sunroof glass
  if (carModel) {
    ['Plane020','Plane037','Plane028','Plane048'].forEach(function(name) {
      var sr = carModel.getObjectByName(name);
      if (sr) {
        animateMeshPosition(sr, 'y', state.sunroof ? 0.15 : 0, 800);
      }
    });
  }

  toast(state.sunroof ? 'Sunroof open — feel the sky' : 'Sunroof closed');
}

// ── AMBIENT ──
function toggleAmbient() {
  state.ambient = !state.ambient;
  haptic('light');
  document.getElementById('btnAmbient').classList.toggle('on', state.ambient);
  document.getElementById('ambientStrip').classList.toggle('show', state.ambient);
  updateAmbientLighting();
  toast(state.ambient ? 'Ambient lighting on' : 'Ambient off');
}

function setAmbColor(color, el) {
  state.ambColor = color;
  haptic('click');
  document.querySelectorAll('.amb-dot').forEach(function (d) { d.classList.remove('sel'); });
  el.classList.add('sel');
  updateAmbientLighting();
}

function updateAmbientLighting() {
  const c = ambColors[state.ambColor];
  if (state.ambient) {
    // Add a colored point light inside the car for ambient effect
    if (!window._ambLight) {
      window._ambLight = new THREE.PointLight(0xffffff, 0, 3);
      window._ambLight.position.set(0, 1.2, 0);
      scene.add(window._ambLight);
    }
    window._ambLight.color.setRGB(c.r / 255, c.g / 255, c.b / 255);
    window._ambLight.intensity = 0.8;

    // Also tint the rim light
    fillLight.color.setRGB(c.r / 255, c.g / 255, c.b / 255);
    fillLight.intensity = 0.3;
  } else {
    if (window._ambLight) window._ambLight.intensity = 0;
    fillLight.color.setHex(0x4DB848);
    fillLight.intensity = 0.15;
  }
}

// ── HORN ──
function tapHorn() {
  haptic('horn');
  sndHorn();
  document.getElementById('btnHorn').classList.add('on');
  flashWave('waveHorn', 500);
  setTimeout(function () { document.getElementById('btnHorn').classList.remove('on'); }, 500);
  toast('Beep beep!');
}


// ──────────────────────────────────────────────────
// MESH ANIMATION HELPERS
// ──────────────────────────────────────────────────
function animateMeshRotation(mesh, axis, target, duration) {
  const start = mesh.rotation[axis];
  const startTime = Date.now();
  function step() {
    const t = Math.min((Date.now() - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    mesh.rotation[axis] = start + (target - start) * ease;
    if (t < 1) requestAnimationFrame(step);
  }
  step();
}

function animateMeshPosition(mesh, axis, target, duration) {
  if (!mesh._origPos) mesh._origPos = mesh.position.clone();
  const start = mesh.position[axis];
  const startTime = Date.now();
  function step() {
    const t = Math.min((Date.now() - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    mesh.position[axis] = start + (target - start) * ease;
    if (t < 1) requestAnimationFrame(step);
  }
  step();
}


// ──────────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────────
initThree();
loadModel();
