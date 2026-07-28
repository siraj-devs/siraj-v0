export const SUBMISSION_TEAM_LABELS: Record<string, string> = {
  design: "🎨 فريق التصميم",
  evenings: "🌙 فريق الأمسيات",
  activities: "📅 فريق الأنشطة والفعاليات",
  development: "💻 فريق التطوير",
  undecided: "🤔 لست متأكداً من الفريق",
};

export const SUBMISSION_AVAILABILITY_LABELS: Record<string, string> = {
  "less-3": "أقل من 3 ساعات",
  "3-5": "من 3 إلى 5 ساعات",
  "more-5": "أكثر من 5 ساعات",
};

export function getSubmissionTeamLabel(team: string) {
  return SUBMISSION_TEAM_LABELS[team] ?? team;
}

export function getSubmissionAvailabilityLabel(value: string) {
  return SUBMISSION_AVAILABILITY_LABELS[value] ?? value;
}

export type SubmissionRow = {
  id: number;
  connection_id: string;
  provider: "42" | "discord" | null;
  name: string;
  email: string;
  tel: string;
  team: string;
  skills: string[];
  about: string;
  availability: string;
  notes: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  submitted_at: string;
  connection_login: string | null;
  connection_username: string | null;
  connection_avatar: string | null;
  connection_name: string | null;
};
