import { useState, useEffect, useCallback, useRef } from "react";
import { X, Volume2, Pause, Square, Send } from "lucide-react";
import { Figure } from "@/types/analysis";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  ThreadPrimitive,
  MessagePrimitive,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { toast } from "sonner";

interface FigureThreadProps {
  figure: Figure;
  onClose: () => void;
  voice: SpeechSynthesisVoice | null;
  voices: SpeechSynthesisVoice[];
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
}

type PlayState = "idle" | "playing" | "paused";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/figure-chat`;

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

function buildStoryText(figure: Figure): string {
  const parts: string[] = [];
  parts.push(`**${figure.label}** — ${figure.description}`);
  parts.push(
    figure.isRealPerson
      ? `This is a **historical person** — a real figure from history whose life and deeds have been recorded across centuries of scholarship.`
      : `This is an **allegorical figure** — a symbolic representation embodying an idea, virtue, or concept rather than a specific historical individual.`
  );
  if (figure.biography) {
    parts.push(figure.biography);
  }
  return parts.join("\n\n");
}

const AssistantMessage = () => (
  <MessagePrimitive.Root className="aui-message">
    <QuillAvatar />
    <div className="aui-message-content">
      <MessagePrimitive.Content
        components={{
          Text: ({ text }) => (
            <div className="font-body text-foreground leading-[1.85] text-[15px]">
              {text.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  className="mb-3 last:mb-0"
                  dangerouslySetInnerHTML={{
                    __html: para.replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong class="text-walnut">$1</strong>'
                    ),
                  }}
                />
              ))}
            </div>
          ),
        }}
      />
    </div>
  </MessagePrimitive.Root>
);

const UserMessage = () => (
  <MessagePrimitive.Root className="aui-user-message">
    <div className="aui-user-message-content">
      <MessagePrimitive.Content
        components={{
          Text: ({ text }) => (
            <p className="font-body text-foreground text-[15px]">{text}</p>
          ),
        }}
      />
    </div>
  </MessagePrimitive.Root>
);

function ThreadContent({ onSubmit, isStreaming, figureLabel }: {
  onSubmit: (text: string) => void;
  isStreaming: boolean;
  figureLabel: string;
}) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSubmit(trimmed);
    setInput("");
  };

  return (
    <ThreadPrimitive.Root className="aui-thread">
      <ThreadPrimitive.Viewport className="aui-thread-viewport">
        <ThreadPrimitive.Messages
          components={{
            AssistantMessage,
            UserMessage,
          }}
        />
      </ThreadPrimitive.Viewport>
      <form onSubmit={handleSubmit} className="aui-composer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${figureLabel}...`}
          className="aui-composer-input"
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="aui-composer-send"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </ThreadPrimitive.Root>
  );
}

async function streamFigureChat({
  messages,
  figureContext,
  onDelta,
  onDone,
  onError,
}: {
  messages: { role: string; content: string }[];
  figureContext: { label: string; description: string; biography: string; isRealPerson: boolean };
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, figureContext }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    const msg = body.error || `Error ${resp.status}`;
    onError(msg);
    return;
  }

  if (!resp.body) {
    onError("No response body");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        onDone();
        return;
      }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  onDone();
}

const FigureThread = ({ figure, onClose, voice, voices, onVoiceChange }: FigureThreadProps) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const streamingTextRef = useRef("");
  const msgCounterRef = useRef(0);

  // Initialize with the full story as a single assistant message
  useEffect(() => {
    const storyText = buildStoryText(figure);
    setChatMessages([{ id: "story", role: "assistant", text: storyText }]);
    setIsStreaming(false);
    streamingTextRef.current = "";
    msgCounterRef.current = 0;
  }, [figure]);

  // Convert to ThreadMessageLike
  const threadMessages: ThreadMessageLike[] = chatMessages.map((msg) => ({
    role: msg.role,
    id: msg.id,
    content: [{ type: "text" as const, text: msg.text }],
  }));

  const runtime = useExternalStoreRuntime({
    messages: threadMessages,
    isRunning: isStreaming,
    onNew: async () => {},
    convertMessage: (msg) => msg,
  });

  const handleSubmit = useCallback(
    (text: string) => {
      const userMsgId = `user-${++msgCounterRef.current}`;
      const assistantMsgId = `ai-${msgCounterRef.current}`;

      setChatMessages((prev) => [...prev, { id: userMsgId, role: "user", text }]);
      setIsStreaming(true);
      streamingTextRef.current = "";

      // Build conversation history for the API (exclude the story message)
      const apiMessages = chatMessages
        .filter((m) => m.id !== "story")
        .map((m) => ({ role: m.role, content: m.text }));
      apiMessages.push({ role: "user", content: text });

      const figureContext = {
        label: figure.label,
        description: figure.description,
        biography: figure.biography,
        isRealPerson: figure.isRealPerson,
      };

      streamFigureChat({
        messages: apiMessages,
        figureContext,
        onDelta: (delta) => {
          streamingTextRef.current += delta;
          const soFar = streamingTextRef.current;
          setChatMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.id === assistantMsgId) {
              return prev.map((m) =>
                m.id === assistantMsgId ? { ...m, text: soFar } : m
              );
            }
            return [...prev, { id: assistantMsgId, role: "assistant", text: soFar }];
          });
        },
        onDone: () => setIsStreaming(false),
        onError: (msg) => {
          setIsStreaming(false);
          toast.error(msg);
        },
      });
    },
    [chatMessages, figure]
  );

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
          <div className="flex flex-col gap-2">
            {voices.length > 1 && (
              <select
                value={voice?.name || ""}
                onChange={(e) => {
                  const v = voices.find((x) => x.name === e.target.value);
                  if (v) onVoiceChange(v);
                }}
                className="w-full text-xs font-body bg-parchment/80 border border-gold/30 rounded-sm px-2 py-1.5 text-walnut focus:outline-none focus:border-gold/60"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} {v.lang ? `(${v.lang})` : ""}
                  </option>
                ))}
              </select>
            )}
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
        </div>

        <div className="flex-1 overflow-hidden">
          <AssistantRuntimeProvider runtime={runtime}>
            <ThreadContent
              onSubmit={handleSubmit}
              isStreaming={isStreaming}
              figureLabel={figure.label}
            />
          </AssistantRuntimeProvider>
        </div>
      </div>
    </>
  );
};

export default FigureThread;
