import DecorativeLines from "@/components/DecorativeLines";
import Image from "next/image";

const evenings = [
  {
    id: 1,
    image: "/back-end/card1.png",
    date: "01 ربيع الثاني | 24 شتنبر",
    title: "هموم الدنيا الفانية... ومصيرك يوم الغاشية",
  },
  {
    id: 2,
    image: "/back-end/card2.png",
    date: "01 ربيع الثاني | 24 شتنبر",
    title: "التحرر من التشتت",
  },
  {
    id: 3,
    image: "/back-end/card3.png",
    date: "01 ربيع الثاني | 24 شتنبر",
    title: "قل اللهم مالك الملك",
  },
  {
    id: 4,
    image: "/back-end/card4.png",
    date: "01 ربيع الثاني | 24 شتنبر",
    title: "التحرر من العادة",
  },
];

export default function Evenings() {
  return (
    <div className="flex flex-col gap-15 pb-20">
      <div className="my-10">
        <DecorativeLines title="الأمسيات" />
      </div>
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-8">
          <div className="grid grid-cols-1 items-start gap-10 px-5 md:grid-cols-2 md:gap-20">
            {evenings.map((evening) => (
              <div
                key={evening.id}
                className="flex flex-col items-center justify-center gap-5"
              >
                <Image
                  width={600}
                  height={600}
                  src={evening.image}
                  alt={evening.title}
                  className="rounded-lg"
                />
                <div className="flex flex-col items-center justify-center gap-3">
                  <h3 className="text-sm text-gray-500">{evening.date}</h3>
                  <p className="max-w-lg text-center font-kufam text-2xl font-semibold md:text-4xl">
                    {evening.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-10 flex items-center justify-center px-4">
        <button className="flex flex-row items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-400 bg-transparent px-6 py-4 transition-all duration-300 hover:border-gray-600 hover:bg-gray-50 md:px-9 md:py-6">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-600 text-xl font-light text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </span>
          <h2 className="text-xl font-medium text-gray-800 md:text-2xl">
            أمسية جديدة
          </h2>
        </button>
      </div>
    </div>
  );
}
