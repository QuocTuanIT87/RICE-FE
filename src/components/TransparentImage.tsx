import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TransparentImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  title?: string;
}

export function TransparentImage({
  src,
  alt,
  className,
  onClick,
  title,
}: TransparentImageProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Make pixels close to white transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // If pixel is near-white
        if (r > 230 && g > 230 && b > 230) {
          data[i + 3] = 0; // Alpha
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setDataUrl(canvas.toDataURL());
    };
  }, [src]);

  if (!dataUrl) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(className, "opacity-0")}
        title={title}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      className={className}
      onClick={onClick}
      title={title}
    />
  );
}
