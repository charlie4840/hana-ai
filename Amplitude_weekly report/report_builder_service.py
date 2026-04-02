"""
주간 보고서 웹 UI용: Amplitude(REST 또는 스냅샷) + generate_analysis + HTML 미리보기.
"""
from __future__ import annotations

import subprocess
import sys
from datetime import date
from pathlib import Path

from report_mail import (
    amplitude_rest_credentials_configured,
    fetch_amplitude_kpi_and_persist_context,
    kpi_tokens_from_snapshot,
    prepare_email_html,
    refresh_mcp_context_period_metadata,
    validate_mcp_files_for_cli_period,
)


def run_generate_analysis(base_dir: Path, *, timeout: int = 600) -> tuple[int, str]:
    proc = subprocess.run(
        [sys.executable, str(base_dir / "generate_analysis.py")],
        cwd=str(base_dir),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
    )
    log = (proc.stdout or "") + (proc.stderr or "")
    return proc.returncode, log


def build_weekly_report_preview(
    base_dir: Path, report_start: date, report_end: date
) -> tuple[str | None, dict[str, str] | None, str | None]:
    """
    Amplitude 데이터(REST 또는 MCP 스냅샷) + generate_analysis + 메일 HTML.
    Returns (html, kpi_overlay, error_message).
    """
    kpi_overlay: dict[str, str] | None = None
    if amplitude_rest_credentials_configured():
        try:
            kpi_overlay = fetch_amplitude_kpi_and_persist_context(
                base_dir, report_start, report_end
            )
        except Exception as e:
            return None, None, f"Amplitude REST 조회 실패: {e}"
    else:
        ok, err = validate_mcp_files_for_cli_period(base_dir, report_start, report_end)
        if not ok:
            return None, None, err
        refresh_mcp_context_period_metadata(base_dir, report_start, report_end)
        kpi_overlay = kpi_tokens_from_snapshot(base_dir, report_start, report_end)
        if not kpi_overlay:
            return None, None, "스냅샷에서 KPI 치환값을 만들 수 없습니다."

    gen_code, gen_log = run_generate_analysis(base_dir)
    if gen_code != 0:
        tail = (gen_log[-3500:] if gen_log else "") or f"종료 코드 {gen_code}"
        return None, None, f"여정·시사점 생성 실패:\n{tail}"

    html = prepare_email_html(
        base_dir, report_start, report_end, kpi_overlay=kpi_overlay
    )
    return html, kpi_overlay, None
