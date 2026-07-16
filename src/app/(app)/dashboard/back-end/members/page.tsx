import { redirect } from "next/navigation";

export default function BackEndMembersRedirect() {
  redirect("/dashboard/members");
}
