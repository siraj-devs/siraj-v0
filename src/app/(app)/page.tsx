import Activities from "@/components/Activities";
import DecorativeLines from "@/components/DecorativeLines";
import MainContent from "@/components/Definition";
import { Hero } from "@/components/Hero";
import ProposedPrograms from "@/components/ProposedPrograms";

export default function Home() {
  return (
    <>
      <div className="flex flex-col gap-48 pb-20">
        <Hero />
        <div className="flex flex-col gap-20">
          <DecorativeLines title="التعريف" />
          <MainContent />
        </div>
        <div className="flex flex-col gap-20" >
          <DecorativeLines title="الأنشطة" />
          <Activities />
        </div>
        <div className="flex flex-col gap-20">
          <DecorativeLines title="البرامج المقترحة" />
          <ProposedPrograms />
        </div>
      </div>
    </>
  );
}
