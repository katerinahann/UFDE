import {cp,rm} from 'node:fs/promises'; await rm('out',{recursive:true,force:true}); await cp('apps/web/out','out',{recursive:true});
