"use client";

import { submitJoinForm } from "@/app/actions/submit-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface UserData {
  id: string;
  name: string;
  email?: string;
  login: string;
  image?: string | null;
}

export function JoinForm({ userData }: { userData?: UserData }) {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [team, setTeam] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [about, setAbout] = useState("");
  const [availability, setavailability] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!userData) return;
    setLogin(userData.login ?? "");
    setName(userData.name ?? "");
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !login ||
      !name ||
      !email ||
      !team ||
      skills.length === 0 ||
      !about
    ) {
      toast.error("يرجى ملء جميع الحقول الإلزامية");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitJoinForm({
        login,
        name,
        email,
        tel,
        team,
        skills,
        about,
        availability,
        notes,
      });

      if (result.success) {
        toast.success("تم إرسال طلبك بنجاح!");
        router.push("/succ-join");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-20">
      {/* Header */}
      <div className="mb-20 text-center">
        <h1 className="mb-6 font-kufam text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
          هل ترغب في أن تكون جزءًا
          <br />
          من نادي سراج؟
        </h1>
        <p className="mb-2 text-base leading-relaxed text-muted-foreground md:text-lg lg:text-xl">
          يسعدنا اهتمامك! يرجى ملء النموذج التالي حتى نتعرف عليك أكثر
          <br />
          ونوجهك إلى الفريق الأنسب لمهاراتك واهتماماتك.
        </p>
        <p className="text-sm text-destructive">* خانات إلزامية</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-16">
        {/* Personal Information Section */}
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <div className="h-px bg-border" />
              <div className="absolute top-1/2 left-0 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
            </div>
            <h2 className="px-2 font-kufam font-medium whitespace-nowrap text-secondary-on-container after:mr-1 after:text-base after:text-destructive after:content-['*']">
              المعلومات الشخصية
            </h2>
            <div className="relative flex-1">
              <div className="h-px bg-border" />
              <div className="absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
            </div>
          </div>

          <div className="space-y-6 rounded-lg bg-card/30 p-8">
            <div>
              <Label htmlFor="login" className="mb-2 block text-right text-sm">
                اسم المدرسي:
              </Label>
              <Input
                id="login"
                value={login}
                onChange={() => {}}
                className="bg-background py-5 text-right"
                placeholder="aalaoui"
                disabled
                required
              />
            </div>

            <div>
              <Label
                htmlFor="name"
                className="mb-2 block text-right text-sm"
              >
                الاسم الكامل:
              </Label>
              <Input
                id="name"
                value={name}
                onChange={() => {}}
                className="bg-background py-5 text-right"
                placeholder="أحمد العلوي"
                disabled
                required
              />
            </div>

            <div>
              <Label htmlFor="tel" className="mb-2 block text-right text-sm">
                رقم الهاتف:
              </Label>
              <Input
                id="tel"
                type="tel"
                maxLength={10}
                value={tel}
                onChange={(e) => {
                  if (/^[0-9]*$/.test(e.target.value)) setTel(e.target.value);
                }}
                className="bg-background py-5 text-right"
                placeholder="06XX1XXX7X"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="mb-2 block text-right text-sm">
                البريد الإلكتروني:
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background py-5 text-right"
                placeholder="ahmed@alaoui.ma"
                required
              />
            </div>
          </div>
        </div>

        {/* Team Selection Section */}
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <div className="h-px bg-border" />
              <div className="absolute top-1/2 left-0 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
            </div>
            <h2 className="text--secondary px-2 font-kufam font-medium whitespace-nowrap after:mr-1 after:text-base after:text-destructive after:content-['*']">
              الفريق الذي ترغب في الانضمام إليه
            </h2>
            <div className="relative flex-1">
              <div className="h-px bg-border" />
              <div className="absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
            </div>
          </div>

          <div className="rounded-lg bg-card/30 p-8">
            <Select value={team} onValueChange={setTeam} required>
              <SelectTrigger className="w-full cursor-pointer flex-row-reverse bg-background py-5 text-right">
                <SelectValue placeholder="اختر الفريق" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="design" className="cursor-pointer">
                  🎨 فريق التصميم
                </SelectItem>
                <SelectItem value="evenings" className="cursor-pointer">
                  🌙 فريق الأمسيات
                </SelectItem>
                <SelectItem value="activities" className="cursor-pointer">
                  📅 فريق الأنشطة والفعاليات
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Skills Section */}
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <div className="h-px bg-border" />
              <div className="absolute top-1/2 left-0 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
            </div>
            <h2 className="text--secondary px-2 font-kufam font-medium whitespace-nowrap after:mr-1 after:text-base after:text-destructive after:content-['*']">
              المهارات أو الأدوات التي تتقنها
            </h2>
            <div className="relative flex-1">
              <div className="h-px bg-border" />
              <div className="absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
            </div>
          </div>

          <div className="rounded-lg bg-card/30 p-8">
            <div className="relative">
              <TagInput
                tags={skills}
                onTagsChange={setSkills}
                placeholder="تصميم جرافيك، مونتاج فيديو..."
                maxTags={10}
                maxLength={30}
              />
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <div className="h-px bg-border" />
              <div className="absolute top-1/2 left-0 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
            </div>
            <h2 className="text--secondary px-2 font-kufam font-medium whitespace-nowrap after:mr-1 after:text-base after:text-destructive after:content-['*']">
              نبذة مختصرة عنك، شغفك، هواياتك؟
            </h2>
            <div className="relative flex-1">
              <div className="h-px bg-border" />
              <div className="absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
            </div>
          </div>

          <div className="rounded-lg bg-card/30 p-8">
            <div className="relative">
              <Textarea
                value={about}
                maxLength={250}
                onChange={(e) => setAbout(e.target.value)}
                className="min-h-[150px] resize-none bg-background text-right"
                placeholder="أحب التصميم والإبداع، أتطلع مهاراتي في تجربة المستخدم..."
              />
              <p className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  شاركنا نبذة قصيرة عنك، ما يثير شغفك، وطموحاتك المستقبلية.
                </span>
                <span>250/{about.length}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Time Availability Section */}
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <div className="h-px bg-border" />
              <div className="absolute top-1/2 left-0 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
            </div>
            <h2 className="text--secondary px-2 font-kufam font-medium whitespace-nowrap after:mr-1 after:text-base after:text-destructive after:content-['*']">
              الوقت الذي يمكنك تخصيصه للنادي أسبوعيًا؟
            </h2>
            <div className="relative flex-1">
              <div className="h-px bg-border" />
              <div className="absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
            </div>
          </div>

          <div className="rounded-lg bg-card/30 p-8">
            <RadioGroup value={availability} onValueChange={setavailability}>
              <div className="flex cursor-pointer items-center justify-end gap-3 rounded-md p-3 transition-colors hover:bg-accent/50">
                <Label htmlFor="less-3" className="cursor-pointer text-sm">
                  أقل من 3 ساعات
                </Label>
                <RadioGroupItem value="less-3" id="less-3" />
              </div>
              <div className="flex cursor-pointer items-center justify-end gap-3 rounded-md p-3 transition-colors hover:bg-accent/50">
                <Label htmlFor="3-5" className="cursor-pointer text-sm">
                  من 3 إلى 5 ساعات
                </Label>
                <RadioGroupItem value="3-5" id="3-5" />
              </div>
              <div className="flex cursor-pointer items-center justify-end gap-3 rounded-md p-3 transition-colors hover:bg-accent/50">
                <Label htmlFor="more-5" className="cursor-pointer text-sm">
                  أكثر من 5 ساعات
                </Label>
                <RadioGroupItem value="more-5" id="more-5" />
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Additional Notes Section */}
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <div className="h-px bg-border" />
              <div className="absolute top-1/2 left-0 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
            </div>
            <h2 className="text--secondary px-2 font-kufam font-medium whitespace-nowrap">
              ملاحظات إضافية أو اقتراحات :
            </h2>
            <div className="relative flex-1">
              <div className="h-px bg-border" />
              <div className="absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
            </div>
          </div>

          <div className="rounded-lg bg-card/30 p-8">
            <div className="relative">
              <Textarea
                value={notes}
                maxLength={250}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[150px] resize-none bg-background text-right"
                placeholder="شاركنا ملاحظاتك أو أي أفكار قد تساعدنا في تحسينك..."
              />
              <p className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>اختياري: يمكنك إضافة أي معلومات إضافية تراها مهمة</span>
                <span>250/{notes.length}</span>
              </p>
            </div>
          </div>
        </div>

        <div>
          {/* Privacy Notice */}
          <p className="mb-6 text-center text-sm leading-relaxed text-muted-foreground">
            جميع المعلومات التي تقدمها سرية، وتُستخدم فقط لأغراض تقييم الانضمام
            للنادي، ولن تتم مشاركتها مع أي طرف ثالث.
          </p>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !login ||
                !availability ||
                !tel ||
                !name ||
                !email ||
                !team ||
                skills.length === 0 ||
                !about
              }
            >
              {isSubmitting ? "جاري الإرسال..." : "إرسال"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
