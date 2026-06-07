#!/usr/bin/env python3

import json
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
SERVICES_FILE = REPO_ROOT / "services.json"

ALLOWED_TYPES = {"api", "web", "worker"}


def fail(message: str) -> None:
    print(f"ERROR: {message}")
    sys.exit(1)


def warn(message: str) -> None:
    print(f"WARNING: {message}")


def require_string(service: dict[str, Any], key: str) -> str:
    value = service.get(key)

    if not isinstance(value, str) or not value.strip():
        fail(f"Service '{service.get('name', '<unknown>')}' must define non-empty string '{key}'.")

    return value.strip()


def require_bool(service: dict[str, Any], key: str) -> bool:
    value = service.get(key)

    if not isinstance(value, bool):
        fail(f"Service '{service.get('name', '<unknown>')}' must define boolean '{key}'.")

    return value


def optional_int(service: dict[str, Any], key: str) -> int | None:
    value = service.get(key)

    if value is None:
        return None

    if not isinstance(value, int):
        fail(f"Service '{service.get('name', '<unknown>')}' field '{key}' must be an integer.")

    return value


def validate_service(service: dict[str, Any], names: set[str], local_ports: set[int]) -> None:
    name = require_string(service, "name")

    if name in names:
        fail(f"Duplicate service name found: {name}")

    names.add(name)

    service_type = require_string(service, "type")

    if service_type not in ALLOWED_TYPES:
        fail(f"Service '{name}' has invalid type '{service_type}'. Allowed: {sorted(ALLOWED_TYPES)}")

    context = require_string(service, "context")
    dockerfile = service.get("dockerfile", "Dockerfile")

    if not isinstance(dockerfile, str) or not dockerfile.strip():
        fail(f"Service '{name}' must define non-empty string 'dockerfile'.")

    image = require_string(service, "image")

    enabled = require_bool(service, "enabled")
    build = require_bool(service, "build")
    push = require_bool(service, "push")

    context_path = REPO_ROOT / context.replace("./", "", 1)
    dockerfile_path = context_path / dockerfile

    if not context_path.is_dir():
        fail(f"Service '{name}' context directory does not exist: {context_path}")

    if build and not dockerfile_path.is_file():
        fail(f"Service '{name}' Dockerfile does not exist: {dockerfile_path}")

    internal_port = optional_int(service, "internalPort")
    local_port = optional_int(service, "localPort")

    if service_type in {"api", "web"}:
        if internal_port is None:
            fail(f"Service '{name}' of type '{service_type}' must define 'internalPort'.")

        if local_port is None:
            fail(f"Service '{name}' of type '{service_type}' must define 'localPort'.")

        if local_port in local_ports:
            fail(f"Duplicate localPort found: {local_port}")

        local_ports.add(local_port)

        require_string(service, "healthPath")

    if service_type == "api":
        require_string(service, "livenessPath")
        require_string(service, "readinessPath")

        metrics_path = service.get("metricsPath")
        if metrics_path is not None and not isinstance(metrics_path, str):
            fail(f"Service '{name}' field 'metricsPath' must be a string if defined.")

    depends_on = service.get("dependsOn", [])

    if not isinstance(depends_on, list):
        fail(f"Service '{name}' field 'dependsOn' must be a list.")

    for dependency in depends_on:
        if not isinstance(dependency, str):
            fail(f"Service '{name}' field 'dependsOn' must contain only strings.")

    print(
        "OK:",
        name,
        f"type={service_type}",
        f"context={context}",
        f"image={image}",
        f"enabled={enabled}",
        f"build={build}",
        f"push={push}",
    )


def main() -> None:
    if not SERVICES_FILE.is_file():
        fail(f"services.json not found: {SERVICES_FILE}")

    try:
        services = json.loads(SERVICES_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"services.json is invalid JSON: {exc}")

    if not isinstance(services, list):
        fail("services.json must contain a JSON array.")

    if not services:
        fail("services.json must contain at least one service.")

    names: set[str] = set()
    local_ports: set[int] = set()

    print(f"Validating service registry: {SERVICES_FILE}")
    print()

    for service in services:
        if not isinstance(service, dict):
            fail("Each services.json entry must be an object.")

        validate_service(service, names, local_ports)

    print()
    print(f"Service registry validation completed successfully. Services: {len(services)}")


if __name__ == "__main__":
    main()