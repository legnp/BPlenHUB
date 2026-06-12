import { Timestamp } from "firebase/firestore";

export type SocialPlatform = 'linkedin' | 'instagram' | 'tiktok' | 'whatsapp' | 'article' | 'other';

export interface SocialPost {
  id: string;
  slug?: string;
  platform: SocialPlatform;
  url: string;
  title: string;
  summary: string;
  thumbnail: string;
  publishedAt: string; // ISO date or formatted string from input
  isActive: boolean;
  isFeatured: boolean;
  content?: string; // Conteúdo Markdown para artigos
  author?: string;  // Nome do autor do artigo
  createdAt?: any;
  updatedAt?: any;
}
