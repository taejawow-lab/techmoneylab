# TechMoneyLab AdSense re-review remediation — 2026-07-21

## Trigger

Google AdSense again classified the site as low-value content. This release prepares a smaller, stable review corpus; it does not guarantee approval.

## Baseline observed before remediation

- Production sitemap: 302 URLs total.
- Exact article routes: 65.
- Tag archives: more than 200 indexable sitemap URLs, many with one or two articles.
- Repository corpus: 58 public MDX articles and 1 draft.
- Actual reader-body depth: 19 public articles under 800 words, 44 under 1,200, and 54 under 1,500.
- Reader-visible production language appeared in 14 public articles, including AdSense-readiness and publishing-workflow wording.
- Several comparison articles made unsupported first-person testing claims. Those articles are not part of the retained review corpus.
- About page used the wrong `editor@techmoneylab.org` address while the contact page used `.net`.
- `ads.txt` contained a valid publisher row followed by contradictory comments saying no seller was authorized.
- Case-variant category labels generated duplicate static category routes.

## Release scope

1. Freeze the public review corpus at 20 source-backed finance guides; preserve the remaining articles as drafts for later bespoke remediation.
2. Retained-corpus deterministic floor:
   - 20 exact public articles;
   - at least 750 reader-body words;
   - at least 8 unique source URLs;
   - at least 3 article images;
   - no exposed AdSense/publishing-process language;
   - no unsupported first-person testing claims;
   - no exact repeated 18+ word paragraphs across retained articles;
   - no retained article link to a drafted article.
3. Remove all tag archives from the sitemap and render them `noindex, nofollow` while keeping them available for navigation.
4. Merge category routes case-insensitively so each normalized category has one archive.
5. Rewrite Editorial Process and Editorial Standards around reader questions, official sources, claim-to-evidence mapping, limitations, corrections, and transparent AI assistance. Remove factory-facing detector and auto-generation claims.
6. Correct About contact email to `editor@techmoneylab.net`.
7. Make `ads.txt` internally consistent.
8. Add `npm run qa:adsense` and `npm run qa:adsense:dist` gates.

## Verification evidence

- `npm run qa:adsense`: PASS — public 20, minimum body words 775, minimum sources 8, minimum article images 3, zero failures.
- `npm run build`: PASS — Astro generated 132 pages and 20 exact article routes.
- `npm run qa:adsense:dist`: PASS — exact article sitemap count 20 and tag sitemap count 0.
- `git diff --check`: PASS.
- Generated `.astro`, `dist`, `node_modules`, and lockfile install noise were restored/cleaned before commit.
- Live visual baseline review of a retained long-form guide showed a polished article layout, visible hero art, source list, decision-oriented sections, disclosure links, and no obvious broken navigation. Production smoke must be repeated after deployment.

## Review-window rule

Do not resume broad automated publishing for TechMoneyLab or make bulk public-corpus changes until the next AdSense decision. Drafted articles should return only after bespoke editorial repair and the same deterministic gate. Unrelated portfolio sites are outside this hold.
