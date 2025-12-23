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
  {
    id: 7,
    name: "فريق المبيعات",
    numberOfMembers: "خمسة أعضاء",
    memberIcons: 9,
    icon_bg: "bg-teal-500/10",
  },
  {
    id: 8,
    name: "فريق البحث والتطوير",
    numberOfMembers: "أربعة أعضاء",
    memberIcons: 4,
    icon_bg: "bg-indigo-500/10",
  },
];

export default function Teams() {
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
        <DecorativeLines title="الفرق" />
      </div>
      <div className="container mx-auto flex flex-col gap-10 px-4">
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
        <div className="mt-10 flex items-center justify-center">
          <button className="flex items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-400 bg-transparent px-6 py-4 transition-all duration-300 hover:border-gray-600 hover:bg-gray-50 md:gap-5 md:px-9 md:py-6">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-white md:h-8 md:w-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4 md:h-6 md:w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-800 md:text-2xl">
              فريق جديد
            </h2>
          </button>
        </div>
      </div>
    </div>
  );
}
