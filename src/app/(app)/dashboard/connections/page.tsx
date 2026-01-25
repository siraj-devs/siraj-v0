import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from("ft_connections").select("*");
  const connections: {
    id: number;
    login: string;
    name: string;
    avatar: string | null;
    access_at: string | null;
    authorized_at: string | null;
  }[] = data ?? [];
  connections.sort((a, b) => {
    const dateA = a.access_at ? new Date(a.access_at).getTime() : 0;
    const dateB = b.access_at ? new Date(b.access_at).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div
      dir="ltr"
      className="p-4 grid container mx-auto grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {connections.map((connection) => (
        <div
          key={connection.id}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition duration-300 ease-in-out hover:border-indigo-400 hover:shadow-xl"
        >
          <div className="flex items-center gap-2 p-4">
            {/* Avatar Area */}
            <Link
              href={`https://profile.intra.42.fr/users/${connection.login}`}
              target="_blank"
              className="shrink-0"
            >
              {/* Using a larger size for the card view for impact */}
              <Image
                src={connection.avatar ?? "/avatar.jpeg"}
                alt={`${connection.name}'s Avatar`}
                width={48}
                height={48}
                className="rounded-full border-4 border-indigo-500/50 shadow-md"
              />
            </Link>

            {/* User Info Area */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-bold text-gray-900">
                {connection.name}
              </h3>
              <p className="truncate text-sm text-gray-600">
                @{connection.login}
              </p>
            </div>
          </div>

          {/* Timestamp Details */}
          <div className="border-t border-gray-100 p-4">
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              {/* Last Access */}
              <div>
                <dt className="font-medium text-gray-500">Access at</dt>
                <dd className="mt-1 text-gray-900">
                  {connection.access_at
                    ? new Date(connection.access_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </dd>
              </div>

              {/* Authorized At */}
              <div>
                <dt className="font-medium text-gray-500">Authorized at</dt>
                <dd className="mt-1 text-gray-900">
                  {connection.authorized_at
                    ? new Date(connection.authorized_at).toLocaleString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )
                    : "N/A"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ))}
    </div>
  );
}
