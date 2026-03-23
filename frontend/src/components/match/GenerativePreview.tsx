import { useRef, useEffect, useState, useCallback } from 'react';
import type { GenerativeConfig } from '../../lib/generative.ts';
import type { TeamData } from '../../data/teams.ts';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { PixelGrid } from '../grid/PixelGrid.tsx';
import type { PixelGridController } from '../grid/PixelGridController.ts';
import { exportHighRes, downloadBlob } from '../../lib/export.ts';
import styles from './GenerativePreview.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

interface GenerativePreviewProps {
  matchId: string;
  config: GenerativeConfig;
  homeTeam: TeamData;
  awayTeam: TeamData;
}

export function GenerativePreview({ matchId, config, homeTeam, awayTeam }: GenerativePreviewProps) {
  const controllerRef = useRef<PixelGridController | null>(null);
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const homePixels = getLogoPixels(homeTeam.slug, homeTeam.name[0]);
  const awayPixels = getLogoPixels(awayTeam.slug, awayTeam.name[0]);

  // Apply generative config once controller is ready
  useEffect(() => {
    // Small delay to let the PixelGrid mount and expose its controller
    const timer = setTimeout(() => {
      const ctrl = controllerRef.current;
      if (ctrl) {
        ctrl.applyGenerativeConfig(config, homePixels, awayPixels);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [config, homePixels, awayPixels]);

  const handleExport = useCallback(async () => {
    const ctrl = controllerRef.current;
    if (!ctrl) {
      setStatus('grid not ready');
      return;
    }

    setExporting(true);
    setStatus('exporting...');

    try {
      const blob = await exportHighRes(
        ctrl.getRenderer(),
        ctrl.getScene(),
        ctrl.getCamera(),
        3600,
        4800
      );
      setExportBlob(blob);
      const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
      setStatus(`exported (${sizeMB} MB)`);
    } catch (err) {
      setStatus(`export failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setExporting(false);
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!exportBlob) return;
    const filename = `${homeTeam.slug}-vs-${awayTeam.slug}-${config.score.replace(/\s/g, '')}.png`;
    downloadBlob(exportBlob, filename);
  }, [exportBlob, homeTeam.slug, awayTeam.slug, config.score]);

  const handleUpload = useCallback(async () => {
    if (!exportBlob) return;

    setUploading(true);
    setStatus('uploading...');

    try {
      const formData = new FormData();
      formData.append('image', exportBlob, 'design.png');
      formData.append('matchId', matchId);
      formData.append('title', `${config.matchTitle} | ${config.score} | One-of-One Print`);
      formData.append('description', `Generative design from ${config.matchTitle}, ${config.date}. Score: ${config.score}.`);

      const res = await fetch(`${API_BASE}/api/designs/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      setStatus('uploaded -- product created');
    } catch (err) {
      setStatus(`upload failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setUploading(false);
    }
  }, [exportBlob, matchId, config]);

  return (
    <div className={styles.wrapper}>
      <PixelGrid
        logoPixels={homePixels}
        height="50vh"
        ref={controllerRef}
      />

      <div className={styles.configSummary}>
        <div>// GENERATIVE DESIGN -- <span>{config.matchTitle}</span></div>
        <div>// SCORE: <span>{config.score}</span> | DATE: <span>{config.date}</span></div>
        <div>
          // PARAMS: scale=<span>{config.gridScale.toFixed(2)}</span>{' '}
          rot=<span>{config.gridRotation.toFixed(0)}</span>{' '}
          shape=<span>{config.shapeMode}</span>{' '}
          fluid=<span>{config.fluidIntensity.toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.controls}>
        <button
          className={styles.btn}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'EXPORTING...' : 'EXPORT PNG (3600x4800)'}
        </button>

        {exportBlob && (
          <button className={styles.btn} onClick={handleDownload}>
            DOWNLOAD
          </button>
        )}

        {exportBlob && (
          <button
            className={styles.btn}
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'UPLOADING...' : 'UPLOAD TO STORE'}
          </button>
        )}
      </div>

      <div className={`${styles.status}${status.includes('uploaded') || status.includes('exported') ? ` ${styles.success}` : ''}`}>
        {status && `> ${status}`}
      </div>
    </div>
  );
}
