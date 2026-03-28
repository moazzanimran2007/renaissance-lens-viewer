

## Fix AI Figure Hallucination

**Problem:** The AI identifies figures it *expects* to be in the painting (e.g., Virgin Mary, John the Baptist) based on the painting's title/tradition, even when those figures aren't visible in the uploaded image — which may be a crop, partial view, or different version.

**Solution:** Update the AI prompt to strictly require only identifying figures that are **visually present** in the image.

### Changes

**`supabase/functions/analyze-painting/index.ts`** — Update the system prompt with these additions:

- Add explicit instruction: "ONLY identify figures you can actually SEE in the image. Do NOT list figures you expect to be present based on the painting's title or iconographic tradition. If the image is cropped or partial, only describe what is visible."
- Add: "For partially visible figures (e.g., only a face edge is showing), mark them but note they are partially visible."
- Add: "If you can only see 2 figures, only return 2 figures. Never fabricate or assume figures that are not visually present."

This is a prompt-only change — no UI or type changes needed.

