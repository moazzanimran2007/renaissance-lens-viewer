import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import UploadScreen from "@/components/UploadScreen";
import LoadingState from "@/components/LoadingState";
import PaintingView from "@/components/PaintingView";
import ErrorState from "@/components/ErrorState";
import { AnalysisResult } from "@/types/analysis";

type AppState = "upload" | "loading" | "result" | "error";

const Index = () => {
  const [state, setState] = useState<AppState>("upload");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const analyzeImage = useCallback(async (file: File, previewUrl: string) => {
    setImageUrl(previewUrl);
    setCurrentFile(file);
    setState("loading");

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

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
