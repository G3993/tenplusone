import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import styles from './Play.module.css';

/* ------------------------------------------------------------------ *
 * iFC — PENALTY BREAKER
 * A premium-minimal penalty mini-game in the spirit of Lacoste's
 * "Ace Breaker RG", recolored to iFC. Dark studio, electric-green accent,
 * a goal packed with breakable spectrum-color panels, and a diving keeper.
 *
 * Flow per shot (3 taps): aim X (sweeping vertical guide) → aim Y (sweeping
 * horizontal guide) → power (oscillating meter). Ball curls to the target;
 * higher power = bigger blast radius = more panels shattered, but the keeper
 * has a better chance the lower/closer you aim. 5 shots, demolish the goal.
 * ------------------------------------------------------------------ */

const SHOTS = 5;
const COLS = 7;
const ROWS = 4;
const GOAL_Z = -9;
const GOAL_W = 7.0; // inner width  → x ∈ [-3.5, 3.5]
const GOAL_H = 2.7; // inner height → y ∈ [0.1, 2.8]
const Y0 = 0.12;

// iFC spectrum palette for the panels.
const SPECTRUM = [0x22d3ee, 0x4ade80, 0x3b82f6, 0xf43f5e, 0xfb923c, 0xfacc15];

type Phase = 'intro' | 'aimX' | 'aimY' | 'power' | 'shooting' | 'result';

type Hud = { score: number; combo: number; shotsUsed: number; scored: boolean[] };

interface Callbacks {
  onPhase: (p: Phase) => void;
  onHud: (h: Hud) => void;
  onFlash: (msg: { text: string; kind: 'goal' | 'save' } | null) => void;
  powerEl: () => HTMLDivElement | null;
}

interface Panel {
  mesh: THREE.Mesh;
  cx: number;
  cy: number;
  broken: boolean;
}

interface Debris {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  spin: THREE.Vector3;
  life: number;
}

class Game {
  private canvas: HTMLCanvasElement;
  private cb: Callbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private raf = 0;

  private ball!: THREE.Mesh;
  private reticle!: THREE.Group;
  private guideX!: THREE.Mesh;
  private guideY!: THREE.Mesh;
  private keeper!: THREE.Group;
  private panels: Panel[] = [];
  private debris: Debris[] = [];
  private impactRing!: THREE.Mesh;

  private phase: Phase = 'intro';
  private hud: Hud = { score: 0, combo: 0, shotsUsed: 0, scored: [] };

  // locked aim + shot animation
  private aimX = 0;
  private aimY = 1.4;
  private power = 0.5;
  private shotT = 0;
  private keeperFromX = 0;
  private keeperToX = 0;
  private resolved = false;
  private shake = 0;

  constructor(canvas: HTMLCanvasElement, cb: Callbacks) {
    this.canvas = canvas;
    this.cb = cb;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050706, 0.045);

    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    this.camera.position.set(0, 2.1, 6.6);

    this.buildLights();
    this.buildArena();
    this.buildGoal();
    this.buildPanels();
    this.buildKeeper();
    this.buildBall();
    this.buildAimAids();

    this.resize();
    window.addEventListener('resize', this.resize);
    this.loop();
    this.pushHud();
  }

  // ---- scene construction ----
  private buildLights() {
    this.scene.add(new THREE.AmbientLight(0x4a5a50, 0.6));
    const key = new THREE.SpotLight(0xffffff, 80, 40, Math.PI / 5, 0.5, 1.4);
    key.position.set(2.5, 9, 6);
    key.target.position.set(0, 1.2, GOAL_Z);
    this.scene.add(key, key.target);
    const rim = new THREE.DirectionalLight(0x4ade80, 1.4);
    rim.position.set(-5, 3, GOAL_Z - 4);
    this.scene.add(rim);
    const fill = new THREE.PointLight(0x3b82f6, 18, 30);
    fill.position.set(-4, 2, 4);
    this.scene.add(fill);
  }

  private buildArena() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x080b09, roughness: 0.55, metalness: 0.3 }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // faint penalty-box lines on the turf
    const lineMat = new THREE.LineBasicMaterial({ color: 0x1f2a22 });
    const box = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-4.2, 0.01, GOAL_Z),
      new THREE.Vector3(-4.2, 0.01, GOAL_Z + 5),
      new THREE.Vector3(4.2, 0.01, GOAL_Z + 5),
      new THREE.Vector3(4.2, 0.01, GOAL_Z),
    ]);
    this.scene.add(new THREE.Line(box, lineMat));
    // penalty arc-ish marker at the spot
    const spot = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 24),
      new THREE.MeshBasicMaterial({ color: 0x2a3a30 }),
    );
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(0, 0.011, 2.5);
    this.scene.add(spot);
  }

  private buildGoal() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x223a2c,
      roughness: 0.4,
      metalness: 0.2,
    });
    const r = 0.07;
    const half = GOAL_W / 2 + r;
    const top = GOAL_H + Y0 + r;
    const post = () =>
      new THREE.Mesh(new THREE.CylinderGeometry(r, r, GOAL_H + Y0 + r, 16), mat);
    const lp = post();
    lp.position.set(-half, (GOAL_H + Y0) / 2, GOAL_Z);
    const rp = post();
    rp.position.set(half, (GOAL_H + Y0) / 2, GOAL_Z);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(r, r, GOAL_W + 2 * r, 16), mat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, top, GOAL_Z);
    this.scene.add(lp, rp, bar);

    // subtle net behind the panels
    const netMat = new THREE.LineBasicMaterial({ color: 0x18241d, transparent: true, opacity: 0.6 });
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 14; i++) {
      const x = -GOAL_W / 2 + (GOAL_W * i) / 14;
      pts.push(new THREE.Vector3(x, Y0, GOAL_Z - 1.1), new THREE.Vector3(x, top, GOAL_Z - 1.1));
    }
    for (let j = 0; j <= 6; j++) {
      const y = Y0 + (GOAL_H * j) / 6;
      pts.push(new THREE.Vector3(-GOAL_W / 2, y, GOAL_Z - 1.1), new THREE.Vector3(GOAL_W / 2, y, GOAL_Z - 1.1));
    }
    this.scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), netMat));
  }

  private buildPanels() {
    const gap = 0.06;
    const pw = GOAL_W / COLS;
    const ph = GOAL_H / ROWS;
    const geo = new THREE.BoxGeometry(pw - gap, ph - gap, 0.16);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = SPECTRUM[(r + c) % SPECTRUM.length];
        const mat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.32,
          roughness: 0.35,
          metalness: 0.1,
        });
        const m = new THREE.Mesh(geo, mat);
        const cx = -GOAL_W / 2 + pw * (c + 0.5);
        const cy = Y0 + ph * (r + 0.5);
        m.position.set(cx, cy, GOAL_Z);
        this.scene.add(m);
        this.panels.push({ mesh: m, cx, cy, broken: false });
      }
    }
  }

  private buildKeeper() {
    this.keeper = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x0a0c0b, emissive: 0x4ade80, emissiveIntensity: 0.22, roughness: 0.5 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.0, 6, 12), mat);
    torso.position.y = 0.95;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), mat);
    head.position.y = 1.75;
    // outstretched arms bar
    const arms = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 1.5, 4, 8), mat);
    arms.rotation.z = Math.PI / 2;
    arms.position.y = 1.25;
    this.keeper.add(torso, head, arms);
    this.keeper.position.set(0, 0, GOAL_Z + 0.4);
    this.scene.add(this.keeper);
  }

  private buildBall() {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 28, 28),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.28, metalness: 0.05, emissive: 0x111111 }),
    );
    ball.position.set(0, 0.17, 2.5);
    this.scene.add(ball);
    this.ball = ball;
  }

  private buildAimAids() {
    // reticle ring
    this.reticle = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.03, 12, 40),
      new THREE.MeshBasicMaterial({ color: 0x4ade80 }),
    );
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x4ade80 }),
    );
    this.reticle.add(ring, dot);
    this.reticle.visible = false;
    this.scene.add(this.reticle);

    const gMat = () => new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.5 });
    this.guideX = new THREE.Mesh(new THREE.PlaneGeometry(0.04, GOAL_H + 0.4), gMat());
    this.guideY = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_W + 0.4, 0.04), gMat());
    this.guideX.position.z = GOAL_Z + 0.12;
    this.guideY.position.z = GOAL_Z + 0.12;
    this.guideX.visible = false;
    this.guideY.visible = false;
    this.scene.add(this.guideX, this.guideY);

    this.impactRing = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.34, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }),
    );
    this.impactRing.position.z = GOAL_Z + 0.2;
    this.scene.add(this.impactRing);
  }

  // ---- game flow ----
  start() {
    this.hud = { score: 0, combo: 0, shotsUsed: 0, scored: [] };
    this.panels.forEach((p) => {
      p.broken = false;
      p.mesh.visible = true;
      p.mesh.scale.set(1, 1, 1);
      p.mesh.position.set(p.cx, p.cy, GOAL_Z);
      p.mesh.rotation.set(0, 0, 0);
    });
    this.pushHud();
    this.beginShot();
  }

  private beginShot() {
    this.aimX = 0;
    this.aimY = 1.4;
    this.power = 0.5;
    this.resolved = false;
    this.shotT = 0;
    this.ball.position.set(0, 0.17, 2.5);
    this.ball.visible = true;
    this.keeper.position.x = 0;
    this.keeper.rotation.z = 0;
    this.setPhase('aimX');
  }

  private setPhase(p: Phase) {
    this.phase = p;
    this.reticle.visible = p === 'aimY' || p === 'power';
    this.guideX.visible = p === 'aimX';
    this.guideY.visible = p === 'aimY';
    this.cb.onPhase(p);
  }

  tap() {
    if (this.phase === 'aimX') {
      this.setPhase('aimY');
    } else if (this.phase === 'aimY') {
      this.setPhase('power');
    } else if (this.phase === 'power') {
      this.launch();
    }
  }

  private launch() {
    // keeper commits to a guessed lane and dives
    const lanes = [-2.4, -1.2, 0, 1.2, 2.4];
    this.keeperFromX = 0;
    this.keeperToX = lanes[Math.floor(Math.random() * lanes.length)];
    this.shotT = 0;
    this.resolved = false;
    this.setPhase('shooting');
  }

  private resolveShot() {
    this.resolved = true;
    const idx = this.hud.shotsUsed;

    // keeper save? close in x and not aimed high
    const keeperReach = 0.95;
    const saved = Math.abs(this.aimX - this.keeperToX) < keeperReach && this.aimY < 2.0;

    if (saved) {
      this.hud.combo = 0;
      this.hud.scored[idx] = false;
      this.cb.onFlash({ text: 'Saved', kind: 'save' });
      // ball deflects sideways
      this.ball.position.x += this.keeperToX > this.aimX ? -0.6 : 0.6;
    } else {
      const blast = 0.5 + this.power * 1.4;
      let broke = 0;
      for (const p of this.panels) {
        if (p.broken) continue;
        const d = Math.hypot(p.cx - this.aimX, p.cy - this.aimY);
        if (d < blast) {
          p.broken = true;
          broke++;
          this.spawnDebris(p);
        }
      }
      const base = broke > 0 ? broke * 100 : 50;
      const comboBonus = broke > 0 ? this.hud.combo * 50 : 0;
      this.hud.score += base + comboBonus;
      if (broke > 0) this.hud.combo += 1;
      this.hud.scored[idx] = true;
      this.cb.onFlash({ text: broke >= 4 ? 'Smashed!' : 'Goal', kind: 'goal' });
      this.triggerImpact();
      this.shake = 0.35;
    }

    this.hud.shotsUsed += 1;
    this.pushHud();

    window.setTimeout(() => this.cb.onFlash(null), 900);
    window.setTimeout(() => {
      const allBroken = this.panels.every((p) => p.broken);
      if (this.hud.shotsUsed >= SHOTS || allBroken) {
        this.setPhase('result');
        this.reticle.visible = false;
      } else {
        this.beginShot();
      }
    }, 1100);
  }

  private spawnDebris(p: Panel) {
    p.mesh.visible = false;
    const shard = p.mesh.clone() as THREE.Mesh;
    shard.visible = true;
    shard.material = (p.mesh.material as THREE.Material).clone();
    this.scene.add(shard);
    this.debris.push({
      mesh: shard,
      vel: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2 + 1, Math.random() * 4 + 2),
      spin: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      life: 1,
    });
  }

  private triggerImpact() {
    this.impactRing.position.x = this.aimX;
    this.impactRing.position.y = this.aimY;
    this.impactRing.scale.set(1, 1, 1);
    (this.impactRing.material as THREE.MeshBasicMaterial).opacity = 0.9;
  }

  private pushHud() {
    this.cb.onHud({ ...this.hud, scored: [...this.hud.scored] });
  }

  // ---- per-frame ----
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    // sweeping aim guides
    if (this.phase === 'aimX') {
      this.aimX = Math.sin(t * 2.6) * (GOAL_W / 2 - 0.2);
      this.guideX.position.x = this.aimX;
      this.guideX.position.y = Y0 + GOAL_H / 2;
      this.reticle.position.set(this.aimX, this.aimY, GOAL_Z + 0.14);
    } else if (this.phase === 'aimY') {
      this.aimY = Y0 + 0.2 + (Math.sin(t * 2.1) * 0.5 + 0.5) * (GOAL_H - 0.4);
      this.guideY.position.y = this.aimY;
      this.reticle.position.set(this.aimX, this.aimY, GOAL_Z + 0.14);
    } else if (this.phase === 'power') {
      this.power = Math.sin(t * 4.2) * 0.5 + 0.5;
      const el = this.cb.powerEl();
      if (el) el.style.transform = `scaleX(${0.04 + this.power * 0.96})`;
      this.reticle.position.set(this.aimX, this.aimY, GOAL_Z + 0.14);
    }

    // reticle spin for life
    this.reticle.rotation.z += dt * 1.4;

    // shot in flight
    if (this.phase === 'shooting') {
      const dur = 0.72 - this.power * 0.18;
      this.shotT += dt / dur;
      const s = Math.min(this.shotT, 1);
      // ball: penalty spot → target with a lofted arc + slight curl
      const sx = 0;
      const sy = 0.17;
      const sz = 2.5;
      this.ball.position.x = THREE.MathUtils.lerp(sx, this.aimX, s) + Math.sin(s * Math.PI) * this.aimX * 0.12;
      this.ball.position.y = THREE.MathUtils.lerp(sy, this.aimY, s) + Math.sin(s * Math.PI) * 0.5;
      this.ball.position.z = THREE.MathUtils.lerp(sz, GOAL_Z + 0.2, s);
      this.ball.rotation.x -= dt * 16;
      // keeper dive
      const ks = Math.min(this.shotT * 1.2, 1);
      this.keeper.position.x = THREE.MathUtils.lerp(this.keeperFromX, this.keeperToX, ks);
      this.keeper.rotation.z = -this.keeperToX * 0.18 * ks;
      if (s >= 1 && !this.resolved) this.resolveShot();
    }

    // debris physics
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.life -= dt * 1.2;
      d.vel.y -= dt * 9;
      d.mesh.position.addScaledVector(d.vel, dt);
      d.mesh.rotation.x += d.spin.x * dt;
      d.mesh.rotation.y += d.spin.y * dt;
      d.mesh.rotation.z += d.spin.z * dt;
      const sc = Math.max(d.life, 0);
      d.mesh.scale.set(sc, sc, sc);
      if (d.life <= 0) {
        this.scene.remove(d.mesh);
        this.debris.splice(i, 1);
      }
    }

    // impact ring fade
    const ir = this.impactRing.material as THREE.MeshBasicMaterial;
    if (ir.opacity > 0) {
      ir.opacity = Math.max(0, ir.opacity - dt * 1.8);
      const sc = this.impactRing.scale.x + dt * 5;
      this.impactRing.scale.set(sc, sc, sc);
    }

    // camera idle drift + shake
    this.shake = Math.max(0, this.shake - dt);
    const sh = this.shake * 0.12;
    this.camera.position.x = Math.sin(t * 0.3) * 0.25 + (Math.random() - 0.5) * sh;
    this.camera.position.y = 2.1 + Math.cos(t * 0.4) * 0.08 + (Math.random() - 0.5) * sh;
    this.camera.lookAt(0, 1.3, GOAL_Z);

    this.renderer.render(this.scene, this.camera);
  };

  private resize = () => {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
  }
}

// ---------------------------------------------------------------- UI

const PROMPTS: Record<Phase, { text: string; hint: string }> = {
  intro: { text: '', hint: '' },
  aimX: { text: 'Tap to set direction', hint: 'Lock the horizontal line' },
  aimY: { text: 'Tap to set height', hint: 'Lock the vertical line' },
  power: { text: 'Tap to strike', hint: 'More power = bigger blast, riskier' },
  shooting: { text: '', hint: '' },
  result: { text: '', hint: '' },
};

export function Play() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const powerRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>('intro');
  const [hud, setHud] = useState<Hud>({ score: 0, combo: 0, shotsUsed: 0, scored: [] });
  const [flash, setFlash] = useState<{ text: string; kind: 'goal' | 'save' } | null>(null);

  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      const game = new Game(canvasRef.current, {
        onPhase: setPhase,
        onHud: setHud,
        onFlash: setFlash,
        powerEl: () => powerRef.current,
      });
      gameRef.current = game;
      return () => game.dispose();
    } catch (e) {
      // No WebGL (e.g. headless/old GPU). Keep the page alive — the premium
      // intro still renders; just can't run the 3D scene.
      console.warn('[Play] WebGL unavailable:', e);
      setWebglFailed(true);
    }
  }, []);

  const handleTap = useCallback(() => {
    gameRef.current?.tap();
  }, []);

  const totalPanels = COLS * ROWS;
  const playing = phase === 'aimX' || phase === 'aimY' || phase === 'power' || phase === 'shooting';

  return (
    <div
      className={styles.root}
      onPointerDown={() => {
        if (playing) handleTap();
      }}
    >
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.vignette} />
      <div className={styles.grain} />

      {/* in-game HUD */}
      {playing && (
        <div className={styles.hud}>
          <div className={styles.hudTop}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Score</span>
              <span className={styles.statValue}>{hud.score.toLocaleString()}</span>
              <div className={styles.shots}>
                {Array.from({ length: SHOTS }).map((_, i) => (
                  <span
                    key={i}
                    className={`${styles.pip} ${
                      i < hud.shotsUsed ? (hud.scored[i] ? styles.pipScored : styles.pipUsed) : ''
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className={`${styles.stat} ${styles.statRight}`}>
              <span className={styles.statLabel}>Combo</span>
              <span className={`${styles.statValue} ${hud.combo > 0 ? styles.combo : ''}`}>
                ×{hud.combo + 1}
              </span>
            </div>
          </div>

          {(phase === 'aimX' || phase === 'aimY' || phase === 'power') && (
            <div className={styles.prompt}>
              <div className={styles.promptText}>{PROMPTS[phase].text}</div>
              <div className={styles.promptHint}>{PROMPTS[phase].hint}</div>
              <div className={styles.powerWrap} style={{ opacity: phase === 'power' ? 1 : 0.25 }}>
                <div ref={powerRef} className={styles.powerFill} style={{ transform: 'scaleX(0.04)' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {flash && (
        <div className={`${styles.flash} ${flash.kind === 'goal' ? styles.flashGoal : styles.flashSave}`}>
          {flash.text}
        </div>
      )}

      {/* intro */}
      {phase === 'intro' && (
        <div className={`${styles.overlay} ${styles.fadeIn}`}>
          <div className={styles.eyebrow}>iFC · Play</div>
          <h1 className={styles.title}>
            Penalty
            <br />
            <span className={styles.titleSub}>Breaker</span>
          </h1>
          <p className={styles.lede}>
            Three taps. Aim, height, power. Curl it past the keeper and shatter the spectrum
            wall. Five shots to demolish the goal.
          </p>
          <button className={styles.cta} onClick={() => gameRef.current?.start()} disabled={webglFailed}>
            Play
          </button>
          {webglFailed && (
            <p className={styles.lede} style={{ marginTop: 18, color: '#f43f5e' }}>
              This experience needs WebGL — enable hardware acceleration to play.
            </p>
          )}
        </div>
      )}

      {/* result */}
      {phase === 'result' && (
        <ResultScreen hud={hud} totalPanels={totalPanels} onReplay={() => gameRef.current?.start()} />
      )}
    </div>
  );
}

function ResultScreen({
  hud,
  totalPanels,
  onReplay,
}: {
  hud: Hud;
  totalPanels: number;
  onReplay: () => void;
}) {
  const goals = hud.scored.filter(Boolean).length;
  const accuracy = hud.shotsUsed ? Math.round((goals / hud.shotsUsed) * 100) : 0;

  const share = useCallback(() => {
    const text = `I scored ${hud.score.toLocaleString()} on iFC Penalty Breaker ⚽️🟢`;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const nav = navigator as Navigator & { share?: (d: { title: string; text: string; url: string }) => Promise<void> };
    if (nav.share) nav.share({ title: 'iFC Penalty Breaker', text, url }).catch(() => {});
    else navigator.clipboard?.writeText(`${text} ${url}`).catch(() => {});
  }, [hud.score]);

  return (
    <div className={`${styles.overlay} ${styles.fadeIn}`}>
      <div className={styles.eyebrow}>Full time</div>
      <div className={styles.score}>{hud.score.toLocaleString()}</div>
      <div className={styles.resultRow}>
        <div className={styles.resultStat}>
          <b>
            {goals}/{hud.shotsUsed}
          </b>
          <span>Scored</span>
        </div>
        <div className={styles.resultStat}>
          <b>{accuracy}%</b>
          <span>Accuracy</span>
        </div>
        <div className={styles.resultStat}>
          <b>×{hud.combo + 1}</b>
          <span>Best combo</span>
        </div>
        <div className={styles.resultStat}>
          <b>{totalPanels}</b>
          <span>Panels</span>
        </div>
      </div>
      <div className={styles.buttonRow}>
        <button className={styles.cta} onClick={onReplay}>
          Play again
        </button>
        <button className={styles.ctaGhost} onClick={share}>
          Share
        </button>
      </div>
    </div>
  );
}

export default Play;
