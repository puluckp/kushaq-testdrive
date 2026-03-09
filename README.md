# ŠKODA KUSHAQ 2026 — Virtual Test Drive

## Quick Setup (2 minutes)

### Step 1: Place your GLB file
Copy your `.glb` file into the `assets/` folder and rename it to `kushaq.glb`

```
kushaq-local/
├── index.html
├── style.css
├── app.js
├── README.md
└── assets/
    └── kushaq.glb   ← PUT YOUR FILE HERE
```

### Step 2: Start a local server
Open Terminal/Command Prompt, navigate to this folder, and run:

**Python (most common):**
```bash
cd path/to/kushaq-local
python -m http.server 8080
```

**Node.js:**
```bash
cd path/to/kushaq-local
npx serve .
```

**VS Code:** Install "Live Server" extension → right-click `index.html` → Open with Live Server

### Step 3: Open in browser
Go to: `http://localhost:8080`

---

## Customizing the Model

Open `app.js` and edit the `CONFIG` object at the top:

### Model Path
```js
modelPath: 'assets/kushaq.glb'   // change if your file has a different name
```

### Scale & Position
If the car appears too big or too small:
```js
modelScale: 1,        // try 0.01 for huge models, 100 for tiny ones
modelPositionY: 0,    // negative moves car down
modelRotationY: 0,    // degrees — rotate to face camera
```

### Mesh Names (IMPORTANT!)
After the model loads, open **browser DevTools → Console** (F12).
You'll see a list of all mesh names like:
```
═══ MODEL MESH NAMES ═══
  Mesh: Body_Paint | Material: Green_Metallic
  Mesh: Door_FL | Material: Green_Metallic
  Mesh: Sunroof_Glass | Material: Glass
  ...
```

Copy the relevant names into CONFIG:
```js
meshNames: {
  doorFL: 'Door_FL',         // driver door
  sunroof: 'Sunroof_Glass',  // sunroof panel
  headlightL: 'HL_Left',     // left headlight
  // ... etc
}
```

This enables actual 3D animations (door opening, sunroof sliding, etc.)

### Camera Positions
Adjust the preset camera angles:
```js
cameras: {
  hero:  { x: 4.5, y: 2.0, z: 4.5 },  // default view
  front: { x: 0,   y: 1.5, z: 6 },
  side:  { x: 6,   y: 1.5, z: 0 },
  rear:  { x: 0,   y: 1.5, z: -6 },
  top:   { x: 0,   y: 7,   z: 0.1 },
}
```

---

## Optimizing the GLB (if >15MB)

For the Cardekho mobile ad, the file should ideally be under 15MB.

### Option 1: gltf.report (browser tool)
1. Go to https://gltf.report
2. Drop your GLB file
3. See size breakdown
4. Apply: Texture Compress → WebP, Mesh Compress → Draco
5. Export optimized GLB

### Option 2: Command line
```bash
npm install -g @gltf-transform/cli
gltf-transform optimize kushaq.glb kushaq-opt.glb --compress draco --texture-compress webp
```

### Option 3: gltf-pipeline
```bash
npm install -g gltf-pipeline
gltf-pipeline -i kushaq.glb -o kushaq-opt.glb -d
```

---

## Features
- 🎮 Full 360° orbit controls (drag to rotate, pinch to zoom)
- 🔊 Engine start/stop with synthesized audio
- 💡 LED headlights & taillights (actual 3D lights in the scene)
- 🚪 Door open/close with sound
- ☀️ Sunroof open/close
- 🎨 5-color ambient lighting
- 📯 Horn with haptic feedback
- 📱 Mobile haptic vibrations on every interaction
- 📷 5 camera angle presets (Hero, Front, Side, Rear, Top)

---

## Troubleshooting

**Model doesn't load:**
- Make sure you're using a local server (not file://)
- Check browser console (F12) for errors
- Verify the GLB file path

**Model is black/dark:**
- The studio lighting should handle this, but you can increase light intensity in app.js
- Try increasing `renderer.toneMappingExposure` in app.js

**Model is too big/small:**
- Adjust `CONFIG.modelScale` in app.js
- The auto-scale feature should handle most cases

**Door/sunroof buttons don't animate the 3D model:**
- You need to set the correct mesh names in CONFIG.meshNames
- Check the browser console for the mesh name list after loading

**No sound on mobile:**
- Audio requires user interaction first (the "Begin Experience" button handles this)
