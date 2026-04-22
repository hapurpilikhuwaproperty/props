"use client";
import { useState } from "react";
import Image from "next/image";

export default function Lightbox({ images }: { images: { url: string; isCover?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  if (!images?.length) return null;
  return (
    <>
      <div className="grid grid-cols-2 gap-3" onClick={() => setOpen(true)}>
        {images.slice(0, 4).map((img, idx) => (
          <div key={img.url} className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer">
            <Image src={img.url} alt="gallery" fill className="object-cover" placeholder="blur" blurDataURL={img.url + "?w=10&q=10"} />
            {idx === 3 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-sm font-semibold">+{images.length - 3} more</div>
            )}
          </div>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4" onClick={() => setOpen(false)}>
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={images[active].url} alt="large" width={1600} height={900} className="w-full h-auto rounded-2xl object-contain" placeholder="blur" blurDataURL={images[active].url + '?w=10&q=10'} />
            <button className="absolute top-3 right-3 text-white text-xl" onClick={() => setOpen(false)}>×</button>
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {images.map((img, idx) => (
                <button key={img.url} onClick={() => setActive(idx)} className={`h-16 w-24 relative rounded-md overflow-hidden border ${idx === active ? 'border-brand' : 'border-transparent'}`}>
                  <Image src={img.url} alt="thumb" fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
