
// Lazy loading utilities for heavy document export libraries

// Lazy load jsPDF
let jsPDFModule: any = null;
export const loadJsPDF = async () => {
  if (!jsPDFModule) {
    console.log('🔄 Loading jsPDF library...');
    const module = await import('jspdf');
    jsPDFModule = module.jsPDF;
    console.log('✅ jsPDF library loaded');
  }
  return jsPDFModule;
};

// Lazy load DOCX library
let docxModule: any = null;
export const loadDocx = async () => {
  if (!docxModule) {
    console.log('🔄 Loading DOCX library...');
    docxModule = await import('docx');
    console.log('✅ DOCX library loaded');
  }
  return docxModule;
};

export interface ExportOptions {
  includeHeader?: boolean;
  headerText?: string;
  includeFooter?: boolean;
  footerText?: string;
  includeClientProjectInfo?: boolean;
  includeNotes?: boolean;
  timestampFrequency?: 'none' | 'every-speaker' | 'every-minute' | 'every-5-minutes';
  includeBranding?: boolean;
  professionalTemplate?: 'standard' | 'modern' | 'minimal' | 'legal';
}

export const exportToPDF = async (
  title: string,
  fullText: string,
  company?: any,
  options?: ExportOptions
) => {
  const jsPDF = await loadJsPDF();
  
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add company information if available
    let yPosition = 22;
    
    // Add header if specified in options
    if (options?.includeHeader && options.headerText) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'italic');
      doc.text(options.headerText, 14, 14);
      doc.setFont(undefined, 'normal');
      yPosition += 4;
    }
    
    // Add client and project info if requested
    if (options?.includeClientProjectInfo && (company?.clientName || company?.projectName)) {
      doc.setFontSize(12);
      if (company?.clientName) {
        doc.text(`Client: ${company.clientName}`, 14, yPosition);
        yPosition += 6;
      }
      if (company?.projectName) {
        doc.text(`Project: ${company.projectName}`, 14, yPosition);
        yPosition += 6;
      }
    }
    
    if (company?.logo_url) {
      try {
        // Add logo
        const img = new Image();
        img.src = company.logo_url;
        
        // Create a canvas to draw the image for measurement
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Wait for image to load
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image to canvas
        ctx?.drawImage(img, 0, 0);
        
        // Calculate dimensions (max width 50, maintain aspect ratio)
        const maxWidth = 50;
        const aspectRatio = img.width / img.height;
        const width = Math.min(maxWidth, img.width);
        const height = width / aspectRatio;
        
        // Add logo to PDF (positioned at top right)
        doc.addImage(canvas, 'PNG', doc.internal.pageSize.width - width - 14, 14, width, height);
        
        // Move start position down if image is very tall
        yPosition = Math.max(yPosition, height + 20);
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }
    
    // Add title and metadata
    doc.setFontSize(18);
    doc.text(title, 14, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(company?.createdAt * 1000 || Date.now()).toLocaleDateString()}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Duration: ${company?.duration ? formatTime(Math.round(company.duration)) : 'N/A'}`, 14, yPosition);
    yPosition += 6;
    
    // Add company information if available
    if (company?.name) {
      doc.setFontSize(14);
      doc.text(company.settings?.organizationLabel || "Company", 14, yPosition);
      yPosition += 6;
      
      doc.setFontSize(10);
      doc.text(company.name, 14, yPosition);
      yPosition += 5;
      
      if (company.contact?.email) {
        doc.text(`Email: ${company.contact.email}`, 14, yPosition);
        yPosition += 5;
      }
      
      if (company.contact?.phone) {
        doc.text(`Phone: ${company.contact.phone}`, 14, yPosition);
        yPosition += 5;
      }
      
      if (company.contact?.website) {
        doc.text(`Website: ${company.contact.website}`, 14, yPosition);
        yPosition += 5;
      }
      
      if (company.address?.street) {
        let addressText = company.address.street;
        if (company.address.city) addressText += `, ${company.address.city}`;
        if (company.address.state) addressText += `, ${company.address.state}`;
        if (company.address.zipCode) addressText += ` ${company.address.zipCode}`;
        if (company.address.country) addressText += `, ${company.address.country}`;
        
        doc.text(`Address: ${addressText}`, 14, yPosition);
        yPosition += 5;
      }
      
      yPosition += 5;
    }
    
    // Add meeting purpose if available
    if (company?.meetingPurpose) {
      doc.text(`Purpose: ${company.meetingPurpose}`, 14, yPosition);
      yPosition += 6;
    } else {
      yPosition = 44;
    }
    
    // Add professional notes if available and requested
    if (options?.includeNotes && company?.notes) {
      doc.setFontSize(14);
      doc.text("Professional Notes", 14, yPosition);
      yPosition += 6;
      
      doc.setFontSize(10);
      const notesLines = doc.splitTextToSize(company.notes, 180);
      doc.text(notesLines, 14, yPosition);
      yPosition += (notesLines.length * 5) + 6;
    }
    
    // Add speakers if available
    if (company?.speakers && company.speakers.length > 0) {
      doc.setFontSize(14);
      doc.text("Speakers", 14, yPosition);
      yPosition += 6;
      
      doc.setFontSize(10);
      company.speakers.forEach((speaker: any) => {
        doc.text(`- ${speaker.name || speaker.id}`, 14, yPosition);
        yPosition += 5;
      });
      
      yPosition += 5;
    }
    
    // Add transcript
    doc.setFontSize(14);
    doc.text("Transcript", 14, yPosition);
    yPosition += 6;
    
    // Add the transcript with timestamps based on preferences
    if (fullText) {
      // Handle timestamp frequency
      const lines = fullText.split("\n");
      let processedText = '';
      
      if (options?.timestampFrequency === 'none') {
        processedText = fullText;
      } else {
        // Process based on timestamp frequency preference
        let lastSpeaker = '';
        let minuteCounter = 0;
        
        lines.forEach((line, index) => {
          const speakerMatch = line.match(/^([^:]+):\s(.+)$/);
          
          if (speakerMatch) {
            const [_, speakerName, text] = speakerMatch;
            let addTimestamp = false;
            
            if (options.timestampFrequency === 'every-speaker' && speakerName !== lastSpeaker) {
              addTimestamp = true;
            } else if (options.timestampFrequency === 'every-minute' && (minuteCounter % 60 === 0)) {
              addTimestamp = true;
            } else if (options.timestampFrequency === 'every-5-minutes' && (minuteCounter % 300 === 0)) {
              addTimestamp = true;
            }
            
            if (addTimestamp && company?.duration) {
              const estimatedProgress = (index / lines.length) * company.duration;
              processedText += `[${formatTime(Math.round(estimatedProgress))}] `;
            }
            
            processedText += line + '\n';
            lastSpeaker = speakerName;
            minuteCounter++;
          } else {
            processedText += line + '\n';
          }
        });
      }
      
      // Split text into lines to fit the page width
      const textLines = doc.splitTextToSize(processedText, 180);
      
      // Add the text
      doc.setFontSize(10);
      doc.text(textLines, 14, yPosition);
    }
    
    // Add footer if specified in options
    if (options?.includeFooter && options.footerText) {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont(undefined, 'italic');
        doc.text(
          options.footerText,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
    }
    
    // Download the PDF
    doc.save(`${title.replace(/\s+/g, '_')}_transcript.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const exportToDocx = async (
  title: string,
  fullText: string,
  company?: any,
  options?: ExportOptions
) => {
  const docx = await loadDocx();
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun } = docx;
  
  try {
    // Create a new Word document
    const doc = new Document({
      title: title,
      description: `Transcript for ${title}`,
      creator: company?.name || "Dicta-Notes",
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: {
              after: 200
            }
          }),
          
          // Add company logo if available
          ...(company?.logo_url ? [
            new Paragraph({
              children: [
                new ImageRun({
                  data: await fetch(company.logo_url).then(r => r.arrayBuffer()),
                  transformation: {
                    width: 100,
                    height: 100
                  },
                  type: 'image',
                  fallback: ''
                })
              ],
              alignment: AlignmentType.RIGHT
            })
          ] : []),
          
          // Add company info if available
          ...(company ? [
            new Paragraph({
              text: company.settings?.organizationLabel || "Company Information",
              heading: HeadingLevel.HEADING_3,
              spacing: {
                before: 200,
                after: 100
              }
            }),
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE
              },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE }
              },
              rows: [
                // Company name
                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 20,
                        type: WidthType.PERCENTAGE
                      },
                      children: [new Paragraph("Name:")]
                    }),
                    new TableCell({
                      width: {
                        size: 80,
                        type: WidthType.PERCENTAGE
                      },
                      children: [new Paragraph(company.name)]
                    })
                  ]
                }),
                // Company email
                ...(company.contact?.email ? [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 20,
                          type: WidthType.PERCENTAGE
                        },
                        children: [new Paragraph("Email:")]
                      }),
                      new TableCell({
                        width: {
                          size: 80,
                          type: WidthType.PERCENTAGE
                        },
                        children: [new Paragraph(company.contact.email)]
                      })
                    ]
                  })
                ] : []),
                // Company phone
                ...(company.contact?.phone ? [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 20,
                          type: WidthType.PERCENTAGE
                        },
                        children: [new Paragraph("Phone:")]
                      }),
                      new TableCell({
                        width: {
                          size: 80,
                          type: WidthType.PERCENTAGE
                        },
                        children: [new Paragraph(company.contact.phone)]
                      })
                    ]
                  })
                ] : []),
                // Company website
                ...(company.contact?.website ? [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 20,
                          type: WidthType.PERCENTAGE
                        },
                        children: [new Paragraph("Website:")]
                      }),
                      new TableCell({
                        width: {
                          size: 80,
                          type: WidthType.PERCENTAGE
                        },
                        children: [new Paragraph(company.contact.website)]
                      })
                    ]
                  })
                ] : []),
                // Company address
                ...(company.address?.street ? [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 20,
                          type: WidthType.PERCENTAGE
                        },
                        children: [new Paragraph("Address:")]
                      }),
                      new TableCell({
                        width: {
                          size: 80,
                          type: WidthType.PERCENTAGE
                        },
                        children: [new Paragraph(`${company.address.street}${company.address.city ? `, ${company.address.city}` : ''}${company.address.state ? `, ${company.address.state}` : ''}${company.address.zipCode ? ` ${company.address.zipCode}` : ''}${company.address.country ? `, ${company.address.country}` : ''}`)]
                      })
                    ]
                  })
                ] : [])
              ]
            })
          ] : []),
          
          // Add transcript section
          new Paragraph({
            text: "Transcript",
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 400,
              after: 200
            }
          }),
          
          // Process transcript text by speaker
          ...(fullText ? fullText.split("\n").map(line => {
            // Check if line starts with a speaker name
            const speakerMatch = line.match(/^([^:]+):\s(.+)$/);
            
            if (speakerMatch) {
              const [_, speakerName, text] = speakerMatch;
              return new Paragraph({
                children: [
                  new TextRun({
                    text: `${speakerName}: `,
                    bold: true
                  }),
                  new TextRun(text)
                ],
                spacing: {
                  after: 100
                }
              });
            }
            return new Paragraph({
              text: line,
              spacing: {
                after: 100
              }
            });
          }) : [new Paragraph("No transcript available.")])
        ]
      }]
    });
    
    // Generate and save the document
    const blob = await Packer.toBlob(doc);
    const element = document.createElement('a');
    element.href = URL.createObjectURL(blob);
    element.download = `${title.replace(/\s+/g, '_')}_transcript.docx`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  } catch (error) {
    console.error('Error generating Word document:', error);
    throw error;
  }
};

// Export data interface for new functions
export interface ExportData {
  title: string;
  fullText: string;
  createdAt: number;
  duration?: number;
  speakers?: Array<{ id: string; name: string; confidence?: number }>;
  segments?: Array<{ text: string; start_time: number; speaker?: any }>;
  meetingPurpose?: string;
  company?: any;
  clientName?: string;
  projectName?: string;
  notes?: string;
}

// Export to TXT format
export const exportToTxt = async (data: ExportData) => {
  const { title, fullText, createdAt, duration, speakers, meetingPurpose, company, clientName, projectName, notes } = data;
  
  let content = `${title}\n`;
  content += '='.repeat(title.length) + '\n\n';
  
  // Add metadata
  content += `Date: ${new Date(createdAt * 1000).toLocaleString()}\n`;
  if (duration) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    content += `Duration: ${hours}h ${minutes}m ${seconds}s\n`;
  }
  
  if (company?.name) content += `Company: ${company.name}\n`;
  if (clientName) content += `Client: ${clientName}\n`;
  if (projectName) content += `Project: ${projectName}\n`;
  if (meetingPurpose) content += `Purpose: ${meetingPurpose}\n`;
  
  // FIX: Ensure speakers is an array before accessing length and forEach
  if (Array.isArray(speakers) && speakers.length > 0) {
    content += `\nSpeakers:\n`;
    speakers.forEach(speaker => {
      content += `- ${speaker.name || speaker.id}\n`;
    });
  }
  
  content += '\n' + '-'.repeat(50) + '\n\n';
  content += fullText;
  
  if (notes) {
    content += '\n\n' + '-'.repeat(50) + '\n';
    content += 'Notes:\n' + notes;
  }
  
  // Create and download file
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const element = document.createElement('a');
  element.href = url;
  element.download = `${title.replace(/\s+/g, '_')}_transcript.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(url);
};

// Export to CSV format
export const exportToCsv = async (data: ExportData) => {
  const { title, segments, speakers } = data;
  
  let csvContent = 'Timestamp,Speaker,Text\n';
  
  if (segments && segments.length > 0) {
    segments.forEach(segment => {
      const timestamp = new Date(segment.start_time * 1000).toISOString();
      const speakerId = typeof segment.speaker === 'string' ? segment.speaker : segment.speaker?.id || 'Unknown';
      // FIX: Ensure speakers is an array before calling find
      const speakerName = (Array.isArray(speakers) ? speakers.find(s => s.id === speakerId)?.name : null) || 
                         (typeof segment.speaker === 'object' ? segment.speaker?.name : speakerId) || 
                         'Unknown';
      const text = segment.text.replace(/"/g, '""'); // Escape quotes
      csvContent += `"${timestamp}","${speakerName}","${text}"\n`;
    });
  } else {
    // Fallback for fullText without segments
    const lines = data.fullText.split('\n');
    lines.forEach((line, index) => {
      const speakerMatch = line.match(/^([^:]+):\s(.+)$/);
      if (speakerMatch) {
        const [_, speakerName, text] = speakerMatch;
        csvContent += `"${index}","${speakerName}","${text.replace(/"/g, '""')}"\n`;
      } else if (line.trim()) {
        csvContent += `"${index}","Unknown","${line.replace(/"/g, '""')}"\n`;
      }
    });
  }
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const element = document.createElement('a');
  element.href = url;
  element.download = `${title.replace(/\s+/g, '_')}_transcript.csv`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(url);
};

// Export to PDF format (alias for existing exportToPDF)
export const exportToPdf = async (data: ExportData) => {
  const { title, fullText, company } = data;
  return exportToPDF(title, fullText, company);
};

// Add formatTime function if not already imported
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
