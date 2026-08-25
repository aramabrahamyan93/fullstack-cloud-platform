import json
import os
import subprocess
from pathlib import Path


def main() -> None:
    before = os.environ["BEFORE_SHA"]
    head = os.environ["HEAD_SHA"]
    github_output = os.environ["GITHUB_OUTPUT"]

    changed_files = subprocess.check_output(
        ["git", "diff", "--name-only", before, head],
        text=True,
    ).splitlines()

    services = json.loads(Path("services.json").read_text())

    build_all = (
        "services.json" in changed_files
        or ".github/workflows/publish-images.yml" in changed_files
        or "scripts/github-actions/detect-changed-services.py" in changed_files
        or "scripts/github-actions/update-helm-image-tags.sh" in changed_files
    )

    selected = []

    for service in services:
        context = service["context"].lstrip("./").rstrip("/")

        if build_all or any(
            path == context or path.startswith(context + "/")
            for path in changed_files
        ):
            selected.append(service)

    print("Changed files:")
    for path in changed_files:
        print(f" - {path}")

    print("Selected services:")
    for service in selected:
        print(f" - {service['name']}")

    with open(github_output, "a", encoding="utf-8") as output:
        output.write(
            f"services={json.dumps(selected, separators=(',', ':'))}\n"
        )


if __name__ == "__main__":
    main()