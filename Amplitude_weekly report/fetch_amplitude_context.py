"""
Amplitude REST로 선택 기간(또는 자동 지난주) KPI를 조회해 amplitude_mcp_context.json 만 갱신합니다.
메일·generate_analysis 는 실행하지 않습니다. cron / 작업 스케줄러용.

사용:
  python fetch_amplitude_context.py
  python fetch_amplitude_context.py --start 2026-03-09 --end 2026-03-15

필요: .env 의 AMPLITUDE_API_KEY, AMPLITUDE_SECRET_KEY(또는 AMPLITUDE_SECRET)
"""
from __future__ import annotations

import argparse
import sys
from datetime import date, datetime
from pathlib import Path

from report_mail import (
    amplitude_rest_credentials_configured,
    fetch_amplitude_kpi_and_persist_context,
    get_report_week_range,
    load_env_file,
)


def _parse_date(s: str) -> date:
    return date.fromisoformat(s.strip())


def main() -> int:
    base_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Amplitude REST → amplitude_mcp_context.json 갱신만")
    parser.add_argument("--start", default="", help="YYYY-MM-DD (--end 와 함께)")
    parser.add_argument("--end", default="", help="YYYY-MM-DD")
    args = parser.parse_args()

    load_env_file(base_dir / ".env")

    if not amplitude_rest_credentials_configured():
        print(
            ".env 에 AMPLITUDE_API_KEY 와 AMPLITUDE_SECRET_KEY(또는 AMPLITUDE_SECRET) 가 필요합니다.",
            file=sys.stderr,
        )
        return 1

    if args.start and args.end:
        report_start = _parse_date(args.start)
        report_end = _parse_date(args.end)
        if report_end < report_start:
            print("종료일은 시작일 이상이어야 합니다.", file=sys.stderr)
            return 1
    elif args.start or args.end:
        print("--start 와 --end 를 함께 지정하세요.", file=sys.stderr)
        return 1
    else:
        report_start, report_end = get_report_week_range(datetime.now())

    try:
        fetch_amplitude_kpi_and_persist_context(base_dir, report_start, report_end)
    except Exception as e:
        print(f"조회 실패: {e}", file=sys.stderr)
        return 1

    print(f"갱신 완료: {report_start} ~ {report_end} → amplitude_mcp_context.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
