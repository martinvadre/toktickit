import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DOCX = "/Users/martin/Uni/CPE334/Lab4/Lab Report 04.docx"
OUT_PDF = "/Users/martin/Uni/CPE334/Lab4/Lab Report 04.pdf"

doc = docx.Document()

# -------------------------------------------------------------
# Page Margins & Setup (Letter 8.5 x 11 inches, 0.8 in margins)
# -------------------------------------------------------------
for sec in doc.sections:
    sec.page_width = Inches(8.5)
    sec.page_height = Inches(11.0)
    sec.top_margin = Inches(0.8)
    sec.bottom_margin = Inches(0.8)
    sec.left_margin = Inches(0.8)
    sec.right_margin = Inches(0.8)

# -------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------
def p_title(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(12)
    run = p.add_run(text)
    run.font.name = "Arial"
    run.font.size = Pt(20)
    run.bold = True
    return p

def p_h1(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    run = p.add_run(text)
    run.font.name = "Arial"
    run.font.size = Pt(15)
    run.bold = True
    return p

def p_h2(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text)
    run.font.name = "Arial"
    run.font.size = Pt(12)
    run.bold = True
    return p

def p_body(text, bold=False, italic=False, size=10, space_after=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    run = p.add_run(text)
    run.font.name = "Arial"
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    return p

def p_img(rel_path, width_inches=6.3, space_after=8):
    abs_path = os.path.join(REPO_ROOT, rel_path)
    if not os.path.exists(abs_path):
        print(f"WARNING: Image not found: {abs_path}")
        return None
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(space_after)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    run.add_picture(abs_path, width=Inches(width_inches))
    return p

def page_break():
    doc.add_page_break()

# =============================================================
# TITLE PAGE
# =============================================================
p_title("Report_lab_04")
p_body("Pawarit Wongdaeng 67070503466", bold=True, size=11)
p_body("Github : martinvadre", size=11)
p_body("Peer reviewer : Tatchakorn Thamnimitr 67070503415", bold=True, size=11)
p_body("Github : Magiciancat9", size=11)
p_body("Repository : https://github.com/martinvadre/toktickit", size=11)
p_body("Project Kanban : https://github.com/users/martinvadre/projects/3", size=11, space_after=12)

p_img("artifacts/lab-04/report/part1_github_repo_main.png", width_inches=6.3)
page_break()

# =============================================================
# ANSWER PART 1: GIT USE WITH ENGINEERING WORKFLOW
# =============================================================
p_h1("Answer Part 1: Git Use with Engineering Workflow")
p_body("Repository : https://github.com/martinvadre/toktickit")
p_body("Project : https://github.com/users/martinvadre/projects/3")
p_body("Issue 17 : https://github.com/martinvadre/toktickit/issues/55")
p_body("Issue 18 : https://github.com/martinvadre/toktickit/issues/56")
p_body("Issue 19 : https://github.com/martinvadre/toktickit/issues/57")
p_body("Issue 20 : https://github.com/martinvadre/toktickit/issues/58")
p_body("Issue 21 : https://github.com/martinvadre/toktickit/issues/68")
p_body("Issue 22 : https://github.com/martinvadre/toktickit/issues/71")
p_body("Pull request 1 : https://github.com/martinvadre/toktickit/pull/62")
p_body("Pull request 2 : https://github.com/martinvadre/toktickit/pull/63")
p_body("Pull request 3 : https://github.com/martinvadre/toktickit/pull/64")
p_body("Pull request 4 : https://github.com/martinvadre/toktickit/pull/65")
p_body("Pull request 5 : https://github.com/martinvadre/toktickit/pull/70")
p_body("Pull request 6 : https://github.com/martinvadre/toktickit/pull/72")
p_body("Pull request main : https://github.com/martinvadre/toktickit/pull/73", space_after=12)

p_h2("Kanban board")
p_img("artifacts/lab-04/report/part1_github_kanban.png", width_inches=6.3)
page_break()

p_h2("Commit History")
p_img("artifacts/lab-04/report/part1_git_commit_graph.png", width_inches=6.3)
page_break()

p_h2("All Issue")
p_img("artifacts/lab-04/report/part1_github_all_issues.png", width_inches=6.3)

p_h2("Issue 17 - https://github.com/martinvadre/toktickit/issues/55")
p_img("artifacts/lab-04/report/part1_github_issue55.png", width_inches=6.3)
page_break()

p_h2("Issue 18 - https://github.com/martinvadre/toktickit/issues/56")
p_img("artifacts/lab-04/report/part1_github_issue56.png", width_inches=6.3)

p_h2("Issue 19 - https://github.com/martinvadre/toktickit/issues/57")
p_img("artifacts/lab-04/report/part1_github_issue57.png", width_inches=6.3)
page_break()

p_h2("Issue 20 - https://github.com/martinvadre/toktickit/issues/58")
p_img("artifacts/lab-04/report/part1_github_issue58.png", width_inches=6.3)

p_h2("Issue 21 - https://github.com/martinvadre/toktickit/issues/68")
p_img("artifacts/lab-04/report/part1_github_issue68.png", width_inches=6.3)
page_break()

p_h2("Issue 22 - https://github.com/martinvadre/toktickit/issues/71")
p_img("artifacts/lab-04/report/part1_github_issue71.png", width_inches=6.3)

p_h2("All Pull Requests")
p_img("artifacts/lab-04/report/part1_github_all_prs.png", width_inches=6.3)
page_break()

p_h2("Pull Requests 1 - https://github.com/martinvadre/toktickit/pull/62")
p_img("artifacts/lab-04/report/part1_github_pr62.png", width_inches=6.3)

p_h2("Pull Requests 2 - https://github.com/martinvadre/toktickit/pull/63")
p_img("artifacts/lab-04/report/part1_github_pr63.png", width_inches=6.3)
page_break()

p_h2("Pull Requests 3 - https://github.com/martinvadre/toktickit/pull/64")
p_img("artifacts/lab-04/report/part1_github_pr64.png", width_inches=6.3)

p_h2("Pull Requests 4 - https://github.com/martinvadre/toktickit/pull/65")
p_img("artifacts/lab-04/report/part1_github_pr65.png", width_inches=6.3)
page_break()

p_h2("Pull Requests 5 - https://github.com/martinvadre/toktickit/pull/70")
p_img("artifacts/lab-04/report/part1_github_pr70.png", width_inches=6.3)

p_h2("Pull Requests 6 - https://github.com/martinvadre/toktickit/pull/72")
p_img("artifacts/lab-04/report/part1_github_pr72.png", width_inches=6.3)
page_break()

p_h2("Directory Structure & .gitignore")
p_img("artifacts/lab-04/report/part1_directory_structure.png", width_inches=6.3)
p_img("artifacts/lab-04/report/part1_gitignore.png", width_inches=5.8)
page_break()

p_h2("Rendered README.md")
p_img("artifacts/lab-04/report/part1_readme_rendered.png", width_inches=6.3)
page_break()

p_h2("Rendered Reviewer.md")
p_body("Author: Pawarit Wongdaeng 67070503466 - GitHub: @martinvadre", bold=True)
p_body("Peer reviewer: Tatchakorn Thamnimitr 67070503415 - GitHub: @Magiciancat9", bold=True, space_after=8)
p_img("artifacts/lab-04/report/part1_reviewer_rendered.png", width_inches=6.3)
page_break()

# =============================================================
# ANSWER PART 2: SPEC DD
# =============================================================
p_h1("Answer Part 2: Spec DD (Specification-Driven Development)")
p_body("Specification Link: https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/specification.md", bold=True)
p_body("Documented numbered Functional Requirements (FR-01 to FR-15), Business Rules (BR-01 to BR-08), Acceptance Criteria (AC-01 to AC-10), Database Models (ActionTaken parent-child relations), Non-destructive Migration Decisions, Authoritative Status Lifecycle Transitions, and Product Definition of Done before implementation began.", space_after=8)

p_h2("Rendered docs/lab-04/specification.md")
p_img("artifacts/lab-04/report/part2_spec_rendered.png", width_inches=6.3)

p_h2("Early Specification Proof: Commit 6eae025 & PR #62")
p_body("PR #62 merged into lab4-staging at commit 6eae025 prior to any feature branch implementation.")
p_img("artifacts/lab-04/report/part2_spec_early_proof.png", width_inches=6.3)
page_break()

# =============================================================
# ANSWER PART 3: TEST DD AND TRACEABILITY
# =============================================================
p_h1("Answer Part 3: Test DD and Traceability")
p_body("Test Plan Link: https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/tests.md", bold=True)
p_body("Planned test matrix mapped 1:1 against Acceptance Criteria with 151 / 151 automated tests passing (100% success rate) across backend integration, frontend RTL components, and Playwright end-to-end workflows.", space_after=8)

p_h2("Rendered docs/lab-04/tests.md")
p_img("artifacts/lab-04/report/part3_tests_rendered.png", width_inches=6.3)

p_h2("Vitest Backend Suite (92 / 92 Passing across 21 test files)")
p_img("artifacts/lab-04/report/part3_test_backend_pass.png", width_inches=6.3)
page_break()

p_h2("Vitest Frontend Suite (53 / 53 Passing across 15 test files)")
p_img("artifacts/lab-04/report/part3_test_frontend_pass.png", width_inches=6.3)

p_h2("Playwright End-to-End Suite (14 / 14 Passing)")
p_img("artifacts/lab-04/report/part3_test_e2e_pass.png", width_inches=6.3)
page_break()

# =============================================================
# ANSWER PART 4: AI USE WITH REFLECTION
# =============================================================
p_h1("Answer Part 4: AI Use with Reflection")
p_body("AI Log Link: https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/ai-use.md", bold=True)
p_body("Rendered view of docs/lab-04/ai-use.md documenting Antigravity coding agent with Gemini 3.8 Flash (High), prompt iterations across 6 key development phases (PROMPT-01 to PROMPT-06), validation strategies, and engineering reflection on plan-first agent collaboration.", space_after=8)

p_img("artifacts/lab-04/report/part4_ai_use_rendered.png", width_inches=6.3)
page_break()

# =============================================================
# ANSWER PART 5: WORKING IT STAFF DASHBOARD UI
# =============================================================
p_h1("Answer Part 5: Working IT Staff Dashboard UI")
p_body("Demonstrates operational IT Staff dashboard summarizing service-desk workload with authoritative metric counters (New, Open, In Progress, Waiting for Requester, My Assigned), recent and urgent ticket alerts, quick action shortcuts, and seamless drill-down navigation into filtered queues. Counts are verified to match real-time database aggregation queries.", space_after=8)

p_h2("1. IT Staff Dashboard (Desktop View 1280px)")
p_img("artifacts/lab-04/screenshots/staff-dashboard/desktop.png", width_inches=6.2)

p_h2("2. Authoritative Database Query Proof")
p_img("artifacts/lab-04/report/part5_staff_dashboard_sql_proof.png", width_inches=6.0)
page_break()

p_h2("3. IT Staff Dashboard (Tablet View 768px)")
p_img("artifacts/lab-04/screenshots/staff-dashboard/tablet.png", width_inches=5.2)

p_h2("4. IT Staff Dashboard (Mobile View 375px)")
p_img("artifacts/lab-04/screenshots/staff-dashboard/mobile.png", width_inches=4.2)
page_break()

# =============================================================
# ANSWER PART 6: WORKING ACTIONS TAKEN UI
# =============================================================
p_h1("Answer Part 6: Working Actions Taken UI")
p_body("Demonstrates parent-child Actions Taken work structure under Ticket Detail. Each action captures Date/Time, Description, Result, Performed By (auto-populated), Follow-Up Required toggle, mandatory Follow-up Note, Attachment Notes, and status lifecycle (Completed / Cancelled). Supports multiple IT Staff performers per ticket (BR-02) while Requesters receive read-only visibility.", space_after=8)

p_h2("1. IT Staff Ticket Detail with Actions Taken List (Desktop)")
p_img("artifacts/lab-04/screenshots/actions-taken/staff-actions-desktop.png", width_inches=6.3)

p_h2("2. Record / Edit Action Taken Modal Dialog with Validation")
p_img("artifacts/lab-04/screenshots/actions-taken/action-modal.png", width_inches=6.0)
page_break()

p_h2("3. Requester Ticket Detail (Read-Only Actions Taken View)")
p_body("Requesters can review all action history for transparency, but all action editing/creation controls are strictly omitted.", italic=True)
p_img("artifacts/lab-04/screenshots/actions-taken/requester-actions-desktop.png", width_inches=6.3)
page_break()

# =============================================================
# ANSWER PART 7: WORKING TICKET WORKFLOW
# =============================================================
p_h1("Answer Part 7: Working Ticket Workflow")
p_body("Enforces the authoritative Ticket Status transition matrix (New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, Cancelled). Moving to Resolved or Closed strictly requires a formal Resolution Summary (>= 10 characters). Requester resolution indications are purely advisory and cannot bypass staff formal resolution. Stale concurrent updates trigger 409 Conflict alerts.", space_after=8)

p_h2("1. Mandatory Resolution Summary Gate Modal (>= 10 characters required)")
p_img("artifacts/lab-04/report/part7_resolution_modal.png", width_inches=6.2)

p_h2("2. Requester Advisory Resolution Cue (Badge Alert)")
p_img("artifacts/lab-04/report/part7_advisory_cue.png", width_inches=6.2)
page_break()

# =============================================================
# ANSWER PART 8: WORKING REQUESTER DASHBOARD AND FINAL REGRESSION UI
# =============================================================
p_h1("Answer Part 8: Working Requester Dashboard and Final Regression UI")
p_body("Demonstrates Requester dashboard summarizing only the authenticated Requester's tickets (My Open Tickets, In Progress, Resolved, Closed), recent activity, and quick navigation. Strict data isolation is enforced by the backend. Confirms full regression retention across all Labs 1-3 features (Auth, Passwords, My Tickets, Attachments, Comments, Notes, Admin User Management).", space_after=8)

p_h2("1. Requester Dashboard (Desktop View 1280px)")
p_img("artifacts/lab-04/screenshots/requester-dashboard/desktop.png", width_inches=6.2)

p_h2("2. Requester Dashboard (Tablet View 768px)")
p_img("artifacts/lab-04/screenshots/requester-dashboard/tablet.png", width_inches=5.2)
page_break()

p_h2("3. Requester Dashboard (Mobile View 375px)")
p_img("artifacts/lab-04/screenshots/requester-dashboard/mobile.png", width_inches=4.2)
page_break()

# =============================================================
# ANSWER PART 9: ZEN GREEN UI, RESPONSIVE, ACCESSIBILITY, AND FINAL POLISH
# =============================================================
p_h1("Answer Part 9: Zen Green UI, Responsive, Accessibility, and Final Polish")
p_body("UI Spec Link: https://github.com/martinvadre/toktickit/blob/main/docs/lab-04/ui-spec.md", bold=True)
p_body("Full adherence to the Zen Green design system (#1E5E3A, #2B8251, #EBF5EE), completed visual and accessibility verification checklist, and seamless responsive behavior across Desktop (1280px), Tablet (768px), and Mobile (375px) viewports with zero horizontal scrolling or clipping.", space_after=8)

p_h2("Rendered docs/lab-04/ui-spec.md")
p_img("artifacts/lab-04/report/part9_ui_spec_rendered.png", width_inches=6.3)

p_h2("Zen Green Design & Accessibility Verification Checklist")
p_img("artifacts/lab-04/report/part9_visual_checklist.png", width_inches=6.3)

# Save DOCX
os.makedirs(os.path.dirname(OUT_DOCX), exist_ok=True)
doc.save(OUT_DOCX)
print(f"Successfully generated DOCX: {OUT_DOCX}")

# Convert DOCX to PDF using docx2pdf
try:
    print(f"Converting DOCX to PDF: {OUT_PDF}...")
    from docx2pdf import convert
    convert(OUT_DOCX, OUT_PDF)
    print(f"Successfully generated PDF: {OUT_PDF}")
except Exception as e:
    print(f"docx2pdf conversion notice: {e}")
    # Fallback to AppleScript Word conversion
    try:
        import subprocess
        script = f'''
        tell application "Microsoft Word"
            open file name "{OUT_DOCX}"
            set activeDoc to active document
            save as activeDoc file name "{OUT_PDF}" file format format PDF
            close activeDoc saving no
        end tell
        '''
        subprocess.run(["osascript", "-e", script], check=True)
        print(f"Successfully generated PDF via AppleScript: {OUT_PDF}")
    except Exception as e2:
        print(f"AppleScript conversion failed: {e2}")
