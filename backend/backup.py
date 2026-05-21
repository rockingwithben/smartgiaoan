"""
MongoDB backup utilities for the SmartGiaoAn backend.

This module provides lightweight, filesystem-backed backup operations
that can be invoked from admin endpoints or via a scheduled task.

Features:
- perform_mongo_backup: runs mongodump to create a compressed archive
  of the configured database and writes it to a backups/ directory.
- list_backups: lists available backup archives with basic metadata.

Notes:
- This script assumes the mongodump CLI is installed and accessible on PATH.
- The backup directory is ./backups relative to this file.
- Backups are named mongo-backup-YYYYMMDDTHHMMSSZ.archive.gz
"""
from __future__ import annotations

import os
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List

# Local backups directory (created if missing)
BACKUP_DIR = Path(__file__).parent / "backups"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

def _timestamp() -> str:
    """Return a UTC timestamp suitable for filenames."""
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

def perform_mongo_backup(mongo_uri: str | None = None, backup_dir: Path | None = None) -> Dict[str, object]:
    """
    Perform a MongoDB backup using mongodump.

    Args:
        mongo_uri: MongoDB connection URI. If None, tries to read MONGO_URL env var.
        backup_dir: Directory to place the backup archive. If None, uses the default BACKUP_DIR.

    Returns:
        dict with keys: { success: bool, path: str, stdout: str, stderr: str, error: str (optional) }
    """
    uri = mongo_uri or os.environ.get("MONGO_URL") or ""
    target_dir = Path(backup_dir) if backup_dir else BACKUP_DIR
    target_dir.mkdir(parents=True, exist_ok=True)

    timestamp = _timestamp()
    archive_path = target_dir / f"mongo-backup-{timestamp}.archive.gz"

    cmd = ["mongodump", "--uri", uri, "--archive=" + str(archive_path), "--gzip"]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=False)
        success = result.returncode == 0
        return {
            "success": success,
            "path": str(archive_path),
            "stdout": result.stdout,
            "stderr": result.stderr,
        }
    except Exception as exc:
        return {
            "success": False,
            "path": str(archive_path),
            "stdout": "",
            "stderr": "",
            "error": str(exc),
        }

def list_backups(backup_dir: Path | None = None) -> List[Dict[str, object]]:
    """
    List existing backups in the backup directory.

    Returns:
        List of dicts with keys: name, path, modified (epoch seconds)
    """
    base = Path(backup_dir) if backup_dir else BACKUP_DIR
    if not base.exists():
        return []
    backups: List[Dict[str, object]] = []
    for p in sorted(base.glob("mongo-backup-*.archive.gz"), reverse=True):
        try:
            mtime = p.stat().st_mtime
        except FileNotFoundError:
            continue
        backups.append({"name": p.name, "path": str(p), "modified": int(mtime)})
    return backups

__all__ = ["perform_mongo_backup", "list_backups"]