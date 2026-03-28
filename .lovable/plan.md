

## Expanded Figure Stories + Audio Walkthrough

### What changes

**1. Richer figure descriptions from AI**

Update the edge function prompt to request much more detail per figure: full biography, historical significance, role in the painting, relationships to other figures, and relevant anecdotes. Change the `description` field from "2-3 sentences" to "3-5 rich paragraphs covering their life, significance, and role in the composition."

**Files:** `supabase/functions/analyze-painting/index.ts` (prompt + tool schema)

**2. Updated Figure type and panel UI**

- Expand the `Figure` interface: add `biography` (string, multi-paragraph) alongside the existing short `description`
- Redesign `FigurePanel` to display the full biography with paragraphs, decorative section dividers, and better typography for long-form reading

**Files:** `src/types/analysis.ts`, `src/components/FigurePanel.tsx`

**3. Audio walkthrough using browser TTS**

- Add a floating "Audio Walkthrough" button on the `PaintingView` page
- When activated, it narrates: painting title/artist → painting overview → each figure's name and biography, sequentially
- Uses the browser's built-in `SpeechSynthesis` API (no API key needed)
- Controls: Play/Pause/Stop, with a progress indicator showing which section is being read (e.g., "Reading about Virgin Mary...")
- Highlights the corresponding figure marker while its bio is being narrated
- Create a custom hook `useAudioWalkthrough` to manage the speech queue and state

**Files:** `src/hooks/useAudioWalkthrough.ts` (new), `src/components/AudioWalkthrough.tsx` (new), `src/components/PaintingView.tsx` (integrate button + active figure highlighting)

### Technical details

- **AI prompt change:** The figure description schema changes from `"2-3 sentences"` to a much longer `biography` field requesting full historical context, anecdotes, dates, and significance. The short `description` remains for the tooltip/marker hover.
- **Browser TTS:** Uses `window.speechSynthesis.speak()` with `SpeechSynthesisUtterance`. The walkthrough builds a queue of utterances (overview, then each figure) and plays them sequentially via the `onend` event. Supports pause/resume natively.
- **No new dependencies or API keys required.**

