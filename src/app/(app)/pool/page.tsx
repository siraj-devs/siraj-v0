import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "رسالة إلى السباحين | سراج",
  description:
    "كلام من قلب student إلى قلب pooler — نصائح لـ 4 أسابيع المسبح في 1337 بنگرير",
};

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-6 font-kufam text-2xl font-semibold text-foreground md:text-3xl">
      {children}
    </h2>
  );
}

function Hadith({ children }: { children: ReactNode }) {
  return (
    <blockquote className="my-6 border-r-2 border-primary pr-5 font-amiri text-xl leading-relaxed text-foreground/90 md:text-2xl">
      {children}
    </blockquote>
  );
}

function Ayah({ ayah, surah, verse }: { ayah: string; surah: string; verse: number }) {
  return (
    <blockquote className="my-6 border-r-2 border-primary pr-5 font-amiri text-xl leading-relaxed text-foreground/90 md:text-2xl">
      ﴿ {ayah} ﴾ <span className="text-xs text-muted-foreground">[{surah}:{verse}]</span>
    </blockquote>
  );
}

function AdviceItem({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="relative pr-5 before:absolute before:top-3 before:right-0 before:size-2 before:rounded-full before:bg-primary">
      <h3 className="mb-2 font-kufam text-lg font-medium text-foreground md:text-xl">
        {title}
      </h3>
      <p className="leading-8 text-foreground/75">{children}</p>
    </li>
  );
}

const bulbs = [
  { top: "8%", left: "2%", size: 280, opacity: 0.35 },
  { top: "12%", left: "72%", size: 220, opacity: 0.28 },
  { top: "22%", left: "38%", size: 180, opacity: 0.22 },
  { top: "32%", left: "2%", size: 260, opacity: 0.3 },
  { top: "38%", left: "85%", size: 200, opacity: 0.25 },
  { top: "48%", left: "55%", size: 240, opacity: 0.27 },
  { top: "55%", left: "18%", size: 190, opacity: 0.24 },
  { top: "65%", left: "78%", size: 270, opacity: 0.32 },
  { top: "72%", left: "42%", size: 210, opacity: 0.26 },
  { top: "82%", left: "6%", size: 230, opacity: 0.29 },
  { top: "88%", left: "62%", size: 250, opacity: 0.23 },
  { top: "94%", left: "88%", size: 180, opacity: 0.2 },
];

export default function PoolPage() {
  return (
    <article className="relative overflow-hidden py-8 md:py-12">
      {/* Hero */}
      <header className="mx-auto mb-16 max-w-3xl animate-[fade-up_0.7s_ease-out] text-center md:mb-24">
        <p className="mb-6 inline-block rounded-full border border-primary/30 px-4 py-1.5 text-sm text-primary">
          لـ ex-pooler را كنشوفكم
        </p>
        <h1 className="mb-4 font-kufam text-3xl leading-snug font-bold text-foreground md:text-4xl lg:text-5xl">
          كلام من قلب student
          <span className="mt-2 block text-primary">إلى قلب pooler</span>
        </h1>
      </header>

      <div className="mx-auto max-w-2xl space-y-16 md:space-y-20">
        {/* Opening */}
        <section className="animate-[fade-up_0.8s_ease-out_0.1s_both] text-center">
          <p className="mb-8 font-amiri text-2xl text-foreground/90 md:text-3xl">
            بسم الله الرحمن الرحيم
          </p>
          <div className="space-y-5 text-start text-lg leading-8 text-foreground/80">
            <p>
              مرحبا بكم خوتي فـ 1337 ابن جرير. الحمد لله اللي وصلكم لهاد
              المرحلة، ونسأل الله أن يجعلها بداية خير عليكم فدينكم ودنياكم.
            </p>
            <p>
              هاد الرسالة قراوها بتأن حيت فيها كلام غادي يعاونكوم تدوزو هاد 4
              السيمانات ديال المسبح بما يرضي الله وبأحسن ما يمكن، إن شاء الله.
            </p>
          </div>
        </section>

        {/* Intention */}
        <section className="animate-[fade-up_0.8s_ease-out_0.15s_both]">
          <SectionTitle>الكرة غضرب البوطو وغتخرج</SectionTitle>
          <div className="space-y-5 text-lg leading-8 text-foreground/80">
            <p>
              «أي واحد ادير النية» تقدر تبان ليك هاد الجملة غي طالعة فالفيديوات
              على سي واليد، ولكن حقيقة نت كمسلم مطالب دائماً باستحضار النية قبل
              ما دير أي حاجة — فكذلك المسبح.
            </p>
            <Hadith>
              قال النبي صلى الله عليه وسلم: «إنما الأعمال بالنیات، وإنما لكل
              امرئ ما نوى»
            </Hadith>
            <p>
              فاللي جا يقرا باش ينفع راسو وينفع الأمة ديالوا، ويطلب الرزق الحلال
              — فهاد المجهود اللي غادي يدير إن شاء الله غايلقاه في ميزان حسناته.
              ولي جا لشي حاجة خرى فما يلوم إلا راسو، فكما هو معلوم الجزاء من جنس
              العمل.
            </p>
          </div>
        </section>

        {/* Energy */}
        <section className="animate-[fade-up_0.8s_ease-out_0.2s_both]">
          <SectionTitle>نتا ماشي ثلاجة</SectionTitle>
          <div className="space-y-5 text-lg leading-8 text-foreground/80">
            <p>
              هاد 4 السيمانات غادي يكونو مزيرين، وخاتحس بالعيا خصوصاً فاش اتقرب
              تسالي. ولكن ما تنساش: نت ماشي ثلاجة خدامة 24h/24h — واخا 1337 من
              هاد الناحية ثلاجة صراحة.
            </p>
            <p>
              نتا كانسان عندك واحد كمية الطاقة لي محدودة، وأنت لي كاتحكم فيها
              كفاش تستعملها. وبالتالي حسن التعامل معها هو لي غايخليك متغرقش فهاد
              المسبح.
            </p>
            <p className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4 text-foreground/85">
              خاصك ترد البال لهادشي لي غنقولك، حيت تمنيت كن شي واحد نصحني بيه
              فاش كنت pooler:
            </p>
          </div>
        </section>

        {/* Advice */}
        <section className="animate-[fade-up_0.8s_ease-out_0.25s_both]">
          <Ayah ayah="وَاسْتَعِينُواْ بِالصَّبْرِ وَالصَّلَوٰةِ وَإِنَّهَا لَكَبِيرَةٌ اِلَّا عَلى الْخَٰشِعِينَ" surah="البقرة" verse={44} />
          <ol className="mt-8 list-none space-y-8">
            <AdviceItem title="حافظ على الصلاة فوقتها">
              ماتخليوش الكود ينسيكوم الصلاة. الصلاة هي الصلة لي بينك وبين المولى
              عز وجل، وهي أساس الدين. كفاش نت كمسلم باغي الله يسهل عليك وأنت
              مضيع الحق ديالو لي هو العبادة؟ زد على ذلك، معندكش عذر أمام الله عز
              وجل حيت طريز موفرة الحرية الكاملة فالوقت — مكينش لي يهدر معاك.
              والصلاة هي لي اتعطيكوم البركة فالوقت والفهم.
            </AdviceItem>
            <AdviceItem title="الصدق وعدم الغش">
              البركة كاينة فالصدق. اللي كيغش كيغش راسو قبل الآخر، وكيمحق البركة
              من العمل ديالو — أو حتى إلا مبغيتيش تحنسر فالبوكال ههه.
            </AdviceItem>
            <AdviceItem title="حسن الخلق">
              كونوا خفاف الدم، عاونو، ماتكبّروش على حتى شي واحد. المعرفة بلا أدب
              ما تنفع بوالو.
            </AdviceItem>
            <AdviceItem title="غض البصر وحفظ اللسان">
              المكان فيه الخوت والخواتات — حافظو على الحدود ديال الله، وخليو
              التعامل بكل احترام وحياء. «ومن يتق الله يجعل له مخرجا»
            </AdviceItem>
            <AdviceItem title="الإكثار من الدعاء">
              مرة على مرة دعي الله عز وجل ايسهل عليك ما صعب.
            </AdviceItem>
          </ol>
        </section>

        {/* Greater message — Quran */}
        <section className="animate-[fade-up_0.8s_ease-out_0.32s_both]">
          <div className="space-y-5 text-lg leading-8 text-foreground/80">
            <p>
              الشباب لي وصلولكم هاد الرسائل، بغاو يقولولكم الحمد لله كاين شباب
              محب للخير وهازين الهم باش يكونوا عون وسند للغير. وكيقولوكم كيما
              قريتو هاد الرسائل وفهمتوها وقدرتو أهميتها، فكاين واحد الرسائل أعظم
              وأهم جاتنا من ربنا الرحيم سبحانه. هاد الرسائل والتوجيهات هي كلام
              الله سبحانه؛ القرآن. فمنفرطوش فيه، نقراوه ونفهموه ونتعلموه ونديرو
              به.
            </p>
            <p className="text-foreground/85">
              كيقولنا ربنا سبحانه فواحد الرسالة:
            </p>
            <Ayah ayah="یَـٰۤأَیُّهَا ٱلنَّاسُ قَدۡ جَاۤءَتۡكُم مَّوۡعِظَةࣱ مِّن رَّبِّكُمۡ وَشِفَاۤءࣱ لِّمَا فِی ٱلصُّدُورِ وَهُدࣰى وَرَحۡمَةࣱ لِّلۡمُؤۡمِنِینَ" surah="يونس" verse={57} />
          </div>
        </section>

        {/* Closing */}
        <section className="animate-[fade-up_0.8s_ease-out_0.3s_both]">
          <SectionTitle>وفي الختام</SectionTitle>
          <div className="space-y-5 text-lg leading-8 text-foreground/80">
            <p>
              هاد 4 سيمانات غادي يعلّموكم كثر من الكود — غادي يعلّموكم الصبر،
              والانضباط، والاعتماد على الله مع الأخذ بالأسباب.
            </p>
            <p>
              اسهرو ولكن متعيقوش (والصراحة القضية ممحتاجاش السهيير، لأنه اتخرج
              غير على صحتك — من الأحسن تفيق بكري أو تجي). عياو، ولكن ماتنساوش أن
              التوفيق كامل من عند الله. بذلو المجهود، وخليو النتيجة عليه سبحانه.
            </p>
          </div>
        </section>

        <footer className="animate-[fade-up_0.8s_ease-out_0.35s_both] border-t border-border pt-10 text-center">
          <p className="mb-2 font-kufam text-xl font-medium text-foreground md:text-2xl">
            وفقكم الله وسدّد خطاكم
          </p>
          <p className="mb-8 text-lg leading-relaxed text-foreground/70">
            وجعل لكم في هاذ المسبح خير وبركة
          </p>
        </footer>
      </div>
    </article>
  );
}
