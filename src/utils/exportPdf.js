import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const MARGIN = 8; // mm

export async function exportElementToPdf(element, filename) {
  if (!element) return;

  const canvas = await renderReportCanvas(element);
  if (!canvas) return;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  const contentHeight = pageHeight - MARGIN * 2;

  const scale = Math.min(contentWidth / canvas.width, contentHeight / canvas.height);
  const imageWidth = canvas.width * scale;
  const imageHeight = canvas.height * scale;
  const x = MARGIN + (contentWidth - imageWidth) / 2;
  const y = MARGIN + (contentHeight - imageHeight) / 2;

  const imageData = canvas.toDataURL('image/png', 1.0);
  pdf.addImage(imageData, 'PNG', x, y, imageWidth, imageHeight);

  pdf.save(filename);
}

export async function exportElementToImage(element, filename) {
  if (!element) return;

  const canvas = await renderReportCanvas(element);
  if (!canvas) return;

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace('.pdf', '.png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function renderReportCanvas(element) {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  return html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false
  });
}