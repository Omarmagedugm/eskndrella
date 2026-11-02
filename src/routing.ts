export type Edge={from:string;to:string;line:string;status:string;verified:boolean;minutes:number|null;fare:number|null;walking?:boolean;meters?:number};
export type Preference='fastest'|'cheapest'|'transfers';
export function plan(edges:Edge[],from:string,to:string,preference:Preference,walkLimit=1000){
 if(from===to)return {edges:[],minutes:0,fare:0,transfers:0,walking:0};
 const valid=edges.filter(e=>e.verified&&e.status==='active'&&(!e.walking||(e.meters??Infinity)<=walkLimit));
 const queue:{node:string;line:string;cost:number;path:Edge[];walk:number}[]=[{node:from,line:'',cost:0,path:[],walk:0}];const best=new Map<string,number>();
 while(queue.length){queue.sort((a,b)=>a.cost-b.cost);const cur=queue.shift()!;const key=cur.node+'|'+cur.line+'|'+cur.walk;if((best.get(key)??Infinity)<=cur.cost)continue;best.set(key,cur.cost);if(cur.node===to){const lines=cur.path.filter(e=>!e.walking).map(e=>e.line).filter((v,i,a)=>i===0||v!==a[i-1]);return {edges:cur.path,minutes:cur.path.some(e=>e.minutes==null)?null:cur.path.reduce((n,e)=>n+e.minutes!,0),fare:cur.path.some(e=>e.fare==null)?null:cur.path.reduce((n,e)=>n+e.fare!,0),transfers:Math.max(0,lines.length-1),walking:cur.walk}}
 for(const e of valid.filter(e=>e.from===cur.node)){if(cur.path.some(p=>p.from===e.to))continue;const walk=cur.walk+(e.walking?(e.meters??0):0);if(walk>walkLimit)continue;const transfer=!!cur.line&&!e.walking&&cur.line!==e.line;let weight=preference==='fastest'?e.minutes:preference==='cheapest'?e.fare:(transfer?10000:0)+1;if(weight==null)continue;queue.push({node:e.to,line:e.walking?cur.line:e.line,cost:cur.cost+weight,path:[...cur.path,e],walk})}}
 return null;
}
