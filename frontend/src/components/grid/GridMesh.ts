import * as THREE from 'three';

export interface GridMeshConfig {
  gridSize: number;
  cellSize: number;
  gap: number;
  /** Material color for the cube/sphere cells. Default 0xffffff (white).
   *  Use a dark non-zero value (e.g. 0x141414) for black-on-light pages —
   *  pure 0x000000 zeros out the diffuse term and kills face shading. */
  cellColor: number;
  cellMetalness: number;
  cellRoughness: number;
}

const DEFAULT_CONFIG: GridMeshConfig = {
  gridSize: 32,
  cellSize: 1.3,
  gap: 0.02,
  cellColor: 0xffffff,
  cellMetalness: 0.08,
  cellRoughness: 0.45,
};

export class GridMesh {
  private scene: THREE.Scene;
  private config: GridMeshConfig;
  private instancedMesh: THREE.InstancedMesh | null = null;
  private cellStates: Uint8Array;
  private cubeGeometry: THREE.BoxGeometry;
  private sphereGeometry: THREE.SphereGeometry;
  private material: THREE.MeshStandardMaterial;
  private shadowPlane: THREE.Mesh;
  private isSpheres = false;
  private dummy = new THREE.Object3D();
  readonly gridGroup: THREE.Group;
  readonly totalCells: number;

  constructor(scene: THREE.Scene, config?: Partial<GridMeshConfig>) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.totalCells = this.config.gridSize * this.config.gridSize;
    this.cellStates = new Uint8Array(this.totalCells);

    this.gridGroup = new THREE.Group();
    scene.add(this.gridGroup);

    const { cellSize } = this.config;
    this.cubeGeometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
    this.sphereGeometry = new THREE.SphereGeometry(cellSize * 0.55, 24, 24);

    this.material = new THREE.MeshStandardMaterial({
      color: this.config.cellColor,
      metalness: this.config.cellMetalness,
      roughness: this.config.cellRoughness,
    });

    // Shadow-receiving plane
    this.shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ opacity: 0.35 }),
    );
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -1.0;
    this.shadowPlane.receiveShadow = true;
    scene.add(this.shadowPlane);

    this.createInstancedMesh(this.cubeGeometry);
  }

  /** Live-update the cell material color (shared across all instances). */
  setCellColor(color: number): void {
    this.config.cellColor = color;
    this.material.color.setHex(color);
  }

  private createInstancedMesh(geometry: THREE.BufferGeometry): void {
    if (this.instancedMesh) {
      this.gridGroup.remove(this.instancedMesh);
      this.instancedMesh.dispose();
    }

    const mesh = new THREE.InstancedMesh(geometry, this.material, this.totalCells);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const { gridSize, cellSize, gap } = this.config;
    const offset = (gridSize * (cellSize + gap)) / 2 - (cellSize + gap) / 2;

    for (let j = 0; j < gridSize; j++) {
      for (let i = 0; i < gridSize; i++) {
        const idx = j * gridSize + i;
        this.dummy.position.set(
          i * (cellSize + gap) - offset,
          cellSize / 2,
          j * (cellSize + gap) - offset,
        );
        // Start all cells hidden (scale 0)
        this.dummy.scale.set(0, 0, 0);
        this.dummy.rotation.set(0, 0, 0);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(idx, this.dummy.matrix);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    this.gridGroup.add(mesh);
    this.instancedMesh = mesh;
  }

  setCellVisible(index: number, visible: boolean): void {
    if (index < 0 || index >= this.totalCells || !this.instancedMesh) return;
    this.cellStates[index] = visible ? 1 : 0;

    const { gridSize, cellSize, gap } = this.config;
    const offset = (gridSize * (cellSize + gap)) / 2 - (cellSize + gap) / 2;
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    this.dummy.position.set(
      col * (cellSize + gap) - offset,
      cellSize / 2,
      row * (cellSize + gap) - offset,
    );
    this.dummy.scale.set(visible ? 1 : 0, visible ? 1 : 0, visible ? 1 : 0);
    this.dummy.rotation.set(0, 0, 0);
    this.dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(index, this.dummy.matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /** Update matrix for a cell during animation (position.y bounce, arbitrary scale) */
  setCellMatrix(index: number, posY: number, scale: number): void {
    if (index < 0 || index >= this.totalCells || !this.instancedMesh) return;

    const { gridSize, cellSize, gap } = this.config;
    const offset = (gridSize * (cellSize + gap)) / 2 - (cellSize + gap) / 2;
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    this.dummy.position.set(
      col * (cellSize + gap) - offset,
      cellSize / 2 + posY,
      row * (cellSize + gap) - offset,
    );
    this.dummy.scale.set(scale, scale, scale);
    this.dummy.rotation.set(0, 0, 0);
    this.dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(index, this.dummy.matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  getCellState(index: number): boolean {
    return this.cellStates[index] === 1;
  }

  getIsSpheres(): boolean {
    return this.isSpheres;
  }

  toggleShape(): void {
    this.isSpheres = !this.isSpheres;
    const geometry = this.isSpheres ? this.sphereGeometry : this.cubeGeometry;
    this.createInstancedMesh(geometry);
    // Restore cell visibility states
    for (let i = 0; i < this.totalCells; i++) {
      if (this.cellStates[i]) {
        this.setCellVisible(i, true);
      }
    }
  }

  dispose(): void {
    if (this.instancedMesh) {
      this.gridGroup.remove(this.instancedMesh);
      this.instancedMesh.dispose();
    }
    this.cubeGeometry.dispose();
    this.sphereGeometry.dispose();
    this.material.dispose();
    (this.shadowPlane.material as THREE.Material).dispose();
    (this.shadowPlane.geometry as THREE.BufferGeometry).dispose();
    this.scene.remove(this.gridGroup);
    this.scene.remove(this.shadowPlane);
  }
}
