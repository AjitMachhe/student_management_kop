import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportTableToPdf({
  filename,
  title,
  subtitle = '',
  orgName = 'Student Data Management System',
  columns = [],
  rows = [],
}) {
  if (!rows || rows.length === 0) {
    throw new Error('No records available to export.');
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 297, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(orgName, 14, 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 17);

  if (subtitle) {
    doc.setFontSize(9);
    doc.text(subtitle, 283, 17, { align: 'right' });
  }

  const head = [columns.map((c) => c.header)];
  const body = rows.map((row) =>
    columns.map((c) => (row[c.key] !== null && row[c.key] !== undefined ? String(row[c.key]) : '-'))
  );

  autoTable(doc, {
    startY: 27,
    head,
    body,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  const finalName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(finalName);
}