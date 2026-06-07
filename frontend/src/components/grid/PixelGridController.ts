import * as THREE from 'three';
import { FluidSimulation } from './FluidSimulation.ts';
import { GridMesh } from './GridMesh.ts';
import { getDelay, type TransitionType } from './transitions.ts';
import type { GenerativeConfig } from '../../lib/generative.ts';

export interface GridConfig {
  gridSize?: number;
  cellSize?: number;
  gap?: number;
  /** Stand the grid upright like a billboard, with the camera orbiting
   *  around it (yaw) and `camera.up = (0, -1, 0)`. setRotation drives the
   *  orbit angle. Default: false (tabletop / top-down view, original behavior
   *  GenerativePreview depends on). */
  billboardMode?: boolean;
  /** Skip the WebGL fluid backdrop entirely. The Three.js canvas already
   *  clears alpha-transparent, so the page background shows through. Default:
   *  false (fluid backdrop visible). */
  disableFluid?: boolean;
  /** When true and billboardMode is on, the camera orbits the grid on its
   *  own at autoRotateSpeed °/sec. Calling setRotation manually (e.g. from
   *  a user-driven slider) implicitly turns this off via setAutoRotate(false).
   *  Default: false. */
  autoRotate?: boolean;
  /** Auto-rotate speed in degrees per second. Default 9 (a full sweep every
   *  ~40 seconds — slow museum spin). Only used when autoRotate is on. */
  autoRotateSpeed?: number;
  /** Cube/sphere material color. Default 0xffffff (white). Use a near-black
   *  like 0x141414 to render the crest in black-on-light pages — pure
   *  0x000000 zeros the diffuse term and flattens the lighting. */
  cellColor?: number;
  cellMetalness?: number;
  cellRoughness?: number;
}

interface CellAnimation {
  index: number;
  toVisible: boolean;
  startTime: number;
  duration: number;
}

export class PixelGridController {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private fluidSim: FluidSimulation | null;
  private gridMesh: GridMesh;
  private animFrameId = 0;
  private matchInterval: ReturnType<typeof setInterval> | null = null;
  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
  private animatingCells = new Map<number, CellAnimation>();
  private cleanupPointerEvents: (() => void) | null = null;
  private camH = 80;
  private gridSize: number;
  private cellSize: number;
  // Billboard mode state. orbitRadius / currentRotationDeg drive the camera
  // orbit; ignored when billboardMode=false.
  private billboardMode: boolean;
  private orbitRadius = 60;
  private currentRotationDeg = 0;
  // In billboard mode we add a vertical plane behind the cubes that catches
  // their shadows. Gives the crest a faint "card behind it" halo without
  // adding any visible geometry. Null in tabletop mode.
  private billboardBackdrop: THREE.Mesh | null = null;
  // Auto-rotate state. Driven by the animate loop using a fixed deg/sec rate.
  // setRotation (manual slider) calls setAutoRotate(false) to hand control off.
  private autoRotate: boolean;
  private autoRotateDegPerSec: number;
  private lastAnimateMs = 0;

  constructor(container: HTMLElement, config?: GridConfig) {
    this.container = container;
    this.gridSize = config?.gridSize ?? 32;
    this.cellSize = config?.cellSize ?? 1.3;
    this.billboardMode = !!config?.billboardMode;
    this.autoRotate = !!config?.autoRotate;
    this.autoRotateDegPerSec = config?.autoRotateSpeed ?? 18;
    const disableFluid = !!config?.disableFluid;

    // -- Scene --
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // -- Camera --
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    if (this.billboardMode) {
      // Match the v2 package pose: camera looks at the grid from in front,
      // slightly below, with up flipped so the rendered image is right-side
      // up after gridGroup.rotation.x = -PI/2.
      this.camera.up.set(0, -1, 0);
      this.camera.position.set(0, -20, this.orbitRadius);
      this.camera.lookAt(0, this.cellSize / 2, 0);
    } else {
      this.camera.position.set(0, this.camH, 0);
      this.camera.lookAt(0, 0, 0);
    }

    // -- Renderer --
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    // PCFSoft gives crisper soft shadow edges than VSM at this scale — VSM at
    // radius 30 reads as mush; PCFSoft at low radius keeps the depth cue.
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // ACES filmic tone mapping with a touch of extra exposure makes the
    // crests pop without clipping highlights.
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // -- Fluid sim canvas (behind Three.js) — opt-out for callers that want
    //    the page background to show through unfiltered (e.g. team hero on
    //    the cream site bg). --
    if (disableFluid) {
      this.fluidSim = null;
    } else {
      const fluidCanvas = document.createElement('canvas');
      fluidCanvas.style.position = 'absolute';
      fluidCanvas.style.top = '0';
      fluidCanvas.style.left = '0';
      fluidCanvas.style.width = '100%';
      fluidCanvas.style.height = '100%';
      fluidCanvas.style.zIndex = '0';
      container.appendChild(fluidCanvas);

      this.fluidSim = new FluidSimulation(fluidCanvas);
      this.cleanupPointerEvents = this.fluidSim.attachPointerEvents(container);
    }

    // -- Three.js canvas on top --
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '1';
    container.appendChild(this.renderer.domElement);

    // -- Lighting --
    this.setupLighting();

    // -- Grid mesh -- conditional spreads so callers that omit a material
    //    knob keep GridMesh's defaults (a literal `undefined` would clobber
    //    them via the spread merge in GridMesh's constructor).
    this.gridMesh = new GridMesh(this.scene, {
      gridSize: this.gridSize,
      cellSize: this.cellSize,
      gap: config?.gap ?? 0.02,
      ...(config?.cellColor !== undefined && { cellColor: config.cellColor }),
      ...(config?.cellMetalness !== undefined && { cellMetalness: config.cellMetalness }),
      ...(config?.cellRoughness !== undefined && { cellRoughness: config.cellRoughness }),
    });

    // Stand the grid upright like a billboard when requested. Done once at
    // construction; setRotation orbits the camera around it.
    if (this.billboardMode) {
      this.gridMesh.gridGroup.rotation.x = -Math.PI / 2;
    }

    // -- Wheel zoom --
    this.renderer.domElement.addEventListener('wheel', this.onWheel);

    // -- Start animation loop --
    this.animate();
  }

  private setupLighting(): void {
    if (this.billboardMode) {
      this.setupBillboardLighting();
    } else {
      this.setupTabletopLighting();
    }
  }

  /** Original tabletop pose. Key light from above casts down onto the grid.
   *  GenerativePreview match-design exports depend on this look. */
  private setupTabletopLighting(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    const dLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dLight.position.set(15, 50, 15);
    dLight.castShadow = true;
    dLight.shadow.mapSize.set(2048, 2048);
    dLight.shadow.camera.near = 1;
    dLight.shadow.camera.far = 150;
    dLight.shadow.camera.left = -60;
    dLight.shadow.camera.right = 60;
    dLight.shadow.camera.top = 60;
    dLight.shadow.camera.bottom = -60;
    dLight.shadow.radius = 30;
    dLight.shadow.blurSamples = 50;
    dLight.shadow.bias = -0.0005;
    this.scene.add(dLight);

    const rLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    rLight.position.set(-50, 20, -50);
    this.scene.add(rLight);

    const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight1.position.set(-30, 40, 30);
    this.scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight2.position.set(30, 30, -30);
    this.scene.add(fillLight2);
  }

  /** Billboard pose. Key light comes from the camera-front side so the camera
   *  sees lit faces, with a crisp PCFSoft shadow that lands on neighbouring
   *  cubes and the backdrop plane. Low ambient lets the key/shadow contrast
   *  carry the depth read. */
  private setupBillboardLighting(): void {
    // Low ambient — preserves shadow contrast so cubes read as 3D blocks
    // rather than flat tiles. Dropped further than v1 because with black
    // cubes the shadow side needs to actually go dark for depth to read.
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.12));

    // Key: front-upper-left (camera.up is flipped so world -y is camera-up).
    // Boosted intensity vs v1 so the lit / shadow ratio reads even on the
    // near-black cube material.
    const key = new THREE.DirectionalLight(0xffffff, 1.55);
    key.position.set(-22, -28, 48);
    key.castShadow = true;
    key.shadow.mapSize.set(3072, 3072);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 160;
    key.shadow.camera.left = -42;
    key.shadow.camera.right = 42;
    key.shadow.camera.top = 42;
    key.shadow.camera.bottom = -42;
    // Tight penumbra — gives crisp cast shadows on the backdrop and crisp
    // cube-on-cube shadow edges, both of which carry the depth cue.
    key.shadow.radius = 4;
    key.shadow.blurSamples = 18;
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    // Warm fill from the opposite side stops the shadow side from going
    // pitch black — keeps the crest legible across the rotate slider.
    const fill = new THREE.DirectionalLight(0xfff1d8, 0.32);
    fill.position.set(28, 18, 36);
    this.scene.add(fill);

    // Cool rim from behind catches the cube top/back edges as silhouette.
    const rim = new THREE.DirectionalLight(0xbfd8ff, 0.45);
    rim.position.set(0, 28, -42);
    this.scene.add(rim);

    // Vertical shadow-catching backdrop behind the cubes. ShadowMaterial is
    // transparent except where shadows fall, so the page background still
    // shows through cleanly between cubes — only the shadow halo lands here.
    // Cubes (post-rotation) span world z = [-cellSize, 0]; backdrop sits a
    // touch further back so the shadow lands AROUND each cube on the card.
    // Opacity bumped from 0.22 -> 0.5 so the cast halo is unmistakable.
    const gridExtent = this.gridSize * this.cellSize * 1.4;
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(gridExtent, gridExtent),
      new THREE.ShadowMaterial({ opacity: 0.5 }),
    );
    backdrop.position.set(0, this.cellSize / 2, -this.cellSize * 1.5);
    backdrop.receiveShadow = true;
    this.scene.add(backdrop);
    this.billboardBackdrop = backdrop;
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    if (this.billboardMode) {
      // Zoom in/out along the orbit ring instead of changing camera height.
      this.orbitRadius = Math.max(30, Math.min(120, this.orbitRadius + e.deltaY * 0.08));
      this.applyOrbit();
    } else {
      this.camH = Math.max(40, Math.min(150, this.camH + e.deltaY * 0.08));
      this.camera.position.y = this.camH;
    }
  };

  /** Re-place the camera on the orbit ring at currentRotationDeg / orbitRadius
   *  and re-aim at the grid center. Cheap; safe to call every frame. */
  private applyOrbit(): void {
    const rad = (this.currentRotationDeg * Math.PI) / 180;
    this.camera.position.x = Math.sin(rad) * this.orbitRadius;
    this.camera.position.z = Math.cos(rad) * this.orbitRadius;
    this.camera.position.y = -20;
    this.camera.lookAt(0, this.cellSize / 2, 0);
  }

  private animate = (): void => {
    this.animFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();

    // Auto-orbit. Uses dt rather than a per-frame constant so the spin rate
    // matches the configured deg/sec even on 120Hz/144Hz displays.
    if (this.autoRotate && this.billboardMode) {
      const dtSec = this.lastAnimateMs ? (now - this.lastAnimateMs) / 1000 : 0;
      this.currentRotationDeg = (this.currentRotationDeg + this.autoRotateDegPerSec * dtSec) % 360;
      this.applyOrbit();
    }
    this.lastAnimateMs = now;

    // Update cell animations
    const toRemove: number[] = [];
    for (const [index, anim] of this.animatingCells) {
      const p = Math.min((now - anim.startTime) / anim.duration, 1);
      const ease = 1 - (1 - p) ** 3; // ease-out-cubic

      // Bounce position
      const bounceY = Math.sin(p * Math.PI) * 0.5;
      // Scale: fade in/out at midpoint
      let scale: number;
      if (anim.toVisible) {
        scale = p > 0.5 ? ease : 0;
      } else {
        scale = p < 0.5 ? (1 - ease) : 0;
      }

      this.gridMesh.setCellMatrix(index, bounceY, scale);

      if (p >= 1) {
        // Final state
        this.gridMesh.setCellVisible(index, anim.toVisible);
        toRemove.push(index);
      }
    }
    for (const idx of toRemove) {
      this.animatingCells.delete(idx);
    }

    this.fluidSim?.step();
    this.renderer.render(this.scene, this.camera);
  };

  showLogo(pixels: number[], transition: TransitionType = 'wave'): void {
    // Clear pending timeouts from previous transition
    for (const t of this.pendingTimeouts) clearTimeout(t);
    this.pendingTimeouts = [];

    const logoSet = new Set(pixels);

    for (let pid = 1; pid <= this.gridSize * this.gridSize; pid++) {
      const index = pid - 1;
      const shouldBeVisible = logoSet.has(pid);
      const isVisible = this.gridMesh.getCellState(index);

      if (shouldBeVisible !== isVisible) {
        const timeout = setTimeout(() => {
          this.flipCell(index, shouldBeVisible);
        }, getDelay(pid, transition, this.gridSize));
        this.pendingTimeouts.push(timeout);
      }
    }
  }

  private flipCell(index: number, toVisible: boolean): void {
    // If already animating this cell, let the new animation override
    this.animatingCells.set(index, {
      index,
      toVisible,
      startTime: performance.now(),
      duration: 400,
    });
  }

  startMatchMode(homePixels: number[], awayPixels: number[], switchInterval: number = 4000): void {
    this.stopMatchMode();
    this.showLogo(homePixels, 'wave');

    let showingHome = true;
    let transIdx = 0;
    const transitions: TransitionType[] = ['wave', 'spiral', 'random', 'rows', 'columns', 'diagonal'];

    this.matchInterval = setInterval(() => {
      showingHome = !showingHome;
      transIdx = (transIdx + 1) % transitions.length;
      this.showLogo(showingHome ? homePixels : awayPixels, transitions[transIdx]);
    }, switchInterval);
  }

  stopMatchMode(): void {
    if (this.matchInterval) {
      clearInterval(this.matchInterval);
      this.matchInterval = null;
    }
  }

  setScale(scale: number): void {
    const clamped = Math.max(0.3, Math.min(1.5, scale));
    this.gridMesh.gridGroup.scale.set(clamped, clamped, clamped);
  }

  /** Recolor the crest cells (e.g. light cubes on a dark-mode page). */
  setCellColor(color: number): void {
    this.gridMesh.setCellColor(color);
  }

  setRotation(degrees: number): void {
    if (this.billboardMode) {
      // Manual rotation always wins over auto-orbit. Touching the slider
      // hands control to the user for the rest of the mount.
      this.autoRotate = false;
      // Camera orbits the upright grid; the grid stays put.
      this.currentRotationDeg = degrees;
      this.applyOrbit();
    } else {
      // Original tabletop pose: yaw the grid itself.
      this.gridMesh.gridGroup.rotation.y = (degrees * Math.PI) / 180;
    }
  }

  /** Toggle automatic camera orbit. Only meaningful in billboard mode. */
  setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
  }

  toggleShape(): void {
    this.gridMesh.toggleShape();
  }

  toggleDarkMode(): void {
    const total = this.gridSize * this.gridSize;
    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / this.gridSize);
      const col = i % this.gridSize;
      setTimeout(() => {
        const current = this.gridMesh.getCellState(i);
        this.flipCell(i, !current);
      }, (row + col) * 3);
    }
  }

  setZoom(height: number): void {
    this.camH = Math.max(40, Math.min(150, height));
    this.camera.position.y = this.camH;
  }

  // -- Accessors for high-res export --

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Apply a generative config to the grid for design export.
   * Configures scale, rotation, shape, fluid splats, and transition style.
   */
  applyGenerativeConfig(
    config: GenerativeConfig,
    homePixels: number[],
    awayPixels: number[]
  ): void {
    // Grid scale and rotation
    this.setScale(config.gridScale);
    this.setRotation(config.gridRotation);

    // Shape mode: toggle to sphere if needed
    const isSphere = this.gridMesh.getIsSpheres();
    if ((config.shapeMode === 'sphere') !== isSphere) {
      this.toggleShape();
    }

    // Logo blend: show home logo if blend > 0.5, away if <= 0.5
    const pixels = config.logoBlend > 0.5 ? homePixels : awayPixels;
    this.showLogo(pixels, config.transitionStyle);

    // Trigger fluid splats based on config (no-op when fluid is disabled).
    if (this.fluidSim) {
      const color: [number, number, number] = config.fluidColor;
      for (let i = 0; i < config.splatCount; i++) {
        // FluidSimulation.splat expects pixel coordinates
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        const x = Math.random() * w;
        const y = Math.random() * h;
        const dx = (Math.random() - 0.5) * 200;
        const dy = (Math.random() - 0.5) * 200;
        this.fluidSim.splat(x, y, dx, dy, color);
      }
    }
  }

  resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.fluidSim?.resizeCanvas();
  }

  dispose(): void {
    cancelAnimationFrame(this.animFrameId);
    this.stopMatchMode();
    for (const t of this.pendingTimeouts) clearTimeout(t);
    this.pendingTimeouts = [];

    this.renderer.domElement.removeEventListener('wheel', this.onWheel);
    if (this.cleanupPointerEvents) this.cleanupPointerEvents();

    this.gridMesh.dispose();
    this.fluidSim?.dispose();
    if (this.billboardBackdrop) {
      this.scene.remove(this.billboardBackdrop);
      (this.billboardBackdrop.material as THREE.Material).dispose();
      (this.billboardBackdrop.geometry as THREE.BufferGeometry).dispose();
      this.billboardBackdrop = null;
    }
    this.renderer.dispose();

    // Remove canvases from container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }
}
