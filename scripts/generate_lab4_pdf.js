const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_PDF = '/Users/martin/Uni/CPE334 Soft Eng/Lab4/Lab Report 04.pdf';

function toBase64Uri(relPath) {
  const absPath = path.join(REPO_ROOT, relPath);
  if (!fs.existsSync(absPath)) {
    console.warn(`Warning: Image not found: ${absPath}`);
    return '';
  }
  const data = fs.readFileSync(absPath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Report_lab_04</title>
<style>
  @page {
    size: letter;
    margin: 0.8in;
  }
  * {
    box-sizing: border-box;
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #000000;
    margin: 0;
    padding: 0;
    font-size: 10pt;
    line-height: 1.4;
  }
  .title-text {
    font-size: 20pt;
    font-weight: bold;
    color: #000000;
    margin-top: 0;
    margin-bottom: 12pt;
  }
  h1 {
    font-size: 15pt;
    font-weight: bold;
    color: #000000;
    margin-top: 4pt;
    margin-bottom: 6pt;
    page-break-after: avoid;
  }
  h2 {
    font-size: 12pt;
    font-weight: bold;
    color: #000000;
    margin-top: 10pt;
    margin-bottom: 4pt;
    page-break-after: avoid;
  }
  p {
    margin-top: 0;
    margin-bottom: 4pt;
    color: #000000;
  }
  .title-meta p {
    font-size: 11pt;
    margin-bottom: 4pt;
  }
  .page-break {
    page-break-after: always;
  }
  .img-container {
    text-align: center;
    margin: 4pt 0 8pt 0;
    page-break-inside: avoid;
  }
  img {
    max-width: 100%;
    max-height: 340px;
    width: auto;
    height: auto;
  }
  .img-single {
    max-height: 540px;
  }
  .img-compact {
    max-height: 310px;
  }
  .img-medium {
    max-width: 85%;
    max-height: 340px;
  }
  .img-small {
    max-width: 65%;
    max-height: 340px;
  }
</style>
</head>
<body>

  <!-- TITLE PAGE -->
  <p class="title-text">Report_lab_04</p>
  <div class="title-meta">
    <p><b>Pawarit Wongdaeng 67070503466</b></p>
    <p>Github : martinvadre</p>
    <p><b>Peer reviewer : Tatchakorn Thamnimitr 67070503415</b></p>
    <p>Github : Magiciancat9</p>
    <p>Repository : https://github.com/martinvadre/toktickit</p>
    <p style="margin-bottom: 12pt;">Project Kanban : https://github.com/users/martinvadre/projects/3</p>
  </div>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_repo_main.png')}" style="max-height: 480px;" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 1 -->
  <h1>Answer Part 1: Git Use with Engineering Workflow</h1>
  <p>Repository : https://github.com/martinvadre/toktickit</p>
  <p>Project : https://github.com/users/martinvadre/projects/3</p>
  <p>Issue 17 : https://github.com/martinvadre/toktickit/issues/55</p>
  <p>Issue 18 : https://github.com/martinvadre/toktickit/issues/56</p>
  <p>Issue 19 : https://github.com/martinvadre/toktickit/issues/57</p>
  <p>Issue 20 : https://github.com/martinvadre/toktickit/issues/58</p>
  <p>Issue 21 : https://github.com/martinvadre/toktickit/issues/68</p>
  <p>Issue 22 : https://github.com/martinvadre/toktickit/issues/71</p>
  <p>Pull request 1 : https://github.com/martinvadre/toktickit/pull/62</p>
  <p>Pull request 2 : https://github.com/martinvadre/toktickit/pull/63</p>
  <p>Pull request 3 : https://github.com/martinvadre/toktickit/pull/64</p>
  <p>Pull request 4 : https://github.com/martinvadre/toktickit/pull/65</p>
  <p>Pull request 5 : https://github.com/martinvadre/toktickit/pull/70</p>
  <p>Pull request 6 : https://github.com/martinvadre/toktickit/pull/72</p>
  <p>Pull request main : https://github.com/martinvadre/toktickit/pull/73</p>
  <p>Peer review PR 1 : https://github.com/Magiciancat9/toktickit/pull/60</p>
  <p>Peer review PR 2 : https://github.com/Magiciancat9/toktickit/pull/63</p>
  <p>Peer review PR 3 : https://github.com/Magiciancat9/toktickit/pull/65</p>
  <p>Peer review PR 4 : https://github.com/Magiciancat9/toktickit/pull/67</p>
  <p>Peer review PR 5 : https://github.com/Magiciancat9/toktickit/pull/76</p>
  <p>Peer review PR 6 : https://github.com/Magiciancat9/toktickit/pull/77</p>
  <p>Peer review PR 7 : https://github.com/Magiciancat9/toktickit/pull/78</p>
  <p>Peer review PR 8 : https://github.com/Magiciancat9/toktickit/pull/79</p>
  <p>Peer review PR 9 : https://github.com/Magiciancat9/toktickit/pull/80</p>
  <p>Peer review PR 10 : https://github.com/Magiciancat9/toktickit/pull/81</p>
  <p>Peer review PR 11 : https://github.com/Magiciancat9/toktickit/pull/82</p>
  <p>Peer review PR 12 : https://github.com/Magiciancat9/toktickit/pull/83</p>
  <p style="margin-bottom: 12pt;">Peer review PR main : https://github.com/Magiciancat9/toktickit/pull/84</p>
  <div class="page-break"></div>

  <h2>Kanban board</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_kanban.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Commit History</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_git_commit_graph.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>All Issue</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_all_issues.png')}" />
  </div>

  <h2>Issue 17 - https://github.com/martinvadre/toktickit/issues/55</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_issue55.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Issue 18 - https://github.com/martinvadre/toktickit/issues/56</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_issue56.png')}" />
  </div>

  <h2>Issue 19 - https://github.com/martinvadre/toktickit/issues/57</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_issue57.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Issue 20 - https://github.com/martinvadre/toktickit/issues/58</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_issue58.png')}" />
  </div>

  <h2>Issue 21 - https://github.com/martinvadre/toktickit/issues/68</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_issue68.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Issue 22 - https://github.com/martinvadre/toktickit/issues/71</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_issue71.png')}" />
  </div>

  <h2>All Pull Requests</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_all_prs.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Pull Requests 1 - https://github.com/martinvadre/toktickit/pull/62</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_pr62.png')}" />
  </div>

  <h2>Pull Requests 2 - https://github.com/martinvadre/toktickit/pull/63</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_pr63.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Pull Requests 3 - https://github.com/martinvadre/toktickit/pull/64</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_pr64.png')}" />
  </div>

  <h2>Pull Requests 4 - https://github.com/martinvadre/toktickit/pull/65</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_pr65.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Pull Requests 5 - https://github.com/martinvadre/toktickit/pull/70</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_pr70.png')}" />
  </div>

  <h2>Pull Requests 6 - https://github.com/martinvadre/toktickit/pull/72</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_pr72.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Pull Requests main - https://github.com/martinvadre/toktickit/pull/73</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_pr73.png')}" />
  </div>

  <h2>Peer Review PR 1 (Partner @Magiciancat9) - https://github.com/Magiciancat9/toktickit/pull/60</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_partner_pr60.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Peer Review PR 2 (Partner @Magiciancat9) - https://github.com/Magiciancat9/toktickit/pull/63</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_partner_pr63.png')}" />
  </div>

  <h2>Peer Review PR 3 (Partner @Magiciancat9) - https://github.com/Magiciancat9/toktickit/pull/65</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_partner_pr65.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Peer Review PR 4 (Partner @Magiciancat9) - https://github.com/Magiciancat9/toktickit/pull/67</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_partner_pr67.png')}" />
  </div>

  <h2>Peer Review PR 5 (Partner @Magiciancat9) - https://github.com/Magiciancat9/toktickit/pull/76</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_partner_pr76.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Peer Review PR 6 (Partner @Magiciancat9) - https://github.com/Magiciancat9/toktickit/pull/77</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_partner_pr77.png')}" />
  </div>

  <h2>Peer Review PR 7 (Partner @Magiciancat9) - https://github.com/Magiciancat9/toktickit/pull/78</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_partner_pr78.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Peer Review PR 8 (Partner @Magiciancat9) - https://github.com/Magiciancat9/toktickit/pull/79</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_partner_pr79.png')}" />
  </div>

  <h2>Peer Review PR 9 (Partner @Magiciancat9) - https://github.com/Magiciancat9/toktickit/pull/80</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_partner_pr80.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Peer Review PR 10 (Partner @Magiciancat9) - https://github.com/Magiciancat9/toktickit/pull/81</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_partner_pr81.png')}" />
  </div>

  <h2>Peer Review PR 11 (Partner @Magiciancat9) - https://github.com/Magiciancat9/toktickit/pull/82</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_partner_pr82.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Peer Review PR 12 (Partner @Magiciancat9) - https://github.com/Magiciancat9/toktickit/pull/83</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_partner_pr83.png')}" />
  </div>

  <h2>Peer Review PR main (Partner @Magiciancat9) - https://github.com/Magiciancat9/toktickit/pull/84</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_partner_pr84.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Directory Structure & .gitignore</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_directory_structure.png')}" />
  </div>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_gitignore.png')}" class="img-medium" />
  </div>
  <div class="page-break"></div>

  <h2>Rendered README.md</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_readme_rendered.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Rendered Reviewer.md</h2>
  <p><b>Author: Pawarit Wongdaeng 67070503466 - GitHub: @martinvadre</b></p>
  <p><b>Peer reviewer: Tatchakorn Thamnimitr 67070503415 - GitHub: @Magiciancat9</b></p>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_reviewer_rendered.png')}" class="img-compact" />
  </div>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_reviewer_rendered_2.png')}" class="img-compact" />
  </div>
  <div class="page-break"></div>

  <h2>Rendered Reviewer.md (Partner PR Reviews Continued)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_reviewer_rendered_3.png')}" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 2 -->
  <h1>Answer Part 2: Spec DD (Specification-Driven Development)</h1>
  <p><b>Specification Link: https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/specification.md</b></p>

  <h2>Rendered docs/lab-04/specification.md</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part2_spec_rendered.png')}" class="img-compact" />
  </div>

  <h2>Early Specification Proof: Commit 6eae025 & PR #62</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part2_spec_early_proof.png')}" class="img-compact" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 3 -->
  <h1>Answer Part 3: Test DD and Traceability</h1>
  <p><b>Test Plan Link: https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/tests.md</b></p>

  <h2>Rendered docs/lab-04/tests.md</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part3_tests_rendered.png')}" class="img-compact" />
  </div>

  <h2>Vitest Backend Suite (92 / 92 Passing)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part3_test_backend_pass.png')}" class="img-compact" />
  </div>
  <div class="page-break"></div>

  <h2>Vitest Frontend Suite (53 / 53 Passing)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part3_test_frontend_pass.png')}" />
  </div>

  <h2>Playwright End-to-End Suite (14 / 14 Passing)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part3_test_e2e_pass.png')}" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 4 -->
  <h1>Answer Part 4: AI Use with Reflection</h1>
  <p><b>AI Log Link: https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/ai-use.md</b></p>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part4_ai_use_rendered.png')}" class="img-single" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 5 -->
  <h1>Answer Part 5: Working IT Staff Dashboard UI</h1>

  <h2>1. IT Staff Dashboard (Desktop View 1280px)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/staff-dashboard/desktop.png')}" class="img-compact" />
  </div>

  <h2>2. Database Query Proof</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part5_staff_dashboard_sql_proof.png')}" class="img-compact" />
  </div>
  <div class="page-break"></div>

  <h2>3. IT Staff Dashboard (Tablet View 768px)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/staff-dashboard/tablet.png')}" class="img-medium" />
  </div>

  <h2>4. IT Staff Dashboard (Mobile View 375px)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/staff-dashboard/mobile.png')}" class="img-small" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 6 -->
  <h1>Answer Part 6: Working Actions Taken UI</h1>

  <h2>1. IT Staff Ticket Detail with Actions Taken List (Desktop)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/actions-taken/staff-actions-desktop.png')}" class="img-compact" />
  </div>

  <h2>2. Record / Edit Action Taken Modal</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/actions-taken/action-modal.png')}" class="img-compact" />
  </div>
  <div class="page-break"></div>

  <h2>3. Requester Ticket Detail (Read-Only Actions Taken View)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/actions-taken/requester-actions-desktop.png')}" class="img-single" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 7 -->
  <h1>Answer Part 7: Working Ticket Workflow</h1>

  <h2>1. Mandatory Resolution Summary Modal</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part7_resolution_modal.png')}" class="img-compact" />
  </div>

  <h2>2. Requester Resolution Indication Badge</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part7_advisory_cue.png')}" class="img-compact" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 8 -->
  <h1>Answer Part 8: Working Requester Dashboard and Final Regression UI</h1>

  <h2>1. Requester Dashboard (Desktop View 1280px)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/requester-dashboard/desktop.png')}" class="img-compact" />
  </div>

  <h2>2. Requester Dashboard (Tablet View 768px)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/requester-dashboard/tablet.png')}" class="img-compact" />
  </div>
  <div class="page-break"></div>

  <h2>3. Requester Dashboard (Mobile View 375px)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/requester-dashboard/mobile.png')}" class="img-single" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 9 -->
  <h1>Answer Part 9: Zen Green UI, Responsive, Accessibility, and Final Polish</h1>
  <p><b>UI Spec Link: https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/ui-spec.md</b></p>

  <h2>Rendered docs/lab-04/ui-spec.md</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part9_ui_spec_rendered.png')}" class="img-compact" />
  </div>

  <h2>Zen Green Design & Accessibility Verification Checklist</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part9_visual_checklist.png')}" class="img-compact" />
  </div>

</body>
</html>
`;

async function main() {
  console.log('Launching headless browser to compile Lab Report 04.pdf...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  fs.mkdirSync(path.dirname(OUT_PDF), { recursive: true });

  console.log('Rendering pixel-perfect PDF...');
  await page.pdf({
    path: OUT_PDF,
    format: 'Letter',
    printBackground: true,
    margin: {
      top: '0.8in',
      bottom: '0.8in',
      left: '0.8in',
      right: '0.8in',
    },
  });

  await browser.close();
  console.log(`Successfully generated PDF: ${OUT_PDF}`);
}

main().catch(console.error);
