"""
Amplitude Dashboard REST API로 리포트·비교 기간 수치를 조회합니다.
.env: AMPLITUDE_API_KEY, AMPLITUDE_SECRET_KEY (필수)
선택: AMPLITUDE_API_BASE (기본 https://amplitude.com)
이벤트 정의는 AMPLITUDE_EVENT_JSON_* 로 덮어쓸 수 있습니다.
"""
from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any

from report_mail import prior_period_for_range


def _date_amp(d: date) -> str:
    return d.strftime("%Y%m%d")


def _auth_header() -> str:
    api_key = os.getenv("AMPLITUDE_API_KEY", "").strip()
    secret = os.getenv("AMPLITUDE_SECRET_KEY", os.getenv("AMPLITUDE_SECRET", "")).strip()
    if not api_key or not secret:
        raise AmplitudeConfigError(
            ".env 에 AMPLITUDE_API_KEY 와 AMPLITUDE_SECRET_KEY 를 설정해 주세요."
        )
    token = base64.b64encode(f"{api_key}:{secret}".encode("utf-8")).decode("ascii")
    return f"Basic {token}"


def _api_base() -> str:
    return os.getenv("AMPLITUDE_API_BASE", "https://amplitude.com").rstrip("/")


class AmplitudeConfigError(RuntimeError):
    pass


class AmplitudeApiError(RuntimeError):
    pass


def _get_json(path: str, query: list[tuple[str, str]]) -> dict[str, Any]:
    q = urllib.parse.urlencode(query, doseq=True, safe="/:")
    url = f"{_api_base()}{path}?{q}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": _auth_header(), "Accept": "application/json"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:2000]
        raise AmplitudeApiError(f"Amplitude HTTP {e.code}: {body}") from e
    except urllib.error.URLError as e:
        raise AmplitudeApiError(f"Amplitude 연결 실패: {e}") from e
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise AmplitudeApiError(f"Amplitude 응답이 JSON이 아닙니다: {raw[:500]}") from None


def _event_from_env(key: str, default: dict) -> dict:
    raw = os.getenv(key, "").strip()
    if not raw:
        return default
    return json.loads(raw)


def _default_e_chatai() -> dict:
    return _event_from_env(
        "AMPLITUDE_JSON_E_CHATAI",
        {
            "event_type": "ce:load_pages",
            "filters": [
                {
                    "subprop_type": "event",
                    "subprop_key": "pathname",
                    "subprop_op": "is",
                    "subprop_value": ["/dcr/chatai"],
                }
            ],
        },
    )


def _default_e_ai_image() -> dict:
    return _event_from_env(
        "AMPLITUDE_JSON_E_AI_IMAGE",
        {
            "event_type": "ce:load_pages",
            "filters": [
                {
                    "subprop_type": "event",
                    "subprop_key": "pathname",
                    "subprop_op": "contains",
                    "subprop_value": ["/ai-image"],
                }
            ],
        },
    )


def _default_e_pkg() -> dict:
    return _event_from_env(
        "AMPLITUDE_JSON_E_PKG",
        {"event_type": "ce:load_detail_pkg", "filters": []},
    )


def _segmentation_metric(e: dict, start: date, end: date, metric: str) -> dict[str, Any]:
    e_json = json.dumps(e, separators=(",", ":"), ensure_ascii=False)
    return _get_json(
        "/api/2/events/segmentation",
        [
            ("e", e_json),
            ("start", _date_amp(start)),
            ("end", _date_amp(end)),
            ("m", metric),
            ("i", "1"),
        ],
    )


def _extract_segmentation_scalar(data: dict[str, Any]) -> float | None:
    d = data.get("data") or data
    sc = d.get("seriesCollapsed")
    if sc and isinstance(sc, list) and sc:
        first = sc[0]
        if isinstance(first, list) and first:
            v = first[0]
            if isinstance(v, dict) and "value" in v:
                return float(v["value"])
    series = d.get("series")
    if series and isinstance(series, list) and series[0]:
        row = series[0]
        if isinstance(row, list) and row:
            s = 0.0
            for x in row:
                if isinstance(x, dict) and "value" in x:
                    s += float(x["value"])
                elif isinstance(x, (int, float)):
                    s += float(x)
            return s if s else None
    return None


def _funnel_query(
    events: list[dict],
    start: date,
    end: date,
    *,
    conversion_seconds: int,
) -> dict[str, Any]:
    parts: list[tuple[str, str]] = []
    for ev in events:
        parts.append(("e", json.dumps(ev, separators=(",", ":"), ensure_ascii=False)))
    parts.extend(
        [
            ("start", _date_amp(start)),
            ("end", _date_amp(end)),
            ("mode", "ordered"),
            ("cs", str(conversion_seconds)),
        ]
    )
    return _get_json("/api/2/funnels", parts)


def _parse_funnel_counts(resp: dict[str, Any]) -> tuple[list[int], list[float]] | None:
    data = resp.get("data")
    if not data or not isinstance(data, list) or not data:
        return None
    block = data[0]
    raw = block.get("cumulativeRaw")
    cum = block.get("cumulative")
    if not raw or not isinstance(raw, list):
        return None
    counts = [int(x) for x in raw]
    cump = [float(x) for x in cum] if cum and isinstance(cum, list) else []
    return counts, cump


def _platform_breakdown(start: date, end: date) -> dict[str, Any]:
    e = _default_e_ai_image()
    e_json = json.dumps(e, separators=(",", ":"), ensure_ascii=False)
    group = os.getenv("AMPLITUDE_PLATFORM_GROUP_BY", "gp:resPathCd")
    return _get_json(
        "/api/2/events/segmentation",
        [
            ("e", e_json),
            ("start", _date_amp(start)),
            ("end", _date_amp(end)),
            ("m", "totals"),
            ("i", "1"),
            ("g", group),
        ],
    )


def _regional_breakdown(start: date, end: date) -> dict[str, Any] | None:
    group = os.getenv("AMPLITUDE_REGION_GROUP_BY", "").strip()
    if not group:
        return None
    e = _default_e_ai_image()
    e_json = json.dumps(e, separators=(",", ":"), ensure_ascii=False)
    return _get_json(
        "/api/2/events/segmentation",
        [
            ("e", e_json),
            ("start", _date_amp(start)),
            ("end", _date_amp(end)),
            ("m", "uniques"),
            ("i", "1"),
            ("g", group),
        ],
    )


def _parse_top_series_labels(resp: dict[str, Any], *, limit: int = 3) -> list[tuple[str, float]]:
    d = resp.get("data") or resp
    labels = d.get("seriesLabels") or []
    series = d.get("series") or []
    totals: list[tuple[str, float]] = []
    for i, lab in enumerate(labels):
        if i >= len(series):
            break
        row = series[i]
        if not isinstance(row, list):
            continue
        s = 0.0
        for cell in row:
            if isinstance(cell, dict) and "value" in cell:
                s += float(cell["value"])
            elif isinstance(cell, (int, float)):
                s += float(cell)
        totals.append((str(lab), s))
    totals.sort(key=lambda x: x[1], reverse=True)
    return totals[:limit]


def _parse_platform_pct(resp: dict[str, Any]) -> dict[str, float]:
    d = resp.get("data") or resp
    labels = d.get("seriesLabels") or []
    series = d.get("series") or []
    totals: dict[str, float] = {}
    for i, lab in enumerate(labels):
        if i >= len(series):
            break
        row = series[i]
        if not isinstance(row, list):
            continue
        s = 0.0
        for cell in row:
            if isinstance(cell, dict) and "value" in cell:
                s += float(cell["value"])
            elif isinstance(cell, (int, float)):
                s += float(cell)
        totals[str(lab)] = s
    if not totals:
        return {}
    grand = sum(totals.values())
    if grand <= 0:
        return {k: 0.0 for k in totals}
    return {k: round(100.0 * v / grand, 2) for k, v in totals.items()}


def _fmt_int(n: float | int) -> str:
    v = int(round(n))
    return f"{v:,}"


def _fmt_pct1(x: float | None) -> str:
    if x is None:
        return "—"
    return f"{x:.2f}%"


def _fmt_pct_small(x: float | None) -> str:
    if x is None:
        return "—"
    return f"{x:.3f}%"


def _delta_count(prior: float, report: float) -> tuple[str, str]:
    d = int(round(report - prior))
    sign = "+" if d >= 0 else ""
    pct = 0.0 if prior == 0 else 100.0 * (report - prior) / prior
    ps = "+" if pct >= 0 else ""
    return f"{sign}{d:,}", f"{ps}{pct:.1f}%"


def _delta_pp(prior: float, report: float) -> tuple[str, str]:
    d = report - prior
    sign = "+" if d >= 0 else ""
    return f"{sign}{d:.2f}%p", "#2E7D32" if d >= 0 else "#C62828"


@dataclass
class CollectedMetrics:
    """HTML {{KPI_*}} 치환용."""

    tokens: dict[str, str] = field(default_factory=dict)
    context: dict[str, Any] = field(default_factory=dict)


def collect_for_period(report_start: date, report_end: date) -> CollectedMetrics:
    prior_start, prior_end = prior_period_for_range(report_start, report_end)
    e_ai = _default_e_ai_image()
    e_chat = _default_e_chatai()
    e_pkg = _default_e_pkg()
    cs_24h = int(os.getenv("AMPLITUDE_FUNNEL_CS_SECONDS", "86400"))
    cs_3 = int(os.getenv("AMPLITUDE_FUNNEL3_CS_SECONDS", "86400"))

    debug: dict[str, Any] = {"prior": f"{prior_start}..{prior_end}", "report": f"{report_start}..{report_end}"}

    uv_p = _extract_segmentation_scalar(_segmentation_metric(e_ai, prior_start, prior_end, "uniques"))
    uv_r = _extract_segmentation_scalar(_segmentation_metric(e_ai, report_start, report_end, "uniques"))
    pv_p = _extract_segmentation_scalar(_segmentation_metric(e_ai, prior_start, prior_end, "totals"))
    pv_r = _extract_segmentation_scalar(_segmentation_metric(e_ai, report_start, report_end, "totals"))

    if uv_p is None or uv_r is None or pv_p is None or pv_r is None:
        raise AmplitudeApiError(
            "AI 이미지 UV/PV 조회 실패. 이벤트명·필터가 프로젝트와 맞는지 "
            "AMPLITUDE_JSON_E_AI_IMAGE 등으로 확인하세요."
        )

    f2_p = _parse_funnel_counts(_funnel_query([e_ai, e_pkg], prior_start, prior_end, conversion_seconds=cs_24h))
    f2_r = _parse_funnel_counts(_funnel_query([e_ai, e_pkg], report_start, report_end, conversion_seconds=cs_24h))
    f3_p = _parse_funnel_counts(
        _funnel_query([e_chat, e_ai, e_pkg], prior_start, prior_end, conversion_seconds=cs_3)
    )
    f3_r = _parse_funnel_counts(
        _funnel_query([e_chat, e_ai, e_pkg], report_start, report_end, conversion_seconds=cs_3)
    )

    def two_step_pct(fc: tuple[list[int], list[float]] | None) -> float | None:
        if not fc:
            return None
        counts, _ = fc
        if len(counts) < 2 or counts[0] <= 0:
            return None
        return 100.0 * counts[1] / counts[0]

    def hai_to_ai_pct(fc: tuple[list[int], list[float]] | None) -> float | None:
        if not fc:
            return None
        counts, _ = fc
        if len(counts) < 2 or counts[0] <= 0:
            return None
        return 100.0 * counts[1] / counts[0]

    def final_pct(fc: tuple[list[int], list[float]] | None) -> float | None:
        if not fc:
            return None
        counts, _ = fc
        if len(counts) < 3 or counts[0] <= 0:
            return None
        return 100.0 * counts[2] / counts[0]

    p2p, p2r = two_step_pct(f2_p), two_step_pct(f2_r)
    htp, htr = hai_to_ai_pct(f3_p), hai_to_ai_pct(f3_r)
    fp, fr = final_pct(f3_p), final_pct(f3_r)

    plat_resp = _platform_breakdown(report_start, report_end)
    debug["platform_raw_keys"] = list((plat_resp.get("data") or plat_resp).keys())[:5]
    plat_pct = _parse_platform_pct(plat_resp)

    reg_tokens: dict[str, str] = {
        "{{REG1_LABEL}}": "—",
        "{{REG1_VAL}}": "—",
        "{{REG2_LABEL}}": "—",
        "{{REG2_VAL}}": "—",
        "{{REG3_LABEL}}": "—",
        "{{REG3_VAL}}": "—",
    }
    reg_raw = _regional_breakdown(report_start, report_end)
    if reg_raw is not None:
        try:
            top3 = _parse_top_series_labels(reg_raw, limit=3)
            debug["regional_top3"] = top3
            for idx, (lab, val) in enumerate(top3, start=1):
                reg_tokens[f"{{{{REG{idx}_LABEL}}}}"] = lab
                reg_tokens[f"{{{{REG{idx}_VAL}}}}"] = str(int(round(val)))
        except AmplitudeApiError:
            pass

    mda = plat_pct.get("MDA", plat_pct.get("mda", 0.0))
    dcm = plat_pct.get("DCM", plat_pct.get("dcm", 0.0))
    dcp = plat_pct.get("DCP", plat_pct.get("dcp", 0.0))
    if not plat_pct:
        mda, dcm, dcp = 0.0, 0.0, 0.0

    max_uv = max(uv_p, uv_r, 1)
    max_pv = max(pv_p, pv_r, 1)
    bar_uv_p = round(100.0 * uv_p / max_uv, 1)
    bar_uv_r = round(100.0 * uv_r / max_uv, 1)
    bar_pv_p = round(100.0 * pv_p / max_pv, 1)
    bar_pv_r = round(100.0 * pv_r / max_pv, 1)
    max_fbar = max(fp or 0, fr or 0, 0.0001)
    bar_f_p = round(100.0 * (fp or 0) / max_fbar, 1)
    bar_f_r = round(100.0 * (fr or 0) / max_fbar, 1)

    def uv_row_delta() -> tuple[str, str]:
        da, dp = _delta_count(uv_p, uv_r)
        col = "#2E7D32" if uv_r >= uv_p else "#C62828"
        return f"{da} · {dp}", col

    def pv_row_delta() -> tuple[str, str]:
        da, dp = _delta_count(pv_p, pv_r)
        col = "#2E7D32" if pv_r >= pv_p else "#C62828"
        return f"{da} · {dp}", col

    uvd, uvc = uv_row_delta()
    pvd, pvc = pv_row_delta()

    htd, htc = _delta_pp(htp or 0, htr or 0)
    p2d, p2c = _delta_pp(p2p or 0, p2r or 0)
    fd, fc_ = _delta_pp(fp or 0, fr or 0)

    tokens: dict[str, str] = {
        "{{KPI_UV_REPORT}}": _fmt_int(uv_r),
        "{{KPI_UV_PRIOR}}": _fmt_int(uv_p),
        "{{KPI_PV_REPORT}}": _fmt_int(pv_r),
        "{{KPI_PV_PRIOR}}": _fmt_int(pv_p),
        "{{KPI_HAI_AI_REPORT}}": _fmt_pct1(htr),
        "{{KPI_HAI_AI_PRIOR}}": _fmt_pct1(htp),
        "{{KPI_2STEP_REPORT}}": _fmt_pct1(p2r),
        "{{KPI_2STEP_PRIOR}}": _fmt_pct1(p2p),
        "{{KPI_FINAL_REPORT}}": _fmt_pct_small(fr),
        "{{KPI_FINAL_PRIOR}}": _fmt_pct_small(fp),
        "{{ROW_UV_PRIOR}}": _fmt_int(uv_p),
        "{{ROW_UV_REPORT}}": _fmt_int(uv_r),
        "{{ROW_UV_DELTA}}": uvd,
        "{{ROW_UV_DELTA_COLOR}}": uvc,
        "{{ROW_PV_PRIOR}}": _fmt_int(pv_p),
        "{{ROW_PV_REPORT}}": _fmt_int(pv_r),
        "{{ROW_PV_DELTA}}": pvd,
        "{{ROW_PV_DELTA_COLOR}}": pvc,
        "{{ROW_HAI_PRIOR}}": _fmt_pct1(htp),
        "{{ROW_HAI_REPORT}}": _fmt_pct1(htr),
        "{{ROW_HAI_DELTA}}": htd,
        "{{ROW_HAI_DELTA_COLOR}}": htc,
        "{{ROW_2STEP_PRIOR}}": _fmt_pct1(p2p),
        "{{ROW_2STEP_REPORT}}": _fmt_pct1(p2r),
        "{{ROW_2STEP_DELTA}}": p2d,
        "{{ROW_2STEP_DELTA_COLOR}}": p2c,
        "{{ROW_FINAL_PRIOR}}": _fmt_pct_small(fp),
        "{{ROW_FINAL_REPORT}}": _fmt_pct_small(fr),
        "{{ROW_FINAL_DELTA}}": fd,
        "{{ROW_FINAL_DELTA_COLOR}}": fc_,
        "{{BAR_UV_PRIOR_W}}": str(bar_uv_p),
        "{{BAR_UV_REST_W}}": str(round(100 - bar_uv_p, 1)),
        "{{BAR_UV_LABEL_PRIOR}}": f"전주 {_fmt_int(uv_p)} · 주간 Uniques",
        "{{BAR_UV_REPORT_W}}": str(bar_uv_r),
        "{{BAR_UV_LABEL_REPORT}}": f"금주 {_fmt_int(uv_r)} · 주간 Uniques",
        "{{BAR_PV_LABEL_REPORT}}": f"금주 {_fmt_int(pv_r)} · 주간 Totals",
        "{{BAR_PV_PRIOR_W}}": str(bar_pv_p),
        "{{BAR_PV_REST_W}}": str(round(100 - bar_pv_p, 1)),
        "{{BAR_PV_LABEL_PRIOR}}": f"전주 {_fmt_int(pv_p)} · 주간 Totals",
        "{{BAR_PV_REPORT_W}}": str(bar_pv_r),
        "{{BAR_FIN_PRIOR_W}}": str(bar_f_p),
        "{{BAR_FIN_REST_W}}": str(round(100 - bar_f_p, 1)),
        "{{BAR_FIN_LABEL_PRIOR}}": f"전주 {_fmt_pct_small(fp)}",
        "{{BAR_FIN_REPORT_W}}": str(bar_f_r),
        "{{BAR_FIN_LABEL_REPORT}}": f"금주 {_fmt_pct_small(fr)}",
        "{{PCT_MDA}}": f"{mda:.2f}",
        "{{PCT_DCM}}": f"{dcm:.2f}",
        "{{PCT_DCP}}": f"{dcp:.2f}",
        "{{BAR_MDA_W}}": f"{mda:.2f}",
        "{{BAR_DCM_W}}": f"{dcm:.2f}",
        "{{BAR_DCP_W}}": f"{dcp:.2f}",
    }
    tokens.update(reg_tokens)

    ctx = {
        "source": "amplitude_rest_api",
        "fetched_at": datetime.now().astimezone().isoformat(),
        "project_id": os.getenv("AMPLITUDE_PROJECT_ID", "343341"),
        "report_week": {
            "range_kst": f"{report_start.isoformat()} - {report_end.isoformat()}",
            "uv": uv_r,
            "pv": pv_r,
            "funnel_2step_pct": p2r,
            "funnel_3step_hai_ai_pct": htr,
            "funnel_3step_final_pct": fr,
        },
        "prior_week": {
            "range_kst": f"{prior_start.isoformat()} - {prior_end.isoformat()}",
            "uv": uv_p,
            "pv": pv_p,
        },
        "platform_pct": plat_pct,
        "regional_top3": [
            {"label": reg_tokens.get(f"{{{{REG{i}_LABEL}}}}", "—"), "value": reg_tokens.get(f"{{{{REG{i}_VAL}}}}", "—")}
            for i in range(1, 4)
        ],
        "debug": debug,
    }
    return CollectedMetrics(tokens=tokens, context=ctx)
