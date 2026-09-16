const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../artifacts/lab-03/report');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'dark',
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const githubTargets = [
    { url: 'https://github.com/martinvadre/toktickit', out: 'part1_github_repo_main.png' },
    { url: 'https://github.com/users/martinvadre/projects/1/views/1', out: 'part1_github_kanban.png' },
    { url: 'https://github.com/martinvadre/toktickit/commits/main', out: 'part1_git_commit_graph.png' },
    { url: 'https://github.com/martinvadre/toktickit/issues?q=is%3Aissue', out: 'part1_github_all_issues.png' },
    { url: 'https://github.com/martinvadre/toktickit/issues/29', out: 'part1_github_issue29.png' },
    { url: 'https://github.com/martinvadre/toktickit/issues/30', out: 'part1_github_issue30.png' },
    { url: 'https://github.com/martinvadre/toktickit/issues/31', out: 'part1_github_issue31.png' },
    { url: 'https://github.com/martinvadre/toktickit/issues/32', out: 'part1_github_issue32.png' },
    { url: 'https://github.com/martinvadre/toktickit/issues/33', out: 'part1_github_issue33.png' },
    { url: 'https://github.com/martinvadre/toktickit/issues/34', out: 'part1_github_issue34.png' },
    { url: 'https://github.com/martinvadre/toktickit/pulls?q=is%3Apr', out: 'part1_github_all_prs.png' },
    { url: 'https://github.com/martinvadre/toktickit/pull/35', out: 'part1_github_pr35.png' },
    { url: 'https://github.com/martinvadre/toktickit/pull/36', out: 'part1_github_pr36.png' },
    { url: 'https://github.com/martinvadre/toktickit/pull/37', out: 'part1_github_pr37.png' },
    { url: 'https://github.com/martinvadre/toktickit/pull/38', out: 'part1_github_pr38.png' },
    { url: 'https://github.com/martinvadre/toktickit/pull/39', out: 'part1_github_pr39.png' },
    { url: 'https://github.com/martinvadre/toktickit/pull/40', out: 'part1_github_pr40.png' },
    { url: 'https://github.com/martinvadre/toktickit/pull/41', out: 'part1_github_pr41_main.png' },
    { url: 'https://github.com/martinvadre/toktickit/blob/main/docs/lab-03/specification.md', out: 'part2_spec_rendered.png' },
    { url: 'https://github.com/martinvadre/toktickit/blob/main/docs/lab-03/tests.md', out: 'part3_tests_rendered.png' },
    { url: 'https://github.com/martinvadre/toktickit/blob/main/docs/lab-03/ai-use.md', out: 'part4_ai_use_rendered.png' },
    { url: 'https://github.com/martinvadre/toktickit/blob/main/docs/lab-03/reviewer.md', out: 'part1_reviewer_rendered.png' },
    { url: 'https://github.com/martinvadre/toktickit/blob/main/docs/lab-03/ui-spec.md', out: 'part9_ui_spec_rendered.png' },
  ];

  for (const target of githubTargets) {
    console.log(`Navigating to ${target.url}...`);
    try {
      await page.goto(target.url, { waitUntil: 'networkidle', timeout: 30000 });
      // Small pause for any animations/renders
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(OUT_DIR, target.out) });
      console.log(`Saved ${target.out}`);
    } catch (err) {
      console.error(`Error loading ${target.url}:`, err.message);
      // Fallback with domcontentloaded
      try {
        await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(OUT_DIR, target.out) });
        console.log(`Saved ${target.out} on fallback`);
      } catch (e) {
        console.error(`Fallback failed for ${target.url}:`, e.message);
      }
    }
  }

  await browser.close();
  console.log('GitHub evidence capture completed.');
}

capture().catch(console.error);
