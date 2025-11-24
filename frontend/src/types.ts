// frontend/types.ts

export interface Review {
  id: string;
  user: string;
  rating: number;
  content: string;
  date: string;
}

export interface ProductSummary {
  name: string;
  price: string;
  pros: string[];
  cons: string[];
  overallSentiment: string;
}

export enum AppStatus {
  IDLE = "IDLE",
  ANALYZING = "ANALYZING",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR",
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export type Language = "ko" | "en";
