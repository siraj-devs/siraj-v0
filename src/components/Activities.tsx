import { BookOpenIcon, HandCoinsIcon, MoonStarsIcon, TrophyIcon } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";

function ActivityCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="group flex flex-col items-center rounded-t-[6rem] rounded-b-2xl border border-border/70 bg-background/60 px-6 pt-16 pb-10 text-center shadow-[0_4px_24px_-16px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_18px_60px_-28px_color-mix(in_oklch,var(--primary)_28%,transparent)]">
      <div className="mb-8 transition-transform duration-300 group-hover:scale-105">
        <div className="relative size-16">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M32 0L40.1581 6.89211L50.8091 6.11146L53.358 16.4825L62.4338 22.1115L58.4 32L62.4338 41.8885L53.358 47.5175L50.8091 57.8885L40.1581 57.1079L32 64L23.842 57.1079L13.1909 57.8885L10.642 47.5175L1.56619 41.8885L5.6 32L1.56619 22.1115L10.642 16.4825L13.1909 6.11146L23.842 6.89211L32 0Z"
              fill="#F3B610"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 [&_svg]:size-full [&_svg]:fill-white">
            {icon}
          </div>
        </div>
      </div>
      <h3 className="mb-3 font-kufam text-xl font-medium text-foreground md:text-2xl">
        {title}
      </h3>
      <p className="max-w-xs text-base leading-8 text-foreground/70 md:text-lg">
        {description}
      </p>
    </div>
  );
}

const ACTIVITIES = [
  {
    title: "أمسيات تربوية",
    description:
      "عقد مجالس ولقاءات أسبوعية مخصصة لتدارس آيات الذكر الحكيم وأحاديث النبي عليه الصلاة والسلام بهدف تعزيز الوعي.",
      icon: <MoonStarsIcon weight="fill" />,
  },
  {
    title: "المبادرات الخيرية",
    description:
      "نتظيم حملات لجمع التبرعات لصالح مشاريع لكفالة الأيتام، أو لتوفير الماء عبر حفر الآبار، أو لترميم وإصلاح مدارس بالقرى.",
    icon: <HandCoinsIcon weight="fill" />,
  },
  {
    title: "حلق القرآن",
    description:
      "الإشراف على حلقات منتظمة لتحفيظ القرآن الكريم، مع التركيز على إتقان أحكام التجويد.",
    icon: <BookOpenIcon weight="fill" />,
  },
  {
    title: "المسابقات القرآنية",
    description:
      "إقامة مسابقات بين الطلبة في تلاوة القرآن الكريم، حيث نكتشف الأصوات ونكرم أهل القرآن",
    icon: <TrophyIcon weight="fill" />,
  },
];

export default function Activities() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {ACTIVITIES.map((activity) => (
        <ActivityCard
          key={activity.title}
          title={activity.title}
          description={activity.description}
          icon={activity.icon}
        />
      ))}
    </div>
  );
}
