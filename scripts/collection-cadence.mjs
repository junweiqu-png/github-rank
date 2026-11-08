const DAY=24*60*60*1000;
// While resumable work remains, a daily run advances the queue; otherwise
// retain the original three-day full-refresh cadence.
export function collectionDue({eventName,updatedAt,status,now=new Date()}){
 if(eventName!=='schedule')return true;
 const last=Date.parse(updatedAt),time=+new Date(now);
 if(!Number.isFinite(last)||!Number.isFinite(time))return true;
 const discovery=status?.discovery||{},skills=status?.skills||{};
 const incomplete=discovery.general?.complete===false
  ||discovery.recent?.complete===false
  ||discovery.skills?.complete===false
  ||discovery.unlabelled_skill_probes?.complete===false
  ||skills.complete===false;
 return time-last>=(incomplete?20*60*60*1000:3*DAY);
}
