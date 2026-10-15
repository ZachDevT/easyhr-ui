export async function renderPdfDocument(html: string): Promise<Blob> {
  if (typeof window === 'undefined') throw new Error('PDF rendering requires a browser.');
  const { default: html2pdf } = await import('html2pdf.js');
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const root = document.createElement('div');
  // Keep the capture width exactly equal to the A4 page width in CSS pixels.
  // Extra margins outside the page make html2pdf slice content at the wrong
  // vertical positions and can force otherwise short documents onto extra pages.
  root.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;max-width:794px;box-sizing:border-box;background:#fff;z-index:-1;';
  const styles = Array.from(parsed.head.querySelectorAll('style')).map((style) => style.outerHTML).join('');
  root.innerHTML = `${styles}<style>
    .pdf-document{width:794px;max-width:794px;margin:0 auto;box-sizing:border-box;background:#fff;color:#202124;font-family:'Questrial',Inter,Arial,sans-serif}
    .pdf-document *{box-sizing:border-box}
    .pdf-document > .paper,.pdf-document > .page{width:794px;max-width:794px;margin:0 auto!important;box-shadow:none!important}
    .pdf-document h1,.pdf-document h2,.pdf-document h3,.pdf-document h4,.pdf-document h5,.pdf-document h6,
    .pdf-document header,.pdf-document footer,.pdf-document .title,.pdf-document .signatures,.pdf-document .signature{break-inside:avoid;page-break-inside:avoid}
    .pdf-document h1,.pdf-document h2,.pdf-document h3,.pdf-document h4,.pdf-document h5,.pdf-document h6{break-after:avoid;page-break-after:avoid}
    .pdf-document p{orphans:3;widows:3}
    .pdf-document ul,.pdf-document ol{padding-left:1.6em}
    .pdf-document table{width:100%;border-collapse:collapse;break-inside:auto}
    .pdf-document th,.pdf-document td{border:1px solid #d0d5dd;padding:8px 10px;vertical-align:top}
    .pdf-document img{max-width:100%;height:auto}
  </style><div class="pdf-document">${parsed.body.innerHTML}</div>`;
  document.body.appendChild(root);
  try {
    const images = Array.from(root.querySelectorAll('img'));
    await Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
      image.onload = () => resolve();
      image.onerror = () => resolve();
    })));
    const documentRoot = root.querySelector('.pdf-document') as HTMLElement;
    const fontFamilies = new Set(['Questrial', 'Inter']);
    documentRoot.querySelectorAll('font[face], [style]').forEach((element) => {
      const family = element.getAttribute('face') || (element as HTMLElement).style.fontFamily;
      family.split(',').map((name) => name.trim().replace(/["']/g, '')).filter(Boolean).forEach((name) => fontFamilies.add(name));
    });
    await Promise.all([...fontFamilies].map((family) => document.fonts.load(`15px "${family}"`).catch(() => [])));
    await document.fonts.ready;
    const footer = documentRoot.querySelector('.paper > footer, .page > footer') as HTMLElement | null;
    if (footer) {
      // Place the company footer against the bottom content margin of the last
      // A4 sheet, after body and signature content have taken their final height.
      const pageHeight = 297 * 96 / 25.4;
      const bottomMargin = 22 * 96 / 25.4;
      const rootTop = documentRoot.getBoundingClientRect().top;
      const footerBottom = footer.getBoundingClientRect().bottom - rootTop;
      const pageNumber = Math.max(1, Math.ceil((footerBottom + bottomMargin) / pageHeight));
      const targetBottom = pageNumber * pageHeight - bottomMargin;
      const gap = Math.max(0, targetBottom - footerBottom);
      const currentMargin = Number.parseFloat(getComputedStyle(footer).marginTop) || 0;
      footer.style.marginTop = `${currentMargin + gap}px`;
    }
    const worker = html2pdf().set({
      margin: 0,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 794 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['.signature', '.signatures'] },
    } as any).from(root.querySelector('.pdf-document') as HTMLElement);
    return await worker.outputPdf('blob');
  } finally {
    root.remove();
  }
}

export function openPdfBlob(blob: Blob, filename: string, print = false): void {
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, '_blank');
  if (!tab) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  } else if (print) {
    window.setTimeout(() => tab.print(), 1200);
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openPdfUrl(url: string, print = false): void {
  const tab = window.open(url, '_blank');
  if (print && tab) window.setTimeout(() => tab.print(), 1200);
}

export function downloadPdfUrl(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}
