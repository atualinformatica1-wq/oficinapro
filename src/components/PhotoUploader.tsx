import { useRef, useState } from "react";
import { Camera, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { compressImage } from "@/lib/db";

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
}

export function PhotoUploader({ photos, onChange, max = 3 }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = max - photos.length;
    const list = Array.from(files).slice(0, remaining);
    try {
      const urls = await Promise.all(list.map(compressImage));
      onChange([...photos, ...urls]);
    } catch {
      toast.error("Falha ao processar a imagem");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((p, i) => (
          <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-lg border">
            <img
              src={p}
              alt={`Foto ${i + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-150"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Button type="button" size="icon" variant="secondary" className="h-7 w-7" onClick={() => setZoom(p)}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-7 w-7"
                onClick={() => onChange(photos.filter((_, idx) => idx !== i))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Camera className="h-6 w-6" />
            <span className="text-xs">Adicionar</span>
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Até {max} fotos ({photos.length}/{max})
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Dialog open={!!zoom} onOpenChange={(o) => !o && setZoom(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">Foto ampliada</DialogTitle>
          {zoom && <img src={zoom} alt="Foto ampliada" className="max-h-[80vh] w-full rounded object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
