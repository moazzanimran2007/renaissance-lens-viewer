

## Single Story + Q&A in Figure Thread (Still Using Assistant UI)

Yes, we'll still use Assistant UI — but instead of drip-feeding messages one by one, the full story appears as a single assistant message. Then a text input appears so you can ask follow-up questions.

### Changes

**1. New edge function: `supabase/functions/figure-chat/index.ts`**
- Accepts `{ messages, figureContext }` (label, description, biography, isRealPerson)
- System prompt: Renaissance art scholar persona with the figure's full context baked in
- Streams response via SSE using Lovable AI gateway (`google/gemini-3-flash-preview`)
- Handles 429/402 errors

**2. Rewrite `src/components/FigureThread.tsx`**
- On mount, show ONE assistant message containing the full story: intro line + historical/allegorical note + full biography — all in one message, rendered as multiple paragraphs
- No staggered reveal, no 400ms timers — everything appears immediately
- After the story message, enable the Assistant UI Composer (text input) with placeholder "Ask about {label}..."
- When user submits a question: append user message to thread, call `figure-chat` edge function with streaming, stream AI response as a new assistant message
- Keep `useExternalStoreRuntime` but manage messages array manually (pre-populated story + user/AI exchanges)
- Keep TTS controls in header (unchanged)
- Keep QuillAvatar, slide-in panel, parchment styling

**3. Update `ThreadContent`**
- Show `UserMessage` component (simple styled bubble) instead of `() => null`
- Show Composer component with parchment-themed input styling
- Composer hidden until story is loaded (brief moment)

**4. Style additions in `src/index.css`**
- User message bubble: slightly different background from assistant
- Composer input: gold border, parchment background, matching font

### Flow
```text
1. Click figure dot → panel slides in
2. Full story appears as one assistant message (immediate, no drip)
3. Text input visible at bottom: "Ask about Jesus..."
4. User types question → user message appears → AI streams scholarly answer
5. Conversation continues, full history sent each time
```

### Files
- **New:** `supabase/functions/figure-chat/index.ts`
- **Modified:** `src/components/FigureThread.tsx`, `src/index.css`

