"use client";

import DecorativeLines from "@/components/DecorativeLines";
import { EIIcon } from "@/components/EIIcon";
import { useState } from "react";

const teams = [
  {
    id: 1,
    name: "فريق التصميم",
    numberOfMembers: "عضوين",
    memberIcons: 2,
    icon_bg: "bg-blue-500/10",
  },
  {
    id: 2,
    name: "فريق التطوير",
    numberOfMembers: "خمسة أعضاء",
    memberIcons: 10,
    icon_bg: "bg-green-500/10",
  },
  {
    id: 3,
    name: "فريق المحتوى",
    numberOfMembers: "ثلاثة أعضاء",
    memberIcons: 3,
    icon_bg: "bg-red-500/10",
  },
  {
    id: 4,
    name: "فريق التسويق",
    numberOfMembers: "أربعة أعضاء",
    memberIcons: 4,
    icon_bg: "bg-yellow-500/10",
  },
  {
    id: 5,
    name: "فريق الدعم الفني",
    numberOfMembers: "عضوين",
    memberIcons: 2,
    icon_bg: "bg-purple-500/10",
  },
  {
    id: 6,
    name: "فريق الموارد البشرية",
    numberOfMembers: "ثلاثة أعضاء",
    memberIcons: 3,
    icon_bg: "bg-pink-500/10",
  },
];

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
];

export default function Meetings() {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleEdit = (teamId: number) => {
    console.log("Edit team:", teamId);
    setOpenMenuId(null);
  };

  const handleDelete = (teamId: number) => {
    console.log("Delete team:", teamId);
    setOpenMenuId(null);
  };

  return (
    <div className="flex flex-col gap-10 pb-25">
      <div className="my-10">
        <DecorativeLines title="اللقاءات" />
      </div>
      <div className="container mx-auto flex flex-col gap-20 px-4">
        {/* Teams Grid - Responsive */}
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="group relative flex flex-col gap-5 rounded-2xl border border-gray-500/20 p-5"
            >
              {/* Three dots menu button */}
              <button
                onClick={() =>
                  setOpenMenuId(openMenuId === team.id ? null : team.id)
                }
                className="absolute top-5 left-5 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6 text-gray-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                  />
                </svg>
              </button>

              {/* Dropdown menu */}
              {openMenuId === team.id && (
                <div className="absolute top-12 left-5 z-10 w-40 rounded-lg border border-gray-200 bg-white shadow-lg">
                  <button
                    onClick={() => handleEdit(team.id)}
                    className="flex w-full items-center gap-2 px-4 py-3 text-right text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(team.id)}
                    className="flex w-full items-center gap-2 rounded-b-lg px-4 py-3 text-right text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                    حذف
                  </button>
                </div>
              )}

              <div className="flex items-center gap-5">
                <div
                  className={`h-15 w-15 flex-shrink-0 rounded-2xl p-2 ${team.icon_bg}`}
                ></div>
                <div>
                  <h2 className="text-2xl text-gray-800 md:text-3xl">
                    {team.name}
                  </h2>
                  <h3 className="text-base text-gray-500 md:text-lg">
                    {team.numberOfMembers}
                  </h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t pt-5">
                {Array.from({ length: team.memberIcons }).map((_, index) => (
                  <EIIcon key={index} className="h-15 w-15" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tasks Section - Responsive */}
        <div className="flex flex-col gap-10">
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
              {task.hasAssignee && (
                <EIIcon className="h-10 w-10 flex-shrink-0" />
              )}
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
                اجتماع جديد
              </h2>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
