import { useEffect, useState } from "react";

const messages = [
  "Consulting the archives…",
  "Identifying figures…",
  "Tracing brushstrokes through history…",
  "Decoding symbolism and allegory…",
  "Searching for historical context…",
];

interface LoadingStateProps {
  imageUrl: string;
}

const LoadingState = ({ imageUrl }: LoadingStateProps) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink relative overflow-hidden">
      <img
        src={imageUrl}
        alt="Analyzing painting"
        className="absolute inset-0 w-full h-full object-contain"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, hsla(43, 50%, 54%, 0.35), hsla(20, 40%, 13%, 0.6))",
          animation: "golden-pulse 3s ease-in-out infinite",
        }}
      />
      <div className="relative z-10 text-center px-6">
        <div className="w-16 h-16 mx-auto mb-8 rounded-full border-2 border-gold/60 animate-pulse-gold" />
        <p
          key={msgIndex}
          className="font-display text-2xl md:text-3xl text-parchment tracking-wide"
          style={{ animation: "rotate-message 3s ease-in-out" }}
        >
          {messages[msgIndex]}
        </p>
      </div>
    </div>
  );
};

export default LoadingState;
