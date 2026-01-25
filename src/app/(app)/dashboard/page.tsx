import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  const submissions: Submission[] = data ?? [];

  return (
    <div className="container mx-auto p-4">
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">
          إرساليات ({submissions?.length || 0})
        </h2>

        {submissions && submissions.length > 0 ? (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-lg border bg-gray-50 p-4"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="bg-red400 flex gap-4">
                    <Link
                      href={`https://profile.intra.42.fr/users/${submission.login}`}
                      target="_blank"
                    >
                      <Image
                        src={submission.avatar ?? "/avatar.jpeg"}
                        alt="User Avatar"
                        width={40}
                        height={40}
                        className="rounded-full border-2 border-[#0E0E0E]"
                      />
                    </Link>

                    <div className="">
                      <h3 className="text-lg font-semibold">
                        {submission.name}
                      </h3>
                      <p className="text-gray-600">@{submission.login}</p>
                      <p className="text-blue-600">{submission.email}</p>
                    </div>
                  </div>
                  <div className="bg-red400 justify-self-center">
                    <p className="text-sm text-gray-500">
                      {new Date(submission.created_at).toLocaleString("en-US", {
                        dateStyle: "long",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="justify-self-end">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        submission.email_sent
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {submission.email_sent ? "Email sent" : "Email not sent"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p>
                    <strong>الفريق:</strong> {submission.team}
                  </p>
                  <p>
                    <strong>المهارات:</strong> {submission.skills.join(", ")}
                  </p>
                  <p>
                    <strong>التوفر:</strong> {submission.availability}
                  </p>
                  <p>
                    <strong>حول:</strong> {submission.about}
                  </p>
                  {submission.notes && (
                    <p>
                      <strong>ملاحظات:</strong> {submission.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">لا توجد إرساليات بعد.</p>
        )}
      </div>
    </div>
  );
}
