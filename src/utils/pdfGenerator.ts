import { jsPDF } from "jspdf";
import { IssueTicket } from "../types";

export function generateIssuesPDF(issues: IssueTicket[], authorName: string) {
  // Initialize standard A4 PDF (210mm x 297mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageHeight = 297;
  const pageWidth = 210;
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2; // 180mm
  let currentY = 15;

  // Helper utility: draw standard footer with page number
  const drawPageFooter = (pageNumber: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    
    // Line above footer
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 15, marginX + contentWidth, pageHeight - 15);
    
    // Footer text
    doc.text("CityPulse Smart Infrastructure Core • Secure Municipal Record", marginX, pageHeight - 10);
    doc.text(`Page ${pageNumber}`, marginX + contentWidth, pageHeight - 10, { align: "right" });
  };

  // 1. Draw elegant, high-contrast Slate Header
  const drawMainHeader = () => {
    // Header dark bar container
    doc.setFillColor(15, 23, 42); // slate-900 (deep cold charcoal)
    doc.rect(marginX, currentY, contentWidth, 32, "F");

    // Accent line in green or blue
    doc.setFillColor(59, 130, 246); // blue-500
    doc.rect(marginX, currentY + 31, contentWidth, 1, "F");

    // Title text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("CITYPULSE CIVIC INCIDENT LEDGER", marginX + 8, currentY + 11);

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Automated Municipal SLA Compliance & Infrastructure Audit", marginX + 8, currentY + 17);

    // Timestamp & Auditor info (Right-aligned in header box)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225); // slate-300
    const todayStr = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    doc.text(`Generated: ${todayStr}`, marginX + contentWidth - 8, currentY + 11, { align: "right" });
    doc.text(`Record Keeper: ${authorName}`, marginX + contentWidth - 8, currentY + 17, { align: "right" });
    doc.text(`Database: Connected Live State`, marginX + contentWidth - 8, currentY + 23, { align: "right" });

    currentY += 38;
  };

  // Initiate PDF generation sequence
  drawMainHeader();

  // 2. Aggregate statistics section styled like modern bento boxes
  const total = issues.length;
  const resolved = issues.filter((i) => i.status === "Resolved").length;
  const inProgress = issues.filter((i) => i.status === "In Progress").length;
  const pending = issues.filter((i) => i.status === "Pending" || i.status === "Critical").length;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("EXECUTIVE METRIC OVERVIEW", marginX, currentY);
  currentY += 4.5;

  // Let's render 4 clean stats boxes
  const boxWidth = contentWidth / 4 - 3;
  const boxHeight = 16;
  const boxY = currentY;

  const stats = [
    { label: "Total Alerts", val: total.toString(), color: [241, 245, 249], text: [15, 23, 42] },
    { label: "Resolved", val: resolved.toString(), color: [209, 250, 229], text: [6, 95, 70] },
    { label: "In Dispatch", val: inProgress.toString(), color: [254, 243, 199], text: [146, 64, 14] },
    { label: "Pending", val: pending.toString(), color: [239, 246, 255], text: [30, 64, 175] }
  ];

  stats.forEach((stat, idx) => {
    const boxX = marginX + idx * (boxWidth + 4);
    
    // Box Background fill
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.rect(boxX, boxY, boxWidth, boxHeight, "F");
    
    // Box light border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(boxX, boxY, boxWidth, boxHeight, "S");

    // Draw Stats Text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // Gray label
    doc.text(stat.label.toUpperCase(), boxX + 4, boxY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(stat.text[0], stat.text[1], stat.text[2]);
    doc.text(stat.val, boxX + 4, boxY + 12);
  });

  currentY += boxHeight + 8;
  let pageCount = 1;

  // 3. Grid listings title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("CIVIC DISPATCH LEDGER REGISTRY", marginX, currentY);
  
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY + 2, marginX + contentWidth, currentY + 2);
  currentY += 7;

  // Render individual tickets
  issues.forEach((issue, index) => {
    // Compute total approximate size needed for this item
    // Heights mapping:
    // Header line = 5
    // Metadata block = 10
    // Description body (varies as wrapped size lines * 4.5)
    // Resolution or safety advice = 12
    // Bottom padding = 6
    const wrappedDesc = doc.splitTextToSize(issue.description || "N/A", contentWidth - 10);
    const wrappedSafety = doc.splitTextToSize(issue.suggestedAction || "N/A", contentWidth - 10);
    const wrappedComplaint = doc.splitTextToSize(issue.complaintText || "N/A", contentWidth - 10);
    
    let itemHeight = 22 + wrappedDesc.length * 4.5;
    
    if (issue.status === "Resolved") {
      const wrappedNotes = doc.splitTextToSize(issue.resolutionNotes || "No specific closure summary added.", contentWidth - 16);
      itemHeight += 12 + wrappedNotes.length * 4.5;
    } else {
      itemHeight += 8 + wrappedSafety.length * 4.5;
    }

    // Is there room on the current page?
    if (currentY + itemHeight > pageHeight - 18) {
      // Draw footer for the completed page
      drawPageFooter(pageCount);
      
      // Setup new page
      doc.addPage();
      pageCount++;
      currentY = 15;
      
      // Draw subpage banner header
      doc.setFillColor(15, 23, 42);
      doc.rect(marginX, currentY, contentWidth, 8, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text("CITYPULSE MUNICIPAL INCIDENT LEDGER — (CONTINUED)", marginX + 4, currentY + 5.5);
      currentY += 13;
    }

    // Incident item background container block (light gray highlight border)
    const itemStartY = currentY;
    
    // Draw background color based on status to group beautifully
    if (issue.status === "Resolved") {
      doc.setFillColor(248, 250, 252); // extremely soft slate blue-white
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(marginX, itemStartY, contentWidth, itemHeight, "F");
    
    // Box outer delicate stroke
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.4);
    doc.rect(marginX, itemStartY, contentWidth, itemHeight, "S");

    // Bullet Left Anchor vertical accent stroke bar
    if (issue.status === "Resolved") {
      doc.setFillColor(16, 185, 129); // Emerald index
    } else if (issue.severity === "Critical") {
      doc.setFillColor(239, 68, 68); // Red index
    } else if (issue.status === "In Progress") {
      doc.setFillColor(245, 158, 11); // Amber index
    } else {
      doc.setFillColor(59, 130, 246); // Blue index
    }
    doc.rect(marginX, itemStartY, 2, itemHeight, "F");

    // Title Line
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${index + 1}. Ticket #${issue.id} : ${issue.category}`, marginX + 5.5, currentY + 6.5);

    // Status Pill
    const badgeText = `${issue.status.toUpperCase()} • ${issue.severity.toUpperCase()}`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    
    // Set appropriate text colors
    if (issue.status === "Resolved") {
      doc.setTextColor(6, 95, 70); // Emerald text
    } else if (issue.severity === "Critical") {
      doc.setTextColor(153, 27, 27); // Red text
    } else if (issue.status === "In Progress") {
      doc.setTextColor(146, 64, 14); // Yellow text
    } else {
      doc.setTextColor(30, 64, 175); // Blue text
    }
    doc.text(badgeText, marginX + contentWidth - 4.5, currentY + 6.5, { align: "right" });

    currentY += 10.5;

    // Grid metadata details (Location, Department, Reporter Name, Reported Date)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate-500
    
    doc.setFont("helvetica", "bold");
    doc.text("Department Target: ", marginX + 5.5, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(issue.assignedDepartment, marginX + 32, currentY);

    doc.setFont("helvetica", "bold");
    doc.text("Audited GPS Site: ", marginX + 90, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(`${issue.locationName} (${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)})`, marginX + 116, currentY);
    
    currentY += 4.5;
    
    doc.setFont("helvetica", "bold");
    doc.text("Filed By Citizen: ", marginX + 5.5, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(issue.reporterName, marginX + 32, currentY);

    doc.setFont("helvetica", "bold");
    doc.text("Creation Timestamp: ", marginX + 90, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(issue.createdAt).toLocaleString(), marginX + 116, currentY);

    currentY += 6.5;

    // Description text wrapper print
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("Observation Narrative Log:", marginX + 5.5, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42); // slate-900 (high contrast)
    
    wrappedDesc.forEach((line: string) => {
      currentY += 4;
      doc.text(line, marginX + 5.5, currentY);
    });

    currentY += 5.5;

    // Conditional render: Resolution or suggested safety guidelines
    if (issue.status === "Resolved") {
      // Render clean resolution details in a delicate light-green badge
      const notesStartY = currentY;
      const wrappedNotes = doc.splitTextToSize(issue.resolutionNotes || "No specific closure summary added.", contentWidth - 16);
      const notesHeight = wrappedNotes.length * 4.5 + 8;
      
      // Draw resolution box background rectangle
      doc.setFillColor(240, 253, 250); // Teal light banner
      doc.rect(marginX + 5.5, notesStartY, contentWidth - 11, notesHeight, "F");
      
      doc.setDrawColor(204, 251, 241);
      doc.rect(marginX + 5.5, notesStartY, contentWidth - 11, notesHeight, "S");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 118, 110); // Teal anchor
      doc.text("RESOLVED CLOSURE LOG • ENGINEER CONFIRMED", marginX + 9, currentY + 5);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59); // slate-800
      
      wrappedNotes.forEach((line: string, i: number) => {
        doc.text(line, marginX + 9, currentY + 10 + i * 4);
      });
      
      // Render date aligned at the bottom right corner of box
      if (issue.resolutionDate) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(13, 148, 136);
        const resolvedDate = new Date(issue.resolutionDate).toLocaleDateString();
        doc.text(`Completed: ${resolvedDate}`, marginX + contentWidth - 9, currentY + notesHeight - 3, { align: "right" });
      }

      currentY += notesHeight + 2;
    } else {
      // Pending / In progress alerts - Render warning safety response suggested by AI
      const adviceStartY = currentY;
      const adviceHeight = wrappedSafety.length * 4.5 + 8;
      
      doc.setFillColor(254, 252, 232); // light amber-yellow warning callout
      doc.rect(marginX + 5.5, adviceStartY, contentWidth - 11, adviceHeight, "F");
      
      doc.setDrawColor(254, 240, 138);
      doc.rect(marginX + 5.5, adviceStartY, contentWidth - 11, adviceHeight, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(161, 98, 7); // amber yellow
      doc.text("CRITICAL DISPATCH RESPONSE ACTION REQUIRED", marginX + 9, currentY + 5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59); // slate-800

      wrappedSafety.forEach((line: string, i: number) => {
        doc.text(line, marginX + 9, currentY + 10 + i * 4);
      });

      currentY += adviceHeight + 2;
    }

    // Safety margin padding to isolate ledger cards
    currentY = itemStartY + itemHeight + 6;
  });

  // Finish PDF sequence
  drawPageFooter(pageCount);

  // Trigger browser binary data download save dialog
  doc.save(`Municipal_Incident_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
