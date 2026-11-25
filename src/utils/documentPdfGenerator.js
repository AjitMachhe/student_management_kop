import jsPDF from 'jspdf';

function loadImageSafe(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || '').split(' ');
  let line = '';
  let currentY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

/**
 * Generates Hall Ticket PDF matching the attached template layout
 * Supports single student or bulk array of students
 */
export async function generateHallTicketPdf(studentsList, orgSettings = {}) {
  const students = Array.isArray(studentsList) ? studentsList : [studentsList];
  if (students.length === 0) throw new Error('No students selected for Hall Ticket.');

  const logoImg = await loadImageSafe(orgSettings?.logo_url);
  const sigImg = await loadImageSafe(orgSettings?.controller_signature_url);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 760;
  const ctx = canvas.getContext('2d');

  students.forEach((student, index) => {
    if (index > 0 && index % 2 === 0) {
      doc.addPage();
    }

    // Background & Outer Dashed Cut Border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
    ctx.setLineDash([]);

    // Inner Card Border
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 4;
    ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

    // Left Vertical "Hall Ticket" Crimson Strip
    ctx.fillStyle = '#d81b60';
    ctx.fillRect(32, 32, 68, canvas.height - 64);
    ctx.save();
    ctx.translate(76, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Hall Ticket', 0, 0);
    ctx.restore();

    // Top Curved Pink/Crimson Header Banner
    ctx.fillStyle = '#d81b60';
    ctx.beginPath();
    ctx.moveTo(100, 32);
    ctx.lineTo(canvas.width - 32, 32);
    ctx.lineTo(canvas.width - 32, 165);
    ctx.quadraticCurveTo(canvas.width - 90, 225, canvas.width - 170, 225);
    ctx.lineTo(180, 225);
    ctx.quadraticCurveTo(115, 225, 100, 165);
    ctx.closePath();
    ctx.fill();

    // Customer Logo Circle on Top-Left of Banner
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(195, 130, 74, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 5;
    ctx.stroke();

    if (logoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(195, 130, 68, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, 127, 62, 136, 136);
      ctx.restore();
    } else {
      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(orgSettings?.exam_short_code || 'EXAM', 195, 138);
    }

    // Organization & Exam Title in Header
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      orgSettings?.org_name || 'Perfect Publication, Kolhapur',
      880,
      78
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText(
      orgSettings?.exam_title || 'Maharashtra State Talent Search Examination',
      880,
      130
    );

    // Std & Exam Date Pill Boxes inside Banner
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Std -', 640, 195);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(655, 162, 110, 44);
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(student.standard || '-', 710, 193);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText('Exam Dt.', 925, 195);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(940, 162, 260, 44);
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(orgSettings?.exam_date || '22 March 2026', 1070, 193);

    // Student Details Rows with Ruled Lines
    const rows = [
      { label: 'Student Name', value: student.student_name || '-' },
      { label: 'Exam No.', value: student.form_number || '-' },
      { label: 'Center Name', value: student.exam_center || 'Allotted Center' },
      { label: 'School Name', value: student.school_name || '-' },
      { label: 'Mobile No.', value: student.parent_mobile || '-' },
    ];

    let startY = 290;
    rows.forEach((r) => {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(r.label, 145, startY);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(r.value, 410, startY);

      // Horizontal ruled line
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(400, startY + 14);
      ctx.lineTo(canvas.width - 70, startY + 14);
      ctx.stroke();

      startY += 64;
    });

    // School Stamp Placeholder Circle on Right
    ctx.save();
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(1280, 390, 95, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1280, 390, 72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(79, 70, 229, 0.45)';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCHOOL / CENTER', 1280, 386);
    ctx.fillText('STAMP', 1280, 410);
    ctx.restore();

    // Bottom Notice & Controller Signature
    ctx.fillStyle = '#be185d';
    ctx.font = 'bold 23px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Notice :', 145, 635);

    ctx.fillStyle = '#334155';
    ctx.font = '22px sans-serif';
    wrapText(
      ctx,
      orgSettings?.hall_ticket_notice ||
        'Parents and teachers are responsible for bringing their students/children to the examination center and picking them up after the exam is over.',
      245,
      635,
      1020,
      30
    );

    if (sigImg) {
      ctx.drawImage(sigImg, 1340, 585, 170, 65);
    }
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(orgSettings?.controller_title || 'Exam Controller', 1425, 682);

    // Embed canvas onto A4 page (top half or bottom half)
    const imgData = canvas.toDataURL('image/png');
    const yOffset = index % 2 === 0 ? 12 : 152;
    doc.addImage(imgData, 'PNG', 10, yOffset, 190, 92);
  });

  const fileName =
    students.length === 1
      ? `HallTicket_${students[0].form_number}.pdf`
      : `Bulk_HallTickets_${students.length}_Students.pdf`;
  doc.save(fileName);
}

/**
 * Generates Certificate (प्रमाणपत्र) PDF matching the attached template layout
 * Supports single exam result or bulk array of exam results
 */
export async function generateCertificatePdf(examRecords, orgSettings = {}) {
  const exams = Array.isArray(examRecords) ? examRecords : [examRecords];
  if (exams.length === 0) throw new Error('No examination records selected for Certificate.');

  const logoImg = await loadImageSafe(orgSettings?.logo_url);
  const sigImg = await loadImageSafe(orgSettings?.controller_signature_url);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 1980;
  const ctx = canvas.getContext('2d');

  exams.forEach((exam, idx) => {
    if (idx > 0) doc.addPage();

    // Warm Cream/Parchment Background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#fdfbf7');
    grad.addColorStop(0.5, '#fbf7ee');
    grad.addColorStop(1, '#f5eedc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ornate Double Gold/Brown Frame
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 10;
    ctx.strokeRect(42, 42, canvas.width - 84, canvas.height - 84);

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.strokeRect(62, 62, canvas.width - 124, canvas.height - 124);

    // Corner Ornamental Accents
    const corners = [
      [62, 62],
      [canvas.width - 62, 62],
      [62, canvas.height - 62],
      [canvas.width - 62, canvas.height - 62],
    ];
    ctx.fillStyle = '#92400e';
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top-Left Organization Logo
    if (logoImg) {
      ctx.drawImage(logoImg, 110, 105, 175, 175);
    } else {
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(195, 190, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(orgSettings?.exam_short_code || 'MSTS', 195, 198);
    }

    // Header Organization & Exam Title
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      orgSettings?.org_name_marathi || orgSettings?.org_name || 'परफेक्ट पब्लिकेशन, कोल्हापूर',
      320,
      165
    );

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(
      orgSettings?.exam_title_marathi ||
        orgSettings?.exam_title ||
        'महाराष्ट्र स्टेट टॅलेंट सर्च (प्रज्ञा शोध) परीक्षा',
      320,
      230
    );

    // Center "प्रमाणपत्र" Banner
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 92px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('प्रमाणपत्र', canvas.width / 2, 430);

    // Decorative Divider under Title
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(430, 465);
    ctx.lineTo(970, 465);
    ctx.stroke();

    // Citation Body Text
    const acadYear = exam.students?.academic_year || orgSettings?.academic_year || '2026-27';
    const orgDisplay = orgSettings?.org_name_marathi || orgSettings?.org_name || 'परफेक्ट पब्लिकेशन';

    ctx.fillStyle = '#1e293b';
    ctx.font = '34px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('असे प्रमाणित करणेत येते की,', 130, 580);

    ctx.fillText('कुमार / कुमारी :', 130, 665);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(exam.student_name || '-', 410, 665);

    ctx.fillStyle = '#1e293b';
    ctx.font = '32px sans-serif';
    ctx.fillText(
      `याने / हिने ${orgDisplay} या शैक्षणिक संस्थेमार्फत घेण्यात आलेल्या परीक्षेत`,
      130,
      750
    );
    ctx.fillText(
      `इयत्ता ${exam.standard}   सन ${acadYear}   मध्ये खालील विषय घेऊन ${exam.result_status} झाला / झाली.`,
      130,
      825
    );

    // Marks Table (Matching 4-Column Certificate Layout)
    const tableX = 130;
    const tableY = 910;
    const colWidths = [460, 220, 220, 240];
    const rowH = 85;
    const totalTableW = colWidths.reduce((a, b) => a + b, 0);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;

    // Header Row
    ctx.fillStyle = 'rgba(180, 83, 9, 0.12)';
    ctx.fillRect(tableX, tableY, totalTableW, rowH);
    ctx.strokeRect(tableX, tableY, totalTableW, rowH * 3);

    // Vertical Column Dividers
    let curX = tableX;
    colWidths.forEach((w, i) => {
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(curX, tableY);
        ctx.lineTo(curX, tableY + rowH * (i === 3 ? 1 : 3));
        ctx.stroke();
      }
      curX += w;
    });

    // Horizontal Row Dividers (Columns 1-3 only; Column 4 spans total marks)
    ctx.beginPath();
    ctx.moveTo(tableX, tableY + rowH);
    ctx.lineTo(tableX + totalTableW, tableY + rowH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tableX, tableY + rowH * 2);
    ctx.lineTo(tableX + colWidths[0] + colWidths[1] + colWidths[2], tableY + rowH * 2);
    ctx.stroke();

    // Table Headers
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('विषय (Subject)', tableX + colWidths[0] / 2, tableY + 54);
    ctx.fillText('कमाल गुण', tableX + colWidths[0] + colWidths[1] / 2, tableY + 54);
    ctx.fillText(
      'प्राप्त गुण',
      tableX + colWidths[0] + colWidths[1] + colWidths[2] / 2,
      tableY + 54
    );
    ctx.fillText(
      'एकूण गुण',
      tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2,
      tableY + 54
    );

    // Row 1: Marathi & Mathematics
    ctx.textAlign = 'left';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('मराठी व गणित (Marathi & Maths)', tableX + 24, tableY + rowH + 54);

    ctx.textAlign = 'center';
    ctx.fillText(
      String(exam.subject_1_max_marks || 100),
      tableX + colWidths[0] + colWidths[1] / 2,
      tableY + rowH + 54
    );
    ctx.fillText(
      String(exam.subject_1_marks ?? 0),
      tableX + colWidths[0] + colWidths[1] + colWidths[2] / 2,
      tableY + rowH + 54
    );

    // Row 2: English & Intelligence
    ctx.textAlign = 'left';
    ctx.fillText('इंग्रजी व बुद्धिमत्ता (English & IQ)', tableX + 24, tableY + rowH * 2 + 54);

    ctx.textAlign = 'center';
    ctx.fillText(
      String(exam.subject_2_max_marks || 100),
      tableX + colWidths[0] + colWidths[1] / 2,
      tableY + rowH * 2 + 54
    );
    ctx.fillText(
      String(exam.subject_2_marks ?? 0),
      tableX + colWidths[0] + colWidths[1] + colWidths[2] / 2,
      tableY + rowH * 2 + 54
    );

    // Merged Total Obtained Marks Cell
    ctx.font = 'bold 38px sans-serif';
    ctx.fillStyle = '#991b1b';
    ctx.fillText(
      `${exam.obtained_marks} / ${exam.total_marks}`,
      tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2,
      tableY + rowH * 2 + 12
    );
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText(
      `(${exam.percentage}%)`,
      tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2,
      tableY + rowH * 2 + 48
    );

    // Remarks (शेरा)
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`शेरा :   ${exam.remarks || exam.result_status}`, 130, 1280);

    // Bottom Left Congratulations Text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('हे प्रमाणपत्र देणेत येत आहे.', 130, 1430);

    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText('अभिनंदन !', 130, 1510);

    // Center Red Gold-Edged Seal Badge
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 1650, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(orgSettings?.exam_short_code || 'M.S.T.S EXAM', canvas.width / 2, 1660);

    // Bottom Right Controller Signature
    if (sigImg) {
      ctx.drawImage(sigImg, 1020, 1480, 220, 85);
    }
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(orgSettings?.controller_title || 'परीक्षा प्रमुख', 1130, 1615);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('प्रज्ञाशोध परीक्षा', 1130, 1660);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  });

  const fileName =
    exams.length === 1
      ? `Certificate_${exams[0].student_name.replace(/\s+/g, '_')}.pdf`
      : `Bulk_Certificates_${exams.length}_Students.pdf`;
  doc.save(fileName);
}