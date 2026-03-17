export type MemberRole =
  | "Founder"
  | "Co-Founder"
  | "CTO"
  | "CEO"
  | "CFO"
  | "Communication"
  | "Technical"
  | "Marketing"
  | "Design"
  | "Sales"
  | "Legal"
  | "Operations"
  | "Advisor"
  | "Intern";

export type CompanyStatus =
  | "auto-entrepreneur"
  | "micro-entreprise"
  | "EURL"
  | "SASU"
  | "SARL"
  | "SAS"
  | "SA"
  | "SCI"
  | "Association";

export interface Member {
  id: string;
  name: string;
  roles: MemberRole[];
  email?: string;
  avatar?: string;
  githubUrl?: string;
  joinedAt: string;
}

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  siret?: string;
  websites: string[];
  githubRepos: string[];
  createdAt: string;
}

export interface DiscussionMessage {
  id: string;
  author: string;
  authorRole: string;
  content: string;
  type: "message" | "idea" | "test" | "bug" | "decision";
  createdAt: string;
  threadId: string;
  reactions?: Record<string, number>;
}

export interface DiscussionThread {
  id: string;
  title: string;
  category: "tech" | "product" | "marketing" | "legal" | "general";
  pinned: boolean;
  createdAt: string;
  lastActivity: string;
  messageCount: number;
}

export interface Invoice {
  id: string;
  type: "facture" | "devis";
  number: string;
  clientName: string;
  clientAddress?: string;
  clientSiret?: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  status: "draft" | "sent" | "paid" | "cancelled";
  totalHT: number;
  tva?: number;
  totalTTC: number;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DeclarationReminder {
  id: string;
  title: string;
  dueDate: string;
  type: "urssaf" | "impots" | "cfe" | "tva" | "other";
  status: "upcoming" | "done" | "overdue";
  description: string;
}
