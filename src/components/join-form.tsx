"use client";

import { submitJoinForm } from "@/app/actions/submit-form";
import DecorativeLines from "@/components/DecorativeLines";
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
import { useState } from "react";
import { toast } from "sonner";

interface UserData {
  id: string;
  name: string;
  email?: string;
  login: string;
  image?: string | null;
}

// Shared section-divider heading used for every form section
function SectionHeading({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative min-w-0 flex-1">
        <div className="h-px bg-border" />
        <div className="absolute top-1/2 left-0 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
      </div>
      <h2
        className={`px-2 font-kufam font-medium text-foreground/80 ${
          required
            ? "after:mr-1 after:text-base after:text-destructive after:content-['*']"
            : ""
        }`}
      >
        {label}
      </h2>
      <div className="relative min-w-0 flex-1">
        <div className="h-px bg-border" />
        <div className="absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-border bg-background" />
      </div>
    </div>
  );
}

export function JoinForm({ userData }: { userData?: UserData }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [team, setTeam] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [about, setAbout] = useState("");
  const [availability, setavailability] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleArabicNameChange = (value: string) => {
    if (
      /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]*$/.test(
        value,
      )
    ) {
      setName(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (
      !userData?.id ||
      !trimmedName ||
      !email ||
      !team ||
      skills.length === 0 ||
      !about
    ) {
      toast.error("يرجى ملء جميع الحقول الإلزامية");
      return;
    }

    if (
      !/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/.test(
        trimmedName,
      )
    ) {
      toast.error("الاسم الكامل يجب أن يكون بالعربية فقط");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitJoinForm({
        name: trimmedName,
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
        router.refresh();
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
    <div className="mx-auto w-full max-w-3xl px-4 py-10 pb-16 md:py-14">
      {/* Page header — matches courses/sessions style */}
      <div className="mb-16 flex flex-col gap-4">
        <DecorativeLines
          eyebrow="إنضم إلينا"
          title="هل ترغب في أن تكون جزءًا من سراج؟"
          description="يسعدنا اهتمامك! يرجى ملء النموذج التالي حتى نتعرف عليك أكثر ونوجهك إلى الفريق الأنسب لمهاراتك واهتماماتك."
        />
        <p className="text-center text-sm text-destructive">* خانات إلزامية</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-16">
        {/* Personal Information */}
        <div className="space-y-6">
          <SectionHeading label="المعلومات الشخصية" required />

          <div className="space-y-6 rounded-2xl bg-card/30 p-6 sm:p-8">
            <div>
              <Label htmlFor="name" className="mb-2 block text-sm">
                الاسم الكامل
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleArabicNameChange(e.target.value)}
                className="bg-background py-5"
                placeholder="أحمد العلوي"
                required
                autoComplete="name"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                يُسمح فقط بالحروف العربية.
              </p>
            </div>

            <div>
              <Label htmlFor="tel" className="mb-2 block text-sm">
                رقم الهاتف
              </Label>
              <Input
                id="tel"
                type="tel"
                maxLength={10}
                value={tel}
                onChange={(e) => {
                  if (/^[0-9]*$/.test(e.target.value)) setTel(e.target.value);
                }}
                className="bg-background py-5"
                placeholder="06XX1XXX7X"
                dir="ltr"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="mb-2 block text-sm">
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background py-5"
                placeholder="ahmed@alaoui.ma"
                dir="ltr"
                required
              />
            </div>
          </div>
        </div>

        {/* Team Selection */}
        <div className="space-y-6">
          <SectionHeading label="الفريق الذي ترغب في الانضمام إليه" required />

          <div className="rounded-2xl bg-card/30 p-6 sm:p-8">
            <Select value={team} onValueChange={setTeam} required>
              <SelectTrigger className="w-full cursor-pointer flex-row-reverse bg-background py-5">
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
                <SelectItem value="development" className="cursor-pointer">
                  💻 فريق التطوير
                </SelectItem>
                <SelectItem value="undecided" className="cursor-pointer">
                  🤔 لست متأكداً من الفريق
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-6">
          <SectionHeading label="المهارات أو الأدوات التي تتقنها" required />

          <div className="rounded-2xl bg-card/30 p-6 sm:p-8">
            <TagInput
              tags={skills}
              onTagsChange={setSkills}
              placeholder="تصميم جرافيك، مونتاج فيديو..."
              maxTags={10}
              maxLength={30}
            />
          </div>
        </div>

        {/* About */}
        <div className="space-y-6">
          <SectionHeading label="نبذة مختصرة عنك، شغفك، هواياتك؟" required />

          <div className="rounded-2xl bg-card/30 p-6 sm:p-8">
            <Textarea
              value={about}
              maxLength={250}
              onChange={(e) => setAbout(e.target.value)}
              className="min-h-[150px] resize-none bg-background"
              placeholder="أحب التصميم والإبداع، أتطلع إلى تطوير مهاراتي في تجربة المستخدم..."
            />
            <p className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>شاركنا نبذة قصيرة عنك، ما يثير شغفك، وطموحاتك المستقبلية.</span>
              <span>{about.length}/250</span>
            </p>
          </div>
        </div>

        {/* Time Availability */}
        <div className="space-y-6">
          <SectionHeading label="الوقت الذي يمكنك تخصيصه أسبوعيًا؟" required />

          <div className="rounded-2xl bg-card/30 p-6 sm:p-8">
            <RadioGroup value={availability} onValueChange={setavailability}>
              {(
                [
                  { value: "less-3", label: "أقل من 3 ساعات" },
                  { value: "3-5", label: "من 3 إلى 5 ساعات" },
                  { value: "more-5", label: "أكثر من 5 ساعات" },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  htmlFor={option.value}
                  className="flex cursor-pointer items-center justify-end gap-3 rounded-xl p-3 transition-colors hover:bg-accent/50"
                >
                  <span className="text-sm text-foreground">{option.label}</span>
                  <RadioGroupItem value={option.value} id={option.value} />
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-6">
          <SectionHeading label="ملاحظات إضافية أو اقتراحات" />

          <div className="rounded-2xl bg-card/30 p-6 sm:p-8">
            <Textarea
              value={notes}
              maxLength={250}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[150px] resize-none bg-background"
              placeholder="شاركنا ملاحظاتك أو أي أفكار قد تساعدنا في تحسين تجربتك..."
            />
            <p className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>اختياري: يمكنك إضافة أي معلومات إضافية تراها مهمة</span>
              <span>{notes.length}/250</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-6">
          <p className="max-w-md text-center text-sm leading-relaxed text-muted-foreground">
            جميع المعلومات التي تقدمها سرية، وتُستخدم فقط لأغراض تقييم الانضمام،
            ولن تتم مشاركتها مع أي طرف ثالث.
          </p>
          <Button
            type="submit"
            size="lg"
            disabled={
              isSubmitting ||
              !userData?.id ||
              !availability ||
              !tel ||
              !name.trim() ||
              !email ||
              !team ||
              skills.length === 0 ||
              !about
            }
          >
            {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب"}
          </Button>
        </div>
      </form>
    </div>
  );
}
