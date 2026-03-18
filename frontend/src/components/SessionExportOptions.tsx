


import React, { useState, useRef } from "react";
import { Session, TranscriptionSegment, Speaker } from "types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, FileType, File, FileCode } from "lucide-react";
import { exportToTxt, exportToCsv, exportToDocx, exportToPDF } from "utils/documentExport";
import { toast } from "sonner";
import { formatTime } from "utils/transcriptionUtils";
import { format } from "date-fns";

// Lazy load jsPDF for PDF generation
const loadJsPDF = async () => {
  const { default: jsPDF } = await import('jspdf');
  return jsPDF;
};

interface Props {
  session: Session;
  companyName?: string;
}

export function SessionExportOptions({ session, companyName }: Props) {
  const [isExporting, setIsExporting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Add a ref to track if export is in progress immediately
  const exportInProgressRef = useRef(false);
  
  // Add debounce protection against faulty mouse switches
  const lastClickTimeRef = useRef(0);
  const DEBOUNCE_DELAY = 300; // 300ms protection window

  const getSpeakersMap = (speakers: Speaker[] | undefined) => {
    if (!speakers) return {};
    return speakers.reduce((acc, s) => {
      acc[s.id] = s.name;
      return acc;
    }, {} as Record<string, string>);
  };

  const speakersMap = getSpeakersMap(session?.speakers || session?.transcript_data?.speakers);

  const segments = session?.segments || session?.transcript_data?.segments || [];
  const fullText = session?.full_text || session?.transcript_data?.full_text || "";
  const title = session?.title || "Untitled Session";
  const createdAt = session?.created_at || 0;
  
  const exportToJson = async (data: any) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    element.download = `${data.title.replace(/\s+/g, '_')}_transcript.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
  };

  const exportToMd = async (data: any) => {
    let mdContent = `# ${data.title}\n\n`;
    mdContent += `**Date:** ${new Date(data.createdAt * 1000).toLocaleDateString()}\n`;
    if (data.duration) {
      const hours = Math.floor(data.duration / 3600);
      const minutes = Math.floor((data.duration % 3600) / 60);
      const seconds = Math.floor(data.duration % 60);
      mdContent += `**Duration:** ${hours}h ${minutes}m ${seconds}s\n`;
    }
    if (data.meetingPurpose) mdContent += `**Purpose:** ${data.meetingPurpose}\n`;
    if (data.companyName) mdContent += `**Company:** ${data.companyName}\n`;
    
    if (data.speakers && Object.keys(data.speakers).length > 0) {
      mdContent += `\n## Speakers\n`;
      Object.values(data.speakers).forEach(speaker => {
        mdContent += `- ${speaker}\n`;
      });
    }
    
    mdContent += `\n## Transcript\n\n`;
    mdContent += data.fullText;
    
    if (data.notes) {
      mdContent += `\n\n## Notes\n\n${data.notes}`;
    }
    
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    element.download = `${data.title.replace(/\s+/g, '_')}_transcript.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
  };
  
  const handleExport = async (format: "txt" | "csv" | "pdf" | "json" | "md" | "docx") => {
    // Immediate prevention of multiple clicks
    if (isExporting || exportInProgressRef.current) {
      return;
    }
    
    exportInProgressRef.current = true;
    setIsExporting(true);
    const toastId = toast.loading(`Exporting transcript to ${format.toUpperCase()}...`);

    try {
      const exportData = {
        title,
        createdAt,
        speakers: speakersMap,
        segments,
        fullText,
        company: {
          name: companyName || "Dicta-Notes",
          createdAt,
          duration: session.duration,
          speakers: session.speakers,
          meetingPurpose: session.metadata?.meetingPurpose,
          notes: session.metadata?.notes,
          clientName: session.client_name,
          projectName: session.project_name,
          logo_url: session.metadata?.company?.logo_url,
          contact: session.metadata?.company?.contact,
          address: session.metadata?.company?.address,
          settings: session.metadata?.company?.settings
        }
      };

      const exportOptions = {
        includeHeader: false,
        includeFooter: false,
        timestampFrequency: 'every-speaker' as const,
        includeClientProjectInfo: true,
        includeNotes: true,
        includeBranding: false,
        professionalTemplate: 'standard' as const
      };

      switch (format) {
        case "txt":
          await exportToTxt(exportData);
          break;
        case "csv":
          await exportToCsv(exportData);
          break;
        case "pdf":
          await exportToPDF(exportData.title, exportData.fullText, exportData.company, exportOptions);
          break;
        case "json":
          await exportToJson(exportData);
          break;
        case "md":
          await exportToMd(exportData);
          break;
        case "docx":
          await exportToDocx(exportData.title, exportData.fullText, exportData.company);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      toast.success(`Transcript exported as ${format.toUpperCase()} file`, { id: toastId });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.", { id: toastId });
    } finally {
      setIsExporting(false);
      exportInProgressRef.current = false;
    }
  };

  // Wrap the export handler to prevent event bubbling
  const handleExportClick = (format: "txt" | "csv" | "pdf" | "json" | "md" | "docx") => {
    const now = Date.now();
    
    // Debounce protection - prevent clicks within 300ms
    if (now - lastClickTimeRef.current < DEBOUNCE_DELAY) {
      console.log('Export click debounced - too rapid');
      return;
    }
    
    // Check if export is already in progress
    if (isExporting || exportInProgressRef.current) {
      console.log('Export already in progress');
      return;
    }
    
    // Update last click time
    lastClickTimeRef.current = now;
    
    // Close dropdown immediately and start export
    setDropdownOpen(false);
    handleExport(format);
  };

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Export Transcript As</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => handleExportClick("txt")}>
          <FileText className="mr-2 h-4 w-4" />
          <span>TXT</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleExportClick("csv")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleExportClick("md")}>
          <FileCode className="mr-2 h-4 w-4" />
          <span>Markdown</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleExportClick("json")}>
          <File className="mr-2 h-4 w-4" />
          <span>JSON</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleExportClick("pdf")}>
          <FileType className="mr-2 h-4 w-4" />
          <span>PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleExportClick("docx")}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Word (DOCX)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
