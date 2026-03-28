import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";

interface PaintingRow {
  id: string;
  title: string;
  artist: string;
  date: string | null;
  image_path: string;
  created_at: string;
}

const Gallery = () => {
  const [paintings, setPaintings] = useState<PaintingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("paintings")
        .select("id, title, artist, date, image_path, created_at")
        .order("created_at", { ascending: false });
      if (data) setPaintings(data);
      setLoading(false);
    };
    load();
  }, []);

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from("paintings").getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="min-h-screen parchment-texture">
      <header className="text-center pt-10 pb-8 px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Upload
        </Link>
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-walnut">
          Gallery
        </h1>
        <p className="font-body text-muted-foreground mt-2 text-sm italic">
          Your analyzed paintings
        </p>
      </header>

      <div className="max-w-5xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : paintings.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-16 h-16 text-gold/40 mx-auto mb-4" />
            <p className="font-body text-muted-foreground">
              No paintings analyzed yet.{" "}
              <Link to="/" className="text-gold underline underline-offset-4 hover:text-walnut">
                Upload one
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paintings.map((p) => (
              <Link
                key={p.id}
                to={`/painting/${p.id}`}
                className="group gold-border rounded-lg overflow-hidden bg-parchment/60 hover:shadow-lg transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={getImageUrl(p.image_path)}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold text-walnut truncate">
                    {p.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    {p.artist}{p.date ? ` · ${p.date}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
