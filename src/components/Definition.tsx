import { Rosette } from "@/components/islamic-motif";
import { BookOpen, Target } from "lucide-react";
import type { ReactNode } from "react";

function PrincipleColumn({
  title,
  icon,
  children,
  className = "",
}: {
  number: number;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative flex flex-col p-8 md:p-12 ${className}`}>
      <div className="mb-6 flex size-14 items-center justify-center rounded-full border border-primary/25 bg-primary/6 text-primary">
        {icon}
      </div>
      <h3 className="mb-3 font-kufam text-2xl font-medium text-foreground md:text-3xl">
        {title}
      </h3>
      <p className="leading-8 text-foreground/70 md:text-lg">{children}</p>
    </div>
  );
}

export default function Definition() {
  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-linear-to-b from-primary/5 to-transparent px-6 py-14 md:px-16 md:py-20">
        <Rosette className="pointer-events-none absolute -top-8 -right-8 size-40 text-primary/6 md:size-56" />
        <Rosette className="pointer-events-none absolute -bottom-10 -left-10 size-32 text-primary/5 md:size-44" />
        <h3 className="relative mb-6 block text-center font-kufam text-2xl font-medium text-primary/60">
          الرؤية
        </h3>
        <p className="relative mx-auto max-w-3xl text-center font-amiri text-2xl leading-loose text-foreground/85 md:text-3xl">
          إن نادي سراج هو مشروع إحياء للصلة بالله وتجديد لمعنى العبودية في حياة
          الشاب الجامعي. وُلد من شعور صادق بالمسؤولية تجاه أمة تُستضعف وواقعٍ
          يموج بالأزمات، ودافعٍ يعيد للطالب وعيه برسالته؛ رسالة الإسلام التي
          تبني الإنسان بناءً شاملا: علما يهدي، فكرا يرشد، روحا تزكّى، ونفسا
          تعمر الأرض بالخير
        </p>
      </div>

      <div className="relative grid grid-cols-1 overflow-hidden rounded-3xl border border-border/60 bg-background/60 md:grid-cols-2">
        <div
          aria-hidden
          className="absolute inset-y-8 left-1/2 hidden w-px -translate-x-1/2 bg-linear-to-b from-transparent via-primary/20 to-transparent md:block"
        />
        <PrincipleColumn
          number={1}
          title="المبدأ"
          icon={<BookOpen className="size-6" strokeWidth={1.75} />}
        >
          القرآن هو لبّ هذا المشروع؛ نعيش معه تدبّرا وتزكية ليكون محور الأنشطة.
          وتأتي السنة النبوية كمنهج تربوي بنائي وإصلاحي. كما يقوم النادي على
          رفض للانغلاق وللذوبان، وجمع بين العقل المفكر والقلب الذاكر
        </PrincipleColumn>
        <PrincipleColumn
          number={2}
          title="الهدف"
          className="border-t border-border/60 md:border-t-0"
          icon={<Target className="size-6" strokeWidth={1.75} />}
        >
          النادي تربوي علمي دعوي مجتمعي؛ يجمع بين تزكية النفس وتنمية الوعي
          وخدمة الناس بأنشطة تُترجم الإيمان إلى أثر. والانضمام إليه هو دخول في
          رحلة إيمانية وعملية، تقوم على النية المخلصة والصحبة الصالحة وصدق
          الهمة
        </PrincipleColumn>
      </div>
    </div>
  );
}
