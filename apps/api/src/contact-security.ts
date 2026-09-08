import {createHmac,timingSafeEqual} from 'node:crypto';
import type {Request} from 'express';
export function contactClientIp(req:Request,secret?:string){const ip=req.header('x-ufde-ip')||'',time=req.header('x-ufde-time')||'',signature=req.header('x-ufde-signature')||'';if(secret&&ip.length<=100&&Math.abs(Date.now()-Number(time))<300000&&/^[a-f0-9]{64}$/.test(signature)){const expected=createHmac('sha256',secret).update(time+'\n'+ip).digest();if(timingSafeEqual(expected,Buffer.from(signature,'hex')))return ip;}return req.ip||req.socket.remoteAddress||'unknown';}
