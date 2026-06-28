export enum Lifecycle {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  ESCALATED = "ESCALATED"
}

export interface CivicSignal {
  id: string; // e.g., CMP-001
  narrative: string;
  classification: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  department: string;
  lifecycle: Lifecycle;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  upvotes: number;
  reporter: string; // email or officer
  imageUrl?: string;
  createdAt: string;
  aiAnalysis?: {
    classification: string;
    priority: string;
    department: string;
    reasoning: string;
  };
  dispatchedUnitId?: string;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'IN_PROGRESS' | 'DELAYED' | 'COMPLETED';
  progress: number;
  budgetSuggested: number;
  budgetUtilized: number;
  timeline: string;
  imageUrlBefore?: string;
  imageUrlAfter?: string;
}

export interface IoTSensor {
  id: string;
  type: 'air' | 'water' | 'waste' | 'smart' | 'traffic';
  name: string;
  lat: number;
  lng: number;
  status: 'ONLINE' | 'CRITICAL' | 'OFFLINE';
  reading: number;
  unit: string;
  history: { time: string; value: number }[];
}

export interface Poll {
  id: string;
  question: string;
  options: { text: string; votes: number }[];
  totalVotes: number;
  userVotedIndex?: number;
}

export type UserRole = 'citizen' | 'official' | 'response_force';

export interface UserSession {
  email?: string;
  id?: string; // Officer ID or Unit ID
  role: UserRole;
  name: string;
}
