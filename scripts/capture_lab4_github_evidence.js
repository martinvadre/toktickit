const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../artifacts/lab-04/report');
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
    { url: 'https://github.com/users/martinvadre/projects/3', out: 'part1_github_kanban.png' },
    { url: 'https://github.com/martinvadre/toktickit/commits/main', out: 'part1_git_commit_graph.png' },
    { url: 'https://github.com/martinvadre/toktickit/issues?q=is%3Aissue', out: 'part1_github_all_issues.png' },
    { url: 'https://github.com/martinvadre/toktickit/issues/55', out: 'part1_github_issue55.png' },
    { url: 'https://github.com/martinvadre/toktickit/issues/56', out: 'part1_github_issue56.png' },
    { url: 'https://github.com/martinvadre/toktickit/issues/57', out: 'part1_github_issue57.png' },
    { url: 'https://github.com/martinvadre/toktickit/issues/58', out: 'part1_github_issue58.png' },
    { url: 'https://github.com/martinvadre/toktickit/issues/68', out: 'part1_github_issue68.png' },
    { url: 'https://github.com/martinvadre/toktickit/issues/71', out: 'part1_github_issue71.png' },
    { url: 'https://github.com/martinvadre/toktickit/pulls?q=is%3Apr', out: 'part1_github_all_prs.png' },
    { url: 'https://github.com/martinvadre/toktickit/pull/62', out: 'part1_github_pr62.png' },
    { url: 'https://github.com/martinvadre/toktickit/pull/63', out: 'part1_github_pr63.png' },
    { url: 'https://github.com/martinvadre/toktickit/pull/64', out: 'part1_github_pr64.png' },
    { url: 'https://github.com/martinvadre/toktickit/pull/65', out: 'part1_github_pr65.png' },
    { url: 'https://github.com/martinvadre/toktickit/pull/70', out: 'part1_github_pr70.png' },
    { url: 'https://github.com/martinvadre/toktickit/pull/72', out: 'part1_github_pr72.png' },
    { url: 'https://github.com/martinvadre/toktickit/blob/main/README.md', out: 'part1_readme_rendered.png' },
    { url: 'https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/reviewer.md', out: 'part1_reviewer_rendered.png' },
    { url: 'https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/specification.md', out: 'part2_spec_rendered.png' },
    { url: 'https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/tests.md', out: 'part3_tests_rendered.png' },
    { url: 'https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/ai-use.md', out: 'part4_ai_use_rendered.png' },
    { url: 'https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/ui-spec.md', out: 'part9_ui_spec_rendered.png' },
  ];

  for (const target of githubTargets) {
    console.log(`Navigating to ${target.url}...`);
    try {
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUT_DIR, target.out) });
      console.log(`Saved ${target.out}`);
    } catch (err) {
      console.error(`Error loading ${target.url}:`, err.message);
      try {
        await page.goto(target.url, { waitUntil: 'load', timeout: 35000 });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(OUT_DIR, target.out) });
        console.log(`Saved ${target.out} on retry`);
      } catch (e) {
        console.error(`Retry failed for ${target.url}:`, e.message);
      }
    }
  }

  await browser.close();
  console.log('GitHub evidence capture completed.');
}

capture().catch(console.error);
