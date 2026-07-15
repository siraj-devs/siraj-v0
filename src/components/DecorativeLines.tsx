import { Rosette } from "@/components/islamic-motif";
import { toArabicIndic } from "@/lib/utils";

export default function DecorativeLines({
  title,
  index,
  eyebrow,
}: {
  title: string;
  index?: number;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {(eyebrow || index !== undefined) && (
        <span className="font-kufam text-sm text-primary/70">
          {index !== undefined && `${index} — `}
          {eyebrow}
        </span>
      )}
      <div className="flex items-center gap-3">
        <span className="h-px w-10 bg-primary/30 md:w-16" />
        <Rosette className="size-4 text-primary/50" />
        <span className="h-px w-10 bg-primary/30 md:w-16" />
      </div>
      <h2 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
    </div>
  );
}
