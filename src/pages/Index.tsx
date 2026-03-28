import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from "pdfjs-dist";
import UploadScreen from "@/components/UploadScreen";
import LoadingState from "@/components/LoadingState";
import PaintingView from "@/components/PaintingView";
import ErrorState from "@/components/ErrorState";
import { AnalysisResult } from "@/types/analysis";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type AppState = "upload" | "loading" | "result" | "error";

const pdfToBase64Image = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/png");
};

const Index = () => {
  const [state, setState] = useState<AppState>("upload");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const analyzeImage = useCallback(async (file: File, previewUrl: string) => {
    setState("loading");
    setCurrentFile(file);

    try {
      let base64: string;

      if (file.type === "application/pdf") {
        base64 = await pdfToBase64Image(file);
        setImageUrl(base64);
      } else {
        setImageUrl(previewUrl);
        const reader = new FileReader();
        base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const { data, error } = await supabase.functions.invoke("analyze-painting", {
        body: { image: base64 },
      });

      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error || "Analysis failed");

      setAnalysis(data as AnalysisResult);
      setState("result");
    } catch (e: any) {
      console.error("Analysis error:", e);
      setErrorMsg(
        e?.message?.includes("identified")
          ? "This painting could not be identified. Try uploading a different work from the Renaissance period."
          : "Something went wrong during analysis. Please try again."
      );
      setState("error");
    }
  }, []);

  const reset = useCallback(() => {
    setState("upload");
    setImageUrl("");
    setCurrentFile(null);
    setAnalysis(null);
    setErrorMsg("");
  }, []);

  const retry = useCallback(() => {
    if (currentFile && imageUrl) {
      analyzeImage(currentFile, imageUrl);
    }
  }, [currentFile, imageUrl, analyzeImage]);

  switch (state) {
    case "upload":
      return <UploadScreen onAnalyze={analyzeImage} />;
    case "loading":
      return <LoadingState imageUrl={imageUrl} />;
    case "result":
      return analysis ? (
        <PaintingView imageUrl={imageUrl} analysis={analysis} onReset={reset} />
      ) : null;
    case "error":
      return <ErrorState message={errorMsg} onRetry={retry} onReset={reset} />;
  }
};

export default Index;
