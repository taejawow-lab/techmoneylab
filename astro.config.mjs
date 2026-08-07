import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { REVIEW_POST_SET } from './src/config/review-corpus.mjs';
import mdx from '@astrojs/mdx';

// 사이트별 환경 변수에서 site URL 읽음 (자동 셋업 스크립트가 .env 자동 생성)
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://techmoneylab.net';

export default defineConfig({
  site: SITE_URL,
  integrations: [
    tailwind({
      applyBaseStyles: false, // global.css에서 직접 베이스 스타일 작성
    }),
    sitemap({
      filter: (page) => {
        const { pathname } = new URL(page);
        const segments = pathname.split('/').filter(Boolean);
        const isAllowedReviewPost = segments[0] !== 'posts' || segments.length !== 2 || REVIEW_POST_SET.has(segments[1]);
        return !pathname.startsWith('/tags/') && pathname !== '/search/' && !pathname.startsWith('/posts/page/') && isAllowedReviewPost;
      },
    }),
    mdx(),
  ],
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
