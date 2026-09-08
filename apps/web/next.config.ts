import type { NextConfig } from 'next';
const preview = process.env.UFDE_STATIC_EXPORT === 'true';
const config:NextConfig = {
  ...(preview ? {output:'export'} : {output:'standalone'}),
  transpilePackages: ['@ufde/config','@ufde/types','@ufde/ui'],
  images: {unoptimized: true,remotePatterns:(process.env.NEXT_PUBLIC_IMAGE_HOSTS||'').split(',').map(h=>h.trim()).filter(Boolean).map(hostname=>({protocol:'https' as const,hostname}))},
  poweredByHeader:false,
  ...(preview ? {} : {async rewrites(){return [{source:'/api/admin/:path*',destination:(process.env.ADMIN_BACKEND_URL||'http://localhost:4000/v1/admin')+'/:path*'},{source:'/api/media/:id',destination:(process.env.ADMIN_BACKEND_URL||'http://localhost:4000/v1/admin').replace(/\/admin\/?$/,'')+'/media/:id'},{source:'/api/contact',destination:process.env.CONTACT_BACKEND_URL||'http://localhost:4000/v1/contact'}]},async headers(){return [{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'X-Frame-Options',value:'DENY'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},{key:'Content-Security-Policy',value:"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' "+(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')+"; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"}]}]}})
};
export default config;
