import {
  ConnectionsManager,
  type DcConnectionRow,
  type FtConnectionRow,
  type GoogleConnectionRow,
} from "@/components/connections-manager";
import { gateDashboardPage } from "@/lib/dashboard-gate";
import { createClient } from "@/lib/supabase/server";

export default async function ConnectionsPage() {
  await gateDashboardPage("/dashboard/connections");
  const supabase = await createClient();

  const [{ data: ftData }, { data: dcData }, { data: googleData }] =
    await Promise.all([
      supabase
        .from("ft_connections")
        .select("id, login, name, avatar, access_at, authorized_at"),
      supabase
        .from("dc_connections")
        .select("id, username, email, avatar, access_at, authorized_at"),
      supabase
        .from("google_connections")
        .select("id, email, name, avatar, access_at, authorized_at"),
    ]);

  const ftConnections = (ftData ?? []) as FtConnectionRow[];
  const dcConnections = (dcData ?? []) as DcConnectionRow[];
  const googleConnections = (googleData ?? []) as GoogleConnectionRow[];

  return (
    <div className="py-6 md:py-10">
      <ConnectionsManager
        ftConnections={ftConnections}
        dcConnections={dcConnections}
        googleConnections={googleConnections}
      />
    </div>
  );
}
