export function validateEnvironment(env:Record<string,unknown>) {
  const prod=env.NODE_ENV==='production';
  const url=String(env.DATABASE_URL || '');
  if (!/^postgres(ql)?:\/\//.test(url)) throw new Error('DATABASE_URL must be a PostgreSQL connection URL');
  const origins=String(env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(x=>x.trim());
  for (const origin of origins) {const u=new URL(origin);if (u.origin!==origin || !['http:','https:'].includes(u.protocol) || (prod && u.protocol!=='https:')) throw new Error('CORS_ORIGINS must contain exact trusted origins (HTTPS in production)');}
  if(prod && String(env.ADMIN_API_TOKEN||'').length<48)throw new Error('ADMIN_API_TOKEN must contain at least 48 characters');
  if(prod && env.DEMO_MODE==='true')throw new Error('DEMO_MODE must be disabled in production');
  if(prod && env.LEGAL_APPROVED!=='true')throw new Error('LEGAL_APPROVED must be true after institutional review');
  return {...env,CORS_ORIGINS:origins.join(','),PORT:Number(env.PORT||4000)};
}
