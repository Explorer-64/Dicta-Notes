import React, { useCallback, useEffect, useRef, useState } from "react";
import brain from "brain";
import { Header } from "components/Header";
import { NoIndex } from "components/NoIndexMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { format } from "date-fns";
import { Camera, ChevronDown, FileUp, Loader2, Plus, Trash2, Upload, X } from "lucide-react";

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export type DocumentAnalysisResult = {
  id: string;
  title: string;
  summary: string;
  key_points: string[];
  action_items: string[];
  full_text: string;
  language_detected: string;
  source_filename: string;
  created_at: string;
};

type ListItem = {
  id: string;
  title: string;
  summary: string;
  language_detected: string;
  source_filename: string;
  created_at: string;
};

function formatDateSafe(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : format(d, "PPp");
}

function parseErrorMessage(text: string, fallback: string): string {
  try {
    const j = JSON.parse(text);
    if (j?.detail) {
      if (typeof j.detail === "string") return j.detail;
      if (Array.isArray(j.detail)) return j.detail.map((x: { msg?: string }) => x.msg).filter(Boolean).join("; ");
    }
  } catch {
    /* ignore */
  }
  return text || fallback;
}

export default function Documents() {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [list, setList] = useState<ListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [latest, setLatest] = useState<DocumentAnalysisResult | null>(null);
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [photoQueue, setPhotoQueue] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await brain.document_analysis_list();
      if (!res.ok) {
        const t = await res.text();
        throw new Error(parseErrorMessage(t, res.statusText));
      }
      const data = await res.json();
      setList(data.documents || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not load documents";
      toast.error(msg);
      setList([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const addPhotos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (newFiles.length === 0) return;
    setPhotoQueue((q) => {
      const combined = [...q, ...newFiles].slice(0, 10);
      const urls = combined.map((f) => URL.createObjectURL(f));
      setPhotoPreviewUrls((prev) => { prev.forEach((u) => URL.revokeObjectURL(u)); return urls; });
      return combined;
    });
  };

  const removePhoto = (idx: number) => {
    setPhotoQueue((q) => {
      const next = q.filter((_, i) => i !== idx);
      const urls = next.map((f) => URL.createObjectURL(f));
      setPhotoPreviewUrls((prev) => { prev.forEach((u) => URL.revokeObjectURL(u)); return urls; });
      return next;
    });
  };

  const runImageUpload = async () => {
    if (photoQueue.length === 0) return;
    setBusy(true);
    setProgress(15);
    setLatest(null);
    const progressTimer = window.setInterval(() => {
      setProgress((p) => (p < 85 ? p + 8 : p));
    }, 400);
    try {
      const res = await brain.document_analysis_analyze_images({ files: photoQueue });
      setProgress(100);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(parseErrorMessage(t, res.statusText));
      }
      const data: DocumentAnalysisResult = await res.json();
      setLatest(data);
      setPhotoQueue([]);
      setPhotoPreviewUrls((prev) => { prev.forEach((u) => URL.revokeObjectURL(u)); return []; });
      toast.success("Document analyzed");
      await fetchList();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      window.clearInterval(progressTimer);
      setBusy(false);
      setTimeout(() => setProgress(0), 400);
    }
  };

  const runUpload = async (file: File) => {
    setBusy(true);
    setProgress(15);
    setLatest(null);
    const progressTimer = window.setInterval(() => {
      setProgress((p) => (p < 85 ? p + 8 : p));
    }, 400);
    try {
      const res = await brain.document_analysis_analyze({ file });
      setProgress(100);

      if (!res.ok) {
        const t = await res.text();
        throw new Error(parseErrorMessage(t, res.statusText));
      }
      const data: DocumentAnalysisResult = await res.json();
      setLatest(data);
      toast.success("Document analyzed");
      await fetchList();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      toast.error(msg);
    } finally {
      window.clearInterval(progressTimer);
      setBusy(false);
      setTimeout(() => setProgress(0), 400);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx") && !lower.endsWith(".txt")) {
      toast.error("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File is too large. Maximum size is 20MB.");
      return;
    }
    void runUpload(file);
  };

  const onDelete = async (docId: string) => {
    try {
      const res = await brain.document_analysis_delete(docId);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(parseErrorMessage(t, res.statusText));
      }
      toast.success("Document removed");
      if (latest?.id === docId) setLatest(null);
      await fetchList();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const loadDocument = async (docId: string) => {
    setLoadingDoc(docId);
    try {
      const res = await brain.document_analysis_get(docId);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(parseErrorMessage(t, res.statusText));
      }
      const data: DocumentAnalysisResult = await res.json();
      setLatest(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not load document");
    } finally {
      setLoadingDoc(null);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NoIndex />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 sm:py-10 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Document analysis</h1>
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
          Upload a PDF, Word document, or plain text file. We extract the text, analyze it with Gemini 2.5 Flash, and save a summary, key points, and action items to your account.
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileUp className="h-5 w-5" />
              Upload
            </CardTitle>
            <CardDescription>Drag and drop or browse — up to 20MB</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              disabled={busy}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={() => !busy && inputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              } ${busy ? "opacity-60 pointer-events-none" : ""}`}
            >
              {busy ? (
                <div className="space-y-3">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing document…</p>
                  <Progress value={progress} className="h-2 max-w-md mx-auto" />
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">Drop a file here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">PDF, DOCX, or TXT</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Photo / camera section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5" />
              Scan with camera
            </CardTitle>
            <CardDescription>Take a photo of each page, then analyze all at once — up to 10 pages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input ref={cameraRef} type="file" accept={IMAGE_ACCEPT} capture="environment" className="hidden" disabled={busy} onChange={(e) => addPhotos(e.target.files)} />
            <input ref={galleryRef} type="file" accept={IMAGE_ACCEPT} multiple className="hidden" disabled={busy} onChange={(e) => addPhotos(e.target.files)} />

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={busy || photoQueue.length >= 10} onClick={() => cameraRef.current?.click()}>
                <Camera className="h-4 w-4 mr-2" /> Take photo
              </Button>
              <Button type="button" variant="outline" disabled={busy || photoQueue.length >= 10} onClick={() => galleryRef.current?.click()}>
                <Plus className="h-4 w-4 mr-2" /> Add from gallery
              </Button>
            </div>

            {photoQueue.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {photoPreviewUrls.map((url, idx) => (
                    <div key={idx} className="relative">
                      <img src={url} alt={`Page ${idx + 1}`} className="h-24 w-20 object-cover rounded border" />
                      <span className="absolute top-0 left-0 bg-black/60 text-white text-xs px-1 rounded-br">{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        aria-label="Remove page"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {busy ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Analyzing {photoQueue.length} page{photoQueue.length > 1 ? "s" : ""}…
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                ) : (
                  <Button type="button" onClick={runImageUpload}>
                    Analyze {photoQueue.length} page{photoQueue.length > 1 ? "s" : ""}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {latest && (
          <Card className="mb-8 border-primary/30">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-xl">{latest.title || latest.source_filename}</CardTitle>
                  <CardDescription className="mt-1">
                    {latest.source_filename}
                    {latest.language_detected ? (
                      <Badge variant="secondary" className="ml-2 align-middle">
                        {latest.language_detected}
                      </Badge>
                    ) : null}
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => onDelete(latest.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Summary</h2>
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{latest.summary}</p>
              </section>
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key points</h2>
                <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base">
                  {(latest.key_points || []).map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Action items</h2>
                {latest.action_items?.length ? (
                  <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base">
                    {latest.action_items.map((k, i) => (
                      <li key={i}>{k}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">None detected</p>
                )}
              </section>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                    <span className="text-sm font-semibold">Full text</span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="mt-3 max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs sm:text-sm whitespace-pre-wrap break-words">
                    {latest.full_text}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        )}

        <h2 className="text-lg font-semibold mb-3">Your analyzed documents</h2>
        {loadingList ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved analyses yet. Upload a document above.</p>
        ) : (
          <ul className="space-y-3">
            {list.map((doc) => (
              <li key={doc.id}>
                <Card
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => loadDocument(doc.id)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium truncate">{doc.title || doc.source_filename}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {doc.language_detected ? (
                            <Badge variant="outline">{doc.language_detected}</Badge>
                          ) : null}
                          <span>{formatDateSafe(doc.created_at)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{doc.summary}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {loadingDoc === doc.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
