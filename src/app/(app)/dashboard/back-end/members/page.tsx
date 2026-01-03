"use client";

import DecorativeLines from "@/components/DecorativeLines";
import Link from "next/link";
import { useState } from "react";

const members = [
  {
    id: 1,
    name: "مصطفى ",
    last_name: "عروة",
    role: "مشرف",
    role_color: "bg-primary/20",
    intra: "Intra 1",
    discord: "Discord 1",
  },
  {
    id: 2,
    name: "خالد ",
    last_name: "بن الوليد",
    role: "مشرف",
    role_color: "bg-primary/20",
  },
  {
    id: 3,
    name: "أبو عبيدة",
    last_name: "الجرزي",
    role: "مالك",
    role_color: "bg-red-400/20",
    intra: "Intra 3",
    discord: "Discord 3",
  },
  {
    id: 4,
    name: "سعد",
    last_name: "بن أبي وقاص",
    role: "عضو",
    role_color: "bg-lime-300/30",
    intra: "Intra 4",
  },
  {
    id: 5,
    name: "عبد الله",
    last_name: "بن رواحة",
    role: "عضو",
    role_color: "bg-lime-300/30",
    discord: "Discord 5",
  },
  {
    id: 6,
    name: "عمرو",
    last_name: "بن العاص",
    role: "عضو",
    role_color: "bg-lime-300/30",
    intra: "Intra 6",
    discord: "Discord 6",
  },
];

export default function Members() {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleEdit = (id: number) => {
    console.log("Edit member:", id);
    setOpenMenuId(null);
  };

  const handleDelete = (id: number) => {
    console.log("Delete member:", id);
    setOpenMenuId(null);
  };

  return (
    <div className="mb-20 flex flex-col gap-10">
      <div className="my-16">
        <DecorativeLines title="الأعضاء" />
      </div>
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-10">
          {members.map((member) => {
            const hasIntra = member.intra && member.intra.trim() !== "";
            const hasDiscord = member.discord && member.discord.trim() !== "";
            const hasSocialMedia = hasIntra || hasDiscord;

            return (
              <div
                key={member.id}
                className="group relative flex w-full flex-col items-center gap-5 rounded-lg border border-gray-200 px-7 py-16 sm:w-[calc(50%-20px)] lg:w-[calc(33.333%-27px)] xl:w-[calc(25%-30px)]"
              >
                {/* Three dots menu button */}
                <button
                  onClick={() =>
                    setOpenMenuId(openMenuId === member.id ? null : member.id)
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
                {openMenuId === member.id && (
                  <div className="absolute top-12 left-5 z-10 w-40 rounded-lg border border-gray-200 bg-white shadow-lg">
                    <button
                      onClick={() => handleEdit(member.id)}
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
                      onClick={() => handleDelete(member.id)}
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

                <div className="flex h-19 w-19 items-center justify-center rounded-xl bg-black text-white">
                  <span className="text-2xl font-medium">
                    {member.name.charAt(0)} {member.last_name.charAt(0)}
                  </span>
                </div>
                <h3 className="text-center text-3xl font-medium text-gray-800">
                  {member.name} {member.last_name}
                </h3>
                <span
                  className={`rounded-lg px-8 py-2 text-sm font-medium ${member.role_color} text-gray-800`}
                >
                  {member.role}
                </span>
                {hasSocialMedia && (
                  <div className="mt-4 flex gap-3">
                    {hasIntra && (
                      <Link href={`https://intra.example.com/${member.intra}`}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 32 32"
                          className="h-9 w-9 rounded-full bg-gray-200 p-2 transition hover:bg-gray-300"
                          fill="black"
                        >
                          <path
                            d="M0 0 C-1.40844718 3.21524305 -3.10344786 5.32183868 -5.625 7.75 C-6.25664062 8.36359375 -6.88828125 8.9771875 -7.5390625 9.609375 C-8.26222656 10.29773438 -8.26222656 10.29773438 -9 11 C-6.03 11.33 -3.06 11.66 0 12 C0 15.3 0 18.6 0 22 C-1.98 22 -3.96 22 -6 22 C-6 20.35 -6 18.7 -6 17 C-9.63 17 -13.26 17 -17 17 C-17.49661666 12.91805334 -17.27999708 11.38163303 -14.8046875 8.0078125 C-13.84385729 7.03114443 -12.86662639 6.07038474 -11.875 5.125 C-11.400625 4.62742187 -10.92625 4.12984375 -10.4375 3.6171875 C-6.99758485 0.23305476 -4.77122343 -0.58047525 0 0 Z"
                            transform="translate(18,4)"
                          />
                          <path
                            d="M0 0 C3.96 0 7.92 0 12 0 C12.49230769 7.38461538 12.49230769 7.38461538 10 10.5 C9.34 10.995 8.68 11.49 8 12 C8.33 12.33 8.66 12.66 9 13 C9.99 12.67 10.98 12.34 12 12 C12 13.98 12 15.96 12 18 C8.04 18 4.08 18 0 18 C-0.3125 14.8125 -0.3125 14.8125 0 11 C2.5 8.0625 2.5 8.0625 5 6 C4.67 5.67 4.34 5.34 4 5 C2.02 5.99 2.02 5.99 0 7 C0 4.69 0 2.38 0 0 Z"
                            transform="translate(19,4)"
                          />
                        </svg>
                      </Link>
                    )}
                    {hasDiscord && (
                      <Link
                        href={`https://discord.example.com/${member.discord}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-9 w-9 rounded-full bg-gray-200 p-2 transition hover:bg-gray-300"
                          viewBox="0 0 576 512"
                        >
                          <path d="M492.5 69.8c-.2-.3-.4-.6-.8-.7-38.1-17.5-78.4-30-119.7-37.1-.4-.1-.8 0-1.1 .1s-.6 .4-.8 .8c-5.5 9.9-10.5 20.2-14.9 30.6-44.6-6.8-89.9-6.8-134.4 0-4.5-10.5-9.5-20.7-15.1-30.6-.2-.3-.5-.6-.8-.8s-.7-.2-1.1-.2c-41.3 7.1-81.6 19.6-119.7 37.1-.3 .1-.6 .4-.8 .7-76.2 113.8-97.1 224.9-86.9 334.5 0 .3 .1 .5 .2 .8s.3 .4 .5 .6c44.4 32.9 94 58 146.8 74.2 .4 .1 .8 .1 1.1 0s.7-.4 .9-.7c11.3-15.4 21.4-31.8 30-48.8 .1-.2 .2-.5 .2-.8s0-.5-.1-.8-.2-.5-.4-.6-.4-.3-.7-.4c-15.8-6.1-31.2-13.4-45.9-21.9-.3-.2-.5-.4-.7-.6s-.3-.6-.3-.9 0-.6 .2-.9 .3-.5 .6-.7c3.1-2.3 6.2-4.7 9.1-7.1 .3-.2 .6-.4 .9-.4s.7 0 1 .1c96.2 43.9 200.4 43.9 295.5 0 .3-.1 .7-.2 1-.2s.7 .2 .9 .4c2.9 2.4 6 4.9 9.1 7.2 .2 .2 .4 .4 .6 .7s.2 .6 .2 .9-.1 .6-.3 .9-.4 .5-.6 .6c-14.7 8.6-30 15.9-45.9 21.8-.2 .1-.5 .2-.7 .4s-.3 .4-.4 .7-.1 .5-.1 .8 .1 .5 .2 .8c8.8 17 18.8 33.3 30 48.8 .2 .3 .6 .6 .9 .7s.8 .1 1.1 0c52.9-16.2 102.6-41.3 147.1-74.2 .2-.2 .4-.4 .5-.6s.2-.5 .2-.8c12.3-126.8-20.5-236.9-86.9-334.5zm-302 267.7c-29 0-52.8-26.6-52.8-59.2s23.4-59.2 52.8-59.2c29.7 0 53.3 26.8 52.8 59.2 0 32.7-23.4 59.2-52.8 59.2zm195.4 0c-29 0-52.8-26.6-52.8-59.2s23.4-59.2 52.8-59.2c29.7 0 53.3 26.8 52.8 59.2 0 32.7-23.2 59.2-52.8 59.2z" />
                        </svg>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-10 flex items-center justify-center">
        <button className="flex items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-gray-400 bg-transparent px-9 py-6 transition-all duration-300 hover:border-gray-600 hover:bg-gray-50">
          <div className="flex items-center justify-center rounded-full bg-gray-300 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-8 w-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-medium text-gray-800">عضو جديد</h2>
        </button>
      </div>
    </div>
  );
}
