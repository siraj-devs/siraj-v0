import Image from "next/image";

export default function Page() {
  return (
    <main className="container mx-auto mt-[73px] flex min-h-[90vh] flex-col items-center justify-center py-8 text-center">
      <div
        className="aspect-square"
        style={{ position: "relative", width: "25%" }}
      >
        <Image
          src="/construction.png"
          alt="Responsive image"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
        />
      </div>

      <h1 className="mb-6 font-kufam text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
        الموقع تحت الصيانة
      </h1>

      <p className="mb-10 text-base leading-relaxed text-foreground/70 md:text-lg">
        نعتذر عن الإزعاج، نحن نقوم حالياً بأعمال صيانة على الموقع. الرجاء العودة
        لاحقاً.
      </p>
    </main>
  );
}
