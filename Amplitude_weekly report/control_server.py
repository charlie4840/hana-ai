"""
로컬 제어 패널: 프롬프트 편집 + 주간 보고서 미리보기·발송.
실행: python control_server.py  →  http://127.0.0.1:8765
"""
from __future__ import annotations

import os
import uuid
from datetime import date
from pathlib import Path

from flask import Flask, Response, abort, jsonify, request, session

from report_builder_service import build_weekly_report_preview
from report_mail import (
    load_env_file,
    save_prompt_files_if_non_empty,
    send_weekly_report_email,
)

BASE_DIR = Path(__file__).resolve().parent
MAX_PROMPT_CHARS = 500_000

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-local-change-me-report-builder")

# 세션별 미리보기 HTML·KPI (로컬 단일 사용자 가정)
_preview_cache: dict[str, dict] = {}


@app.get("/")
def index() -> Response:
    html_path = BASE_DIR / "control_panel.html"
    if not html_path.is_file():
        return Response("control_panel.html 없음", status=404, mimetype="text/plain; charset=utf-8")
    return Response(
        html_path.read_text(encoding="utf-8"),
        mimetype="text/html; charset=utf-8",
    )


@app.get("/report-builder")
def report_builder_page() -> Response:
    html_path = BASE_DIR / "report_builder.html"
    if not html_path.is_file():
        return Response("report_builder.html 없음", status=404, mimetype="text/plain; charset=utf-8")
    return Response(
        html_path.read_text(encoding="utf-8"),
        mimetype="text/html; charset=utf-8",
    )


@app.get("/api/prompts")
def api_prompts():
    journey_path = BASE_DIR / "prompts" / "journey-prompt.txt"
    insights_path = BASE_DIR / "prompts" / "insights-prompt.txt"
    return jsonify(
        {
            "journey_prompt": journey_path.read_text(encoding="utf-8")
            if journey_path.is_file()
            else "",
            "insights_prompt": insights_path.read_text(encoding="utf-8")
            if insights_path.is_file()
            else "",
        }
    )


@app.post("/api/save-prompts")
def api_save_prompts():
    data = request.get_json(silent=True) or {}
    journey = data.get("journey_prompt", "")
    insights = data.get("insights_prompt", "")

    if not isinstance(journey, str):
        journey = ""
    if not isinstance(insights, str):
        insights = ""

    if journey.strip() and len(journey) > MAX_PROMPT_CHARS:
        return jsonify({"ok": False, "error": "여정지도 프롬프트가 너무 깁니다."}), 400
    if insights.strip() and len(insights) > MAX_PROMPT_CHARS:
        return jsonify({"ok": False, "error": "시사점 프롬프트가 너무 깁니다."}), 400

    try:
        save_prompt_files_if_non_empty(BASE_DIR, journey, insights)
        return jsonify({"ok": True, "message": "프롬프트가 성공적으로 저장되었습니다."})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.post("/api/report/preview")
def api_report_preview():
    data = request.get_json(silent=True) or {}
    start_s = data.get("start")
    end_s = data.get("end")
    if not start_s or not end_s:
        return jsonify(ok=False, error="start 와 end 가 필요합니다."), 400
    try:
        report_start = date.fromisoformat(str(start_s).strip()[:10])
        report_end = date.fromisoformat(str(end_s).strip()[:10])
    except ValueError:
        return jsonify(ok=False, error="날짜는 YYYY-MM-DD 형식이어야 합니다."), 400
    if report_end < report_start:
        return jsonify(ok=False, error="종료일은 시작일 이상이어야 합니다."), 400

    load_env_file(BASE_DIR / ".env")
    html, kpi_overlay, err = build_weekly_report_preview(BASE_DIR, report_start, report_end)
    if err:
        return jsonify(ok=False, error=err), 400
    if not html or not kpi_overlay:
        return jsonify(ok=False, error="미리보기 HTML 생성에 실패했습니다."), 500

    sid = session.get("rb_sid") or str(uuid.uuid4())
    session["rb_sid"] = sid
    _preview_cache[sid] = {
        "html": html,
        "kpi_overlay": kpi_overlay,
        "start": report_start.isoformat(),
        "end": report_end.isoformat(),
    }
    return jsonify(ok=True)


@app.get("/api/report/preview-html")
def api_report_preview_html():
    sid = session.get("rb_sid")
    if not sid or sid not in _preview_cache:
        abort(404)
    row = _preview_cache[sid]
    return Response(row["html"], mimetype="text/html; charset=utf-8")


@app.post("/api/report/send")
def api_report_send():
    data = request.get_json(silent=True) or {}
    start_s = str(data.get("start") or "").strip()[:10]
    end_s = str(data.get("end") or "").strip()[:10]
    sid = session.get("rb_sid")
    if not sid or sid not in _preview_cache:
        return jsonify(ok=False, error="먼저 「주간보고 만들기」로 미리보기를 생성하세요."), 400
    cached = _preview_cache[sid]
    if cached["start"] != start_s or cached["end"] != end_s:
        return jsonify(
            ok=False,
            error="화면의 시작·종료일이 미리보기와 같아야 발송할 수 있습니다.",
        ), 400

    load_env_file(BASE_DIR / ".env")
    report_start = date.fromisoformat(cached["start"])
    report_end = date.fromisoformat(cached["end"])
    kpi_overlay = cached["kpi_overlay"]
    try:
        receivers, mail_subject = send_weekly_report_email(
            BASE_DIR,
            report_start,
            report_end,
            load_dotenv=False,
            kpi_overlay=kpi_overlay,
        )
    except Exception as e:
        return jsonify(ok=False, error=str(e)), 500
    return jsonify(ok=True, receivers=receivers, subject=mail_subject)


def main() -> None:
    load_env_file(BASE_DIR / ".env")
    port = int(os.getenv("CONTROL_PANEL_PORT", "8765"))
    print(f"제어 패널: http://127.0.0.1:{port}/")
    print(f"주간 보고서: http://127.0.0.1:{port}/report-builder")
    app.run(host="127.0.0.1", port=port, debug=False, threaded=True)


if __name__ == "__main__":
    main()
