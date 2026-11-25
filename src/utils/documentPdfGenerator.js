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
  return currentY;
}

function drawOrnamentalCorner(ctx, x, y, flipX, flipY) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);

  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 56);
  ctx.lineTo(0, 0);
  ctx.lineTo(56, 0);
  ctx.stroke();

  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.arc(10, 10, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(10, 10, 16, 0, Math.PI / 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Generates Hall Ticket PDF (2 per A4 page)
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

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
    ctx.setLineDash([]);

    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 4;
    ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

    // Left Vertical "Hall Ticket" Strip
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

    // Top Curved Header Banner
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

    // Logo Circle
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

    // Std & Exam Date Pill Boxes
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

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(400, startY + 14);
      ctx.lineTo(canvas.width - 70, startY + 14);
      ctx.stroke();

      startY += 64;
    });

    // Stamp Circle
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

    // Notice & Signature
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
 * Generates Executive Certificate PDF in English or Marathi
 * @param {Object|Array} examRecords
 * @param {Object} orgSettings
 * @param {'english'|'marathi'} language
 */
export async function generateCertificatePdf(
  examRecords,
  orgSettings = {},
  language = 'english'
) {
  const exams = Array.isArray(examRecords) ? examRecords : [examRecords];
  if (exams.length === 0) throw new Error('No examination records selected for Certificate.');

  const isMarathi = language === 'marathi';
  const logoImg = await loadImageSafe(orgSettings?.logo_url);
  const sigImg = await loadImageSafe(orgSettings?.controller_signature_url);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const canvas = document.createElement('canvas');
  canvas.width = 1480;
  canvas.height = 2093; // Exact A4 ratio
  const ctx = canvas.getContext('2d');

  exams.forEach((exam, idx) => {
    if (idx > 0) doc.addPage();

    const s1Max = Number(exam.subject_1_max_marks) || 100;
    const s2Max = Number(exam.subject_2_max_marks) || 100;
    const s1Marks = Number(exam.subject_1_marks) || 0;
    const s2Marks = Number(exam.subject_2_marks) || 0;
    const totalMax = s1Max + s2Max;
    const totalObtained = Number((s1Marks + s2Marks).toFixed(2));
    const pct = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;

    // 1. Luxury Ivory / Warm Parchment Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#fffdf9');
    bgGrad.addColorStop(0.5, '#fcf8ef');
    bgGrad.addColorStop(1, '#f7efe0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Classic Navy & Gold Double Ornamental Border
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 14;
    ctx.strokeRect(46, 46, canvas.width - 92, canvas.height - 92);

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 4;
    ctx.strokeRect(68, 68, canvas.width - 136, canvas.height - 136);

    ctx.strokeStyle = 'rgba(180, 83, 9, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 80, canvas.width - 160, canvas.height - 160);

    // Ornamental Corners
    drawOrnamentalCorner(ctx, 88, 88, false, false);
    drawOrnamentalCorner(ctx, canvas.width - 88, 88, true, false);
    drawOrnamentalCorner(ctx, 88, canvas.height - 88, false, true);
    drawOrnamentalCorner(ctx, canvas.width - 88, canvas.height - 88, true, true);

    // 3. Subtle Central Watermark Emblem
    ctx.save();
    ctx.globalAlpha = 0.045;
    if (logoImg) {
      ctx.drawImage(logoImg, canvas.width / 2 - 260, 860, 520, 520);
    } else {
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 1120, 260, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Header Section (Centered Logo + Organization & Exam Title)
    const centerX = canvas.width / 2;
    if (logoImg) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, 205, 86, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, 205, 78, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, centerX - 78, 127, 156, 156);
      ctx.restore();
    } else {
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(centerX, 205, 78, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(orgSettings?.exam_short_code || 'MSTS', centerX, 214);
    }

    const orgTitle = isMarathi
      ? orgSettings?.org_name_marathi || orgSettings?.org_name || 'परफेक्ट पब्लिकेशन, कोल्हापूर'
      : orgSettings?.org_name || 'Perfect Publication, Kolhapur';

    const examTitle = isMarathi
      ? orgSettings?.exam_title_marathi ||
        orgSettings?.exam_title ||
        'महाराष्ट्र स्टेट टॅलेंट सर्च (प्रज्ञा शोध) परीक्षा'
      : orgSettings?.exam_title || 'Maharashtra State Talent Search Examination';

    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(orgTitle, centerX, 345);

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(examTitle, centerX, 405);

    // 5. Ribbon Banner Title ("CERTIFICATE OF ACHIEVEMENT" / "प्रमाणपत्र")
    const ribbonW = 680;
    const ribbonH = 82;
    const ribbonX = centerX - ribbonW / 2;
    const ribbonY = 450;

    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.roundRect(ribbonX, ribbonY, ribbonW, ribbonH, 12);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = isMarathi ? 'bold 50px sans-serif' : 'bold 38px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      isMarathi ? 'प्रमाणपत्र' : 'CERTIFICATE OF MERIT',
      centerX,
      ribbonY + (isMarathi ? 58 : 54)
    );

    // Exam Seat No. & Academic Year Metadata Strip
    const acadYear = exam.students?.academic_year || orgSettings?.academic_year || '2026-27';
    const seatNo = exam.students?.form_number || '-';

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      isMarathi ? `बैठक क्रमांक : ${seatNo}` : `Seat / Exam No. : ${seatNo}`,
      140,
      595
    );
    ctx.textAlign = 'right';
    ctx.fillText(
      isMarathi ? `शैक्षणिक वर्ष : ${acadYear}` : `Academic Year : ${acadYear}`,
      canvas.width - 140,
      595
    );

    // 6. Formal Citation Paragraph
    ctx.textAlign = 'center';
    ctx.fillStyle = '#334155';
    ctx.font = isMarathi ? '32px sans-serif' : 'italic 30px Georgia, serif';
    ctx.fillText(
      isMarathi ? 'असे प्रमाणित करण्यात येते की,' : 'This is to proudly certify that',
      centerX,
      670
    );

    // Student Name Highlight with Gold Underline
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText(exam.student_name || '-', centerX, 745);

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(280, 764);
    ctx.lineTo(canvas.width - 280, 764);
    ctx.stroke();

    // School Name
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(
      isMarathi
        ? `शाळा : ${exam.school_name || '-'}`
        : `Student of ${exam.school_name || '-'}`,
      centerX,
      815
    );

    // Body Narrative
    ctx.fillStyle = '#334155';
    ctx.font = '28px sans-serif';
    if (isMarathi) {
      ctx.fillText(
        `याने / हिने ${orgTitle} तर्फे घेण्यात आलेल्या परीक्षेत`,
        centerX,
        875
      );
      ctx.fillText(
        `इयत्ता ${exam.standard} (${exam.medium} माध्यम) मध्ये खालील गुणांसह "${exam.result_status}" श्रेणी प्राप्त केली आहे.`,
        centerX,
        922
      );
    } else {
      ctx.fillText(
        `has successfully appeared in the examination conducted by ${orgTitle}`,
        centerX,
        875
      );
      ctx.fillText(
        `for Standard ${exam.standard} (${exam.medium} Medium) and achieved "${exam.result_status}" status.`,
        centerX,
        922
      );
    }

    // 7. Perfectly Aligned 4-Row Scorecard Table (Header + 2 Subjects + Bold Total Footer)
    const tableX = 140;
    const tableY = 975;
    const colWidths = [560, 200, 220, 220]; // Total = 1200px (centered on 1480px canvas)
    const rowH = 74;
    const totalW = colWidths.reduce((a, b) => a + b, 0);

    // Outer Table Box
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 3;
    ctx.strokeRect(tableX, tableY, totalW, rowH * 4);

    // Header Row Background
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(tableX, tableY, totalW, rowH);

    // Alternating Row Backgrounds
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tableX, tableY + rowH, totalW, rowH);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(tableX, tableY + rowH * 2, totalW, rowH);

    // Grand Total Row Background (Highlighted Gold/Amber Tint)
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(tableX, tableY + rowH * 3, totalW, rowH);

    // Draw All Horizontal Lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath();
      ctx.moveTo(tableX, tableY + rowH * r);
      ctx.lineTo(tableX + totalW, tableY + rowH * r);
      if (r === 3) {
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 3;
      }
      ctx.stroke();
    }

    // Draw All Vertical Column Lines Full Height (Clean Grid Alignment)
    let curX = tableX;
    colWidths.forEach((w, i) => {
      if (i > 0) {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(curX, tableY);
        ctx.lineTo(curX, tableY + rowH * 4);
        ctx.stroke();
      }
      curX += w;
    });

    // Helper to get center X of column i
    const colCenter = (colIdx) => {
      let x = tableX;
      for (let i = 0; i < colIdx; i++) x += colWidths[i];
      return x + colWidths[colIdx] / 2;
    };

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isMarathi ? 'विषय (Subject)' : 'Subject Name', colCenter(0), tableY + 46);
    ctx.fillText(isMarathi ? 'कमाल गुण' : 'Max Marks', colCenter(1), tableY + 46);
    ctx.fillText(isMarathi ? 'प्राप्त गुण' : 'Obtained', colCenter(2), tableY + 46);
    ctx.fillText(isMarathi ? 'टक्केवारी' : 'Percentage', colCenter(3), tableY + 46);

    // Subject 1 Row
    const s1Pct = s1Max > 0 ? ((s1Marks / s1Max) * 100).toFixed(1) : '0.0';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 25px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      isMarathi ? '१. मराठी व गणित' : '1. Marathi & Mathematics',
      tableX + 28,
      tableY + rowH + 46
    );
    ctx.textAlign = 'center';
    ctx.fillText(String(s1Max), colCenter(1), tableY + rowH + 46);
    ctx.fillText(String(s1Marks), colCenter(2), tableY + rowH + 46);
    ctx.fillText(`${s1Pct}%`, colCenter(3), tableY + rowH + 46);

    // Subject 2 Row
    const s2Pct = s2Max > 0 ? ((s2Marks / s2Max) * 100).toFixed(1) : '0.0';
    ctx.textAlign = 'left';
    ctx.fillText(
      isMarathi ? '२. इंग्रजी व बुद्धिमत्ता' : '2. English & Intelligence',
      tableX + 28,
      tableY + rowH * 2 + 46
    );
    ctx.textAlign = 'center';
    ctx.fillText(String(s2Max), colCenter(1), tableY + rowH * 2 + 46);
    ctx.fillText(String(s2Marks), colCenter(2), tableY + rowH * 2 + 46);
    ctx.fillText(`${s2Pct}%`, colCenter(3), tableY + rowH * 2 + 46);

    // Grand Total Row (Aligned Directly Under Each Column!)
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      isMarathi ? 'एकूण गुण (Grand Total)' : 'Grand Total',
      tableX + 28,
      tableY + rowH * 3 + 47
    );
    ctx.textAlign = 'center';
    ctx.fillText(String(totalMax), colCenter(1), tableY + rowH * 3 + 47);
    ctx.fillText(String(totalObtained), colCenter(2), tableY + rowH * 3 + 47);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText(`${pct}%`, colCenter(3), tableY + rowH * 3 + 47);

    // 8. Remarks & Result Status Box
    const remarksY = 1335;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      isMarathi
        ? `निकाल श्रेणी : ${exam.result_status}`
        : `Result Grade : ${exam.result_status}`,
      140,
      remarksY
    );

    if (exam.remarks) {
      ctx.fillStyle = '#991b1b';
      ctx.fillText(
        isMarathi ? `विशेष शेरा : ${exam.remarks}` : `Remarks / Merit : ${exam.remarks}`,
        140,
        remarksY + 48
      );
    }

    // 9. Footer: Congratulations, Gold Foil Seal & Signature
    const footerY = 1660;

    // Left Congratulations
    ctx.textAlign = 'left';
    ctx.fillStyle = '#334155';
    ctx.font = '26px sans-serif';
    ctx.fillText(
      isMarathi ? 'हे प्रमाणपत्र गौरवपूर्वक प्रदान करण्यात येत आहे.' : 'Awarded with best wishes for future success.',
      140,
      footerY - 40
    );
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 42px Georgia, serif';
    ctx.fillText(isMarathi ? 'हार्दिक अभिनंदन !' : 'Congratulations !', 140, footerY + 20);

    ctx.fillStyle = '#64748b';
    ctx.font = '22px sans-serif';
    ctx.fillText(
      `Date : ${orgSettings?.exam_date || new Date().toLocaleDateString('en-IN')}`,
      140,
      footerY + 80
    );

    // Center Gold & Crimson Official Seal
    const sealX = centerX;
    const sealY = footerY + 20;

    // Ribbon tails under seal
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(sealX - 45, sealY + 70);
    ctx.lineTo(sealX - 70, sealY + 165);
    ctx.lineTo(sealX - 35, sealY + 145);
    ctx.lineTo(sealX - 10, sealY + 165);
    ctx.lineTo(sealX - 10, sealY + 70);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sealX + 45, sealY + 70);
    ctx.lineTo(sealX + 70, sealY + 165);
    ctx.lineTo(sealX + 35, sealY + 145);
    ctx.lineTo(sealX + 10, sealY + 165);
    ctx.lineTo(sealX + 10, sealY + 70);
    ctx.fill();

    // Outer Gold Circle
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(sealX, sealY, 96, 0, Math.PI * 2);
    ctx.fill();

    // Inner Crimson Circle
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(sealX, sealY, 82, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 72, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(orgSettings?.exam_short_code || 'M.S.T.S', sealX, sealY - 4);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('VERIFIED SEAL', sealX, sealY + 24);

    // Right Signature Block
    const sigCenterX = canvas.width - 280;
    if (sigImg) {
      ctx.drawImage(sigImg, sigCenterX - 110, footerY - 85, 220, 80);
    }

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sigCenterX - 130, footerY + 10);
    ctx.lineTo(sigCenterX + 130, footerY + 10);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      isMarathi ? 'परीक्षा प्रमुख' : 'Controller of Examinations',
      sigCenterX,
      footerY + 48
    );
    ctx.fillStyle = '#475569';
    ctx.font = '22px sans-serif';
    ctx.fillText(orgTitle, sigCenterX, footerY + 82);

    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  });

  const langTag = isMarathi ? 'Marathi' : 'English';
  const fileName =
    exams.length === 1
      ? `Certificate_${langTag}_${exams[0].student_name.replace(/\s+/g, '_')}.pdf`
      : `Bulk_Certificates_${langTag}_${exams.length}_Students.pdf`;
  doc.save(fileName);
}