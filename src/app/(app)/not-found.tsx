import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
      <div className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="container mx-auto max-w-2xl text-center">
          {/* Success Message */}
          <h1 className="mb-4 font-kufam text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            خطأ 404
          </h1>

          <p className="mb-10 text-base leading-relaxed text-foreground/70 md:text-lg">
            الصفحة التي تبحث عنها غير موجودة.
          </p>

          {/* Return Button */}
          <Link href="/">
            <Button>الرجوع إلى الرئيسية</Button>
          </Link>
        </div>
      </div>
  );
}
