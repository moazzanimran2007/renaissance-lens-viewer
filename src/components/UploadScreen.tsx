import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadScreenProps {
  onAnalyze: (file: File, previewUrl: string) => void;
}

const UploadScreen = ({ onAnalyze }: UploadScreenProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (!f.type.match(/^image\/(jpeg|png|webp|avif)$/) && f.type !== "application/pdf") return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  return (
    <div className="min-h-screen parchment-texture flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <h1 className="font-display text-5xl md:text-7xl font-semibold text-walnut tracking-tight mb-4">
          Renaissance Lens
        </h1>
        <p className="font-body text-lg md:text-xl text-muted-foreground mb-8 italic">
          Upload a painting. Unlock its world.
        </p>
        <Link
          to="/gallery"
          className="inline-flex items-center gap-1.5 font-body text-sm text-gold hover:text-walnut transition-colors mb-8"
        >
          <ImageIcon className="w-4 h-4" /> View Gallery
        </Link>

        {!preview ? (
          <div
            className={`gold-border rounded-lg p-16 md:p-24 cursor-pointer transition-all duration-300 ${
              isDragging
                ? "bg-gold/10 border-gold scale-[1.02]"
                : "bg-parchment-dark/50 hover:bg-gold/5"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/jpeg,image/png,image/webp,image/avif,application/pdf";
              input.onchange = (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) handleFile(f);
              };
              input.click();
            }}
          >
            <Upload className="w-12 h-12 text-gold mx-auto mb-6 opacity-60" />
            <p className="font-display text-xl text-walnut/70">
              Drag & drop a painting here
            </p>
            <p className="font-body text-sm text-muted-foreground mt-2">
              or click to browse · JPG, PNG, WEBP, AVIF, PDF
            </p>
          </div>
        ) : (
          <div className="animate-fade-up">
            <div className="gold-border rounded-lg overflow-hidden mb-8 inline-block">
              <img
                src={preview}
                alt="Uploaded painting preview"
                className="max-h-[400px] w-auto object-contain"
              />
            </div>
            <div className="flex flex-col items-center gap-4">
              <Button
                variant="renaissance"
                size="lg"
                onClick={() => file && onAnalyze(file, preview)}
              >
                Analyze Painting
              </Button>
              <button
                className="font-body text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
              >
                Choose a different image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadScreen;
