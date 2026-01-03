import { Button } from "@/components/ui/button";
import { checkFormCompletionStatus } from "@/lib/form-status";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function Page() {
  notFound(); // Temporary disable the page

  const formStatus = await checkFormCompletionStatus();
  // If user is not logged in, redirect to login
  if (!formStatus.isLoggedIn) redirect("/login");
  // If user hasn't submitted the form yet, redirect to join page
  if (!formStatus.hasSubmittedForm) redirect("/join");

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
}
