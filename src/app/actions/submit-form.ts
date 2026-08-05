"use server";

import {
  canManageMembers,
  getMemberForSession,
} from "@/lib/members";
import { getSession } from "@/lib/session";
import {
  getSubmissionAvailabilityLabel,
  getSubmissionTeamLabel,
  getSubmissions,
  type SubmissionRow,
} from "@/lib/submissions";
import { createClient } from "@/lib/supabase/server";
import env from "@/env";
import nodemailer from "nodemailer";

async function requireOwner() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const member = await getMemberForSession(session);
  if (!canManageMembers(member?.role)) throw new Error("غير مصرح");
  return { session, member };
}

export async function getSubmissionsForDashboard(): Promise<SubmissionRow[]> {
  await requireOwner();
  return getSubmissions();
}

export async function submitJoinForm(formData: JoinFormData) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const name = formData.name.trim();
    if (
      !/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/.test(
        name,
      )
    ) {
      return {
        success: false,
        message: "الاسم الكامل يجب أن يكون بالعربية فقط",
      };
    }

    const connectionId = session.user.id;
    const provider = session.provider ?? null;
    const connectionLabel =
      provider === "42"
        ? `@${session.user.login}`
        : session.user.login;

    const supabase = await createClient();

    const { data: submission, error: dbError } = await supabase
      .from("submissions")
      .insert({
        connection_id: connectionId,
        name,
        email: formData.email,
        tel: formData.tel,
        team: formData.team,
        skills: formData.skills,
        about: formData.about,
        availability: formData.availability,
        notes: formData.notes ?? null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      if (dbError.code === "23505") {
        return {
          success: false,
          message: "لقد قمت بإرسال طلب انضمام مسبقاً",
        };
      }
      throw new Error("Failed to store form submission in database");
    }

    const adminEmail = env.ADMIN_EMAIL;
    const smtpHost = env.SMTP_HOST;
    const smtpPort = env.SMTP_PORT;
    const smtpUser = env.SMTP_USER;
    const smtpPass = env.SMTP_PASS;

    if (!adminEmail || !smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.warn(
        "Skipping join notification email: ADMIN_EMAIL or SMTP is not configured",
      );
      return { success: true, message: "تم إرسال طلبك بنجاح" };
    }

    const providerLabel =
      provider === "42" ? "42" : provider === "discord" ? "ديسكورد" : "غير معروف";
    const teamLabel = getSubmissionTeamLabel(formData.team);
    const availabilityLabel = getSubmissionAvailabilityLabel(
      formData.availability,
    );

    const emailContent = `
طلب انضمام جديد - نادي سراج

═══════════════════════════════════
المعلومات الشخصية
═══════════════════════════════════

الاتصال: ${providerLabel} / ${connectionLabel}
معرّف الاتصال: ${connectionId}
الاسم الكامل: ${name}
البريد الإلكتروني: ${formData.email}
رقم الهاتف: ${formData.tel}

═══════════════════════════════════
معلومات الانضمام
═══════════════════════════════════

الفريق المختار: ${teamLabel}

المهارات:
${formData.skills.map((skill) => `  • ${skill}`).join("\n")}

نبذة عن المتقدم:
${formData.about}

الوقت المتاح أسبوعياً: ${availabilityLabel}

${formData.notes ? `ملاحظات إضافية:\n${formData.notes}` : "لا توجد ملاحظات إضافية"}

═══════════════════════════════════
تم الإرسال: ${new Date().toLocaleString("ar-SA", {
      timeZone: "Asia/Riyadh",
      dateStyle: "full",
      timeStyle: "short",
    })}
    `;

    const emailHTML = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #D4AF37 0%, #F4C430 100%); color: #000; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .section { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-right: 4px solid #D4AF37; }
    .section-title { color: #D4AF37; font-weight: bold; font-size: 18px; margin-bottom: 10px; border-bottom: 2px solid #D4AF37; padding-bottom: 5px; }
    .field { margin: 10px 0; }
    .field-label { font-weight: bold; color: #666; }
    .field-value { color: #333; margin-right: 10px; }
    .skills-list { list-style: none; padding: 0; }
    .skills-list li { background: #fff3cd; padding: 5px 10px; margin: 5px 0; border-radius: 4px; display: inline-block; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>طلب انضمام جديد</h1>
      <p>نادي سراج</p>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">المعلومات الشخصية</div>
        <div class="field">
          <span class="field-label">الاتصال:</span>
          <span class="field-value">${providerLabel} / ${connectionLabel}</span>
        </div>
        <div class="field">
          <span class="field-label">معرّف الاتصال:</span>
          <span class="field-value" dir="ltr">${connectionId}</span>
        </div>
        <div class="field">
          <span class="field-label">الاسم الكامل:</span>
          <span class="field-value">${name}</span>
        </div>
        <div class="field">
          <span class="field-label">البريد الإلكتروني:</span>
          <span class="field-value"><a href="mailto:${formData.email}">${formData.email}</a></span>
        </div>
        <div class="field">
          <span class="field-label">رقم الهاتف:</span>
          <span class="field-value"><a href="tel:${formData.tel}">${formData.tel}</a></span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">معلومات الانضمام</div>
        <div class="field">
          <span class="field-label">الفريق المختار:</span>
          <span class="field-value">${teamLabel}</span>
        </div>
        <div class="field">
          <span class="field-label">المهارات:</span>
          <ul class="skills-list">
            ${formData.skills.map((skill) => `<li>${skill}</li>`).join("")}
          </ul>
        </div>
        <div class="field">
          <span class="field-label">نبذة عن المتقدم:</span>
          <div style="background: white; padding: 10px; border-radius: 4px; margin-top: 5px;">
            ${formData.about.replace(/\n/g, "<br>")}
          </div>
        </div>
        <div class="field">
          <span class="field-label">الوقت المتاح أسبوعياً:</span>
          <span class="field-value">${availabilityLabel}</span>
        </div>
        ${
          formData.notes
            ? `
        <div class="field">
          <span class="field-label">ملاحظات إضافية:</span>
          <div style="background: white; padding: 10px; border-radius: 4px; margin-top: 5px;">
            ${formData.notes.replace(/\n/g, "<br>")}
          </div>
        </div>
        `
            : ""
        }
      </div>

      <div class="footer">
        <p>تم الإرسال: ${new Date().toLocaleString("ar-SA", {
          timeZone: "Asia/Riyadh",
          dateStyle: "full",
          timeStyle: "short",
        })}</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"نادي سراج" <${smtpUser}>`,
        to: adminEmail,
        subject: `طلب انضمام جديد - ${name}`,
        text: emailContent,
        html: emailHTML,
      });

      const { error: updateError } = await supabase
        .from("submissions")
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        })
        .eq("id", submission.id);

      if (updateError) {
        console.error("Failed to update email status:", updateError);
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    return { success: true, message: "تم إرسال طلبك بنجاح" };
  } catch (error) {
    console.error("Form submission error:", error);
    return {
      success: false,
      message: "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.",
    };
  }
}
