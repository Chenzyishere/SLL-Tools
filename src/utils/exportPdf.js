import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const MARGIN = 10; // mm

export async function exportElementToPdf(element, filename) {
  if (!element) return;

  const canvas = await renderReportCanvas(element);
  if (!canvas) return;

  const pdf = new jsPDF('l', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  const contentHeight = pageHeight - MARGIN * 2;
  const imageWidth = contentWidth;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  const imageData = canvas.toDataURL('image/png');

  let remainingHeight = imageHeight;
  let position = MARGIN;

  pdf.addImage(imageData, 'PNG', MARGIN, position, imageWidth, imageHeight);
  remainingHeight -= contentHeight;

  while (remainingHeight > 0) {
    position -= contentHeight;
    pdf.addPage();
    pdf.addImage(imageData, 'PNG', MARGIN, position, imageWidth, imageHeight);
    remainingHeight -= contentHeight;
  }

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
    useCORS: true
  });
}