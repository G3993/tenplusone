import * as THREE from 'three';
import { FluidSimulation } from './FluidSimulation.ts';
import { GridMesh } from './GridMesh.ts';
import { getDelay, type TransitionType } from './transitions.ts';

export interface GridConfig {
  gridSize?: number;
  cellSize?: number;
  gap?: number;
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
  private fluidSim: FluidSimulation;
  private gridMesh: GridMesh;
  private animFrameId = 0;
  private matchInterval: ReturnType<typeof setInterval> | null = null;
  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
  private animatingCells = new Map<number, CellAnimation>();
  private cleanupPointerEvents: (() => void) | null = null;
  private camH = 80;
  private gridSize: number;

  constructor(container: HTMLElement, config?: GridConfig) {
    this.container = container;
    this.gridSize = config?.gridSize ?? 32;

    // -- Scene --
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // -- Camera --
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 80, 0);
    this.camera.lookAt(0, 0, 0);

    // -- Renderer --
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;

    // -- Fluid sim canvas (behind Three.js) --
    const fluidCanvas = document.createElement('canvas');
    fluidCanvas.style.position = 'absolute';
    fluidCanvas.style.top = '0';
    fluidCanvas.style.left = '0';
    fluidCanvas.style.width = '100%';
    fluidCanvas.style.height = '100%';
    fluidCanvas.style.zIndex = '0';
    container.appendChild(fluidCanvas);

    // -- Three.js canvas on top --
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '1';
    container.appendChild(this.renderer.domElement);

    // -- Fluid simulation --
    this.fluidSim = new FluidSimulation(fluidCanvas);
    this.cleanupPointerEvents = this.fluidSim.attachPointerEvents(container);

    // -- Lighting --
    this.setupLighting();

    // -- Grid mesh --
    this.gridMesh = new GridMesh(this.scene, {
      gridSize: this.gridSize,
      cellSize: config?.cellSize ?? 1.3,
      gap: config?.gap ?? 0.02,
    });

    // -- Wheel zoom --
    this.renderer.domElement.addEventListener('wheel', this.onWheel);

    // -- Start animation loop --
    this.animate();
  }

  private setupLighting(): void {
    // Ambient
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    // Main directional light with shadows
    const dLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dLight.position.set(15, 50, 15);
    dLight.castShadow = true;
    dLight.shadow.mapSize.width = 2048;
    dLight.shadow.mapSize.height = 2048;
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

    // Rim light
    const rLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    rLight.position.set(-50, 20, -50);
    this.scene.add(rLight);

    // Fill lights
    const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight1.position.set(-30, 40, 30);
    this.scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight2.position.set(30, 30, -30);
    this.scene.add(fillLight2);
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.camH = Math.max(40, Math.min(150, this.camH + e.deltaY * 0.08));
    this.camera.position.y = this.camH;
  };

  private animate = (): void => {
    this.animFrameId = requestAnimationFrame(this.animate);

    // Update cell animations
    const now = performance.now();
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

    this.fluidSim.step();
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

  setRotation(degrees: number): void {
    this.gridMesh.gridGroup.rotation.y = (degrees * Math.PI) / 180;
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

  resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.fluidSim.resizeCanvas();
  }

  dispose(): void {
    cancelAnimationFrame(this.animFrameId);
    this.stopMatchMode();
    for (const t of this.pendingTimeouts) clearTimeout(t);
    this.pendingTimeouts = [];

    this.renderer.domElement.removeEventListener('wheel', this.onWheel);
    if (this.cleanupPointerEvents) this.cleanupPointerEvents();

    this.gridMesh.dispose();
    this.fluidSim.dispose();
    this.renderer.dispose();

    // Remove canvases from container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }
}
