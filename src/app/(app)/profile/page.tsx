import { getMyMemberProfile } from "@/app/actions/profiles";
import { ProfileForm } from "@/components/courses/profile-form";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/profile");

  const { member, pendingRequest, complete } = await getMyMemberProfile();
  const { next } = await searchParams;
  const redirectTo =
    next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <div className="py-10 pb-16 md:py-14">
      <ProfileForm
        member={member}
        pendingRequest={pendingRequest}
        complete={complete}
        redirectTo={redirectTo}
      />
    </div>
  );
}
