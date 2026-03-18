import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Camera, FileImage, Loader2 } from "lucide-react";
import brain from "brain";

interface DocumentMetadata {
  title?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  expected_attendees?: string[];
  document_type?: string;
  extracted_text?: string;
}

interface Props {
  sessionId: string;
  onDocumentAdded: (documentId: string, metadata: DocumentMetadata) => void;
}

export const DocumentCapture: React.FC<Props> = ({ sessionId, onDocumentAdded }) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<string>("agenda");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Define video constraints
  const videoConstraints = {
    width: 720,
    height: 480,
    facingMode: "environment" // Use the rear camera on mobile devices
  };

  // Capture image from webcam
  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setUploadedImage(null);
    }
  }, [webcamRef]);

  // Reset captured image
  const resetImage = () => {
    setCapturedImage(null);
    setUploadedImage(null);
    setError(null);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target) {
          setUploadedImage(e.target.result as string);
          setCapturedImage(null);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Trigger file upload dialog
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process the document
  const processDocument = async () => {
    const imageData = capturedImage || uploadedImage;
    if (!imageData || !sessionId) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Prepare the request
      const requestData = {
        session_id: sessionId,
        document_data: imageData,
        document_type: documentType
      };
      
      // Call the API to add document
      const response = await brain.add_document(requestData);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Document added:", data);
        
        // Process the document to extract metadata
        if (data.document_id) {
          try {
            const processResponse = await brain.process_document({
              document_id: data.document_id,
              session_id: sessionId
            });
            
            if (processResponse.ok) {
              const metadata = await processResponse.json();
              // Call the callback with the document ID and metadata
              onDocumentAdded(data.document_id, metadata);
              // Reset the form
              resetImage();
            } else {
              throw new Error("Failed to process document");
            }
          } catch (processError) {
            console.error("Error processing document:", processError);
            // Still consider document added even if processing failed
            onDocumentAdded(data.document_id, {});
            setError("Document was added but couldn't be processed. You can try again later.");
            resetImage();
          }
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to add document");
      }
    } catch (error) {
      console.error("Error adding document:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <Tabs defaultValue="camera" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="camera" className="flex items-center">
              <Camera className="w-4 h-4 mr-2" /> Camera
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center">
              <FileImage className="w-4 h-4 mr-2" /> Upload
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4 space-y-4">
            {/* Document type selection */}
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={documentType === "agenda" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setDocumentType("agenda")}
              >
                Meeting Agenda
              </Badge>
              <Badge 
                variant={documentType === "minutes" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setDocumentType("minutes")}
              >
                Meeting Minutes
              </Badge>
              <Badge 
                variant={documentType === "presentation" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setDocumentType("presentation")}
              >
                Presentation
              </Badge>
              <Badge 
                variant={documentType === "other" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setDocumentType("other")}
              >
                Other Document
              </Badge>
            </div>
            
            {/* Camera Tab */}
            <TabsContent value="camera" className="mt-0">
              {capturedImage ? (
                <div className="space-y-4">
                  <div className="relative rounded-md overflow-hidden border">
                    <img 
                      src={capturedImage} 
                      alt="Captured document" 
                      className="w-full object-contain max-h-[300px]" 
                    />
                  </div>
                  <div className="flex justify-between gap-2">
                    <Button variant="outline" onClick={resetImage} disabled={isProcessing}>
                      Retake
                    </Button>
                    <Button onClick={processDocument} disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Process Document"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-md overflow-hidden border">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      className="w-full"
                    />
                  </div>
                  <Button onClick={captureImage} className="w-full">
                    Capture Document
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Upload Tab */}
            <TabsContent value="upload" className="mt-0">
              {uploadedImage ? (
                <div className="space-y-4">
                  <div className="relative rounded-md overflow-hidden border">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded document" 
                      className="w-full object-contain max-h-[300px]" 
                    />
                  </div>
                  <div className="flex justify-between gap-2">
                    <Button variant="outline" onClick={resetImage} disabled={isProcessing}>
                      Cancel
                    </Button>
                    <Button onClick={processDocument} disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Process Document"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={triggerFileUpload}
                  >
                    <FileImage className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-center text-muted-foreground">
                      Click to select a document image<br />
                      <span className="text-xs">Supports JPG, PNG and GIF</span>
                    </p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};
