import argparse
import subprocess
import sys
from datetime import date, datetime
from pathlib import Path

from report_mail import (
    amplitude_rest_credentials_configured,
    fetch_amplitude_kpi_and_persist_context,
    get_report_week_range,
    kpi_tokens_from_snapshot,
    load_env_file,
    refresh_mcp_context_period_metadata,
    send_weekly_report_email,
    validate_mcp_files_for_cli_period,
)


def _parse_date(s: str) -> date:
    return date.fromisoformat(s.strip())


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(
        description=(
            "선택(또는 자동 지난주) 기간: (1) REST 키 있으면 API 조회 "
            "(2) --mcp 이면 amplitude_snapshot.json(MCP로 채움) → "
            "generate_analysis → SMTP 발송"
        )
    )
    parser.add_argument(
        "--start",
        type=str,
        default="",
        help="리포트 시작일 YYYY-MM-DD (지정 시 --end 와 함께 사용)",
    )
    parser.add_argument(
        "--end",
        type=str,
        default="",
        help="리포트 종료일 YYYY-MM-DD",
    )
    parser.add_argument(
        "--mcp",
        action="store_true",
        help=(
            "REST 키 없이 발송. amplitude_snapshot.json 의 weekly_interval_7 에 "
            "리포트 시작일이 속한 주 월요일 키·UV/PV 가 있어야 함."
        ),
    )
    args = parser.parse_args()

    load_env_file(base_dir / ".env")

    if args.start and args.end:
        report_start = _parse_date(args.start)
        report_end = _parse_date(args.end)
        if report_end < report_start:
            raise ValueError("종료일은 시작일 이상이어야 합니다.")
    elif args.start or args.end:
        raise ValueError("--start 와 --end 를 함께 지정하세요.")
    else:
        report_start, report_end = get_report_week_range(datetime.now())

    if args.mcp:
        ok, err = validate_mcp_files_for_cli_period(base_dir, report_start, report_end)
        if not ok:
            print(err, file=sys.stderr)
            sys.exit(1)
        refresh_mcp_context_period_metadata(base_dir, report_start, report_end)
        kpi_overlay = kpi_tokens_from_snapshot(base_dir, report_start, report_end)
        if not kpi_overlay:
            print(
                "KPI 치환값을 만들 수 없습니다. amplitude_snapshot.json 의 퍼널·플랫폼 필드를 확인하세요.",
                file=sys.stderr,
            )
            sys.exit(1)
    elif amplitude_rest_credentials_configured():
        try:
            kpi_overlay = fetch_amplitude_kpi_and_persist_context(
                base_dir, report_start, report_end
            )
        except Exception as e:
            print(f"Amplitude REST 수집 실패: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        print(
            "Amplitude REST 키가 없습니다. 다음 중 하나를 선택하세요.\n"
            "  · .env 에 AMPLITUDE_API_KEY + AMPLITUDE_SECRET_KEY(또는 AMPLITUDE_SECRET) 설정\n"
            "  · Cursor Amplitude MCP로 amplitude_snapshot.json 을 채운 뒤 "
            "`python send_email.py --mcp --start … --end …` 실행",
            file=sys.stderr,
        )
        sys.exit(1)

    gen_log = ""
    gen_code = 0
    try:
        proc = subprocess.run(
            [sys.executable, str(base_dir / "generate_analysis.py")],
            cwd=str(base_dir),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=600,
        )
        gen_code = proc.returncode
        gen_log = (proc.stdout or "") + (proc.stderr or "")
    except subprocess.TimeoutExpired:
        gen_log = "generate_analysis.py 타임아웃(10분)"
        gen_code = -1
    except OSError as e:
        gen_log = str(e)
        gen_code = -1
    if gen_code != 0:
        print(
            gen_log[-4000:] or f"generate_analysis 종료 코드 {gen_code}",
            file=sys.stderr,
        )
        print(
            "여정·시사점 생성이 실패해 발송을 중단했습니다. "
            "GEMINI_API_KEY·프롬프트를 확인하거나, AI 생략이 필요하면 "
            "generate_analysis.py 의 SKIP_AI_ANALYSIS=1 을 설정하세요.",
            file=sys.stderr,
        )
        sys.exit(1)

    receivers, _ = send_weekly_report_email(
        base_dir, report_start, report_end, load_dotenv=False, kpi_overlay=kpi_overlay
    )
    print(f"메일 발송 완료: {', '.join(receivers)}")


if __name__ == "__main__":
    main()
