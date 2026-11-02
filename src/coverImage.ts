export const MAX_COVER_LENGTH=180000;
export function safeCover(value:unknown):string|null {
 if(typeof value!=='string')return null;
 const trimmed=value.trim();
 if(!trimmed)return null;
 if(trimmed.startsWith('/')&&!trimmed.startsWith('//')&&trimmed.length<=300)return trimmed;
 if(trimmed.length<=1000){try{const url=new URL(trimmed);if(url.protocol==='https:'&&!url.username&&!url.password)return trimmed}catch{}}
 return trimmed.length<=MAX_COVER_LENGTH&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]*={0,2}$/.test(trimmed)?trimmed:null;
}
export async function prepareCover(file:File):Promise<string>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('اختار صورة JPG أو PNG أو WebP.');
 if(file.size>10*1024*1024)throw Error('الصورة كبيرة. اختار صورة أقل من ١٠ ميجابايت.');
 const url=URL.createObjectURL(file);
 try{
 const image=new Image();image.src=url;await image.decode();
 if(!image.naturalWidth||image.naturalWidth*image.naturalHeight>40000000)throw Error('أبعاد الصورة كبيرة جدًا. صغّرها وحاول تاني.');
 const canvas=document.createElement('canvas');const scale=Math.min(1,1200/image.naturalWidth,900/image.naturalHeight);
 canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error('المتصفح مش قادر يجهز الصورة.');
 for(let attempt=0;attempt<6;attempt++){
 ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
 const result=canvas.toDataURL('image/jpeg',.8-attempt*.08);if(result.length<=MAX_COVER_LENGTH&&safeCover(result))return result;
 canvas.width=Math.max(1,Math.round(canvas.width*.8));canvas.height=Math.max(1,Math.round(canvas.height*.8));
 }
 throw Error('مش قادرين نضغط الصورة للحجم المناسب. جرّب صورة أصغر.');
 }finally{URL.revokeObjectURL(url)}
}
