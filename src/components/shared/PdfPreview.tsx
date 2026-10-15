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
  const [zoom, setZoom] = useState<'page-fit' | number>('page-fit');
  const source = useMemo(() => {
    const hash = `toolbar=0&zoom=${zoom}`;
    return `${url.split('#')[0]}#${hash}`;
  }, [url, zoom]);

  const zoomBy = (amount: number) => setZoom((current) => Math.min(200, Math.max(50, (current === 'page-fit' ? 100 : current) + amount)));

  return <div className={className} style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, ...style }}>
    <div role="toolbar" aria-label="PDF preview controls" style={{ minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, padding: '4px 8px', boxSizing: 'border-box', background: '#fff', border: '1px solid var(--border, #e5e7eb)', borderBottom: 0, borderRadius: '10px 10px 0 0' }}>
      <button type="button" className="btn-neutral btn-sm" onClick={() => zoomBy(-20)} aria-label="Zoom out" title="Zoom out"><ZoomOut size={14}/></button>
      <span aria-live="polite" style={{ minWidth: 48, textAlign: 'center', color: 'var(--text-4, #667085)', fontSize: 12 }}>{zoom === 'page-fit' ? 'Fit page' : `${zoom}%`}</span>
      <button type="button" className="btn-neutral btn-sm" onClick={() => zoomBy(20)} aria-label="Zoom in" title="Zoom in"><ZoomIn size={14}/></button>
      <button type="button" className={`btn-neutral btn-sm ${zoom === 'page-fit' ? 'active' : ''}`} onClick={() => setZoom('page-fit')} aria-label="Fit page" title="Fit page"><Maximize2 size={14}/> Fit</button>
    </div>
    <iframe src={source} title={title} style={{ display: 'block', flex: 1, width: '100%', minHeight: 0, border: '1px solid var(--border, #e5e7eb)', borderRadius: '0 0 10px 10px', outline: 0, background: '#fff' }}/>
  </div>;
}
