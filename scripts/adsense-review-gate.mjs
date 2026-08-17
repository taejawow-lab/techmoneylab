#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
import { REVIEW_POST_SET as keep } from '../src/config/review-corpus.mjs';
const dir=path.join(root,'src/content/posts');
const files=fs.readdirSync(dir).filter(x=>x.endsWith('.mdx'));
const banned=/AdSense[- ]?readiness|future AdSense review|publishing (?:run|workflow)|SEO filler|generated[- ]image QA|deployment workflow|Final readiness pass before publishing/i;
const failures=[]; const publicRows=[]; const paragraphMap=new Map();
const plain=x=>x.replace(/^import .*$/gm,' ').replace(/<[^>]+>/g,' ').replace(/!\[[^\]]*\]\([^)]+\)/g,' ').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[`#*_>|{}]/g,' ').replace(/\s+/g,' ').trim();
for(const file of files){
  const slug=file.slice(0,-4); const raw=fs.readFileSync(path.join(dir,file),'utf8');
  const m=raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/); if(!m){failures.push(`${file}: missing frontmatter`);continue;}
  const fm=m[1], body=raw.slice(m[0].length); const draft=/^draft:\s*true\s*$/m.test(fm);
  if(!draft){
    const words=(plain(body).match(/\b[\w’'-]+\b/g)||[]).length;
    const sources=new Set([...raw.matchAll(/https?:\/\/[^\s)\]}>"']+/g)].map(x=>x[0])).size;
    const images=new Set([...body.matchAll(/(?:!\[[^\]]*\]\((\/images\/[^)]+)\)|["'](\/images\/[^"']+)["'])/g)].map(x=>x[1]||x[2])).size;
    publicRows.push({slug,words,sources,images});
    if(!keep.has(slug)) failures.push(`${slug}: public but not in allowlist`);
    if(words<750) failures.push(`${slug}: ${words} body words < 750`);
    if(sources<8) failures.push(`${slug}: ${sources} source URLs < 8`);
    if(images<3) failures.push(`${slug}: ${images} article images < 3`);
    if(banned.test(raw)) failures.push(`${slug}: production/review language exposed`);
    if(/title:\s*["']?[^\n]*\btested\b/i.test(fm)) failures.push(`${slug}: unsupported tested claim in title`);
    if(/\b(?:our|we|I)\s+(?:test(?:ed|ing)?|used|opened|bought|tried|subscribed|ran|looked|benchmarked|compared)\b/i.test(raw)) failures.push(`${slug}: unsupported first-person experience claim`);
    for(const link of body.matchAll(/\/posts\/([a-z0-9-]+)/g)) if(!keep.has(link[1])) failures.push(`${slug}: internal link points to drafted post ${link[1]}`);
    for(const para of body.split(/\n\s*\n+/)){
      const p=plain(para).toLowerCase(); const wc=(p.match(/\b[\w’'-]+\b/g)||[]).length;
      if(wc>=18 && !para.trimStart().startsWith('#') && !para.trimStart().startsWith('<')){
        const arr=paragraphMap.get(p)||[]; arr.push(slug); paragraphMap.set(p,arr);
      }
    }
  }
}
const publicSet=new Set(publicRows.map(x=>x.slug));
for(const slug of keep) if(!publicSet.has(slug)) failures.push(`${slug}: allowlisted but not public`);
if(publicRows.length!==22) failures.push(`public count ${publicRows.length} != 22`);
for(const [p,slugs] of paragraphMap){ if(new Set(slugs).size>1) failures.push(`duplicate paragraph across ${[...new Set(slugs)].join(', ')}`); }
const astro=fs.readFileSync(path.join(root,'astro.config.mjs'),'utf8');
const tags=fs.readFileSync(path.join(root,'src/pages/tags/[tag].astro'),'utf8');
const about=fs.readFileSync(path.join(root,'src/pages/about.astro'),'utf8');
const ads=fs.readFileSync(path.join(root,'public/ads.txt'),'utf8');
if(!astro.includes("pathname.startsWith('/tags/')")) failures.push('sitemap tag filter missing');
if(!astro.includes('REVIEW_POST_SET.has')) failures.push('sitemap review-corpus filter missing');
if(!tags.includes('noindex={true}')) failures.push('tag noindex missing');
if(about.includes('techmoneylab.org')) failures.push('About email still uses .org');
if(!ads.startsWith('google.com, pub-3526385510396286, DIRECT,')) failures.push('ads.txt publisher row missing');
const header=fs.readFileSync(path.join(root,'src/components/Header.astro'),'utf8');
const home=fs.readFileSync(path.join(root,'src/pages/index.astro'),'utf8');
const appJs=fs.readFileSync(path.join(root,'public/tml-app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'src/styles/global.css'),'utf8');
const uiCorpus=[header,home,appJs].join('\n');
for(const marker of ['12,400+','Reader rating',"You're in —",'news-form']) if(uiCorpus.includes(marker)) failures.push(`unsupported newsletter/social-proof marker: ${marker}`);
if(fs.existsSync(path.join(root,'src/components/Newsletter.astro'))) failures.push('nonfunctional newsletter component still exists');
if(!header.includes('data-menu-toggle') || !css.includes('.menu-toggle { display: grid; }')) failures.push('mobile navigation control missing');
if(/\.hero h1 br\s*\{[^}]*display\s*:\s*none/i.test(css)) failures.push('mobile hero hard break is disabled');
if(!css.includes('.hero-cta { flex-direction: column;')) failures.push('mobile hero CTA stacking guard missing');
if(process.argv.includes('--dist')){
  const sm=fs.readFileSync(path.join(root,'dist/sitemap-0.xml'),'utf8');
  const urls=[...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);
  const posts=urls.filter(x=>{ const seg=new URL(x).pathname.split('/').filter(Boolean); return seg.length===2 && seg[0]==='posts' && seg[1]!=='page'; });
  const tagUrls=urls.filter(x=>new URL(x).pathname.startsWith('/tags/'));
  if(posts.length!==22) failures.push(`dist sitemap post count ${posts.length} != 22`);
  if(tagUrls.length!==0) failures.push(`dist sitemap has ${tagUrls.length} tag URLs`);
  const tombstone=fs.readFileSync(path.join(root,'dist/posts/best-online-brokerages-2026/index.html'),'utf8');
  if(!/noindex/i.test(tombstone) || !tombstone.includes('Article temporarily unavailable')) failures.push('draft tombstone missing noindex/notice');
  if(tombstone.includes('We opened accounts at five brokerages')) failures.push('stale drafted article leaked into tombstone');
  const builtHome=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
  for(const marker of ['12,400+','Reader rating',"You're in —",'news-form']) if(builtHome.includes(marker)) failures.push(`built homepage contains unsupported marker: ${marker}`);
  if(!builtHome.includes('Browse guides')) failures.push('built homepage/header is missing Browse guides CTA');
}
const result={status:failures.length?'FAIL':'PASS',publicCount:publicRows.length,minWords:Math.min(...publicRows.map(x=>x.words)),minSources:Math.min(...publicRows.map(x=>x.sources)),minImages:Math.min(...publicRows.map(x=>x.images)),failures,publicRows};
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exit(1);
