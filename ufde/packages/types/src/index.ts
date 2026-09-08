export type ContentKind = 'ACTIVITY' | 'PROJECT' | 'PUBLICATION';
export interface ContentRecord { id: string; slug: string; kind: ContentKind; locale: string; title: string; summary: string; body: string; category: string; isDemo: boolean; publishedAt: string | null; image?: {url:string; alt:string} | null; seoTitle?:string|null; seoDescription?:string|null; }
