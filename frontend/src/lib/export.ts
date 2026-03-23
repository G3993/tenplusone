import * as THREE from 'three';

/**
 * Render the Three.js scene to a high-resolution PNG blob via WebGLRenderTarget.
 * Default dimensions: 3600x4800 (12x16 inches at 300 DPI, print-ready).
 */
export async function exportHighRes(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  width: number = 3600,
  height: number = 4800
): Promise<Blob> {
  // Check GPU max texture size and scale down if needed
  const maxSize = renderer.capabilities.maxTextureSize;
  const longest = Math.max(width, height);
  if (longest > maxSize) {
    const scale = maxSize / longest;
    console.warn(
      `GPU max texture size is ${maxSize}. Scaling export from ${width}x${height} to ${Math.floor(width * scale)}x${Math.floor(height * scale)}`
    );
    width = Math.floor(width * scale);
    height = Math.floor(height * scale);
  }

  const renderTarget = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
  });

  // Save and update camera aspect ratio
  let originalAspect: number | undefined;
  if (camera instanceof THREE.PerspectiveCamera) {
    originalAspect = camera.aspect;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  try {
    // Render to offscreen target
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);

    // Read pixels
    const pixels = new Uint8Array(width * height * 4);
    renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixels);

    // Reset render target to screen
    renderer.setRenderTarget(null);

    // Flip Y axis (WebGL bottom-up to canvas top-down)
    const flipped = new Uint8Array(width * height * 4);
    const rowSize = width * 4;
    for (let y = 0; y < height; y++) {
      const srcRow = y * rowSize;
      const dstRow = (height - 1 - y) * rowSize;
      flipped.set(pixels.subarray(srcRow, srcRow + rowSize), dstRow);
    }

    // Create image via OffscreenCanvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d')!;
    const imageData = new ImageData(new Uint8ClampedArray(flipped.buffer), width, height);
    ctx.putImageData(imageData, 0, 0);

    return await canvas.convertToBlob({ type: 'image/png' });
  } finally {
    // Restore camera aspect
    if (camera instanceof THREE.PerspectiveCamera && originalAspect !== undefined) {
      camera.aspect = originalAspect;
      camera.updateProjectionMatrix();
    }

    // Clean up render target
    renderTarget.dispose();
  }
}

/**
 * Trigger a browser download for a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
