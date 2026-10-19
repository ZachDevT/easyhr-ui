/**
 * Utility for downloading and previewing chat media and attachments
 * cleanly without exposing internal backend Cloud Run URLs or tokens in the address bar.
 */

export async function downloadChatAttachment(url: string, filename?: string): Promise<void> {
  if (!url) return;

  const cleanName = filename && filename.trim() ? filename.trim() : 'download';

  try {
    // 1. Fetch file as blob directly from origin
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();

    // 2. Create local object URL scoped to current client origin
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = cleanName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 15000);
  } catch (err) {
    console.error('Direct blob download failed, falling back to hidden iframe', err);

    // 3. Fallback: invisible iframe download trigger so user never navigates away
    // Append &download=1 if it is an EasyHR attachment URL
    let downloadUrl = url;
    if (downloadUrl.includes('/api/v1/chat/attachments/')) {
      downloadUrl += (downloadUrl.includes('?') ? '&' : '?') + 'download=1';
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 30000);
  }
}

export async function openChatMediaInNewTab(url: string, title?: string): Promise<void> {
  if (!url) return;

  const cleanTitle = title && title.trim() ? title.trim() : 'EasyHR Media';

  // Open blank tab synchronously to preserve user click gesture and prevent pop-up blockers
  const newWin = window.open('about:blank', '_blank');
  if (newWin) {
    try {
      newWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${cleanTitle} · EasyHR</title>
            <style>
              body {
                margin: 0;
                background: #09090b;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                color: #a1a1aa;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              .spinner {
                border: 2.5px solid rgba(255,255,255,0.12);
                border-top-color: #a238ff;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                animation: spin 0.8s linear infinite;
                margin-bottom: 14px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div style="text-align:center;">
              <div class="spinner" style="margin: 0 auto 14px auto;"></div>
              <div style="font-size: 13.5px; font-weight: 500;">Loading secure media preview...</div>
            </div>
          </body>
        </html>
      `);
      newWin.document.close();
    } catch {
      // Ignore document write error if cross-origin restricted
    }
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    if (newWin && !newWin.closed) {
      newWin.location.replace(blobUrl);
    } else {
      window.open(blobUrl, '_blank');
    }
  } catch (err) {
    console.error('Failed to open secure media blob', err);
    if (newWin && !newWin.closed) {
      // If fetching blob failed, redirect the new window to clean fallback
      newWin.location.replace(url);
    }
  }
}
