import { redirect } from "next/navigation";

export default function BackEndMeetingsRedirect() {
  redirect("/dashboard/meetings");
}
