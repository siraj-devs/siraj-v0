import DecorativeLines from "@/components/DecorativeLines";
import { EIIcon } from "@/components/EIIcon";
import Image from "next/image";

const tasks = [
  {
    id: 1,
    icon: (
      <svg
        width="35"
        height="35"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="2.5"
          y="2.5"
          width="35"
          height="35"
          rx="17.5"
          stroke="#808080"
          strokeWidth="5"
          strokeDasharray="10 10"
        />
      </svg>
    ),
    description:
      "إعداد تقرير شامل يوضّح تقدم المشروع خلال الأسبوع الماضي مع مقارنة بالأهداف المخطط لها.",
    date: "الأربعاء 15 يناير بعد الزوال",
    hasAssignee: true,
  },
  {
    id: 2,
    icon: (
      <svg
        width="35"
        height="35"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="2.5"
          y="2.5"
          width="35"
          height="35"
          rx="17.5"
          stroke="#2048C8"
          strokeWidth="5"
        />
        <path
          d="M20 32C21.5759 32 23.1363 31.6896 24.5922 31.0866C26.0481 30.4835 27.371 29.5996 28.4853 28.4853C29.5996 27.371 30.4835 26.0481 31.0866 24.5922C31.6896 23.1363 32 21.5759 32 20C32 18.4241 31.6896 16.8637 31.0866 15.4078C30.4835 13.9519 29.5996 12.629 28.4853 11.5147C27.371 10.4004 26.0481 9.5165 24.5922 8.91345C23.1363 8.31039 21.5759 8 20 8L20 20L20 32Z"
          fill="#2048C8"
        />
      </svg>
    ),
    description:
      "إعداد تقرير شامل يوضّح تقدم المشروع خلال الأسبوع الماضي مع مقارنة بالأهداف المخطط لها.",
    date: "الخميس 16 يناير صباحا - الجمعة 17 يناير مساء",
    hasAssignee: false,
  },
  {
    id: 3,
    icon: (
      <svg
        width="35"
        height="35"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="20" fill="#0A900A" />
        <path
          d="M29.531 15.2807L17.531 27.2807C17.4614 27.3504 17.3787 27.4057 17.2876 27.4435C17.1966 27.4812 17.099 27.5006 17.0004 27.5006C16.9019 27.5006 16.8043 27.4812 16.7132 27.4435C16.6222 27.4057 16.5394 27.3504 16.4698 27.2807L11.2198 22.0307C11.0791 21.8899 11 21.6991 11 21.5001C11 21.301 11.0791 21.1102 11.2198 20.9694C11.3605 20.8287 11.5514 20.7496 11.7504 20.7496C11.9494 20.7496 12.1403 20.8287 12.281 20.9694L17.0004 25.6897L28.4698 14.2194C28.6105 14.0787 28.8014 13.9996 29.0004 13.9996C29.1994 13.9996 29.3903 14.0787 29.531 14.2194C29.6718 14.3602 29.7508 14.551 29.7508 14.7501C29.7508 14.9491 29.6718 15.1399 29.531 15.2807Z"
          fill="white"
        />
      </svg>
    ),
    description:
      "إعداد قائمة مفصّلة بالمتطلبات التقنية اللازمة للمرحلة القادمة من العمل.",
    date: "السبت 18 يناير صباحا",
    hasAssignee: true,
  },
  {
    id: 4,
    icon: (
      <svg
        width="35"
        height="35"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="20" fill="#90130A" />
        <path
          d="M27.281 26.2194C27.3507 26.2891 27.406 26.3718 27.4437 26.4629C27.4814 26.5539 27.5008 26.6515 27.5008 26.7501C27.5008 26.8486 27.4814 26.9462 27.4437 27.0372C27.406 27.1283 27.3507 27.211 27.281 27.2807C27.2114 27.3504 27.1286 27.4056 27.0376 27.4433C26.9465 27.4811 26.849 27.5005 26.7504 27.5005C26.6519 27.5005 26.5543 27.4811 26.4632 27.4433C26.3722 27.4056 26.2895 27.3504 26.2198 27.2807L20.0004 21.0604L13.781 27.2807C13.6403 27.4214 13.4494 27.5005 13.2504 27.5005C13.0514 27.5005 12.8605 27.4214 12.7198 27.2807C12.5791 27.1399 12.5 26.9491 12.5 26.7501C12.5 26.551 12.5791 26.3602 12.7198 26.2194L18.9401 20.0001L12.7198 13.7807C12.5791 13.6399 12.5 13.4491 12.5 13.2501C12.5 13.051 12.5791 12.8602 12.7198 12.7194C12.8605 12.5787 13.0514 12.4996 13.2504 12.4996C13.4494 12.4996 13.6403 12.5787 13.781 12.7194L20.0004 18.9397L26.2198 12.7194C26.3605 12.5787 26.5514 12.4996 26.7504 12.4996C26.9494 12.4996 27.1403 12.5787 27.281 12.7194C27.4218 12.8602 27.5008 13.051 27.5008 13.2501C27.5008 13.4491 27.4218 13.6399 27.281 13.7807L21.0607 20.0001L27.281 26.2194Z"
          fill="white"
        />
      </svg>
    ),
    description:
      "إعداد قائمة مفصّلة بالمتطلبات التقنية اللازمة للمرحلة القادمة من العمل.",
    date: "السبت 18 يناير صباحا",
    hasAssignee: true,
  },
];

export default function Tasks() {
  return (
    <div className="flex flex-col gap-10 pt-10 pb-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-17 md:flex-row md:gap-10">
          <div className="relative h-64 w-full md:h-auto md:w-1/2">
            <Image
              width={700}
              height={700}
              src="/back-end/card5.png"
              alt="هموم الدنيا الفانية... ومصيرك يوم الغاشية"
              className="rounded-lg object-cover"
            />
          </div>
          <div className="flex flex-col gap-6 md:w-1/2 md:gap-9">
            <div className="flex flex-wrap items-center gap-3 text-base md:gap-5 md:text-2xl">
              <h2 className="rounded-full bg-primary/20 px-6 py-1 md:px-12">
                الاستهداء بالسنة
              </h2>
              <h2 className="rounded-full bg-primary/20 px-6 py-1 md:px-12">
                رياض الصالحين
              </h2>
            </div>
            <h2 className="text-base text-gray-500 md:text-xl">
              01 ربيع الثاني 1447 | 24 شتنبر 2025
            </h2>
            <h1 className="font-kufam text-3xl font-semibold md:text-5xl">
              نور اليقين و التوكل على رب العالمين
            </h1>
            <div className="flex items-center gap-2">
              <h2 className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white">
                <EIIcon className="h-8 w-8" />
              </h2>
              <h2 className="text-base text-gray-500 md:text-xl">
                عبد الواحد ايت بوحسين
              </h2>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-15 pb-20">
        <div className="my-10">
          <DecorativeLines title="المهام" />
        </div>
      </div>
      <div className="container mx-auto flex flex-col gap-10 px-4 pb-20">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-col items-start gap-6 rounded-2xl bg-gray-500/10 p-6 md:flex-row md:gap-10 md:p-10"
          >
            <div className="flex-shrink-0">{task.icon}</div>
            <div className="flex flex-1 flex-col gap-4 md:gap-6">
              <p className="text-2xl md:text-4xl">{task.description}</p>
              <h2 className="text-base text-gray-500 md:text-xl">
                {task.date}
              </h2>
            </div>
            {task.hasAssignee && <EIIcon className="h-10 w-10 flex-shrink-0" />}
          </div>
        ))}
        <div className="mt-10 flex items-center justify-center">
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
              مهمة جديدة
            </h2>
          </button>
        </div>
      </div>
    </div>
  );
}
