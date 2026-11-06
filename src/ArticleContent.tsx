import {useState} from 'react';
import {ExternalLink} from 'lucide-react';
import {articleBlocks,safeLink} from './editorialModel';
export function InlineText({text}:{text:string}){
  const parts=text.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*)/g);
  return <>{parts.map((part,index)=>{const link=part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);if(link&&safeLink(link[2]))return <a key={index} href={safeLink(link[2])!} target="_blank" rel="noreferrer">{link[1]}<ExternalLink size={13}/></a>;return part.startsWith('**')&&part.endsWith('**')?<strong key={index}>{part.slice(2,-2)}</strong>:part;})}</>;
}
function EmbeddedVideo({url}:{url:string}){const [open,setOpen]=useState(false);return open?<iframe className="ed-embed" src={url} title="فيديو مرتبط بالمادة" loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<button className="ed-video-button" onClick={()=>setOpen(true)}>تشغيل الفيديو من YouTube <ExternalLink size={16}/></button>;}
export function ArticleBody({body}:{body:string}){return <>{articleBlocks(body).map((block,index)=>block.type==='heading'?<h2 id={block.id} key={index}>{block.text}</h2>:block.type==='quote'?<blockquote key={index}><InlineText text={block.text}/></blockquote>:block.type==='image'?<figure key={index}><img src={block.url} alt={block.text} loading="lazy" width="1000" height="650"/>{block.caption&&<figcaption>{block.caption}</figcaption>}</figure>:block.type==='list'?<ul key={index}>{block.text.split('\n').map((line,i)=><li key={i}><InlineText text={line.replace(/^[-*]\s+/,'')}/></li>)}</ul>:block.type==='video'?<EmbeddedVideo key={index} url={block.url!}/>:<p key={index}><InlineText text={block.text}/></p>)}</>;}

