import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';

interface MedicalRecord {
  id: string;
  diagnosis: string;
  treatment?: string;
  prescriptions?: Array<{
    medication: string;
    dosage: string;
    frequency?: string;
    duration?: string;
  }>;
  notes?: string;
  followUpDate?: string;
  createdAt: string;
  doctor?: {
    firstName: string;
    lastName: string;
  };
  patient?: {
    firstName: string;
    lastName: string;
  };
}

export async function generateMedicalRecordPDF(records: MedicalRecord[], patientName: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = 297; // A4 height in mm
  const pageWidth = 210; // A4 width in mm
  const margin = 15;
  const colWidth = (pageWidth - 2 * margin - 3) / 2; // Two columns with 3mm gap
  let yPosition = 0;

  // Records
  records.forEach((record, index) => {
    // Add new page for each prescription
    if (index > 0) {
      doc.addPage();
      yPosition = 0;
    }

    // ===== PROFESSIONAL HEADER =====
    // Top banner (teal/medical blue color)
    doc.setFillColor(0, 102, 102); // Teal
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Clinic Name in white
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('DENTALCARE', margin, 16);

    // Tagline
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Professional Dental & Orthodontic Care', margin, 21);

    // Reset text color
    doc.setTextColor(0, 0, 0);
    yPosition = 40;

    // ===== SECTION 1: DOCTOR INFORMATION (FULL WIDTH) =====
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 248, 255);
    doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 6, 'F');
    doc.text('DOCTOR INFORMATION', margin + 2, yPosition + 1);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (record.doctor) {
      doc.text(`Name: Dr. ${record.doctor.firstName} ${record.doctor.lastName}`, margin, yPosition);
      yPosition += 5;
    }

    doc.setFontSize(8);
    doc.text('Qualification: BDS (Bachelor of Dental Surgery) | Board Certified Dentist', margin, yPosition);
    yPosition += 3;
    doc.text('Location: 123 Dental Street, Medical Plaza | Phone: +1-800-DENTAL | Email: care@dentalcare.com', margin, yPosition);
    yPosition += 3;
    doc.text('License #: DCC-2024-001 | Dental Registration #: DRL-2024-' + (record.doctor?.id || 'N/A').substring(0, 6).toUpperCase(), margin, yPosition);
    yPosition += 8;

    // ===== SECTION 2: PATIENT INFORMATION (FULL WIDTH) =====
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 255, 240);
    doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 6, 'F');
    doc.text('PATIENT INFORMATION', margin + 2, yPosition + 1);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${patientName}`, margin, yPosition);
    yPosition += 4;
    doc.text(`Visit Date: ${format(parseISO(record.createdAt), 'MMMM dd, yyyy')}`, margin, yPosition);
    yPosition += 8;

    // Divider line
    doc.setDrawColor(0, 102, 102);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    // ===== SECTION 3: TWO-COLUMN LAYOUT =====
    const colStartY = yPosition;
    let leftColY = colStartY;
    let rightColY = colStartY;
    const leftColX = margin;
    const rightColX = margin + colWidth + 3;

    // ===== LEFT COLUMN: DIAGNOSIS & PRESCRIPTIONS =====

    // Diagnosis
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 248, 255);
    doc.rect(leftColX, leftColY - 3, colWidth, 6, 'F');
    doc.text('DIAGNOSIS', leftColX + 2, leftColY + 1);
    leftColY += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const diagnosisLines = doc.splitTextToSize(record.diagnosis, colWidth - 3);
    doc.text(diagnosisLines, leftColX + 2, leftColY);
    leftColY += diagnosisLines.length * 4 + 5;

    // Prescriptions
    if (record.prescriptions && record.prescriptions.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(0, 102, 102);
      doc.rect(leftColX, leftColY - 3, colWidth, 6, 'F');
      doc.text('PRESCRIPTIONS', leftColX + 2, leftColY + 1);
      doc.setTextColor(0, 0, 0);
      leftColY += 8;

      record.prescriptions.forEach((rx, rxIndex) => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${rxIndex + 1}. ${rx.medication}`, leftColX + 2, leftColY);
        leftColY += 4;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Strength: ${rx.dosage}`, leftColX + 4, leftColY);
        leftColY += 3;

        if (rx.frequency) {
          doc.text(`Frequency: ${rx.frequency}`, leftColX + 4, leftColY);
          leftColY += 3;
        }

        if (rx.duration) {
          doc.text(`Duration: ${rx.duration}`, leftColX + 4, leftColY);
          leftColY += 3;
        }

        leftColY += 3;
      });
    }

    // ===== RIGHT COLUMN: TREATMENT =====
    if (record.treatment) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(255, 250, 205);
      doc.rect(rightColX, rightColY - 3, colWidth, 6, 'F');
      doc.text('TREATMENT COMPLETED', rightColX + 2, rightColY + 1);
      rightColY += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const treatmentLines = doc.splitTextToSize(record.treatment, colWidth - 3);
      doc.text(treatmentLines, rightColX + 2, rightColY);
      rightColY += treatmentLines.length * 4 + 5;
    }

    // Determine the next yPosition after both columns
    yPosition = Math.max(leftColY, rightColY) + 5;

    // Check if we need a new page for bottom section
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }

    // Divider line
    doc.setDrawColor(0, 102, 102);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    // ===== SECTION 4: NOTES & FOLLOW-UP (FULL WIDTH) =====

    // Notes
    if (record.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(255, 250, 205);
      doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 6, 'F');
      doc.text('DOCTOR NOTES', margin + 2, yPosition + 1);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(record.notes, pageWidth - 2 * margin - 3);
      doc.text(notesLines, margin + 2, yPosition);
      yPosition += notesLines.length * 4 + 5;
    }

    // Follow-up Date
    if (record.followUpDate) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 255, 240);
      doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 6, 'F');
      doc.text('FOLLOW-UP APPOINTMENT', margin + 2, yPosition + 1);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Scheduled: ${format(parseISO(record.followUpDate), 'MMMM dd, yyyy')}`, margin + 2, yPosition);
      yPosition += 8;
    }

    // ===== FOOTER WITH SIGNATURE =====
    yPosition = pageHeight - 35;

    // Divider line
    doc.setDrawColor(0, 102, 102);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    // Signature area
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('_________________________', margin, yPosition);
    doc.text('_________________________', margin + colWidth + 8, yPosition);
    yPosition += 4;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Dentist Signature', margin + 2, yPosition);
    doc.text('Pharmacy Stamp / Seal', margin + colWidth + 12, yPosition);
    yPosition += 6;

    // Disclaimer
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.text('This prescription is valid for 30 days from the date of issue. For controlled substances, only one refill is authorized.', margin, yPosition);
    doc.setTextColor(0, 0, 0);
  });

  return doc;
}
