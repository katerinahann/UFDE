import {BadRequestException, Injectable, PipeTransform} from '@nestjs/common';
/** Plain-text content stays plain text; React performs output escaping.
 * Do not mutate passwords or tokens, or attempt regex-based HTML sanitization. */
@Injectable()
export class SanitizePipe implements PipeTransform {
 transform(value:unknown){
  const clean=(input:unknown,depth:number,key=''):unknown=>{
   if(depth>20)throw new BadRequestException('Request nesting exceeds limit');
   if(typeof input==='string')return /password|token|secret/i.test(key)?input:input.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'');
   if(Array.isArray(input))return input.map(v=>clean(v,depth+1,key));
   if(input&&typeof input==='object')return Object.fromEntries(Object.entries(input).map(([k,v])=>{if(['__proto__','prototype','constructor'].includes(k))throw new BadRequestException('Invalid property');return [k,clean(v,depth+1,k)];}));
   return input;
  };
  return clean(value,0);
 }
}
