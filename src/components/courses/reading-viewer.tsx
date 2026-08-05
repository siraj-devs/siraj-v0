import { pdfEmbedUrl } from "@/lib/course-types";
import { BookOpen, ExternalLink } from "lucide-react";

export function ReadingViewer({ title, url }: { title: string; url: string }) {
  const embed = pdfEmbedUrl(url);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 shrink-0 text-primary" />
          <h2 className="font-kufam text-xl text-foreground">{title}</h2>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-xs text-foreground/70 transition hover:border-primary/40 hover:text-primary"
        >
          <ExternalLink className="size-3.5" />
          فتح المصدر
        </a>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
        <iframe src={embed} title={title} className="h-[70vh] w-full" />
      </div>
    </div>
  );
}
