import { useState, useCallback, useRef, useEffect } from "react";
import { AnalysisResult } from "@/types/analysis";

export type WalkthroughState = "idle" | "playing" | "paused";

interface WalkthroughSection {
  type: "intro" | "overview" | "figure";
  label: string;
  text: string;
  figureIndex?: number;
}

export function useAudioWalkthrough(analysis: AnalysisResult) {
  const [state, setState] = useState<WalkthroughState>("idle");
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [activeFigureIndex, setActiveFigureIndex] = useState<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sectionsRef = useRef<WalkthroughSection[]>([]);

  // Build sections
  useEffect(() => {
    const sections: WalkthroughSection[] = [
      {
        type: "intro",
        label: `${analysis.title}`,
        text: `${analysis.title}, by ${analysis.artist}, circa ${analysis.date}.`,
      },
      {
        type: "overview",
        label: "About This Work",
        text: analysis.paintingOverview.replace(/\n\n/g, " "),
      },
      ...analysis.figures.map((fig, i) => ({
        type: "figure" as const,
        label: fig.label,
        text: `${fig.label}. ${(fig.biography || fig.description).replace(/\n\n/g, " ")}`,
        figureIndex: i,
      })),
    ];
    sectionsRef.current = sections;
  }, [analysis]);

  const speakSection = useCallback((index: number) => {
    const sections = sectionsRef.current;
    if (index >= sections.length) {
      setState("idle");
      setCurrentSectionIndex(0);
      setActiveFigureIndex(null);
      return;
    }

    const section = sections[index];
    setCurrentSectionIndex(index);
    setActiveFigureIndex(section.figureIndex ?? null);

    const utterance = new SpeechSynthesisUtterance(section.text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => speakSection(index + 1);
    utterance.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") {
        speakSection(index + 1);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const play = useCallback(() => {
    if (state === "paused") {
      window.speechSynthesis.resume();
      setState("playing");
    } else {
      window.speechSynthesis.cancel();
      setState("playing");
      speakSection(0);
    }
  }, [state, speakSection]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setState("paused");
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setState("idle");
    setCurrentSectionIndex(0);
    setActiveFigureIndex(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const currentLabel = sectionsRef.current[currentSectionIndex]?.label || "";
  const totalSections = sectionsRef.current.length;

  return {
    state,
    currentLabel,
    currentSectionIndex,
    totalSections,
    activeFigureIndex,
    play,
    pause,
    stop,
  };
}
