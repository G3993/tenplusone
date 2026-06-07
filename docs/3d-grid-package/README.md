# Internet Football Club - 3D Grid Package

## Files

### Core Files
- `index.html` - Main 3D grid with WebGL fluid simulation and all 48 World Cup 2026 teams
- `team_pixels.js` - Team pixel data as JavaScript object (for direct embedding)
- `team_pixels.json` - Team pixel data as JSON (for API/dynamic loading)
- `fluid-standalone.html` - Standalone fluid simulation (for use as background layer)

### Team Count
48 teams total - Full World Cup 2026 roster

### Features
- 32×32 pixel grid (1024 total pixels)
- WebGL fluid simulation background (chrome/metal palette)
- Team logo rendering with 6 transition styles (wave, spiral, random, rows, columns, diagonal)
- Dropdown team selector + Random button
- Shape toggle (Cubes ↔ Spheres)
- Wave VFX animation
- Dark/Light mode toggle
- Scale slider (0.3x - 1.5x)
- Rotation slider (0° - 360°)
- Scroll to zoom

### Integration Options

#### Option 1: Standalone
Simply open `index.html` - fully self-contained, no dependencies except CDN Three.js

#### Option 2: Embed in existing site
The fluid simulation and 3D grid use separate canvas layers:
- `#fluid-canvas` - WebGL fluid (z-index: 0)
- `#canvas-container` - Three.js grid (z-index: 1)

#### Option 3: Load teams dynamically
```javascript
fetch('team_pixels.json')
  .then(r => r.json())
  .then(teams => {
    // teams.usa.name = "USA"
    // teams.usa.pixels = [70, 71, 72, ...]
  });
```

### Display Logic
- Logo pixels = WHITE solid cubes (block fluid view)
- Background pixels = TRANSPARENT (fluid shows through)

### Technical Specs
- Grid: CELL_SIZE: 1.3, GAP: 0.02
- Camera: Fixed overhead at y=80
- Shadows: VSM soft shadows, map: 2048×2048, radius: 30, blur: 50
- Fluid: DENSITY_DISSIPATION: 0.98, CURL: 30, SPLAT_RADIUS: 0.005

### GitHub
Push to: https://github.com/G3993/tenplusone
Live: https://g3993.github.io/tenplusone/
