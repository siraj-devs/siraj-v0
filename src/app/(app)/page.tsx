import Activities from "@/components/Activities";
import DecorativeLines from "@/components/DecorativeLines";
import MainContent from "@/components/Definition";
import { Hero } from "@/components/Hero";
import ProposedPrograms from "@/components/ProposedPrograms";

export default function Home() {
  return (
    <div className="flex flex-col gap-24 pb-8 md:gap-32 md:pb-12">
      <Hero />
      <section
        id="about"
        className="flex scroll-mt-24 flex-col gap-10 md:gap-14 lg:scroll-mt-28"
      >
        <DecorativeLines index={1} eyebrow="من نحن" title="التعريف" />
        <MainContent />
      </section>
      <section
        id="activities"
        className="flex scroll-mt-24 flex-col gap-10 md:gap-14 lg:scroll-mt-28"
      >
        <DecorativeLines index={2} eyebrow="ماذا نقدم" title="الأنشطة" />
        <Activities />
      </section>
      <ProposedPrograms />
    </div>
  );
}
