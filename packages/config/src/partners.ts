import type {PartnerRecord} from '@ufde/types';
// No institutional identities or logos are invented. Replace with approved records.
export const demoPartners:PartnerRecord[]=Array.from({length:6},(_,i)=>({id:`demo-partner-${i+1}`,name:'',isDemo:true}));
