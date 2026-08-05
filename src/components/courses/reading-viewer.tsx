import { pdfEmbedUrl } from "@/lib/course-types";

export function ReadingViewer({ title, url }: { title: string; url: string }) {
  const embed = pdfEmbedUrl(url);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-kufam text-xl text-foreground">{title}</h2>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline"
        >
          فتح المصدر
        </a>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
        <iframe
          src={embed}
          title={title}
          className="h-[70vh] w-full"
        />
      </div>
    </div>
  );
}
