export function validateEnvironment(env:Record<string,unknown>) {
  for(const key of Object.keys(env))if(/^NEXT_PUBLIC_.*(SECRET|PASSWORD|TOKEN|KEY|DATABASE|SMTP)/i.test(key))throw new Error('Secrets must never use NEXT_PUBLIC_ environment variables');
  const prod=env.NODE_ENV==='production';
  const url=String(env.DATABASE_URL || '');
  if (!/^postgres(ql)?:\/\//.test(url)) throw new Error('DATABASE_URL must be a PostgreSQL connection URL');
  const origins=String(env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(x=>x.trim());
  for (const origin of origins) {const u=new URL(origin);if (u.origin!==origin || !['http:','https:'].includes(u.protocol) || (prod && u.protocol!=='https:')) throw new Error('CORS_ORIGINS must contain exact trusted origins (HTTPS in production)');}
  if(prod && String(env.CONTACT_RATE_SECRET||env.ADMIN_API_TOKEN||'').length<48)throw new Error('CONTACT_RATE_SECRET must contain at least 48 characters');
  if(prod && env.DEMO_MODE==='true')throw new Error('DEMO_MODE must be disabled in production');
  if(prod && env.LEGAL_APPROVED!=='true')throw new Error('LEGAL_APPROVED must be true after institutional review');
  if(env.CONTACT_PROXY_SECRET && String(env.CONTACT_PROXY_SECRET).length<48)throw new Error('CONTACT_PROXY_SECRET must contain at least 48 characters');
  const port=Number(env.PORT||4000);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be a valid port');
  return {...env,CORS_ORIGINS:origins.join(','),PORT:Number(env.PORT||4000)};
}
