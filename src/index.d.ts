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
    email: string
    login: string
    image?: string
  }
  accessToken: string
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
