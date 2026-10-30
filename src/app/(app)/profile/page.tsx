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

  const {
    member,
    pendingRequest,
    complete,
    ftConnection,
    dcConnection,
    googleConnection,
  } = await getMyMemberProfile();
  const params = await searchParams;
  const redirectTo =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : undefined;

  const sessionProvider =
    session.provider === "discord"
      ? "discord"
      : session.provider === "google"
        ? "google"
        : "42";

  return (
    <div className="py-10 pb-16 md:py-14">
      <ProfileForm
        member={member}
        pendingRequest={pendingRequest}
        complete={complete}
        ftConnection={ftConnection}
        dcConnection={dcConnection}
        googleConnection={googleConnection}
        sessionProvider={sessionProvider}
        redirectTo={redirectTo}
        linkedProvider={
          params.linked === "42" ||
          params.linked === "discord" ||
          params.linked === "google"
            ? params.linked
            : undefined
        }
        linkError={params.link_error}
      />
    </div>
  );
}
