export function range(period,date){
 const d=new Date(date+'T00:00:00+08:00');if(Number.isNaN(+d))throw Error('日期无效');
 const wall=new Date(+d+28800000); let y=wall.getUTCFullYear(),m=wall.getUTCMonth(),day=wall.getUTCDate();
 const utc=(y,m,d)=>Date.UTC(y,m,d)-28800000;let start,end;
 if(period==='all')return [-Infinity,Infinity];
 if(period==='year'){start=utc(y,0,1);end=utc(y+1,0,1)}
 else if(period==='quarter'){m=Math.floor(m/3)*3;start=utc(y,m,1);end=utc(y,m+3,1)}
 else if(period==='month'){start=utc(y,m,1);end=utc(y,m+1,1)}
 else if(period==='week'){day-=(wall.getUTCDay()+6)%7;start=utc(y,m,day);end=start+7*86400000}
 else {start=+d;end=start+86400000}return [start,end];
}
export function rank(repos,{period='all',date,category='all',area='all',domain='all',q=''}={}){const [a,b]=range(period,date);return repos.filter(r=>+new Date(r.created_at)>=a&&+new Date(r.created_at)<b&&(category==='all'||r.category===category)&&(area==='all'||(area==='ai'?r.domain==='ai':r.domain!=='ai'))&&(domain==='all'||r.domain===domain)&&`${r.full_name} ${r.description||''} ${r.summary||''} ${r.input||''} ${r.output||''} ${(r.topics||[]).join(' ')}`.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>b.stars-a.stars||a.full_name.localeCompare(b.full_name));}
