import html2pdf from 'html2pdf.js';

export const exportToPDF = (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  // Define PDF options
  const opt = {
    margin:       [15, 10, 15, 10], // top, left, bottom, right in mm
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }, // Keeping landscape as tables can be wide
    pagebreak:    { mode: ['css', 'legacy'], avoid: ['tr', '.avoid-break'] }
  };

  // Generate and download the PDF
  html2pdf().set(opt).from(element).save();
};
