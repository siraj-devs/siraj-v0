interface JoinFormData {
  login: string
  name: string
  email: string
  tel: string
  team: string
  skills: string[]
  about: string
  availability: string
  notes?: string
}

interface Submission {
  id: number;
  login: string;
  name: string;
  avatar: string;
  email: string;
  tel: string;
  team: string;
  skills: string[];
  about: string;
  availability: string;
  notes: string;
  email_sent: boolean;
  email_sent_at: string;
  created_at: string;
}

interface SessionData {
  user: {
    id: string
    name: string
    email?: string
    login: string
    image?: string | null
  }
  accessToken: string
  provider?: "42" | "discord"
}

type MemberRole = "owner" | "admin" | "participant" | "veteran" | "newcomer"

interface AppMember {
  id: number
  name: string
  ft_connection: number | null
  dc_connection: string | null
  role: MemberRole
}

type TransactionType = "income" | "expense"

interface ClubTransaction {
  id: number
  due_at: string
  amount: number
  type: TransactionType
  note: string
}

interface HijriDay {
  hijri: {
    day: string;
    month: { number: number; ar: string };
    year: string;
  };
  gregorian: {
    date: string;
    weekday: { en: string };
  };
}
