import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentCapture } from "components/DocumentCapture";

interface DocumentMetadata {
  title?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  expected_attendees?: string[];
  document_type?: string;
  extracted_text?: string;
}

interface SessionDocument {
  id: string;
  document_data: string;
  metadata?: DocumentMetadata;
  created_at: number;
}

interface DocumentDisplayProps {
  sessionId: string;
  documents?: SessionDocument[];
  onDocumentAdded: (documentId: string, metadata: DocumentMetadata) => void;
}

export function DocumentDisplay({ sessionId, documents, onDocumentAdded }: DocumentDisplayProps) {
  const [showDocumentCapture, setShowDocumentCapture] = useState(false);

  // Handle document added
  const handleDocumentAdded = (documentId: string, metadata: DocumentMetadata) => {
    onDocumentAdded(documentId, metadata);
    setShowDocumentCapture(false);
  };

  return (
    <div className="space-y-4">
      {/* Document list */}
      {documents && documents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {documents.map((doc) => (
            <Card key={doc.id} className="overflow-hidden transition-all hover:shadow-md">
              <div className="aspect-[4/3] relative">
                <img 
                  src={doc.document_data} 
                  alt={doc.metadata?.title || "Document"} 
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="mb-2 flex justify-between items-start">
                  <h3 className="font-medium">
                    {doc.metadata?.title || 
                     (doc.metadata?.document_type ? 
                      doc.metadata.document_type.charAt(0).toUpperCase() + doc.metadata.document_type.slice(1) : 
                      "Document")}
                  </h3>
                  {doc.metadata?.document_type && (
                    <Badge variant="outline">
                      {doc.metadata.document_type}
                    </Badge>
                  )}
                </div>
                {doc.metadata?.extracted_text && (
                  <div className="text-sm text-muted-foreground mt-2" style={{ whiteSpace: "pre-wrap", maxHeight: "none", overflow: "visible" }}>
                    <div>{doc.metadata.extracted_text}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : showDocumentCapture ? null : (
        <Card className="bg-muted/40">
          <CardContent className="pt-6 pb-8">
            <div className="text-center">
              <h3 className="text-xl font-medium mb-2">No documents yet</h3>
              <p className="text-muted-foreground mb-6">Add documents like agendas or minutes to enhance your meeting record.</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Document capture form */}
      {showDocumentCapture ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Add Document</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDocumentCapture(false)}
            >
              Cancel
            </Button>
          </div>
          <DocumentCapture 
            sessionId={sessionId} 
            onDocumentAdded={handleDocumentAdded} 
          />
        </div>
      ) : (
        <div className="flex justify-center">
          <Button onClick={() => setShowDocumentCapture(true)}>
            Add Document
          </Button>
        </div>
      )}
    </div>
  );
}
