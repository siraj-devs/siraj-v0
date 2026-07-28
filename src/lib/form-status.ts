import { hasSubmissionForSession } from "@/lib/submissions";
import { getSession } from "@/lib/session";

export async function checkFormCompletionStatus() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return { isLoggedIn: false, hasSubmittedForm: false };
    }

    const status = await hasSubmissionForSession();
    return {
      isLoggedIn: true,
      hasSubmittedForm: status.hasSubmittedForm,
      submissionDate: status.submissionDate,
      error: status.error,
    };
  } catch (error) {
    console.error("Error checking form completion status:", error);
    return { isLoggedIn: false, hasSubmittedForm: false, error: true };
  }
}
