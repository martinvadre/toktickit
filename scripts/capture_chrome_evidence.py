import subprocess
import time
import os

OUT_DIR = "/Users/martin/Uni/CPE334/toktickit/artifacts/lab-03/report"
os.makedirs(OUT_DIR, exist_ok=True)

TARGETS = [
    { "url": "https://github.com/martinvadre/toktickit", "out": "part1_github_repo_main.png", "wait": 3.0 },
    { "url": "https://github.com/users/martinvadre/projects/3", "out": "part1_github_kanban.png", "wait": 4.0 },
    { "url": "https://github.com/martinvadre/toktickit/commits/main", "out": "part1_git_commit_graph.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/issues?q=is%3Aissue", "out": "part1_github_all_issues.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/issues/29", "out": "part1_github_issue29.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/issues/30", "out": "part1_github_issue30.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/issues/31", "out": "part1_github_issue31.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/issues/32", "out": "part1_github_issue32.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/issues/33", "out": "part1_github_issue33.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/issues/34", "out": "part1_github_issue34.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/pulls?q=is%3Apr", "out": "part1_github_all_prs.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/pull/35", "out": "part1_github_pr35.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/pull/36", "out": "part1_github_pr36.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/pull/37", "out": "part1_github_pr37.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/pull/38", "out": "part1_github_pr38.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/pull/39", "out": "part1_github_pr39.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/pull/40", "out": "part1_github_pr40.png", "wait": 3.0 },
    { "url": "https://github.com/martinvadre/toktickit/pull/41", "out": "part1_github_pr41_main.png", "wait": 3.5 },
    { "url": "https://github.com/martinvadre/toktickit/blob/main/README.md", "out": "part1_readme_rendered.png", "wait": 3.5 },
    { "url": "https://github.com/martinvadre/toktickit/blob/main/docs/lab-03/reviewer.md", "out": "part1_reviewer_rendered.png", "wait": 3.5 },
    { "url": "https://github.com/martinvadre/toktickit/blob/main/docs/lab-03/specification.md", "out": "part2_spec_rendered.png", "wait": 3.5 },
    { "url": "https://github.com/martinvadre/toktickit/blob/main/docs/lab-03/tests.md", "out": "part3_tests_rendered.png", "wait": 3.5 },
    { "url": "https://github.com/martinvadre/toktickit/blob/main/docs/lab-03/ai-use.md", "out": "part4_ai_use_rendered.png", "wait": 3.5 },
    { "url": "https://github.com/martinvadre/toktickit/blob/main/docs/lab-03/ui-spec.md", "out": "part9_ui_spec_rendered.png", "wait": 3.5 },
]

def run_applescript(script):
    subprocess.run(["osascript", "-e", script], check=True)

try:
    # Setup Chrome window
    setup_script = """
    tell application "Google Chrome"
        activate
        set bounds of front window to {0, 33, 1512, 930}
    end tell
    tell application "System Events"
        set visible of process "Arc" to false
    end tell
    """
    run_applescript(setup_script)
    time.sleep(1)

    for i, target in enumerate(TARGETS):
        print(f"[{i+1}/{len(TARGETS)}] Navigating Chrome to {target['url']}...")
        nav_script = f"""
        tell application "Google Chrome"
            activate
            set bounds of front window to {0, 33, 1512, 930}
            set URL of active tab of front window to "{target['url']}"
        end tell
        """
        run_applescript(nav_script)
        time.sleep(target['wait'])

        out_path = os.path.join(OUT_DIR, target['out'])
        print(f"  Capturing to {target['out']}...")
        subprocess.run(["screencapture", "-x", "-R0,33,1512,897", out_path], check=True)

    print("All Chrome captures completed successfully!")
finally:
    # Restore Arc visibility
    try:
        run_applescript('tell application "System Events" to set visible of process "Arc" to true')
    except Exception as e:
        print(f"Could not restore Arc visibility: {e}")
