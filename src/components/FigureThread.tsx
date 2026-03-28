import { useState, useEffect, useCallback, useRef } from "react";
import { X, Volume2, Pause, Square } from "lucide-react";
import { Figure } from "@/types/analysis";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  ThreadPrimitive,
  MessagePrimitive,
  type ThreadMessageLike,
} from "@assistant-ui/react";

interface FigureThreadProps {
  figure: Figure;
  onClose: () => void;
  voice: SpeechSynthesisVoice | null;
}

type PlayState = "idle" | "playing" | "paused";

interface StoryMessage {
  id: string;
  text: string;
}

const QuillAvatar = () => (
  <div className="aui-avatar">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-5 h-5"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20 2L4 22" strokeLinecap="round" />
      <path d="M20 2C14 4 8 10 4 22" strokeLinecap="round" />
      <path d="M20 2C18 8 12 14 4 22" strokeLinecap="round" />
      <path d="M7 17L3 21" strokeLinecap="round" />
    </svg>
  </div>
);

function buildMessages(figure: Figure): StoryMessage[] {
  const msgs: StoryMessage[] = [];

  msgs.push({
    id: "intro",
    text: `Ah, let me tell you about **${figure.label}**.\n\n${figure.description}`,
  });

  msgs.push({
    id: "type",
    text: figure.isRealPerson
      ? `This is a **historical person** — a real figure from history whose life and deeds have been recorded across centuries of scholarship.`
      : `This is an **allegorical figure** — a symbolic representation embodying an idea, virtue, or concept rather than a specific historical individual.`,
  });

  if (figure.biography) {
    const paragraphs = figure.biography.split("\n\n").filter(Boolean);
    paragraphs.forEach((para, i) => {
      msgs.push({ id: `bio-${i}`, text: para });
    });
  }

  return msgs;
}

const AssistantMessage = () => (
  <MessagePrimitive.Root className="aui-message">
    <QuillAvatar />
    <div className="aui-message-content">
      <MessagePrimitive.Content
        components={{
          Text: ({ text }) => (
            <p
              className="font-body text-foreground leading-[1.85] text-[15px]"
              dangerouslySetInnerHTML={{
                __html: text.replace(
                  /\*\*(.*?)\*\*/g,
                  '<strong class="text-walnut">$1</strong>'
                ),
              }}
            />
          ),
        }}
      />
    </div>
  </MessagePrimitive.Root>
);

function ThreadContent() {
  return (
    <ThreadPrimitive.Root className="aui-thread">
      <ThreadPrimitive.Viewport className="aui-thread-viewport">
        <ThreadPrimitive.Messages
          components={{
            AssistantMessage,
          }}
        />
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

const FigureThread = ({ figure, onClose, voice }: FigureThreadProps) => {
  const allMessages = useRef(buildMessages(figure));
  const [visibleMessages, setVisibleMessages] = useState<StoryMessage[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Stagger message reveal
  useEffect(() => {
    const msgs = buildMessages(figure);
    allMessages.current = msgs;
    setVisibleMessages([]);
    setIsRunning(true);

    let i = 0;
    const reveal = () => {
      if (i < msgs.length) {
        setVisibleMessages((prev) => [...prev, msgs[i]!]);
        i++;
        timerRef.current = setTimeout(reveal, 400);
      } else {
        setIsRunning(false);
      }
    };
    timerRef.current = setTimeout(reveal, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [figure]);

  // Convert to ThreadMessageLike
  const threadMessages: ThreadMessageLike[] = visibleMessages.map((msg) => ({
    role: "assistant" as const,
    id: msg.id,
    content: [{ type: "text" as const, text: msg.text }],
  }));

  const runtime = useExternalStoreRuntime({
    messages: threadMessages,
    isRunning,
    onNew: async () => {},
  });

  // TTS controls
  const storyText = figure.biography || figure.description;

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setPlayState("idle");
  }, []);

  const play = useCallback(() => {
    if (playState === "paused") {
      window.speechSynthesis.resume();
      setPlayState("playing");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${figure.label}. ${storyText.replace(/\n\n/g, " ")}`
    );
    utterance.rate = 0.95;
    if (voice) utterance.voice = voice;
    utterance.onend = () => setPlayState("idle");
    utterance.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") {
        setPlayState("idle");
      }
    };
    window.speechSynthesis.speak(utterance);
    setPlayState("playing");
  }, [playState, figure.label, storyText, voice]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setPlayState("paused");
  }, []);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [figure.label]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md parchment-texture gold-border border-r-0 border-t-0 border-b-0 animate-slide-in-right overflow-hidden flex flex-col">
        <div className="p-6 pb-4 border-b border-gold/20">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="font-display text-2xl font-semibold text-walnut mb-3 pr-8">
            {figure.label}
          </h2>

          <span
            className={`inline-block px-3 py-1 rounded-sm text-xs font-body font-medium tracking-wide uppercase mb-4 ${
              figure.isRealPerson
                ? "bg-gold/20 text-walnut border border-gold/40"
                : "bg-secondary text-secondary-foreground border border-border"
            }`}
          >
            {figure.isRealPerson ? "Historical Person" : "Allegorical Figure"}
          </span>

          {/* TTS Controls */}
          <div className="flex items-center gap-2">
            {playState === "idle" && (
              <button
                onClick={play}
                className="flex items-center gap-2 px-4 py-2 rounded-sm bg-gold/15 text-walnut border border-gold/30 hover:bg-gold/25 transition-colors font-body text-sm"
              >
                <Volume2 className="w-4 h-4" />
                Listen to Story
              </button>
            )}
            {playState === "playing" && (
              <>
                <button
                  onClick={pause}
                  className="flex items-center gap-2 px-4 py-2 rounded-sm bg-gold/15 text-walnut border border-gold/30 hover:bg-gold/25 transition-colors font-body text-sm"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
                <button
                  onClick={stop}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-gold/70 font-body italic ml-1 animate-pulse">
                  Reading…
                </span>
              </>
            )}
            {playState === "paused" && (
              <>
                <button
                  onClick={play}
                  className="flex items-center gap-2 px-4 py-2 rounded-sm bg-gold/15 text-walnut border border-gold/30 hover:bg-gold/25 transition-colors font-body text-sm"
                >
                  <Volume2 className="w-4 h-4" />
                  Resume
                </button>
                <button
                  onClick={stop}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-muted-foreground font-body italic ml-1">
                  Paused
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <AssistantRuntimeProvider runtime={runtime}>
            <ThreadContent />
          </AssistantRuntimeProvider>
        </div>
      </div>
    </>
  );
};

export default FigureThread;
