import PDFDocument from 'pdfkit';
import type { StoredResume } from '../types/resume.js';

export function generateResumePdfBuffer(resume: StoredResume): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 36, bottom: 36, left: 40, right: 40 },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const primaryColor = resume.accentColor || '#1A365D'; // Navy or custom accent
      const secondaryColor = '#2B6CB0'; // Slate blue
      const textColor = '#2D3748'; // Charcoal body
      const mutedColor = '#718096'; // Gray
      const ruleColor = '#E2E8F0'; // Light border

      const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      // Header: Name
      const name = resume.personalDetails.fullName || resume.title || 'Resume';
      doc
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor(primaryColor)
        .text(name, { align: 'center' });

      // Contact Info Row
      const contacts: string[] = [];
      if (resume.personalDetails.email) contacts.push(resume.personalDetails.email);
      if (resume.personalDetails.phone) contacts.push(resume.personalDetails.phone);
      if (resume.personalDetails.location) contacts.push(resume.personalDetails.location);
      if (resume.personalDetails.linkedIn) contacts.push(resume.personalDetails.linkedIn);
      if (resume.personalDetails.gitHub) contacts.push(resume.personalDetails.gitHub);
      if (resume.personalDetails.portfolio) contacts.push(resume.personalDetails.portfolio);

      if (contacts.length > 0) {
        doc.moveDown(0.3);
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(mutedColor)
          .text(contacts.join('  •  '), { align: 'center', width: contentWidth });
      }

      // Helper function to draw Section Header
      function addSectionHeader(title: string) {
        doc.moveDown(0.7);
        // Ensure space or new page if near bottom
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
        }
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor(primaryColor)
          .text(title.toUpperCase(), { characterSpacing: 1 });

        const currentY = doc.y + 2;
        doc
          .strokeColor(secondaryColor)
          .lineWidth(1)
          .moveTo(doc.page.margins.left, currentY)
          .lineTo(doc.page.width - doc.page.margins.right, currentY)
          .stroke();

        doc.y = currentY + 4;
      }

      // Professional Summary
      if (resume.summary && resume.summary.trim()) {
        addSectionHeader('Professional Summary');
        doc
          .font('Helvetica')
          .fontSize(9.5)
          .fillColor(textColor)
          .text(resume.summary.trim(), {
            align: 'justify',
            lineGap: 2,
          });
      }

      // Experience
      if (resume.experience && resume.experience.length > 0) {
        addSectionHeader('Experience');
        for (const exp of resume.experience) {
          if (doc.y > doc.page.height - 80) doc.addPage();

          doc.moveDown(0.4);
          const startY = doc.y;

          // Role and Dates
          doc
            .font('Helvetica-Bold')
            .fontSize(10.5)
            .fillColor(textColor)
            .text(exp.role || 'Role', doc.page.margins.left, startY, { continued: false });

          // Date / location on the right
          const dateStr = [exp.startDate, exp.isCurrent ? 'Present' : exp.endDate].filter(Boolean).join(' - ');
          if (dateStr) {
            doc
              .font('Helvetica')
              .fontSize(9)
              .fillColor(mutedColor)
              .text(dateStr, doc.page.margins.left, startY, {
                align: 'right',
                width: contentWidth,
              });
          }

          // Company and Location
          const companyLine = [exp.company, exp.location, exp.employmentType].filter(Boolean).join(' | ');
          if (companyLine) {
            doc
              .font('Helvetica-Oblique')
              .fontSize(9.5)
              .fillColor(secondaryColor)
              .text(companyLine);
          }

          // Bullets
          if (exp.bullets && exp.bullets.length > 0) {
            doc.moveDown(0.2);
            for (const bullet of exp.bullets) {
              if (doc.y > doc.page.height - 50) doc.addPage();
              doc
                .font('Helvetica')
                .fontSize(9)
                .fillColor(textColor)
                .text(`•  ${bullet.trim()}`, {
                  indent: 8,
                  lineGap: 1.5,
                });
            }
          }
        }
      }

      // Projects
      if (resume.projects && resume.projects.length > 0) {
        addSectionHeader('Projects');
        for (const proj of resume.projects) {
          if (doc.y > doc.page.height - 80) doc.addPage();

          doc.moveDown(0.4);
          const startY = doc.y;

          const titleWithRole = [proj.title, proj.role].filter(Boolean).join(' – ');
          doc
            .font('Helvetica-Bold')
            .fontSize(10.5)
            .fillColor(textColor)
            .text(titleWithRole || 'Project', doc.page.margins.left, startY);

          const dateStr = [proj.startDate, proj.endDate].filter(Boolean).join(' - ');
          if (dateStr) {
            doc
              .font('Helvetica')
              .fontSize(9)
              .fillColor(mutedColor)
              .text(dateStr, doc.page.margins.left, startY, {
                align: 'right',
                width: contentWidth,
              });
          }

          const metaItems: string[] = [];
          if (proj.technologies && proj.technologies.length > 0) {
            metaItems.push(`Technologies: ${proj.technologies.join(', ')}`);
          }
          if (proj.link) {
            metaItems.push(proj.link);
          }

          if (metaItems.length > 0) {
            doc
              .font('Helvetica-Oblique')
              .fontSize(9)
              .fillColor(secondaryColor)
              .text(metaItems.join(' | '));
          }

          if (proj.bullets && proj.bullets.length > 0) {
            doc.moveDown(0.2);
            for (const bullet of proj.bullets) {
              if (doc.y > doc.page.height - 50) doc.addPage();
              doc
                .font('Helvetica')
                .fontSize(9)
                .fillColor(textColor)
                .text(`•  ${bullet.trim()}`, {
                  indent: 8,
                  lineGap: 1.5,
                });
            }
          }
        }
      }

      // Education
      if (resume.education && resume.education.length > 0) {
        addSectionHeader('Education');
        for (const edu of resume.education) {
          if (doc.y > doc.page.height - 70) doc.addPage();

          doc.moveDown(0.4);
          const startY = doc.y;

          const degreeLine = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
          doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .fillColor(textColor)
            .text(degreeLine || 'Degree', doc.page.margins.left, startY);

          const dateRange = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
          if (dateRange) {
            doc
              .font('Helvetica')
              .fontSize(9)
              .fillColor(mutedColor)
              .text(dateRange, doc.page.margins.left, startY, {
                align: 'right',
                width: contentWidth,
              });
          }

          const instDetails = [edu.institution, edu.location, edu.scoreOrGpa ? `GPA/Score: ${edu.scoreOrGpa}` : '']
            .filter(Boolean)
            .join(' | ');

          if (instDetails) {
            doc
              .font('Helvetica-Oblique')
              .fontSize(9)
              .fillColor(secondaryColor)
              .text(instDetails);
          }

          if (edu.description) {
            doc
              .font('Helvetica')
              .fontSize(8.5)
              .fillColor(textColor)
              .text(edu.description);
          }
        }
      }

      // Skills
      if (resume.skills && resume.skills.length > 0) {
        addSectionHeader('Skills');
        doc.moveDown(0.3);
        doc
          .font('Helvetica')
          .fontSize(9.5)
          .fillColor(textColor)
          .text(resume.skills.join('  •  '), { lineGap: 3 });
      }

      // Certifications
      if (resume.certifications && resume.certifications.length > 0) {
        addSectionHeader('Certifications');
        for (const cert of resume.certifications) {
          if (doc.y > doc.page.height - 50) doc.addPage();
          doc.moveDown(0.3);
          const startY = doc.y;

          const certText = cert.issuer ? `${cert.name} – ${cert.issuer}` : cert.name;
          doc
            .font('Helvetica-Bold')
            .fontSize(9.5)
            .fillColor(textColor)
            .text(certText, doc.page.margins.left, startY);

          const certDate = [cert.issueDate, cert.expiryDate ? `Expires: ${cert.expiryDate}` : '']
            .filter(Boolean)
            .join(' - ');

          if (certDate) {
            doc
              .font('Helvetica')
              .fontSize(8.5)
              .fillColor(mutedColor)
              .text(certDate, doc.page.margins.left, startY, {
                align: 'right',
                width: contentWidth,
              });
          }

          if (cert.credentialId || cert.url) {
            const extra = [cert.credentialId ? `ID: ${cert.credentialId}` : '', cert.url].filter(Boolean).join(' | ');
            doc
              .font('Helvetica-Oblique')
              .fontSize(8.5)
              .fillColor(mutedColor)
              .text(extra);
          }
        }
      }

      // Achievements
      if (resume.achievements && resume.achievements.length > 0) {
        addSectionHeader('Achievements');
        for (const ach of resume.achievements) {
          if (doc.y > doc.page.height - 50) doc.addPage();
          doc.moveDown(0.3);
          const startY = doc.y;

          doc
            .font('Helvetica-Bold')
            .fontSize(9.5)
            .fillColor(textColor)
            .text(ach.title, doc.page.margins.left, startY);

          if (ach.date) {
            doc
              .font('Helvetica')
              .fontSize(8.5)
              .fillColor(mutedColor)
              .text(ach.date, doc.page.margins.left, startY, {
                align: 'right',
                width: contentWidth,
              });
          }

          if (ach.description) {
            doc
              .font('Helvetica')
              .fontSize(9)
              .fillColor(textColor)
              .text(ach.description);
          }
        }
      }

      // Links
      if (resume.links && resume.links.length > 0) {
        addSectionHeader('Additional Links');
        doc.moveDown(0.3);
        const linkLines = resume.links.map((l) => `${l.label}: ${l.url}`);
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(secondaryColor)
          .text(linkLines.join('\n'), { lineGap: 2 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
