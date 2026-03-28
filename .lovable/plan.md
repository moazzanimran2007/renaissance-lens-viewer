

## Add PDF and AVIF Upload Support

**What changes:**

1. **`src/components/UploadScreen.tsx`** — Update the file type filter to accept `image/avif` and `application/pdf`, and update the label text to include "PDF, AVIF".

2. **`src/pages/Index.tsx`** — For PDF files, convert the first page to an image before sending to the AI. This requires rendering the PDF to a canvas using `pdfjs-dist`.

3. **Install `pdfjs-dist`** — For client-side PDF-to-image conversion.

4. **`supabase/functions/analyze-painting/index.ts`** — No changes needed; it already receives base64 image data.

**Flow for AVIF:** Works identically to JPG/PNG/WEBP — browsers that support AVIF will render it natively, and `FileReader.readAsDataURL` handles it.

**Flow for PDF:** 
- Load the PDF using `pdfjs-dist`
- Render page 1 to a canvas
- Convert canvas to base64 PNG
- Send that to the edge function as usual
- Preview shows the rendered first page

**Files modified:** `UploadScreen.tsx`, `Index.tsx`, `package.json`

