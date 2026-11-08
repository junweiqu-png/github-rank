// Prioritize newly created projects separately from the slower full-history scan.
// The window travels by calendar month, not by a mutable rolling day, so pages
// can safely resume across successive scheduled runs.
export function recentProjectScopes(now=new Date()){
 const date=new Date(now);
 if(!Number.isFinite(+date))throw TypeError('Invalid discovery date');
 const year=date.getUTCFullYear(),month=date.getUTCMonth();
 const range=offset=>{
  const begin=new Date(Date.UTC(year,month-offset,1)).toISOString().slice(0,10);
  const end=new Date(Date.UTC(year,month-offset+1,0)).toISOString().slice(0,10);
  return begin+'..'+end;
 };
 const windows=[range(0),range(1)];
 return ['stars:>=500','stars:100..499'].flatMap(stars=>windows.map(window=>`${stars} fork:false created:${window}`));
}
