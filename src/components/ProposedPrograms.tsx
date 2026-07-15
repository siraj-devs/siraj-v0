import { Rosette } from "@/components/islamic-motif";
import { toArabicIndic } from "@/lib/utils";
import Image from "next/image";

function ProposedProgram({
  index,
  imageSrc,
  title,
  description,
}: {
  index: number;
  imageSrc: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-border/80 bg-background/60 px-6 py-12 text-center shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_18px_60px_-28px_color-mix(in_oklch,var(--primary)_28%,transparent)] md:px-8 md:py-14">
      <Rosette className="pointer-events-none absolute -right-6 -bottom-6 size-28 text-primary/5 transition-transform duration-500 group-hover:rotate-12" />

      <span className="mb-6 font-kufam text-sm text-primary/50">
        {toArabicIndic(index)}
      </span>

      <div className="relative mb-8">
        <div
          aria-hidden
          className="absolute inset-0 scale-125 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--primary) 35%, transparent) 0%, transparent 70%)",
          }}
        />
        <Image
          width={140}
          height={140}
          src={imageSrc}
          alt={title}
          className="relative size-28 rounded-full border border-primary/20 object-cover transition-transform duration-300 group-hover:scale-105 md:size-32"
        />
      </div>
      <h3 className="relative mb-3 font-kufam text-2xl font-medium text-foreground md:text-3xl">
        {title}
      </h3>
      <p className="relative max-w-sm text-base leading-8 text-foreground/70 md:text-lg">
        {description}
      </p>
    </div>
  );
}

const programs = [
  {
    imageSrc: "/image1.svg",
    title: "البناء المنهجي",
    description:
      "برنامج تعليمي منهجي يهدف إلى تجاوز الشتات المعرفي عبر خطة منهجية طويلة الأمد تجمع بين التأصيل الشرعي والبناء الفكري والسلوكي.",
  },
  {
    imageSrc: "/image1.svg",
    title: "صناعة عقل",
    description:
      "صناعة عقول المصلحين عبر استنباط وبيان معالم الإصلاح من قصص الأنبياء، وقصص القرآن، والسيرة النبوية، والتجارب الإصلاحية، الأعمال الإسلامية.",
  },
  {
    imageSrc: "/image4.svg",
    title: "قادة الفكر",
    description:
      "برنامج فكري نخبوي لقراءة ومناقشة كتب أبرز مفكري الإسلام ممن اجتمعت فيهم قوة العقل وجودة العمل. يهدف للتعرف على طريقة تحليل الواقع المعقد وتكييفه وتنزيل النصوص.",
  },
  {
    imageSrc: "/image4.svg",
    title: "التأصيل العلمي",
    description:
      "يهدف البرنامج إلى التأصيل العلمي الأوّلي في عشرة علوم شرعية أساسية، بما يمثل لطالب العلم قاعدة يمكن له البناء عليها والارتقاء من خلالها في مدارج العلم والتحصيل.",
  },
];

export default function ProposedPrograms() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
      {programs.map((program, i) => (
        <ProposedProgram key={program.title} index={i + 1} {...program} />
      ))}
    </div>
  );
}
