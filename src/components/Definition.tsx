import { Rosette } from "@/components/islamic-motif";
import { toArabicIndic } from "@/lib/utils";
import type { ReactNode } from "react";

function PrincipleColumn({
  number,
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
      {/* <span className="mb-6 font-kufam text-sm text-primary/50">
        {toArabicIndic(number)}
      </span> */}
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
      {/* Vision — lead statement, manuscript style */}
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
          تعمر الأرض بالخير.
        </p>
      </div>

      {/* Principle & Goal — twin columns of an open manuscript */}
      <div className="relative grid grid-cols-1 overflow-hidden rounded-3xl border border-border/60 bg-background/60 md:grid-cols-2">
        <div
          aria-hidden
          className="absolute inset-y-8 left-1/2 hidden w-px -translate-x-1/2 bg-linear-to-b from-transparent via-primary/20 to-transparent md:block"
        />
        <PrincipleColumn
          number={1}
          title="المبدأ"
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M39.7357 51.9465L31.8562 43.5003L23.9767 51.9465L12.4727 51.4772L11.9999 40.6848L20.5098 32.7079L11.9999 24.8873L12.4727 13.6256L23.9767 13L31.8562 21.4462L39.7357 13L51.0821 13.6256L51.5549 24.8873L43.0451 32.7079L51.5549 40.6848L51.0821 51.4772L39.7357 51.9465Z"
                fill="currentColor"
              />
            </svg>
          }
        >
          القرآن هو لبّ هذا المشروع؛ نعيش معه تدبّرا وتزكية ليكون محور الأنشطة.
          وتأتي السنة النبوية كمنهج تربوي بنائي وإصلاحي. كما يقوم النادي على
          رفض للانغلاق وللذوبان، وجمع بين العقل المفكر والقلب الذاكر.
        </PrincipleColumn>
        <PrincipleColumn
          number={2}
          title="الهدف"
          className="border-t border-border/60 md:border-t-0"
          icon={
            <svg
              width="22"
              height="24"
              viewBox="0 0 61 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M35.4241 10.8779L36.9465 11.9551L38.8118 11.9785L44.9231 12.0566L46.886 17.8447L47.4856 19.6113L48.9797 20.7266L53.8782 24.3818L52.0647 30.2188L51.511 32L52.0647 33.7812L53.8782 39.6172L48.9797 43.2734L47.4856 44.3887L46.886 46.1553L44.9231 51.9424L38.8118 52.0215L36.9465 52.0449L35.4241 53.1221L30.4338 56.6504L25.4436 53.1221L23.9211 52.0449L22.0559 52.0215L15.9436 51.9424L13.9817 46.1553L13.3821 44.3887L11.8879 43.2734L6.98853 39.6172L8.80298 33.7812L9.35669 32L8.80298 30.2188L6.98853 24.3818L11.8879 20.7266L13.3821 19.6113L13.9817 17.8447L15.9436 12.0566L22.0559 11.9785L23.9211 11.9551L25.4436 10.8779L30.4338 7.34863L35.4241 10.8779Z"
                stroke="currentColor"
                strokeWidth="6"
              />
            </svg>
          }
        >
          النادي تربوي علمي دعوي مجتمعي؛ يجمع بين تزكية النفس وتنمية الوعي
          وخدمة الناس بأنشطة تُترجم الإيمان إلى أثر. والانضمام إليه هو دخول في
          رحلة إيمانية وعملية، تقوم على النية المخلصة والصحبة الصالحة وصدق
          الهمة.
        </PrincipleColumn>
      </div>
    </div>
  );
}
