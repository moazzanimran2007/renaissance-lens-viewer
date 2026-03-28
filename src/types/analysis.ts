export interface Figure {
  label: string;
  description: string;
  isRealPerson: boolean;
  position: { x: number; y: number };
}

export interface AnalysisResult {
  title: string;
  artist: string;
  date: string;
  paintingOverview: string;
  figures: Figure[];
}
