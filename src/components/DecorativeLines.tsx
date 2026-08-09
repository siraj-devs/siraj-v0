import { Rosette } from "@/components/islamic-motif";

export default function DecorativeLines({
  title,
  index,
  eyebrow,
  description,
}: {
  title: string;
  index?: number;
  eyebrow?: string;
  description?: string;
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
      {description && (
        <p className="mx-auto max-w-2xl text-center text-base leading-8 text-foreground/65 md:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
