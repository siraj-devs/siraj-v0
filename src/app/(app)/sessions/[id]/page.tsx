import { getPublishedSessionById } from "@/app/actions/sessions";
import { Rosette } from "@/components/islamic-motif";
import { formatSessionDueDate } from "@/lib/session-date";
import { has42ConnectionAccess } from "@/lib/sessions-access";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { CalendarDays, Clapperboard } from "lucide-react";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await has42ConnectionAccess())) redirect("/login");

  const { id } = await params;
  const session = await getPublishedSessionById(id);
  if (!session) notFound();

  const embed = youtubeEmbedUrl(session.record_link);

  return (
    <article className="flex w-full flex-col gap-8 py-10 pb-16 md:gap-10 md:py-14">
      <div className="space-y-4 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {formatSessionDueDate(session.due_date)}
          </span>
          {session.series && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
              <Clapperboard className="size-3" />
              {session.series.name}
            </span>
          )}
        </div>

        <h1 className="font-kufam text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          {session.title}
        </h1>
      </div>

      <div className="w-full overflow-hidden rounded-3xl border border-border/70 bg-background/80 p-3 shadow-[0_8px_40px_-24px_color-mix(in_oklch,var(--foreground)_12%,transparent)]">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted/12">
          {embed ? (
            <iframe
              src={embed}
              title={session.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 size-full border-0"
            />
          ) : session.thumbnail ? (
            <Image
              src={session.thumbnail}
              alt={session.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-linear-to-b from-primary/5 to-primary/2 text-primary/35">
              <Rosette className="size-20" />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
