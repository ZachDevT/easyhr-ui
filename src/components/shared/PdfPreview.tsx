'use client';

import { useMemo, useState } from 'react';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

type PdfPreviewProps = {
  url: string;
  title: string;
  className?: string;
  style?: React.CSSProperties;
};

export function PdfPreview({ url, title, className, style }: PdfPreviewProps) {
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [isFit, setIsFit] = useState<boolean>(true);

  const zoomBy = (amount: number) => {
    setIsFit(false);
    setZoomPercent((current) => Math.min(200, Math.max(50, current + amount)));
  };

  const handleFit = () => {
    setIsFit(true);
    setZoomPercent(100);
  };

  const scale = isFit ? 1 : zoomPercent / 100;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: 0,
        ...style,
      }}
    >
      <div
        role="toolbar"
        aria-label="PDF preview controls"
        style={{
          minHeight: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 6,
          padding: '4px 8px',
          boxSizing: 'border-box',
          background: '#fff',
          border: '1px solid var(--border, #e5e7eb)',
          borderBottom: 0,
          borderRadius: '10px 10px 0 0',
          zIndex: 2,
        }}
      >
        <button
          type="button"
          className="btn-neutral btn-sm"
          onClick={() => zoomBy(-20)}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut size={14} />
        </button>
        <span
          aria-live="polite"
          style={{ minWidth: 54, textAlign: 'center', color: 'var(--text-4, #667085)', fontSize: 12 }}
        >
          {isFit ? 'Fit page' : `${zoomPercent}%`}
        </span>
        <button
          type="button"
          className="btn-neutral btn-sm"
          onClick={() => zoomBy(20)}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn size={14} />
        </button>
        <button
          type="button"
          className={`btn-neutral btn-sm ${isFit ? 'active' : ''}`}
          onClick={handleFit}
          aria-label="Fit page"
          title="Fit page"
        >
          <Maximize2 size={14} /> Fit
        </button>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          overflow: 'auto',
          background: '#333639',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: '0 0 10px 10px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: isFit ? 'stretch' : 'flex-start',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: isFit ? '100%' : `${zoomPercent}%`,
            minWidth: isFit ? '100%' : undefined,
            height: isFit ? '100%' : `${zoomPercent}%`,
            minHeight: isFit ? '100%' : 800 * (zoomPercent / 100),
            transition: 'width 0.2s ease, height 0.2s ease',
            display: 'flex',
          }}
        >
          <iframe
            src={`${url.split('#')[0]}#toolbar=0&navpanes=0`}
            title={title}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              border: 0,
              outline: 0,
              background: '#fff',
            }}
          />
        </div>
      </div>
    </div>
  );
}
