import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  imageSrc: string;
  open: boolean;
  onClose: () => void;
  onCrop: (file: File) => void;
}

async function getCroppedFile(imageSrc: string, pixelCrop: Area): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const size = Math.min(pixelCrop.width, 1000);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No canvas context"));
        return;
      }
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        size,
        size,
      );
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          resolve(new File([blob], "cover.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92,
      );
    };
    image.onerror = () => reject(new Error("Image load failed"));
    image.src = imageSrc;
  });
}

export function CoverCropDialog({ imageSrc, open, onClose, onCrop }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const file = await getCroppedFile(imageSrc, croppedAreaPixels);
      onCrop(file);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-surface ring-border sm:max-w-md p-8 gap-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">Recadrer la cover</DialogTitle>
        </DialogHeader>
        <div className="relative w-full aspect-square rounded-md overflow-hidden bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
            aria-valuetext={`${zoom.toFixed(2)}×`}
            className="w-full accent-accent"
          />
          <p className="text-xs text-muted-foreground text-center">
            Glisser pour repositionner · slider pour zoomer
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleApply} disabled={isProcessing}>
            {isProcessing ? "Traitement…" : "Appliquer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
