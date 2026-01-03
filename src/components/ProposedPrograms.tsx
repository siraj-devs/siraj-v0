import Image from "next/image";

function ProposedProgram({
  imageSrc,
  title,
  description,
}: {
  imageSrc: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-300/50 bg-white/10 px-8 py-28 shadow-md backdrop-blur-md">
      <div className="mb-10">
        <Image
          width={900}
          height={900}
          src={imageSrc}
          alt={title}
          className="h-35 w-35 rounded-full border"
        />
      </div>
      <h2 className="mb-2 font-kufam text-3xl font-medium text-foreground">
        {title}
      </h2>
      <p className="max-w-xl text-center text-xl text-foreground/80">
        {description}
      </p>
    </div>
  );
}

export default function ProposedPrograms() {
  return (
    <>
      <div className="container px-4 lg:mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <ProposedProgram
            imageSrc="/image1.svg"
            title="البناء المنهجي"
            description="برنامج تعليمي منهجي يهدف إلى تجاوز الشتات المعرفي عبر خطة منهجية طويلة الأمد تجمع بين التأصيل الشرعي والبناء الفكري والسلوكي."
          />
          <ProposedProgram
            imageSrc="/image2.svg"
            title="صناعة عقل"
            description="صناعة عقول المصلحين عبر استنباط وبيان معالم الإصلاح من قصص الأنبياء، وقصص القرآن، والسيرة النبوية، والتجارب الإصلاحية، الأعمال الإسلامية."
          />
          <ProposedProgram
            imageSrc="/image3.svg"
            title="قادة الفكر"
            description="برنامج فكري نخبوي لقراءة ومناقشة كتب أبرز مفكري الإسلام ممن اجتمعت فيهم قوة العقل وجودة العمل. يهدف للتعرف على طريقة تحليل الواقع المعقد وتكييفه وتنزيل النصوص."
          />
          <ProposedProgram
            imageSrc="/image4.svg"
            title="التأصيل العلمي"
            description="يهدف البرنامج إلى التأصيل العلمي الأوّلي في عشرة علوم شرعية أساسية، بما يمثل لطالب العلم قاعدة يمكن له البناء عليها والارتقاء من خلالها في مدارج العلم والتحصيل."
          />
        </div>
      </div>
    </>
  );
}
