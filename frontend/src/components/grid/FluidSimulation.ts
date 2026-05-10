export interface FluidConfig {
  TEXTURE_DOWNSAMPLE: number;
  DENSITY_DISSIPATION: number;
  VELOCITY_DISSIPATION: number;
  PRESSURE_DISSIPATION: number;
  PRESSURE_ITERATIONS: number;
  CURL: number;
  SPLAT_RADIUS: number;
}

interface FluidPointer {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  down: boolean;
  moved: boolean;
  color: [number, number, number];
}

type FBO = [WebGLTexture, WebGLFramebuffer, number];
interface DoubleFBO {
  read: FBO;
  write: FBO;
  swap: () => void;
}

interface FormatResult {
  internalFormat: number;
  format: number;
}

interface FluidExtensions {
  formatRGBA: FormatResult;
  formatRG: FormatResult;
  formatR: FormatResult;
  halfFloatTexType: number;
  supportLinearFiltering: OES_texture_float_linear | OES_texture_half_float_linear | null;
}

class GLProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
  private gl: WebGL2RenderingContext | WebGLRenderingContext;

  constructor(gl: WebGL2RenderingContext | WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader) {
    this.gl = gl;
    this.uniforms = {};
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    const uc = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < uc; i++) {
      const info = gl.getActiveUniform(this.program, i);
      if (info) {
        this.uniforms[info.name] = gl.getUniformLocation(this.program, info.name);
      }
    }
  }

  bind(): void {
    this.gl.useProgram(this.program);
  }
}

const DEFAULT_CONFIG: FluidConfig = {
  TEXTURE_DOWNSAMPLE: 1,
  DENSITY_DISSIPATION: 0.98,
  VELOCITY_DISSIPATION: 0.98,
  PRESSURE_DISSIPATION: 0.8,
  PRESSURE_ITERATIONS: 25,
  CURL: 30,
  SPLAT_RADIUS: 0.005,
};

export class FluidSimulation {
  private canvas: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext | WebGLRenderingContext;
  private ext!: FluidExtensions;
  private config: FluidConfig;
  private pointers: FluidPointer[] = [];
  private colorPhase = 0;

  private textureWidth = 0;
  private textureHeight = 0;
  private density!: DoubleFBO;
  private velocity!: DoubleFBO;
  private divergence!: FBO;
  private curl!: FBO;
  private pressure!: DoubleFBO;

  private clearProg!: GLProgram;
  private displayProg!: GLProgram;
  private splatProg!: GLProgram;
  private advectionProg!: GLProgram;
  private divergenceProg!: GLProgram;
  private curlProg!: GLProgram;
  private vorticityProg!: GLProgram;
  private pressureProg!: GLProgram;
  private gradSubProg!: GLProgram;

  private blit!: (dest: WebGLFramebuffer | null) => void;
  private lastTime = Date.now();
  private lastMouseX = 0;
  private lastMouseY = 0;

  constructor(canvas: HTMLCanvasElement, config?: Partial<FluidConfig>) {
    this.canvas = canvas;
    this.config = { ...DEFAULT_CONFIG, ...config };

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    this.initWebGLContext();
    this.initBlit();
    this.compilePrograms();
    this.initFramebuffers();

    this.pointers.push(this.createPointer());
  }

  private createPointer(): FluidPointer {
    return { id: -1, x: 0, y: 0, dx: 0, dy: 0, down: false, moved: false, color: [30, 0, 300] };
  }

  private initWebGLContext(): void {
    const params: WebGLContextAttributes = { alpha: false, depth: false, stencil: false, antialias: false };
    const gl2 = this.canvas.getContext('webgl2', params) as WebGL2RenderingContext | null;
    const isWebGL2 = !!gl2;
    const glLegacy = (this.canvas.getContext('webgl', params) || this.canvas.getContext('experimental-webgl', params)) as WebGLRenderingContext | null;
    const gl: WebGL2RenderingContext | WebGLRenderingContext | null = gl2 || glLegacy;
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl as WebGL2RenderingContext;

    let halfFloatTexType: number;
    let supportLinearFiltering: OES_texture_float_linear | OES_texture_half_float_linear | null = null;

    if (isWebGL2) {
      (gl as WebGL2RenderingContext).getExtension('EXT_color_buffer_float');
      supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
      halfFloatTexType = (gl as WebGL2RenderingContext).HALF_FLOAT;
    } else {
      const halfFloat = gl.getExtension('OES_texture_half_float');
      supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
      halfFloatTexType = halfFloat ? halfFloat.HALF_FLOAT_OES : 0;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    let formatRGBA: FormatResult;
    let formatRG: FormatResult;
    let formatR: FormatResult;

    if (isWebGL2) {
      const gl2ctx = gl as WebGL2RenderingContext;
      formatRGBA = this.getSupportedFormat(gl2ctx.RGBA16F, gl2ctx.RGBA, halfFloatTexType)!;
      formatRG = this.getSupportedFormat(gl2ctx.RG16F, gl2ctx.RG, halfFloatTexType)!;
      formatR = this.getSupportedFormat(gl2ctx.R16F, gl2ctx.RED, halfFloatTexType)!;
    } else {
      const fmt = this.getSupportedFormat(gl.RGBA, gl.RGBA, halfFloatTexType)!;
      formatRGBA = fmt;
      formatRG = fmt;
      formatR = fmt;
    }

    this.ext = { formatRGBA, formatRG, formatR, halfFloatTexType, supportLinearFiltering };
  }

  private getSupportedFormat(internalFormat: number, format: number, type: number): FormatResult | null {
    const gl = this.gl;
    if (!this.supportsRenderTextureFormat(internalFormat, format, type)) {
      const gl2 = gl as WebGL2RenderingContext;
      if (gl2.R16F !== undefined) {
        if (internalFormat === gl2.R16F) return this.getSupportedFormat(gl2.RG16F, gl2.RG, type);
        if (internalFormat === gl2.RG16F) return this.getSupportedFormat(gl2.RGBA16F, gl2.RGBA, type);
      }
      return null;
    }
    return { internalFormat, format };
  }

  private supportsRenderTextureFormat(internalFormat: number, format: number, type: number): boolean {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(texture);
    return status;
  }

  private initBlit(): void {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    this.blit = (dest: WebGLFramebuffer | null) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, dest);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  private compilePrograms(): void {
    const gl = this.gl;
    const baseVS = this.compileShader(gl.VERTEX_SHADER,
      `precision highp float; attribute vec2 aPosition; varying vec2 vUv, vL, vR, vT, vB; uniform vec2 texelSize; void main() { vUv = aPosition * 0.5 + 0.5; vL = vUv - vec2(texelSize.x, 0.0); vR = vUv + vec2(texelSize.x, 0.0); vT = vUv + vec2(0.0, texelSize.y); vB = vUv - vec2(0.0, texelSize.y); gl_Position = vec4(aPosition, 0.0, 1.0); }`
    );

    const clearFS = this.compileShader(gl.FRAGMENT_SHADER,
      `precision highp float; varying vec2 vUv; uniform sampler2D uTexture; uniform float value; void main() { gl_FragColor = value * texture2D(uTexture, vUv); }`
    );

    const displayFS = this.compileShader(gl.FRAGMENT_SHADER,
      `precision highp float; varying vec2 vUv; uniform sampler2D uTexture; void main() { vec3 c = texture2D(uTexture, vUv).rgb; float lum = dot(c, vec3(0.299, 0.587, 0.114)); vec3 darkChrome = vec3(0.15, 0.17, 0.2); vec3 midChrome = vec3(0.5, 0.53, 0.58); vec3 brightChrome = vec3(0.85, 0.88, 0.92); vec3 highlight = vec3(1.0, 1.0, 1.0); float angle = lum * 10.0 + vUv.x * 4.0 + vUv.y * 3.0; float irid = sin(angle) * 0.03; vec3 color = mix(darkChrome, midChrome, smoothstep(0.0, 0.4, lum)); color = mix(color, brightChrome, smoothstep(0.3, 0.7, lum)); color = mix(color, highlight, smoothstep(0.75, 1.0, lum) * 0.5); color += vec3(irid, irid * 0.5, -irid); color *= lum * 1.4 + 0.1; gl_FragColor = vec4(color, 1.0); }`
    );

    const splatFS = this.compileShader(gl.FRAGMENT_SHADER,
      `precision highp float; varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius; void main() { vec2 p = vUv - point.xy; p.x *= aspectRatio; vec3 splat = exp(-dot(p, p) / radius) * color; vec3 base = texture2D(uTarget, vUv).xyz; gl_FragColor = vec4(base + splat, 1.0); }`
    );

    const advectionFS = this.compileShader(gl.FRAGMENT_SHADER,
      `precision highp float; varying vec2 vUv; uniform sampler2D uVelocity, uSource; uniform vec2 texelSize; uniform float dt, dissipation; void main() { vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize; gl_FragColor = dissipation * texture2D(uSource, coord); gl_FragColor.a = 1.0; }`
    );

    const divergenceFS = this.compileShader(gl.FRAGMENT_SHADER,
      `precision highp float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity; vec2 sampleV(vec2 uv) { vec2 m = vec2(1.0); if(uv.x<0.0){uv.x=0.0;m.x=-1.0;} if(uv.x>1.0){uv.x=1.0;m.x=-1.0;} if(uv.y<0.0){uv.y=0.0;m.y=-1.0;} if(uv.y>1.0){uv.y=1.0;m.y=-1.0;} return m*texture2D(uVelocity,uv).xy; } void main() { float L=sampleV(vL).x, R=sampleV(vR).x, T=sampleV(vT).y, B=sampleV(vB).y; gl_FragColor = vec4(0.5*(R-L+T-B), 0.0, 0.0, 1.0); }`
    );

    const curlFS = this.compileShader(gl.FRAGMENT_SHADER,
      `precision highp float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity; void main() { float L=texture2D(uVelocity,vL).y, R=texture2D(uVelocity,vR).y, T=texture2D(uVelocity,vT).x, B=texture2D(uVelocity,vB).x; gl_FragColor = vec4(R-L-T+B, 0.0, 0.0, 1.0); }`
    );

    const vorticityFS = this.compileShader(gl.FRAGMENT_SHADER,
      `precision highp float; varying vec2 vUv, vT, vB; uniform sampler2D uVelocity, uCurl; uniform float curl, dt; void main() { float T=texture2D(uCurl,vT).x, B=texture2D(uCurl,vB).x, C=texture2D(uCurl,vUv).x; vec2 force=vec2(abs(T)-abs(B),0.0); force*=1.0/length(force+0.00001)*curl*C; vec2 vel=texture2D(uVelocity,vUv).xy; gl_FragColor=vec4(vel+force*dt,0.0,1.0); }`
    );

    const pressureFS = this.compileShader(gl.FRAGMENT_SHADER,
      `precision highp float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uPressure, uDivergence; vec2 b(vec2 uv){return min(max(uv,0.0),1.0);} void main() { float L=texture2D(uPressure,b(vL)).x, R=texture2D(uPressure,b(vR)).x, T=texture2D(uPressure,b(vT)).x, B=texture2D(uPressure,b(vB)).x, div=texture2D(uDivergence,vUv).x; gl_FragColor=vec4((L+R+B+T-div)*0.25,0.0,0.0,1.0); }`
    );

    const gradSubFS = this.compileShader(gl.FRAGMENT_SHADER,
      `precision highp float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uPressure, uVelocity; vec2 b(vec2 uv){return min(max(uv,0.0),1.0);} void main() { float L=texture2D(uPressure,b(vL)).x, R=texture2D(uPressure,b(vR)).x, T=texture2D(uPressure,b(vT)).x, B=texture2D(uPressure,b(vB)).x; vec2 vel=texture2D(uVelocity,vUv).xy; vel.xy-=vec2(R-L,T-B); gl_FragColor=vec4(vel,0.0,1.0); }`
    );

    this.clearProg = new GLProgram(gl, baseVS, clearFS);
    this.displayProg = new GLProgram(gl, baseVS, displayFS);
    this.splatProg = new GLProgram(gl, baseVS, splatFS);
    this.advectionProg = new GLProgram(gl, baseVS, advectionFS);
    this.divergenceProg = new GLProgram(gl, baseVS, divergenceFS);
    this.curlProg = new GLProgram(gl, baseVS, curlFS);
    this.vorticityProg = new GLProgram(gl, baseVS, vorticityFS);
    this.pressureProg = new GLProgram(gl, baseVS, pressureFS);
    this.gradSubProg = new GLProgram(gl, baseVS, gradSubFS);
  }

  private initFramebuffers(): void {
    const gl = this.gl;
    this.textureWidth = gl.drawingBufferWidth >> this.config.TEXTURE_DOWNSAMPLE;
    this.textureHeight = gl.drawingBufferHeight >> this.config.TEXTURE_DOWNSAMPLE;
    const texType = this.ext.halfFloatTexType;
    const rgba = this.ext.formatRGBA;
    const rg = this.ext.formatRG;
    const r = this.ext.formatR;
    const filtering = this.ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    this.density = this.createDoubleFBO(2, this.textureWidth, this.textureHeight, rgba.internalFormat, rgba.format, texType, filtering);
    this.velocity = this.createDoubleFBO(0, this.textureWidth, this.textureHeight, rg.internalFormat, rg.format, texType, filtering);
    this.divergence = this.createFBO(4, this.textureWidth, this.textureHeight, r.internalFormat, r.format, texType, gl.NEAREST);
    this.curl = this.createFBO(5, this.textureWidth, this.textureHeight, r.internalFormat, r.format, texType, gl.NEAREST);
    this.pressure = this.createDoubleFBO(6, this.textureWidth, this.textureHeight, r.internalFormat, r.format, texType, gl.NEAREST);
  }

  private createFBO(texId: number, w: number, h: number, internalFormat: number, format: number, type: number, param: number): FBO {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + texId);
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return [texture, fbo, texId];
  }

  private createDoubleFBO(texId: number, w: number, h: number, internalFormat: number, format: number, type: number, param: number): DoubleFBO {
    let fbo1 = this.createFBO(texId, w, h, internalFormat, format, type, param);
    let fbo2 = this.createFBO(texId + 1, w, h, internalFormat, format, type, param);
    return {
      get read() { return fbo1; },
      get write() { return fbo2; },
      swap() { [fbo1, fbo2] = [fbo2, fbo1]; },
    };
  }

  step(): void {
    this.resizeCanvas();
    const dt = Math.min((Date.now() - this.lastTime) / 1000, 0.016);
    this.lastTime = Date.now();
    const gl = this.gl;

    gl.viewport(0, 0, this.textureWidth, this.textureHeight);

    this.advectionProg.bind();
    gl.uniform2f(this.advectionProg.uniforms.texelSize, 1.0 / this.textureWidth, 1.0 / this.textureHeight);
    gl.uniform1i(this.advectionProg.uniforms.uVelocity, this.velocity.read[2]);
    gl.uniform1i(this.advectionProg.uniforms.uSource, this.velocity.read[2]);
    gl.uniform1f(this.advectionProg.uniforms.dt, dt);
    gl.uniform1f(this.advectionProg.uniforms.dissipation, this.config.VELOCITY_DISSIPATION);
    this.blit(this.velocity.write[1]);
    this.velocity.swap();

    gl.uniform1i(this.advectionProg.uniforms.uVelocity, this.velocity.read[2]);
    gl.uniform1i(this.advectionProg.uniforms.uSource, this.density.read[2]);
    gl.uniform1f(this.advectionProg.uniforms.dissipation, this.config.DENSITY_DISSIPATION);
    this.blit(this.density.write[1]);
    this.density.swap();

    for (const p of this.pointers) {
      if (p.moved) {
        this.splat(p.x, p.y, p.dx, p.dy, p.color);
        p.moved = false;
      }
    }

    this.curlProg.bind();
    gl.uniform2f(this.curlProg.uniforms.texelSize, 1.0 / this.textureWidth, 1.0 / this.textureHeight);
    gl.uniform1i(this.curlProg.uniforms.uVelocity, this.velocity.read[2]);
    this.blit(this.curl[1]);

    this.vorticityProg.bind();
    gl.uniform2f(this.vorticityProg.uniforms.texelSize, 1.0 / this.textureWidth, 1.0 / this.textureHeight);
    gl.uniform1i(this.vorticityProg.uniforms.uVelocity, this.velocity.read[2]);
    gl.uniform1i(this.vorticityProg.uniforms.uCurl, this.curl[2]);
    gl.uniform1f(this.vorticityProg.uniforms.curl, this.config.CURL);
    gl.uniform1f(this.vorticityProg.uniforms.dt, dt);
    this.blit(this.velocity.write[1]);
    this.velocity.swap();

    this.divergenceProg.bind();
    gl.uniform2f(this.divergenceProg.uniforms.texelSize, 1.0 / this.textureWidth, 1.0 / this.textureHeight);
    gl.uniform1i(this.divergenceProg.uniforms.uVelocity, this.velocity.read[2]);
    this.blit(this.divergence[1]);

    this.clearProg.bind();
    let pTexId = this.pressure.read[2];
    gl.activeTexture(gl.TEXTURE0 + pTexId);
    gl.bindTexture(gl.TEXTURE_2D, this.pressure.read[0]);
    gl.uniform1i(this.clearProg.uniforms.uTexture, pTexId);
    gl.uniform1f(this.clearProg.uniforms.value, this.config.PRESSURE_DISSIPATION);
    this.blit(this.pressure.write[1]);
    this.pressure.swap();

    this.pressureProg.bind();
    gl.uniform2f(this.pressureProg.uniforms.texelSize, 1.0 / this.textureWidth, 1.0 / this.textureHeight);
    gl.uniform1i(this.pressureProg.uniforms.uDivergence, this.divergence[2]);
    pTexId = this.pressure.read[2];
    gl.uniform1i(this.pressureProg.uniforms.uPressure, pTexId);
    gl.activeTexture(gl.TEXTURE0 + pTexId);
    for (let i = 0; i < this.config.PRESSURE_ITERATIONS; i++) {
      gl.bindTexture(gl.TEXTURE_2D, this.pressure.read[0]);
      this.blit(this.pressure.write[1]);
      this.pressure.swap();
    }

    this.gradSubProg.bind();
    gl.uniform2f(this.gradSubProg.uniforms.texelSize, 1.0 / this.textureWidth, 1.0 / this.textureHeight);
    gl.uniform1i(this.gradSubProg.uniforms.uPressure, this.pressure.read[2]);
    gl.uniform1i(this.gradSubProg.uniforms.uVelocity, this.velocity.read[2]);
    this.blit(this.velocity.write[1]);
    this.velocity.swap();

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    this.displayProg.bind();
    gl.uniform1i(this.displayProg.uniforms.uTexture, this.density.read[2]);
    this.blit(null);
  }

  splat(x: number, y: number, dx: number, dy: number, color: [number, number, number]): void {
    const gl = this.gl;
    this.splatProg.bind();
    gl.uniform1i(this.splatProg.uniforms.uTarget, this.velocity.read[2]);
    gl.uniform1f(this.splatProg.uniforms.aspectRatio, this.canvas.width / this.canvas.height);
    gl.uniform2f(this.splatProg.uniforms.point, x / this.canvas.width, 1.0 - y / this.canvas.height);
    gl.uniform3f(this.splatProg.uniforms.color, dx, -dy, 1.0);
    gl.uniform1f(this.splatProg.uniforms.radius, this.config.SPLAT_RADIUS);
    this.blit(this.velocity.write[1]);
    this.velocity.swap();
    gl.uniform1i(this.splatProg.uniforms.uTarget, this.density.read[2]);
    gl.uniform3f(this.splatProg.uniforms.color, color[0] * 0.3, color[1] * 0.3, color[2] * 0.3);
    this.blit(this.density.write[1]);
    this.density.swap();
  }

  multipleSplats(amount: number): void {
    for (let i = 0; i < amount; i++) {
      const color: [number, number, number] = [Math.random() * 10, Math.random() * 10, Math.random() * 10];
      const x = this.canvas.width * Math.random();
      const y = this.canvas.height * Math.random();
      const dx = 1000 * (Math.random() - 0.5);
      const dy = 1000 * (Math.random() - 0.5);
      this.splat(x, y, dx, dy, color);
    }
  }

  resizeCanvas(): void {
    if (this.canvas.width !== this.canvas.clientWidth || this.canvas.height !== this.canvas.clientHeight) {
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
      this.initFramebuffers();
    }
  }

  private getNextColor(): [number, number, number] {
    this.colorPhase += 0.15;
    const base = 0.6 + Math.random() * 0.4;
    return [base, base, base];
  }

  attachPointerEvents(element: HTMLElement): () => void {
    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      if (this.pointers[0].down && (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5)) {
        this.pointers[0].moved = true;
        this.pointers[0].dx = dx * 10;
        this.pointers[0].dy = dy * 10;
        this.pointers[0].x = e.clientX;
        this.pointers[0].y = e.clientY;
        this.pointers[0].color = this.getNextColor();
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      this.pointers[0].down = true;
      this.pointers[0].color = this.getNextColor();
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    };

    const onMouseUp = () => {
      this.pointers[0].down = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        if (i >= this.pointers.length) {
          this.pointers.push(this.createPointer());
        }
        this.pointers[i].down = true;
        this.pointers[i].x = touches[i].clientX;
        this.pointers[i].y = touches[i].clientY;
        this.pointers[i].color = this.getNextColor();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        if (i >= this.pointers.length) continue;
        const dx = touches[i].clientX - this.pointers[i].x;
        const dy = touches[i].clientY - this.pointers[i].y;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          this.pointers[i].moved = true;
          this.pointers[i].dx = dx * 10;
          this.pointers[i].dy = dy * 10;
          this.pointers[i].x = touches[i].clientX;
          this.pointers[i].y = touches[i].clientY;
          this.pointers[i].color = this.getNextColor();
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        for (let j = 0; j < this.pointers.length; j++) {
          if (touches[i].identifier === this.pointers[j].id) {
            this.pointers[j].down = false;
          }
        }
      }
      if (e.targetTouches.length === 0) {
        this.pointers[0].down = false;
      }
    };

    element.addEventListener('mousemove', onMouseMove);
    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('mouseup', onMouseUp);
    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: true });
    element.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('mousemove', onMouseMove);
      element.removeEventListener('mousedown', onMouseDown);
      element.removeEventListener('mouseup', onMouseUp);
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }

  dispose(): void {
    const gl = this.gl;
    // Delete FBO textures
    const fbos = [this.divergence, this.curl];
    for (const fbo of fbos) {
      gl.deleteTexture(fbo[0]);
      gl.deleteFramebuffer(fbo[1]);
    }
    // Delete double FBOs
    const doubleFbos = [this.density, this.velocity, this.pressure];
    for (const dfbo of doubleFbos) {
      gl.deleteTexture(dfbo.read[0]);
      gl.deleteFramebuffer(dfbo.read[1]);
      gl.deleteTexture(dfbo.write[0]);
      gl.deleteFramebuffer(dfbo.write[1]);
    }
    // Delete programs
    const progs = [
      this.clearProg, this.displayProg, this.splatProg, this.advectionProg,
      this.divergenceProg, this.curlProg, this.vorticityProg, this.pressureProg, this.gradSubProg,
    ];
    for (const prog of progs) {
      gl.deleteProgram(prog.program);
    }
    // Lose context
    const loseCtx = gl.getExtension('WEBGL_lose_context');
    if (loseCtx) loseCtx.loseContext();
  }
}
