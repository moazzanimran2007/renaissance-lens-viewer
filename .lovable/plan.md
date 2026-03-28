

## Painting History & Related Works Discovery

### What You'll Get

1. **Painting Gallery** — Every painting you analyze gets saved. You can revisit any past analysis from a gallery page.
2. **Related Paintings** — After analysis, a "Related Works" section shows AI-suggested famous paintings connected by the same artist, era, subject matter, or artistic influence. These are art-historical recommendations, not limited to your uploads.

---

### Technical Plan

**1. Database: `paintings` table**

```sql
CREATE TABLE paintings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  date TEXT,
  painting_overview TEXT,
  figures JSONB,
  image_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Public read, no auth required (no user accounts in this app)
ALTER TABLE paintings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read paintings" ON paintings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert paintings" ON paintings FOR INSERT WITH CHECK (true);
```

**2. Storage: `paintings` bucket (public)**

Store uploaded images. Public bucket so images can be displayed directly via URL.

**3. Save on analysis success (`src/pages/Index.tsx`)**

After `analyze-painting` returns successfully:
- Upload the image file to the `paintings` storage bucket
- Insert a row into the `paintings` table with title, artist, date, overview, figures JSON, and the storage path
- Store the resulting `id` so we can link to it

**4. Gallery page (`src/pages/Gallery.tsx`)**

- Grid of painting thumbnails with title + artist overlay
- Click any card → navigates to `/painting/:id` which loads from DB and renders `PaintingView`
- Parchment-themed cards with gold borders matching existing design

**5. Painting detail route (`src/pages/Painting.tsx`)**

- Route `/painting/:id` — loads painting data from DB, constructs image URL from storage, renders `PaintingView`

**6. Related Works section**

- New edge function `supabase/functions/suggest-related/index.ts`
  - Takes `{ title, artist, date, paintingOverview }` 
  - AI prompt asks for 4-6 famous related paintings with: title, artist, year, a 2-sentence description of why it's related, and a relationship tag (same artist / same era / same subject / artistic influence)
  - Uses tool calling for structured output
- New component `src/components/RelatedWorks.tsx`
  - Displayed below "About This Work" on the result page
  - Cards showing title, artist, year, relationship tag, and reason
  - Called automatically after analysis completes (non-blocking)

**7. Navigation**

- Add a small "Gallery" link in the upload screen header and the painting view header
- Add route `/gallery` in `App.tsx`

### Files

| Action | File |
|--------|------|
| Migration | `paintings` table + storage bucket + RLS |
| New | `supabase/functions/suggest-related/index.ts` |
| New | `src/pages/Gallery.tsx` |
| New | `src/pages/Painting.tsx` |
| New | `src/components/RelatedWorks.tsx` |
| Modified | `src/pages/Index.tsx` — save after analysis |
| Modified | `src/components/PaintingView.tsx` — add RelatedWorks + Gallery link |
| Modified | `src/components/UploadScreen.tsx` — add Gallery link |
| Modified | `src/App.tsx` — add routes |

