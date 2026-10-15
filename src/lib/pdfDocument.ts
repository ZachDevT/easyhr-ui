export async function renderPdfDocument(html: string): Promise<Blob> {
  if (typeof window === 'undefined') throw new Error('PDF rendering requires a browser.');
  const { default: html2pdf } = await import('html2pdf.js');
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const root = document.createElement('div');
  root.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;z-index:-1;';
  const styles = Array.from(parsed.head.querySelectorAll('style')).map((style) => style.outerHTML).join('');
  root.innerHTML = `${styles}<div class="pdf-document">${parsed.body.innerHTML}</div>`;
  document.body.appendChild(root);
  try {
    const images = Array.from(root.querySelectorAll('img'));
    await Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
      image.onload = () => resolve();
      image.onerror = () => resolve();
    })));
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
