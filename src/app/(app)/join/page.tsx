import { JoinForm } from "@/components/join-form";
import { Button } from "@/components/ui/button";
import { checkFormCompletionStatus } from "@/lib/form-status";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
  const formStatus = await checkFormCompletionStatus();
  const session = await getSession();
  // // If user is not logged in, redirect to login
  if (!formStatus.isLoggedIn) redirect("/login");
  // // If user has already submitted the form, redirect to success page
  if (formStatus.hasSubmittedForm)
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <h1 className="mb-6 font-kufam text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
          شكراً لتقديمك!
        </h1>

        <p className="mb-10 text-base leading-relaxed text-foreground/70 md:text-lg">
          سنتواصل معك قريباً بعد مراجعة طلبك بإذن الله.
        </p>

        <Link href="/">
          <Button>الرجوع إلى الرئيسية</Button>
        </Link>
      </div>
    );

  return <JoinForm userData={session?.user} />;
}
