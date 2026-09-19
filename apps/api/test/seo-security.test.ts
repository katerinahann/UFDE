import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import {serializeJsonLd,organizationSchema,contentSchema,publicationSchema,personSchema,absoluteUrl} from '../../web/lib/seo-data';
import {SanitizePipe} from '../src/sanitize.pipe';
import {validateEnvironment} from '../src/environment';
const origin='https://example.org';
test('JSON-LD escapes script-breaking content and rejects unsafe URLs',()=>{
 const value={name:'</script><script>alert(1)</script>'};const json=serializeJsonLd(value);assert.ok(!json.includes('<'));assert.deepEqual(JSON.parse(json),value);assert.equal(absoluteUrl('javascript:alert(1)',origin),undefined);assert.equal(absoluteUrl('https://secret:password@example.org',origin),undefined);
});
test('schema emits only supported facts, published content and genuine event fields',()=>{
 const org=organizationSchema(origin,'Official institute name','/logo.svg',[]);assert.equal(org['@type'],'Organization');assert.ok(!('legalName' in org));assert.equal(org.address.addressLocality,'Paris');
 const item:any={title:'Research meeting',slug:'meeting',kind:'ACTIVITY',locale:'en',summary:'Summary',isDemo:false};
 assert.equal(contentSchema(origin,origin+'/activities/meeting',item)?.['@type'],'Article');
 assert.equal(contentSchema(origin,origin,item,{date:'2026-10-01',location:'Paris',gallery:[],partners:[]})?.['@type'],'Event');
 assert.equal(contentSchema(origin,origin,{...item,isDemo:true}),null);
 const p:any={title:'Report',type:'Research Reports',status:'Published',isDemo:false,authors:['Author'],language:'en'};
 assert.equal(publicationSchema(origin,origin,p)?.['@type'],'Report');assert.equal(publicationSchema(origin,origin,{...p,status:'Draft'}),null);
 assert.equal(personSchema(origin,{id:'1',name:'Person',role:'Researcher',biography:'Bio'} as any)['@type'],'Person');
});
test('sanitization bounds nesting, rejects dangerous keys and preserves passwords',()=>{
 const pipe=new SanitizePipe();assert.deepEqual(pipe.transform({name:'A\u0000B',password:' secret\u0000 '}),{name:'AB',password:' secret\u0000 '});assert.throws(()=>pipe.transform(JSON.parse('{"__proto__":{}}')));let deep:any={};for(let i=0;i<25;i++)deep={nested:deep};assert.throws(()=>pipe.transform(deep));
});
test('public secret configuration and invalid ports fail closed',()=>{
 assert.throws(()=>validateEnvironment({DATABASE_URL:'postgresql://localhost/test',NEXT_PUBLIC_JWT_SECRET:'secret'}));assert.throws(()=>validateEnvironment({DATABASE_URL:'postgresql://localhost/test',PORT:'invalid'}));
});
