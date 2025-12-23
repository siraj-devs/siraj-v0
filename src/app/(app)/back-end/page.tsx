import Link from "next/link";

export default function BackEndPage() {
  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-20 py-40">
          <h1 className="font-kufam text-4xl font-medium text-foreground">
            قادم قريباً...
          </h1>
          <div className="flex flex-wrap justify-center gap-5 text-xl md:gap-25">
            <Link
              href="/back-end/evenings"
              className="text-foreground transition-colors hover:text-primary"
            >
              الأمسيات
            </Link>
            <Link
              href="/back-end/tasks"
              className="text-foreground transition-colors hover:text-primary"
            >
              المهام
            </Link>
            <Link
              href="/back-end/teams"
              className="text-foreground transition-colors hover:text-primary"
            >
              الفرق
            </Link>
            <Link
              href="/back-end/members"
              className="text-foreground transition-colors hover:text-primary"
            >
              الأعضاء
            </Link>
            <Link
              href="/back-end/meetings"
              className="text-foreground transition-colors hover:text-primary"
            >
              اللقاءات
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
