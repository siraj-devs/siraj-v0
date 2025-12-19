import Image from "next/image";

export default function ProposedPrograms() {
  return (
    <>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex w-full flex-col gap-8">
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-300/50 bg-white/10 py-30 shadow-md backdrop-blur-md">
              <div className="mb-10">
                <Image
                  width={900}
                  height={900}
                  src="/image1.svg"
                  alt="Field Trips Icon"
                  className="h-35 w-35 rounded-full border"
                />
              </div>
              <h2 className="mb-4 font-kufam text-4xl font-medium text-foreground">
                البناء المنهجي
              </h2>
              <p className="max-w-xl text-center text-xl text-foreground/80">
                برنامج تعليمي منهجي يهدف إلى تجاوز الشتات المعرفي عبر خطة منهجية
                طويلة الأمد تجمع بين التأصيل الشرعي والبناء الفكري والسلوكي.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-300/50 bg-white/10 py-30 shadow-md backdrop-blur-md">
              <div className="mb-10">
                <Image
                  width={900}
                  height={900}
                  src="/image2.svg"
                  alt="Field Trips Icon"
                  className="h-35 w-35 rounded-full border"
                />
              </div>
              <h2 className="mb-4 font-kufam text-4xl font-medium text-foreground">
                صناعة عقل
              </h2>
              <p className="max-w-xl text-center text-xl text-foreground/80">
                صناعة عقول المصلحين عبر استنباط وبيان معالم الإصلاح من قصص
                الأنبياء، وقصص القرآن، والسيرة النبوية، والتجارب الإصلاحية،
                الأعمال الإسلامية.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-8">
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-300/50 bg-white/10 py-30 shadow-md backdrop-blur-md">
              <div className="mb-10">
                <Image
                  width={900}
                  height={900}
                  src="/image3.svg"
                  alt="Field Trips Icon"
                  className="h-35 w-35 rounded-full border"
                />
              </div>
              <h2 className="mb-4 font-kufam text-4xl font-medium text-foreground">
                قادة الفكر
              </h2>
              <p className="max-w-xl text-center text-xl text-foreground/80">
                برنامج فكري نخبوي لقراءة ومناقشة كتب أبرز مفكري الإسلام ممن
                اجتمعت فيهم قوة العقل وجودة العمل. يهدف للتعرف على طريقة تحليل
                الواقع المعقد وتكييفه وتنزيل النصوص.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-300/50 bg-white/10 py-30 shadow-md backdrop-blur-md">
              <div className="mb-10">
                <Image
                  width={900}
                  height={900}
                  src="/image4.svg"
                  alt="Field Trips Icon"
                  className="h-35 w-35 rounded-full border"
                />
              </div>
              <h2 className="mb-4 font-kufam text-4xl font-medium text-foreground">
                التأصيل العلمي
              </h2>
              <p className="max-w-xl text-center text-xl text-foreground/80">
                يهدف البرنامج إلى التأصيل العلمي الأوّلي في عشرة علوم شرعية
                أساسية، بما يمثل لطالب العلم قاعدة يمكن له البناء عليها
                والارتقاء من خلالها في مدارج العلم والتحصيل.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
