import { getProposedPrograms, type ProgramLinks } from "@/app/actions/content";
import DecorativeLines from "@/components/DecorativeLines";
import { Rosette } from "@/components/islamic-motif";
import { toArabicIndic } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z" />
    </svg>
  );
}

function IconTelegram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function IconWhatsapp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
    </svg>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function IconYoutube({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function ProgramLinksRow({ links }: { links: ProgramLinks }) {
  const items = [
    {
      key: "website",
      href: links.website,
      label: "الموقع",
      icon: <IconGlobe className="size-4" />,
    },
    {
      key: "telegram",
      href: links.telegram,
      label: "تيليجرام",
      icon: <IconTelegram className="size-4" />,
    },
    {
      key: "whatsapp",
      href: links.whatsapp,
      label: "واتساب",
      icon: <IconWhatsapp className="size-4" />,
    },
    {
      key: "instagram",
      href: links.instagram,
      label: "إنستغرام",
      icon: <IconInstagram className="size-4" />,
    },
    {
      key: "facebook",
      href: links.facebook,
      label: "فيسبوك",
      icon: <IconFacebook className="size-4" />,
    },
    {
      key: "twitter",
      href: links.twitter,
      label: "X",
      icon: <IconX className="size-4" />,
    },
    {
      key: "youtube",
      href: links.youtube,
      label: "يوتيوب",
      icon: <IconYoutube className="size-4" />,
    },
  ].flatMap((item) => {
    const href = item.href;
    if (!href) return [];
    return [{ key: item.key, label: item.label, icon: item.icon, href }];
  });

  if (items.length === 0) return null;

  return (
    <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          title={item.label}
          className="flex size-9 items-center justify-center rounded-full border border-border/80 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        >
          {item.icon}
        </Link>
      ))}
    </div>
  );
}

function ProposedProgramCard({
  index,
  imageSrc,
  title,
  description,
  links,
}: {
  index: number;
  imageSrc: string | null;
  title: string;
  description: string;
  links: ProgramLinks;
}) {
  return (
    <div className="group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-border/80 bg-background/60 px-6 py-12 text-center shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_18px_60px_-28px_color-mix(in_oklch,var(--primary)_28%,transparent)] md:px-8 md:py-14">
      <Rosette className="pointer-events-none absolute -right-6 -bottom-6 size-28 text-primary/5 transition-transform duration-500 group-hover:rotate-12" />

      <div className="relative mb-8">
        <div
          aria-hidden
          className="absolute inset-0 scale-125 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--primary) 35%, transparent) 0%, transparent 70%)",
          }}
        />
        {imageSrc ? (
          <Image
            width={140}
            height={140}
            src={imageSrc}
            alt={title}
            className="relative size-28 rounded-full border border-primary/20 object-cover transition-transform duration-300 group-hover:scale-105 md:size-32"
          />
        ) : (
          <div className="relative flex size-28 items-center justify-center rounded-full border border-primary/20 bg-muted font-kufam text-2xl text-muted-foreground md:size-32">
            {toArabicIndic(index)}
          </div>
        )}
      </div>
      <h3 className="relative mb-3 font-kufam text-2xl font-medium text-foreground md:text-3xl">
        {title}
      </h3>
      <p className="relative max-w-sm text-base leading-8 text-foreground/70 md:text-lg">
        {description}
      </p>
      <ProgramLinksRow links={links} />
    </div>
  );
}

export default async function ProposedPrograms() {
  let programs: Awaited<ReturnType<typeof getProposedPrograms>> = [];
  try {
    programs = await getProposedPrograms();
  } catch (error) {
    console.error("Failed to load proposed programs:", error);
  }

  if (programs.length === 0) return null;

  return (
    <section className="flex flex-col gap-10 md:gap-14">
      <DecorativeLines index={3} eyebrow="مساراتنا" title="البرامج المقترحة" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
        {programs.map((program, i) => (
          <ProposedProgramCard
            key={program.id}
            index={i + 1}
            imageSrc={program.image}
            title={program.name}
            description={program.description}
            links={program.links}
          />
        ))}
      </div>
    </section>
  );
}
