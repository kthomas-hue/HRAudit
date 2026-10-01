import type { Category, Question } from '../data/questions'

export interface ResourceLink {
  id: string
  label: string
  url: string
  description?: string
}

export interface ActionItem {
  id: string
  title: string
  detail: string
  timeframe: 'This week' | '30 days' | '90 days'
}

export interface CategoryGuidance {
  categoryId: string
  stakes: string
  riskIfWeak: string
  nextMove: string
  partnerAngle: string
  /** Longer narrative shown in the paid report */
  reportDetail: string
  actions: ActionItem[]
  resources: ResourceLink[]
}

export interface SiteSettings {
  productName: string
  tagline: string
  landingHeadline: string
  landingLead: string
  reportTitle: string
  contactEmail: string
  contactPhone: string
  websiteUrl: string
  privacyUrl: string
  adminPassword: string
  partnerCtaLabel: string
}

export interface ContentPack {
  version: number
  updatedAt: string
  settings: SiteSettings
  categories: Category[]
  questions: Question[]
  feedbackPrompt: string
  feedbackPlaceholder: string
  guidance: Record<string, CategoryGuidance>
}

export const CONTENT_STORAGE_KEY = 'dreamstone-hr-content-pack-v1'
export const ADMIN_SESSION_KEY = 'dreamstone-hr-admin-session'
