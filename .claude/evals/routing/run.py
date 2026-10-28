"""Which figure skill does Claude load for a request, with every skill present?

Runs each case in `cases.json` through `claude -p` in this repo, in plan mode with no
tool that can write, and records the skills it invokes. A case passes when one of them
is in `expect`, or when none is and `expect` holds "none". Run it after changing a
skill's description:

    python3 .claude/evals/routing/run.py [--model ID] [--repeat N]
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).parent
REPO = HERE.parents[2]
FIGURE_SKILLS = {
    'figures', 'figure-design', 'figure-diagram', 'figure-chart',
    'figure-shader', 'figure-code', 'figure-verify',
}
# figure-design is loaded alongside a kind's skill, so a run keeps going past it.
ALONGSIDE = {'figure-design'}
MAX_TOOLS = 20
MAX_SECONDS = 300


def invoked(prompt: str, model: str) -> list[str] | None:
    """Every skill invoked, or None when the CLI never started a session."""
    env = {key: value for key, value in os.environ.items() if key != 'CLAUDECODE'}
    process = subprocess.Popen(
        ['claude', '-p', prompt, '--output-format', 'stream-json', '--verbose',
         '--permission-mode', 'plan',
         '--disallowedTools', 'Bash', 'Write', 'Edit', 'NotebookEdit',
         '--model', model],
        cwd=REPO, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, env=env,
    )
    watchdog = threading.Timer(MAX_SECONDS, process.kill)
    watchdog.start()
    skills, tools, started = [], 0, False
    try:
        for line in process.stdout:
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue
            started = started or event.get('subtype') == 'init'
            if event.get('type') == 'assistant':
                for block in event['message'].get('content', []):
                    if block.get('type') == 'tool_use':
                        tools += 1
                        if block['name'] == 'Skill':
                            skills.append(block['input'].get('skill'))
            settled = any(skill not in ALONGSIDE for skill in skills)
            if settled or tools >= MAX_TOOLS or event.get('type') == 'result':
                break
    finally:
        watchdog.cancel()
        process.kill()
    return skills if started else None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', default='claude-opus-5-5')
    parser.add_argument('--repeat', type=int, default=1)
    args = parser.parse_args()

    cases = json.loads((HERE / 'cases.json').read_text()) * args.repeat
    with ThreadPoolExecutor(5) as pool:
        loaded = list(pool.map(lambda case: invoked(case['prompt'], args.model), cases))

    passed = 0
    for case, skills in zip(cases, loaded):
        if skills is None:
            print('ERROR claude did not start |', case['prompt'][:70])
            continue
        figure = [skill for skill in skills if skill in FIGURE_SKILLS]
        ok = any(skill in case['expect'] for skill in figure) if figure else 'none' in case['expect']
        passed += ok
        print('PASS' if ok else 'FAIL', skills or ['none'], '|', case['prompt'][:70])
    print(f'{passed} / {len(cases)}')


if __name__ == '__main__':
    main()
