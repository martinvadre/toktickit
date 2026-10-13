const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_PDF = '/Users/martin/Uni/CPE334/Lab4/Lab Report 04.pdf';

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
    color: #1f2937;
    margin: 0;
    padding: 0;
    font-size: 10pt;
    line-height: 1.5;
  }
  h1 {
    font-size: 15pt;
    font-weight: bold;
    color: #111827;
    margin-top: 18pt;
    margin-bottom: 8pt;
    border-bottom: 1.5pt solid #1E5E3A;
    padding-bottom: 4pt;
  }
  h2 {
    font-size: 12pt;
    font-weight: bold;
    color: #1E5E3A;
    margin-top: 14pt;
    margin-bottom: 6pt;
  }
  p {
    margin-top: 0;
    margin-bottom: 6pt;
  }
  .title-page {
    padding-top: 10pt;
  }
  .title-page h1 {
    font-size: 24pt;
    color: #1E5E3A;
    border-bottom: 2pt solid #1E5E3A;
    padding-bottom: 8pt;
    margin-bottom: 14pt;
  }
  .meta-box {
    margin-bottom: 16pt;
    line-height: 1.6;
    font-size: 10.5pt;
  }
  .meta-box b {
    color: #111827;
  }
  .page-break {
    page-break-after: always;
  }
  .img-container {
    text-align: center;
    margin: 8pt 0 14pt 0;
  }
  img {
    max-width: 100%;
    height: auto;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  }
  .img-medium {
    max-width: 85%;
  }
  .img-small {
    max-width: 65%;
  }
  .link-list {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 10pt 14pt;
    margin-bottom: 14pt;
  }
  .link-list p {
    margin-bottom: 3pt;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 9pt;
  }
  a {
    color: #2563eb;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  .desc-box {
    background: #f0fdf4;
    border-left: 4px solid #2B8251;
    padding: 8pt 12pt;
    margin-bottom: 12pt;
    font-size: 9.5pt;
  }
</style>
</head>
<body>

  <!-- TITLE PAGE -->
  <div class="title-page">
    <h1>Report_lab_04</h1>
    <div class="meta-box">
      <p><b>Author:</b> Pawarit Wongdaeng 67070503466</p>
      <p><b>Github:</b> martinvadre</p>
      <p><b>Peer reviewer:</b> Tatchakorn Thamnimitr 67070503415</p>
      <p><b>Github:</b> Magiciancat9</p>
      <p><b>Repository:</b> <a href="https://github.com/martinvadre/toktickit">https://github.com/martinvadre/toktickit</a></p>
      <p><b>Project Kanban:</b> <a href="https://github.com/users/martinvadre/projects/3">https://github.com/users/martinvadre/projects/3</a></p>
    </div>
    <div class="img-container">
      <img src="${toBase64Uri('artifacts/lab-04/report/part1_github_repo_main.png')}" style="max-height: 480px;" />
    </div>
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 1 -->
  <h1>Answer Part 1: Git Use with Engineering Workflow</h1>
  <div class="link-list">
    <p><b>Repository :</b> <a href="https://github.com/martinvadre/toktickit">https://github.com/martinvadre/toktickit</a></p>
    <p><b>Project :</b> <a href="https://github.com/users/martinvadre/projects/3">https://github.com/users/martinvadre/projects/3</a></p>
    <p><b>Issue 17 :</b> <a href="https://github.com/martinvadre/toktickit/issues/55">https://github.com/martinvadre/toktickit/issues/55</a></p>
    <p><b>Issue 18 :</b> <a href="https://github.com/martinvadre/toktickit/issues/56">https://github.com/martinvadre/toktickit/issues/56</a></p>
    <p><b>Issue 19 :</b> <a href="https://github.com/martinvadre/toktickit/issues/57">https://github.com/martinvadre/toktickit/issues/57</a></p>
    <p><b>Issue 20 :</b> <a href="https://github.com/martinvadre/toktickit/issues/58">https://github.com/martinvadre/toktickit/issues/58</a></p>
    <p><b>Issue 21 :</b> <a href="https://github.com/martinvadre/toktickit/issues/68">https://github.com/martinvadre/toktickit/issues/68</a></p>
    <p><b>Issue 22 :</b> <a href="https://github.com/martinvadre/toktickit/issues/71">https://github.com/martinvadre/toktickit/issues/71</a></p>
    <p><b>Pull request 1 :</b> <a href="https://github.com/martinvadre/toktickit/pull/62">https://github.com/martinvadre/toktickit/pull/62</a></p>
    <p><b>Pull request 2 :</b> <a href="https://github.com/martinvadre/toktickit/pull/63">https://github.com/martinvadre/toktickit/pull/63</a></p>
    <p><b>Pull request 3 :</b> <a href="https://github.com/martinvadre/toktickit/pull/64">https://github.com/martinvadre/toktickit/pull/64</a></p>
    <p><b>Pull request 4 :</b> <a href="https://github.com/martinvadre/toktickit/pull/65">https://github.com/martinvadre/toktickit/pull/65</a></p>
    <p><b>Pull request 5 :</b> <a href="https://github.com/martinvadre/toktickit/pull/70">https://github.com/martinvadre/toktickit/pull/70</a></p>
    <p><b>Pull request 6 :</b> <a href="https://github.com/martinvadre/toktickit/pull/72">https://github.com/martinvadre/toktickit/pull/72</a></p>
    <p><b>Pull request main :</b> <a href="https://github.com/martinvadre/toktickit/pull/73">https://github.com/martinvadre/toktickit/pull/73</a></p>
  </div>

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
  <p><b>Author:</b> Pawarit Wongdaeng 67070503466 - GitHub: @martinvadre</p>
  <p><b>Peer reviewer:</b> Tatchakorn Thamnimitr 67070503415 - GitHub: @Magiciancat9</p>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part1_reviewer_rendered.png')}" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 2 -->
  <h1>Answer Part 2: Spec DD (Specification-Driven Development)</h1>
  <p><b>Specification Link:</b> <a href="https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/specification.md">https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/specification.md</a></p>
  <div class="desc-box">
    Documented numbered Functional Requirements (FR-01 to FR-15), Business Rules (BR-01 to BR-08), Acceptance Criteria (AC-01 to AC-10), Database Models (ActionTaken parent-child relations), Non-destructive Migration Decisions, Authoritative Status Lifecycle Transitions, and Product Definition of Done before implementation began.
  </div>

  <h2>Rendered docs/lab-04/specification.md</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part2_spec_rendered.png')}" />
  </div>

  <h2>Early Specification Proof: Commit 6eae025 & PR #62</h2>
  <p>PR #62 merged into lab4-staging at commit 6eae025 prior to any feature branch implementation.</p>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part2_spec_early_proof.png')}" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 3 -->
  <h1>Answer Part 3: Test DD and Traceability</h1>
  <p><b>Test Plan Link:</b> <a href="https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/tests.md">https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/tests.md</a></p>
  <div class="desc-box">
    Planned test matrix mapped 1:1 against Acceptance Criteria with 151 / 151 automated tests passing (100% success rate) across backend integration, frontend RTL components, and Playwright end-to-end workflows.
  </div>

  <h2>Rendered docs/lab-04/tests.md</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part3_tests_rendered.png')}" />
  </div>

  <h2>Vitest Backend Suite (92 / 92 Passing across 21 test files)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part3_test_backend_pass.png')}" />
  </div>
  <div class="page-break"></div>

  <h2>Vitest Frontend Suite (53 / 53 Passing across 15 test files)</h2>
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
  <p><b>AI Log Link:</b> <a href="https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/ai-use.md">https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/ai-use.md</a></p>
  <div class="desc-box">
    Rendered view of docs/lab-04/ai-use.md documenting Antigravity coding agent with Gemini 3.8 Flash (High), prompt iterations across 6 key development phases (PROMPT-01 to PROMPT-06), validation strategies, and engineering reflection on plan-first agent collaboration.
  </div>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part4_ai_use_rendered.png')}" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 5 -->
  <h1>Answer Part 5: Working IT Staff Dashboard UI</h1>
  <div class="desc-box">
    Demonstrates operational IT Staff dashboard summarizing service-desk workload with authoritative metric counters (New, Open, In Progress, Waiting for Requester, My Assigned), recent and urgent ticket alerts, quick action shortcuts, and seamless drill-down navigation into filtered queues. Counts are verified to match real-time database aggregation queries.
  </div>

  <h2>1. IT Staff Dashboard (Desktop View 1280px)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/staff-dashboard/desktop.png')}" />
  </div>

  <h2>2. Authoritative Database Query Proof</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part5_staff_dashboard_sql_proof.png')}" class="img-medium" />
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
  <div class="desc-box">
    Demonstrates parent-child Actions Taken work structure under Ticket Detail. Each action captures Date/Time, Description, Result, Performed By (auto-populated), Follow-Up Required toggle, mandatory Follow-up Note, Attachment Notes, and status lifecycle (Completed / Cancelled). Supports multiple IT Staff performers per ticket (BR-02) while Requesters receive read-only visibility.
  </div>

  <h2>1. IT Staff Ticket Detail with Actions Taken List (Desktop)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/actions-taken/staff-actions-desktop.png')}" />
  </div>

  <h2>2. Record / Edit Action Taken Modal Dialog with Validation</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/actions-taken/action-modal.png')}" class="img-medium" />
  </div>
  <div class="page-break"></div>

  <h2>3. Requester Ticket Detail (Read-Only Actions Taken View)</h2>
  <p><i>Requesters can review all action history for transparency, but all action editing/creation controls are strictly omitted.</i></p>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/actions-taken/requester-actions-desktop.png')}" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 7 -->
  <h1>Answer Part 7: Working Ticket Workflow</h1>
  <div class="desc-box">
    Enforces the authoritative Ticket Status transition matrix (New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, Cancelled). Moving to Resolved or Closed strictly requires a formal Resolution Summary (&gt;= 10 characters). Requester resolution indications are purely advisory and cannot bypass staff formal resolution. Stale concurrent updates trigger 409 Conflict alerts.
  </div>

  <h2>1. Mandatory Resolution Summary Gate Modal (&gt;= 10 characters required)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part7_resolution_modal.png')}" />
  </div>

  <h2>2. Requester Advisory Resolution Cue (Badge Alert)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part7_advisory_cue.png')}" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 8 -->
  <h1>Answer Part 8: Working Requester Dashboard and Final Regression UI</h1>
  <div class="desc-box">
    Demonstrates Requester dashboard summarizing only the authenticated Requester's tickets (My Open Tickets, In Progress, Resolved, Closed), recent activity, and quick navigation. Strict data isolation is enforced by the backend. Confirms full regression retention across all Labs 1-3 features (Auth, Passwords, My Tickets, Attachments, Comments, Notes, Admin User Management).
  </div>

  <h2>1. Requester Dashboard (Desktop View 1280px)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/requester-dashboard/desktop.png')}" />
  </div>

  <h2>2. Requester Dashboard (Tablet View 768px)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/requester-dashboard/tablet.png')}" class="img-medium" />
  </div>
  <div class="page-break"></div>

  <h2>3. Requester Dashboard (Mobile View 375px)</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/screenshots/requester-dashboard/mobile.png')}" class="img-small" />
  </div>
  <div class="page-break"></div>

  <!-- ANSWER PART 9 -->
  <h1>Answer Part 9: Zen Green UI, Responsive, Accessibility, and Final Polish</h1>
  <p><b>UI Spec Link:</b> <a href="https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/ui-spec.md">https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/ui-spec.md</a></p>
  <div class="desc-box">
    Full adherence to the Zen Green design system (#1E5E3A, #2B8251, #EBF5EE), completed visual and accessibility verification checklist, and seamless responsive behavior across Desktop (1280px), Tablet (768px), and Mobile (375px) viewports with zero horizontal scrolling or clipping.
  </div>

  <h2>Rendered docs/lab-04/ui-spec.md</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part9_ui_spec_rendered.png')}" />
  </div>

  <h2>Zen Green Design & Accessibility Verification Checklist</h2>
  <div class="img-container">
    <img src="${toBase64Uri('artifacts/lab-04/report/part9_visual_checklist.png')}" />
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
