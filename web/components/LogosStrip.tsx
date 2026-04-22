const logos = [
  "https://dummyimage.com/120x50/ddd/222&text=Smart+World",
  "https://dummyimage.com/120x50/ddd/222&text=Puri",
  "https://dummyimage.com/120x50/ddd/222&text=Conscient",
  "https://dummyimage.com/120x50/ddd/222&text=Ganga",
  "https://dummyimage.com/120x50/ddd/222&text=Shapoorji",
  "https://dummyimage.com/120x50/ddd/222&text=Adani",
  "https://dummyimage.com/120x50/ddd/222&text=Krisumi",
];

export default function LogosStrip() {
  return (
    <section className="bg-white py-8">
      <div className="container flex flex-wrap items-center justify-center gap-8 opacity-80">
        {logos.map((src, i) => (
          <img key={i} src={src} className="h-8 w-auto object-contain" alt="logo" />
        ))}
      </div>
    </section>
  );
}

