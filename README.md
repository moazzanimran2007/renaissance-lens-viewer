# Renaissance Lens

An interactive art guide: upload a photo of a painting and it identifies the work, explains the scene, and marks the people in it so you can click any figure to learn who they are and ask follow-up questions.

## What it does

- **Identifies the painting.** Title, artist and approximate date, plus the story, symbolism and religious or mythological context of the scene.
- **Marks the figures.** Each figure the model can actually see gets a marker on the image, with a short tooltip and a longer biography covering who they were and their role in the painting. The model is told to list only visible figures, not ones it expects from the painting's title.
- **Lets you zoom in on any area.** Click and drag to select part of the painting, and only that crop is analyzed.
- **Answers questions about a figure** in a chat thread, in the voice of an art historian.
- **Gives an audio walkthrough** read aloud with your browser's built-in voices.
- **Suggests related works:** four to six paintings by the same artist, from the same period or on the same subject.
- **Keeps a gallery** of paintings you have analyzed, so you can reopen them.

## How it works

The React front end uploads the image to Supabase Storage and saves the analysis to a Supabase Postgres table. Four Supabase Edge Functions call Google Gemini models through the Lovable AI Gateway:

| Function | Job |
| :--- | :--- |
| `analyze-painting` | Identifies the work and returns figures with positions, using structured tool output |
| `analyze-region` | Analyzes only a selected crop |
| `figure-chat` | Answers questions about one figure |
| `suggest-related` | Suggests related paintings |

## Run it

You need Node.js 18 or newer.

```bash
git clone https://github.com/moazzanimran2007/renaissance-lens-viewer.git
cd renaissance-lens-viewer
npm install
npm run dev
```

The front end connects to the Supabase project named in `.env`. To run your own backend, create a Supabase project, apply the migration in `supabase/migrations` (it creates the `paintings` table and storage bucket), deploy the functions in `supabase/functions` and set `LOVABLE_API_KEY` as a function secret.

## Tech stack

React and TypeScript on Vite, Tailwind CSS with shadcn/ui, Supabase (Postgres, Storage and Edge Functions), Google Gemini models for vision and chat, and the Web Speech API for the audio walkthrough. Built with Lovable.

## Limits

Identifications, positions and biographies come from the model and can be wrong, especially for lesser-known works or partial photos. Treat them as a starting point, not a catalog entry.
