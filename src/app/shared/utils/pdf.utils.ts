import jsPDF from 'jspdf';

/**
 * Collects the bottom Y-positions (in canvas pixels) of all <tr> elements
 * inside a container. Call this BEFORE html2canvas, while the container is
 * still in the DOM, so the browser has laid out the elements.
 */
export function collectRowBreaks(container: HTMLElement, scale = 2): number[] {
  const containerRect = container.getBoundingClientRect();
  const breaks: number[] = [];
  container.querySelectorAll('tr').forEach(el => {
    const rect = el.getBoundingClientRect();
    breaks.push((rect.bottom - containerRect.top) * scale);
  });
  return breaks.sort((a, b) => a - b);
}

/**
 * Renders a canvas to a jsPDF document, splitting pages only at safe row
 * boundaries so that no row is ever cut in half across two pages.
 */
export function renderCanvasToPdf(
  canvas: HTMLCanvasElement,
  pdf: jsPDF,
  safeBreaks: number[] = []
): void {
  const pageW  = pdf.internal.pageSize.getWidth();
  const pageH  = pdf.internal.pageSize.getHeight();
  const ratio  = canvas.width / pageW;
  const pageHPx = Math.floor(pageH * ratio);

  if (canvas.height <= pageHPx) {
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, canvas.height / ratio);
    return;
  }

  let y = 0;
  while (y < canvas.height) {
    const maxCut = y + pageHPx;

    // Find the last safe break that fits within this page
    let cutAt = maxCut;
    for (const brk of safeBreaks) {
      if (brk > y && brk <= maxCut) cutAt = brk;
      if (brk > maxCut) break;
    }

    const sliceH = Math.min(cutAt - y, canvas.height - y);
    if (sliceH <= 0) break;

    const sc = document.createElement('canvas');
    sc.width  = canvas.width;
    sc.height = sliceH;
    sc.getContext('2d')!.drawImage(canvas, 0, -y);

    if (y > 0) pdf.addPage();
    pdf.addImage(sc.toDataURL('image/png'), 'PNG', 0, 0, pageW, sliceH / ratio);
    y += sliceH;
  }
}
