import React, { useState, useRef } from "react";
import { Session } from "types";
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
import { toast } from "sonner";
import brain from "brain";

interface Props {
  session: Session;
  companyName?: string;
}

/**
 * Export button that uses backend export API with tier gate enforcement.
 * Replaces client-side export to ensure feature gating works correctly.
 */
export function TierAwareExportButton({ session, companyName }: Props) {
  const [isExporting, setIsExporting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const exportInProgressRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  const DEBOUNCE_DELAY = 300;

  const handleExport = async (format: "txt" | "csv" | "pdf" | "json" | "md" | "docx") => {
    // Prevent multiple clicks
    if (isExporting || exportInProgressRef.current) {
      return;
    }
    
    exportInProgressRef.current = true;
    setIsExporting(true);
    const toastId = toast.loading(`Exporting transcript to ${format.toUpperCase()}...`);

    try {
      // Prepare export options matching backend ExportOptionsModel
      const exportOptions = {
        includeHeader: false,
        includeFooter: false,
        timestampFrequency: 'every-speaker' as const,
        includeClientProjectInfo: true,
        includeNotes: true,
        includeBranding: false,
        professionalTemplate: 'standard' as const
      };

      // Call backend export API
      console.log(`[Export] Requesting ${format} export for session ${session.id}`);
      const response = await brain.export_session(
        { sessionId: session.id },
        {
          session_id: session.id,
          format: format,
          options: exportOptions
        }
      );

      if (!response.ok) {
        // Check if it's a tier restriction (403)
        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({ 
            detail: "This export format is not available on your plan." 
          }));
          
          console.log(`[Export] Tier gate blocked: ${errorData.detail}`);
          
          toast.error(
            errorData.detail || `${format.toUpperCase()} export requires an upgrade.`,
            { 
              id: toastId,
              duration: 6000,
              action: {
                label: "View Pricing",
                onClick: () => window.location.href = "/pricing"
              }
            }
          );
          return;
        }
        
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }

      // Get the file blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const element = document.createElement('a');
      element.href = url;
      element.download = `${session.title.replace(/\s+/g, '_')}_transcript.${format}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
      
      console.log(`[Export] Successfully exported as ${format}`);
      toast.success(`Transcript exported as ${format.toUpperCase()} file`, { id: toastId });
    } catch (error) {
      console.error("[Export] Failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Export failed. Please try again.", 
        { id: toastId }
      );
    } finally {
      setIsExporting(false);
      exportInProgressRef.current = false;
    }
  };

  const handleExportClick = (format: "txt" | "csv" | "pdf" | "json" | "md" | "docx") => {
    const now = Date.now();
    
    // Debounce protection
    if (now - lastClickTimeRef.current < DEBOUNCE_DELAY) {
      console.log('[Export] Click debounced - too rapid');
      return;
    }
    
    if (isExporting || exportInProgressRef.current) {
      console.log('[Export] Already in progress');
      return;
    }
    
    lastClickTimeRef.current = now;
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
