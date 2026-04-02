"""
주간 리포트 HTML 준비 및 SMTP 발송 공통 로직.
send_email.py, control_server.py 에서 사용합니다.
"""
from __future__ import annotations

import json
import os
import smtplib
from datetime import date, datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path


def load_env_file(env_path: Path, *, override: bool = False) -> None:
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if override:
            os.environ[key] = value
        else:
            os.environ.setdefault(key, value)


def get_week_of_month(target_date: date) -> int:
    return ((target_date.day - 1) // 7) + 1


def get_report_week_range(now: datetime) -> tuple[date, date]:
    current_monday = now.date() - timedelta(days=now.weekday())
    report_start = current_monday - timedelta(days=7)
    report_end = current_monday - timedelta(days=1)
    return report_start, report_end


def format_report_period_line(start: date, end: date) -> str:
    return f"{start:%Y.%m.%d} - {end:%Y.%m.%d}"


def format_chart_period_short(start: date, end: date) -> str:
    if start.year == end.year:
        return f"{start.year}.{start.month:02d}.{start.day:02d}–{end.month:02d}.{end.day:02d}"
    return f"{start:%Y.%m.%d}–{end:%Y.%m.%d}"


def prior_period_for_range(report_start: date, report_end: date) -> tuple[date, date]:
    days = (report_end - report_start).days + 1
    prior_end = report_start - timedelta(days=1)
    prior_start = prior_end - timedelta(days=days - 1)
    return prior_start, prior_end


def parse_range_kst_bounds(range_kst: str) -> tuple[date | None, date | None]:
    """`2026-03-09 - 2026-03-15` 또는 en dash 구간에서 시작일·종료일."""
    s = (range_kst or "").strip()
    if not s:
        return None, None
    for sep in (" - ", " – ", " — "):
        if sep in s:
            a, b = s.split(sep, 1)
            try:
                return date.fromisoformat(a.strip()[:10]), date.fromisoformat(b.strip()[:10])
            except ValueError:
                return None, None
    return None, None


def load_analysis_fragments(base_dir: Path) -> tuple[str, str]:
    generated = base_dir / "analysis-output.json"
    fallback = base_dir / "analysis-output.default.json"
    path = generated if generated.exists() else fallback
    if not path.exists():
        return "", ""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return "", ""
    return (
        str(data.get("journey_html", "") or ""),
        str(data.get("insights_html", "") or ""),
    )


def save_prompt_files_if_non_empty(
    base_dir: Path,
    journey_prompt: str,
    insights_prompt: str,
) -> None:
    """공백만이면 해당 파일은 덮어쓰지 않고 기존 내용을 유지합니다."""
    if journey_prompt.strip():
        (base_dir / "prompts" / "journey-prompt.txt").write_text(
            journey_prompt, encoding="utf-8", newline="\n"
        )
    if insights_prompt.strip():
        (base_dir / "prompts" / "insights-prompt.txt").write_text(
            insights_prompt, encoding="utf-8", newline="\n"
        )


def write_control_panel_context_file(
    base_dir: Path,
    report_start: date,
    report_end: date,
) -> None:
    ctx = build_control_panel_amplitude_context(report_start, report_end)
    (base_dir / "amplitude_mcp_context.json").write_text(
        json.dumps(ctx, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def fetch_amplitude_kpi_and_persist_context(
    base_dir: Path,
    report_start: date,
    report_end: date,
) -> dict[str, str]:
    """
    Amplitude REST로 KPI·플랫폼·(선택)지역을 조회하고,
    amplitude_mcp_context.json 에 병합 저장합니다. HTML 치환용 토큰 dict 를 반환합니다.
    """
    from amplitude_collect import collect_for_period

    cm = collect_for_period(report_start, report_end)
    merged = merge_amplitude_context_payload(cm.context, report_start, report_end)
    (base_dir / "amplitude_mcp_context.json").write_text(
        json.dumps(merged, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return cm.tokens


def amplitude_rest_credentials_configured() -> bool:
    """`.env` 로드 후 호출. AMPLITUDE_SECRET_KEY 또는 AMPLITUDE_SECRET."""
    api = os.getenv("AMPLITUDE_API_KEY", "").strip()
    sec = os.getenv("AMPLITUDE_SECRET_KEY", os.getenv("AMPLITUDE_SECRET", "")).strip()
    return bool(api and sec)


def validate_mcp_files_for_cli_period(
    base_dir: Path, report_start: date, report_end: date
) -> tuple[bool, str]:
    """
    REST 없이 스냅샷만 쓸 때: amplitude_snapshot.json 의 weekly_interval_7 에
    리포트 시작일이 속한 주의 월요일 키·uniques·totals_pv 가 있어야 한다.
    report_week.range_kst 는 메타일 뿐이라 UI 기간과 달라도 오류로 두지 않는다
    (퍼널·파생%는 kpi_tokens_from_snapshot 이 주차 정합성으로 처리).
    """
    p = base_dir / "amplitude_snapshot.json"
    if not p.is_file():
        return (
            False,
            "amplitude_snapshot.json 이 없습니다. Cursor Amplitude MCP로 조회한 뒤 "
            "프로젝트 루트에 저장하고 다시 시도하세요.",
        )
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return False, "amplitude_snapshot.json 이 올바른 JSON이 아닙니다."

    rw = str((data.get("report_week") or {}).get("range_kst") or "").strip()
    if rw:
        ds, de = parse_range_kst_bounds(rw)
        if ds is None or de is None:
            return (
                False,
                "스냅샷 report_week.range_kst 를 파싱할 수 없습니다. "
                "`YYYY-MM-DD - YYYY-MM-DD` 형식을 맞추세요.",
            )

    wk = (data.get("load_pages_ai_image") or {}).get("weekly_interval_7") or {}
    k_mon = (_monday_on_or_before(report_start)).isoformat()
    if k_mon not in wk:
        have = ", ".join(sorted(wk.keys())[-6:]) if wk else "(없음)"
        return (
            False,
            f"선택한 기간의 주간 UV/PV가 스냅샷에 없습니다. "
            f"weekly_interval_7 에 월요일 키 '{k_mon}' 행이 필요합니다. "
            f"(현재 들어 있는 키 예: {have}) "
            "Cursor Amplitude MCP로 해당 주를 조회해 JSON에 추가하거나, .env 에 REST 키를 넣어 주세요.",
        )
    row = wk.get(k_mon) or {}
    if "uniques" not in row or "totals_pv" not in row:
        return (
            False,
            f"스냅샷 주간 행({k_mon})에 uniques / totals_pv 가 없습니다.",
        )

    return True, ""


def merge_amplitude_context_payload(
    api_ctx: dict,
    report_start: date,
    report_end: date,
) -> dict:
    shell = build_control_panel_amplitude_context(report_start, report_end)
    out = {**shell, **api_ctx}
    out["report_week"] = {**shell.get("report_week", {}), **api_ctx.get("report_week", {})}
    out["prior_week"] = {**shell.get("prior_week", {}), **api_ctx.get("prior_week", {})}
    if "mcp_queries" in api_ctx:
        out["mcp_queries"] = api_ctx["mcp_queries"]
    return out


def _fmt_int_k(n: float | int) -> str:
    return f"{int(round(n)):,}"


def _fmt_pct1_k(x: float) -> str:
    return f"{x:.2f}%"


def _fmt_pct_small_k(x: float) -> str:
    return f"{x:.3f}%"


def _delta_count_k(prior: float, report: float) -> tuple[str, str]:
    d = int(round(report - prior))
    sign = "+" if d >= 0 else ""
    pct = 0.0 if prior == 0 else 100.0 * (report - prior) / prior
    ps = "+" if pct >= 0 else ""
    col = "#2E7D32" if report >= prior else "#C62828"
    return f"{sign}{d:,} · {ps}{pct:.1f}%", col


def _delta_pp_k(prior: float, report: float) -> tuple[str, str]:
    d = report - prior
    sign = "+" if d >= 0 else ""
    return f"{sign}{d:.2f}%p", "#2E7D32" if d >= 0 else "#C62828"


def _monday_on_or_before(d: date) -> date:
    """리포트 시작일이 속한 주의 월요일(스냅샷 weekly_interval_7 키와 맞춤)."""
    return d - timedelta(days=d.weekday())


def _snapshot_matches_report_week(data: dict, report_start: date) -> bool:
    """스냅샷에 박힌 금주 시작일과 리포트 시작 주(월요일)가 같을 때만 퍼널·파생% 신뢰."""
    rw = str((data.get("report_week") or {}).get("range_kst") or "")
    if not rw.strip():
        return True
    part = rw.split("-", 1)[0].strip()[:10]
    try:
        d0 = date.fromisoformat(part)
    except ValueError:
        return True
    return _monday_on_or_before(d0) == _monday_on_or_before(report_start)


def _pick_weekly_uv_pv_keys(
    wk: dict, report_start: date
) -> tuple[str | None, str] | None:
    """
    금주 = report_start가 속한 주의 월요일(YYYY-MM-DD),
    전주 = 그 전 월요일. 스냅샷에 전주가 없고 더 최신 주만 있으면 (None, 금주키).
    리포트 주가 스냅샷에 없으면 마지막 두 키 폴백.
    """
    keys = sorted(wk.keys())
    if len(keys) < 1:
        return None
    k_report = _monday_on_or_before(report_start).isoformat()
    k_prior = (_monday_on_or_before(report_start) - timedelta(days=7)).isoformat()
    if k_report in wk:
        if k_prior in wk:
            return k_prior, k_report
        older = [kk for kk in keys if kk < k_report]
        if older:
            return older[-1], k_report
        newer = [kk for kk in keys if kk > k_report]
        if newer:
            return None, k_report
        return k_report, k_report
    if len(keys) >= 2:
        return keys[-2], keys[-1]
    return None


def kpi_tokens_from_snapshot(
    base_dir: Path, report_start: date, report_end: date | None = None
) -> dict[str, str]:
    """amplitude_snapshot.json 기반 KPI 치환값 (API 실패 시 폴백)."""
    _ = report_end  # 향후 7일 미만 구간 등 확장용
    p = base_dir / "amplitude_snapshot.json"
    if not p.is_file():
        return {}
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}

    wk = (data.get("load_pages_ai_image") or {}).get("weekly_interval_7") or {}
    picked = _pick_weekly_uv_pv_keys(wk, report_start)
    if not picked:
        return {}
    k0, k1 = picked
    prior_unknown = k0 is None
    row1 = wk.get(k1) or {}
    if "uniques" not in row1 or "totals_pv" not in row1:
        return {}
    row0 = wk.get(k0) or {} if k0 is not None else {}
    uv_r = float(row1["uniques"])
    pv_r = float(row1["totals_pv"])
    if prior_unknown:
        uv_p = pv_p = 0.0
    else:
        uv_p = float(row0.get("uniques", row1["uniques"]))
        pv_p = float(row0.get("totals_pv", row1["totals_pv"]))

    funnel_ok = _snapshot_matches_report_week(data, report_start)
    if funnel_ok:
        d2 = (data.get("funnel_2step_ai_image_to_pkg") or {}).get("derived_pct") or {}
        p2p = float(d2.get("prior", 0))
        p2r = float(d2.get("report", 0))

        d3 = (data.get("funnel_3step_hai_to_pkg") or {}).get("derived_pct") or {}
        hai = d3.get("hai_to_ai_image") or {}
        htp = float(hai.get("prior", 0)) * 100
        htr = float(hai.get("report", 0)) * 100
        oc = d3.get("overall_conversion_pct") or {}
        fp = float(oc.get("prior", 0))
        fr = float(oc.get("report", 0))
    else:
        p2p = p2r = htp = htr = fp = fr = 0.0

    plat = (data.get("platform_resPathCd") or {}).get("pct") or {}
    mda = float(plat.get("MDA", 0))
    dcm = float(plat.get("DCM", 0))
    dcp = float(plat.get("DCP", 0))

    reg_block = data.get("chart_regional_ai_image") or {}
    top3 = None
    for key, val in reg_block.items():
        if key.startswith("top3") and isinstance(val, list) and val:
            top3 = val
            break
    reg_tokens: dict[str, str] = {
        "{{REG1_LABEL}}": "—",
        "{{REG1_VAL}}": "—",
        "{{REG2_LABEL}}": "—",
        "{{REG2_VAL}}": "—",
        "{{REG3_LABEL}}": "—",
        "{{REG3_VAL}}": "—",
    }
    if top3:
        for i, item in enumerate(top3[:3], start=1):
            reg_tokens[f"{{{{REG{i}_LABEL}}}}"] = str(item.get("label", ""))
            reg_tokens[f"{{{{REG{i}_VAL}}}}"] = str(int(item.get("value", 0)))

    na = "—"
    na_col = "#9E9E9E"
    if prior_unknown:
        max_uv = max(uv_r, 1)
        max_pv = max(pv_r, 1)
        uvd, uvc = na, na_col
        pvd, pvc = na, na_col
        uv_prior_s = pv_prior_s = na
        bar_uv_prior_w = bar_pv_prior_w = "0"
        bar_uv_rest_w = bar_pv_rest_w = "100"
        bar_uv_label_prior = bar_pv_label_prior = na
    else:
        max_uv = max(uv_p, uv_r, 1)
        max_pv = max(pv_p, pv_r, 1)
        uvd, uvc = _delta_count_k(uv_p, uv_r)
        pvd, pvc = _delta_count_k(pv_p, pv_r)
        uv_prior_s = _fmt_int_k(uv_p)
        pv_prior_s = _fmt_int_k(pv_p)
        bar_uv_prior_w = str(round(100.0 * uv_p / max_uv, 1))
        bar_uv_rest_w = str(round(100 - 100.0 * uv_p / max_uv, 1))
        bar_uv_label_prior = f"전주 {_fmt_int_k(uv_p)} · 주간 Uniques"
        bar_pv_prior_w = str(round(100.0 * pv_p / max_pv, 1))
        bar_pv_rest_w = str(round(100 - 100.0 * pv_p / max_pv, 1))
        bar_pv_label_prior = f"전주 {_fmt_int_k(pv_p)} · 주간 Totals"
    if funnel_ok:
        max_f = max(fp, fr, 0.0001)
        htd, htc = _delta_pp_k(htp, htr)
        p2d, p2c = _delta_pp_k(p2p, p2r)
        fd, fc_ = _delta_pp_k(fp, fr)
        fin_prior_w = str(round(100.0 * fp / max_f, 1))
        fin_rest_w = str(round(100 - 100.0 * fp / max_f, 1))
        fin_report_w = str(round(100.0 * fr / max_f, 1))
        fin_label_prior = f"전주 {_fmt_pct_small_k(fp)}"
        fin_label_report = f"금주 {_fmt_pct_small_k(fr)}"
    else:
        htd, htc = na, na_col
        p2d, p2c = na, na_col
        fd, fc_ = na, na_col
        fin_prior_w = fin_report_w = "0"
        fin_rest_w = "100"
        fin_label_prior = fin_label_report = na

    tokens: dict[str, str] = {
        "{{KPI_UV_REPORT}}": _fmt_int_k(uv_r),
        "{{KPI_UV_PRIOR}}": uv_prior_s,
        "{{KPI_PV_REPORT}}": _fmt_int_k(pv_r),
        "{{KPI_PV_PRIOR}}": pv_prior_s,
        "{{KPI_HAI_AI_REPORT}}": _fmt_pct1_k(htr) if funnel_ok else na,
        "{{KPI_HAI_AI_PRIOR}}": _fmt_pct1_k(htp) if funnel_ok else na,
        "{{KPI_2STEP_REPORT}}": _fmt_pct1_k(p2r) if funnel_ok else na,
        "{{KPI_2STEP_PRIOR}}": _fmt_pct1_k(p2p) if funnel_ok else na,
        "{{KPI_FINAL_REPORT}}": _fmt_pct_small_k(fr) if funnel_ok else na,
        "{{KPI_FINAL_PRIOR}}": _fmt_pct_small_k(fp) if funnel_ok else na,
        "{{ROW_UV_PRIOR}}": uv_prior_s,
        "{{ROW_UV_REPORT}}": _fmt_int_k(uv_r),
        "{{ROW_UV_DELTA}}": uvd,
        "{{ROW_UV_DELTA_COLOR}}": uvc,
        "{{ROW_PV_PRIOR}}": pv_prior_s,
        "{{ROW_PV_REPORT}}": _fmt_int_k(pv_r),
        "{{ROW_PV_DELTA}}": pvd,
        "{{ROW_PV_DELTA_COLOR}}": pvc,
        "{{ROW_HAI_PRIOR}}": _fmt_pct1_k(htp) if funnel_ok else na,
        "{{ROW_HAI_REPORT}}": _fmt_pct1_k(htr) if funnel_ok else na,
        "{{ROW_HAI_DELTA}}": htd,
        "{{ROW_HAI_DELTA_COLOR}}": htc,
        "{{ROW_2STEP_PRIOR}}": _fmt_pct1_k(p2p) if funnel_ok else na,
        "{{ROW_2STEP_REPORT}}": _fmt_pct1_k(p2r) if funnel_ok else na,
        "{{ROW_2STEP_DELTA}}": p2d,
        "{{ROW_2STEP_DELTA_COLOR}}": p2c,
        "{{ROW_FINAL_PRIOR}}": _fmt_pct_small_k(fp) if funnel_ok else na,
        "{{ROW_FINAL_REPORT}}": _fmt_pct_small_k(fr) if funnel_ok else na,
        "{{ROW_FINAL_DELTA}}": fd,
        "{{ROW_FINAL_DELTA_COLOR}}": fc_,
        "{{BAR_UV_PRIOR_W}}": bar_uv_prior_w,
        "{{BAR_UV_REST_W}}": bar_uv_rest_w,
        "{{BAR_UV_LABEL_PRIOR}}": bar_uv_label_prior,
        "{{BAR_UV_REPORT_W}}": str(round(100.0 * uv_r / max_uv, 1)),
        "{{BAR_UV_LABEL_REPORT}}": f"금주 {_fmt_int_k(uv_r)} · 주간 Uniques",
        "{{BAR_PV_PRIOR_W}}": bar_pv_prior_w,
        "{{BAR_PV_REST_W}}": bar_pv_rest_w,
        "{{BAR_PV_LABEL_PRIOR}}": bar_pv_label_prior,
        "{{BAR_PV_REPORT_W}}": str(round(100.0 * pv_r / max_pv, 1)),
        "{{BAR_PV_LABEL_REPORT}}": f"금주 {_fmt_int_k(pv_r)} · 주간 Totals",
        "{{BAR_FIN_PRIOR_W}}": fin_prior_w,
        "{{BAR_FIN_REST_W}}": fin_rest_w,
        "{{BAR_FIN_LABEL_PRIOR}}": fin_label_prior,
        "{{BAR_FIN_REPORT_W}}": fin_report_w,
        "{{BAR_FIN_LABEL_REPORT}}": fin_label_report,
        "{{PCT_MDA}}": f"{mda:.2f}",
        "{{PCT_DCM}}": f"{dcm:.2f}",
        "{{PCT_DCP}}": f"{dcp:.2f}",
        "{{BAR_MDA_W}}": f"{mda:.2f}",
        "{{BAR_DCM_W}}": f"{dcm:.2f}",
        "{{BAR_DCP_W}}": f"{dcp:.2f}",
    }
    tokens.update(reg_tokens)
    return tokens


def apply_kpi_tokens(html: str, tokens: dict[str, str]) -> str:
    for key, val in tokens.items():
        html = html.replace(key, val)
    return html


def build_control_panel_amplitude_context(
    report_start: date,
    report_end: date,
) -> dict:
    prior_start, prior_end = prior_period_for_range(report_start, report_end)
    return {
        "source": "control_panel",
        "fetched_at": datetime.now().astimezone().isoformat(),
        "project_id": os.getenv("AMPLITUDE_PROJECT_ID", "343341"),
        "report_week": {
            "label": "리포트 기간 (설정 패널)",
            "range_kst": f"{report_start.isoformat()} - {report_end.isoformat()}",
        },
        "prior_week": {
            "label": "비교 기간 (직전 동일 일수)",
            "range_kst": f"{prior_start.isoformat()} - {prior_end.isoformat()}",
        },
        "note": (
            "이 JSON은 제어 패널에서 지정한 기간입니다. "
            "발송 시 Amplitude REST 수집을 켜면 이 파일에 실제 수치가 병합됩니다. "
            "여정·시사점 본문은 이 컨텍스트 + 프롬프트로 OpenAI가 생성합니다."
        ),
        "mcp_queries": [],
    }


def refresh_mcp_context_period_metadata(
    base_dir: Path, report_start: date, report_end: date
) -> None:
    """`--mcp` 발송 시 amplitude_mcp_context.json 에 CLI 기간·전주 메타 병합(generate_analysis 용)."""
    path = base_dir / "amplitude_mcp_context.json"
    data: dict = {}
    if path.is_file():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            data = {}
    shell = build_control_panel_amplitude_context(report_start, report_end)
    data["report_week"] = {**data.get("report_week", {}), **shell["report_week"]}
    data["prior_week"] = {**data.get("prior_week", {}), **shell["prior_week"]}
    src = str(data.get("source") or "").strip()
    if not src or src == "control_panel":
        data["source"] = "amplitude_mcp"
    data["fetched_at"] = datetime.now().astimezone().isoformat()
    data["note"] = (
        "Cursor Amplitude MCP 등으로 채운 컨텍스트입니다. "
        "send_email.py --mcp 발송 시 report_week/prior_week 가 CLI 기간에 맞춰졌습니다."
    )
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def prepare_email_html(
    base_dir: Path,
    report_start: date,
    report_end: date,
    *,
    kpi_overlay: dict[str, str] | None = None,
) -> str:
    html_path = base_dir / "weekly-report-email.html"
    html_body = html_path.read_text(encoding="utf-8")
    report_period = format_report_period_line(report_start, report_end)
    chart_short = format_chart_period_short(report_start, report_end)
    html_body = html_body.replace("{{REPORT_PERIOD}}", report_period)
    html_body = html_body.replace("{{CHART_PERIOD_SHORT}}", chart_short)
    journey_html, insights_html = load_analysis_fragments(base_dir)
    html_body = html_body.replace("{{JOURNEY_ANALYSIS_CONTENT}}", journey_html)
    html_body = html_body.replace("{{KEY_INSIGHTS_CONTENT}}", insights_html)
    kpi = kpi_tokens_from_snapshot(base_dir, report_start, report_end)
    if kpi_overlay:
        kpi.update(kpi_overlay)
    if kpi:
        html_body = apply_kpi_tokens(html_body, kpi)
    return html_body


def resolve_receivers(base_dir: Path) -> list[str]:
    raw = os.getenv("RECEIVER_EMAIL", "").strip()
    if not raw:
        return []
    return [a.strip() for a in raw.split(",") if a.strip()]


def send_weekly_report_email(
    base_dir: Path,
    report_start: date,
    report_end: date,
    *,
    load_dotenv: bool = True,
    kpi_overlay: dict[str, str] | None = None,
) -> tuple[list[str], str]:
    """
    .env 로 SMTP·발신, 수신을 모두 처리합니다.
    Returns (receiver_list, subject).
    """
    if load_dotenv:
        load_env_file(base_dir / ".env")

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    sender_email = os.getenv("SENDER_EMAIL", "")
    sender_password = os.getenv("SENDER_PASSWORD", "")
    mail_subject_template = os.getenv(
        "MAIL_SUBJECT",
        "[공유] {month}월 {week}째주 AI이미지 주간보고서",
    )

    receiver_list = resolve_receivers(base_dir)
    if not receiver_list:
        raise ValueError(
            "수신 메일이 없습니다. .env 의 RECEIVER_EMAIL 을 설정하세요."
        )
    if not sender_email or not sender_password:
        raise ValueError("SENDER_EMAIL, SENDER_PASSWORD 를 .env 에 설정해 주세요.")

    html_body = prepare_email_html(
        base_dir, report_start, report_end, kpi_overlay=kpi_overlay
    )
    report_month = report_start.month
    report_week = get_week_of_month(report_start)
    mail_subject = (
        mail_subject_template.replace("{month}", str(report_month)).replace(
            "{week}", str(report_week)
        )
    )

    message = MIMEMultipart("alternative")
    message["Subject"] = mail_subject
    message["From"] = sender_email
    message["To"] = ", ".join(receiver_list)
    message.attach(MIMEText(html_body, "html", "utf-8"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, receiver_list, message.as_string())

    return receiver_list, mail_subject
