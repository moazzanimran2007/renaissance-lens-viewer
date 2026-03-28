import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  onReset: () => void;
}

const ErrorState = ({ message, onRetry, onReset }: ErrorStateProps) => {
  return (
    <div className="min-h-screen parchment-texture flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h2 className="font-display text-3xl text-walnut mb-4">
          Analysis Failed
        </h2>
        <p className="font-body text-muted-foreground mb-8 leading-relaxed">
          {message}
        </p>
        <div className="flex flex-col items-center gap-3">
          <Button variant="renaissance" onClick={onRetry}>
            Try Again
          </Button>
          <button
            onClick={onReset}
            className="font-body text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Upload a different painting
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
