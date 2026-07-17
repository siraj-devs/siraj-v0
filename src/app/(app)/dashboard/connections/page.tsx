import {
  ConnectionsManager,
  type DcConnectionRow,
  type FtConnectionRow,
} from "@/components/connections-manager";
import { createClient } from "@/lib/supabase/server";

export default async function ConnectionsPage() {
  const supabase = await createClient();

  const [{ data: ftData }, { data: dcData }] = await Promise.all([
    supabase
      .from("ft_connections")
      .select("id, login, name, avatar, access_at, authorized_at"),
    supabase
      .from("dc_connections")
      .select("id, username, email, avatar, access_at, authorized_at"),
  ]);

  const ftConnections = (ftData ?? []) as FtConnectionRow[];
  const dcConnections = (dcData ?? []) as DcConnectionRow[];

  return (
    <div className="py-6 md:py-10">
      <ConnectionsManager
        ftConnections={ftConnections}
        dcConnections={dcConnections}
      />
    </div>
  );
}
