import { getMyMemberProfile } from "@/app/actions/profiles";
import { ProfileForm } from "@/components/courses/profile-form";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    linked?: string;
    link_error?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/profile");

  const { member, pendingRequest, complete, ftConnection, dcConnection } =
    await getMyMemberProfile();
  const params = await searchParams;
  const redirectTo =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : undefined;

  return (
    <div className="py-10 pb-16 md:py-14">
      <ProfileForm
        member={member}
        pendingRequest={pendingRequest}
        complete={complete}
        ftConnection={ftConnection}
        dcConnection={dcConnection}
        sessionProvider={session.provider === "discord" ? "discord" : "42"}
        redirectTo={redirectTo}
        linkedProvider={
          params.linked === "42" || params.linked === "discord"
            ? params.linked
            : undefined
        }
        linkError={params.link_error}
      />
    </div>
  );
}
