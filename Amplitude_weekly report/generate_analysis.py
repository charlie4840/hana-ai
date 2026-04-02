"""
analysis-prompts.env 의 프롬프트 + Amplitude 분석용 JSON으로 OpenAI에 본문 생성을 요청하고,
analysis-output.json 을 씁니다.

컨텍스트 로드 (기본):
  - amplitude_snapshot.json(UV/PV·퍼널 등) + amplitude_mcp_context.json(기간·REST 병합)을 합칩니다.
  - 기간만 있는 MCP 셸만 있을 때는 스냅샷 수치를 본문으로 씁니다.
  환경변수로 단일 파일만 쓰려면:
  - AMPLITUDE_SNAPSHOT_FILE 또는 AMPLITUDE_CONTEXT_FILE
"""
from __future__ import annotations

import json
import os
import re
import sys
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


def _is_under_base(path: Path, base: Path) -> bool:
    try:
        path.resolve().relative_to(base.resolve())
        return True
    except ValueError:
        return False


def read_prompt(
    base_dir: Path,
    inline_key: str,
    file_key: str,
    fallback_relative: str,
) -> str:
    file_val = os.getenv(file_key, "").strip()
    if file_val:
        p = (base_dir / file_val).resolve()
        if p.is_file() and _is_under_base(p, base_dir):
            return p.read_text(encoding="utf-8").strip()
    inline = os.getenv(inline_key, "").strip()
    if inline:
        return inline.replace("\\n", "\n")
    fb = (base_dir / fallback_relative).resolve()
    if fb.is_file():
        return fb.read_text(encoding="utf-8").strip()
    return ""


def strip_code_fence(text: str) -> str:
    s = text.strip()
    if not s.startswith("```"):
        return s
    lines = s.split("\n")
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()


def sanitize_html_fragment(html: str) -> str:
    out = strip_code_fence(html)
    out = re.sub(r"<\s*script[^>]*>[\s\S]*?<\s*/\s*script\s*>", "", out, flags=re.I)
    out = re.sub(r"<\s*script[^>]*\/?\s*>", "", out, flags=re.I)
    out = re.sub(r"\s+on\w+\s*=\s*(['\"]).*?\1", "", out, flags=re.I)
    out = re.sub(r"\s+javascript:\s*[^\s>]+", "", out, flags=re.I)
    return out.strip()


def load_analysis_context_for_llm(base_dir: Path) -> tuple[dict | None, str]:
    """
    Amplitude 주간 수치가 스냅샷에 있으면 반드시 포함하고,
    MCP 파일은 기간 메타·REST 병합 결과만 있을 때 상위에 얹습니다.
    """
    legacy = os.getenv("AMPLITUDE_SNAPSHOT_FILE", "").strip()
    if legacy:
        p = (base_dir / legacy).resolve()
        if p.is_file() and _is_under_base(p, base_dir):
            try:
                return json.loads(p.read_text(encoding="utf-8")), p.name
            except json.JSONDecodeError:
                return None, ""
        return None, ""
    explicit = os.getenv("AMPLITUDE_CONTEXT_FILE", "").strip()
    if explicit:
        p = (base_dir / explicit).resolve()
        if p.is_file() and _is_under_base(p, base_dir):
            try:
                return json.loads(p.read_text(encoding="utf-8")), p.name
            except json.JSONDecodeError:
                return None, ""
        return None, ""

    snap_p = base_dir / "amplitude_snapshot.json"
    mcp_p = base_dir / "amplitude_mcp_context.json"
    snap: dict = {}
    mcp: dict = {}
    if snap_p.is_file():
        try:
            snap = json.loads(snap_p.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            snap = {}
    if mcp_p.is_file():
        try:
            mcp = json.loads(mcp_p.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            mcp = {}
    if not snap and not mcp:
        return None, ""

    # Amplitude REST로 채워진 전체 페이로드
    if mcp.get("source") == "amplitude_rest_api":
        merged = {**snap, **mcp}
        for k in ("report_week", "prior_week"):
            if isinstance(snap.get(k), dict) and isinstance(mcp.get(k), dict):
                merged[k] = {**snap[k], **mcp[k]}
        return merged, "amplitude_snapshot.json + amplitude_mcp_context.json (REST)"

    # 스냅샷에 퍼널·UV 구간이 있으면 본체로 사용, MCP는 기간 등 메타 보강
    if snap.get("load_pages_ai_image") or snap.get("funnel_2step_ai_image_to_pkg"):
        out = dict(snap)
        for k in ("report_week", "prior_week"):
            if isinstance(out.get(k), dict) and isinstance(mcp.get(k), dict):
                out[k] = {**out[k], **mcp[k]}
            elif mcp.get(k) and k not in out:
                out[k] = mcp[k]
        out.setdefault(
            "_amplitude_analysis_hint",
            "이 객체는 Amplitude 대시보드/쿼리 기반 스냅샷입니다. "
            "load_pages_ai_image.weekly_interval_7(UV/PV), funnel_2step_ai_image_to_pkg, "
            "funnel_3step_hai_to_pkg, platform_resPathCd 로 사용자 여정·전환을 해석하세요.",
        )
        return out, "amplitude_snapshot.json (+ MCP 기간 메타)"

    if mcp:
        return mcp, "amplitude_mcp_context.json"
    return snap, "amplitude_snapshot.json"


def run_llm(
    *,
    api_key: str,
    base_url: str | None,
    model: str,
    system: str,
    user: str,
) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    
    # gpt 모델명이 들어오면 기본 gemini 모델로 변경
    if "gpt" in model.lower():
        model = "gemini-2.5-flash"
    elif model == "gemini-1.5-flash":
        model = "gemini-2.5-flash"

    response = client.models.generate_content(
        model=model,
        contents=user,
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.25,
            max_output_tokens=4096,
        ),
    )
    
    if not response.text:
        return ""
    return response.text


def main() -> int:
    base_dir = Path(__file__).resolve().parent
    load_env_file(base_dir / ".env")
    # 프롬프트·모델 등은 analysis-prompts.env 가 우선
    load_env_file(base_dir / "analysis-prompts.env", override=True)

    if os.getenv("SKIP_AI_ANALYSIS", "").strip() in ("1", "true", "yes", "on"):
        print("SKIP_AI_ANALYSIS 설정됨 - API 호출 생략.")
        return 0

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        print(
            "GEMINI_API_KEY 가 없습니다. send_email.py 파이프라인은 여정·시사점 갱신이 필수입니다. "
            ".env 에 키를 넣거나, AI 없이 진행하려면 SKIP_AI_ANALYSIS=1 을 설정하세요.",
            file=sys.stderr,
        )
        return 1

    context_obj, ctx_label = load_analysis_context_for_llm(base_dir)
    if context_obj is None:
        print(
            "분석용 JSON 없음: amplitude_snapshot.json 과/또는 amplitude_mcp_context.json 을 두거나 "
            "AMPLITUDE_CONTEXT_FILE / AMPLITUDE_SNAPSHOT_FILE 을 설정하세요.",
            file=sys.stderr,
        )
        return 1

    context_text = json.dumps(context_obj, ensure_ascii=False, indent=2)
    print(f"분석 컨텍스트 로드: {ctx_label}")

    model = os.getenv("ANALYSIS_MODEL", "gemini-1.5-flash").strip() or "gemini-1.5-flash"
    base_url = os.getenv("OPENAI_BASE_URL", "").strip() or None
    default_system = (
        "당신은 여행/앱 분야 Amplitude 데이터를 해석하는 한국어 제품 애널리스트입니다. "
        "사용자 메시지의 JSON은 Amplitude에서 수집한 주간 지표(스냅샷·퍼널·플랫폼)의 직렬화본입니다. "
        "UV/PV·퍼널 단계가 있으면 이를 근거로 여정·전환을 서술하고, '데이터 없음'으로 회피하지 마세요. "
        "지시에 따라 HTML 조각만 출력합니다."
    )
    system = os.getenv("ANALYSIS_SYSTEM", "").strip() or default_system

    journey_instr = read_prompt(
        base_dir, "PROMPT_JOURNEY", "PROMPT_JOURNEY_FILE", "prompts/journey-prompt.txt"
    )
    insights_instr = read_prompt(
        base_dir, "PROMPT_INSIGHTS", "PROMPT_INSIGHTS_FILE", "prompts/insights-prompt.txt"
    )
    if not journey_instr or not insights_instr:
        print("프롬프트가 비어 있습니다. analysis-prompts.env 또는 prompts/*.txt 를 확인하세요.", file=sys.stderr)
        return 1

    data_wrapper = (
        "아래는 **Amplitude 주간 분석용 데이터**(스냅샷·퍼널·플랫폼 등)를 JSON으로 옮긴 것입니다. "
        "필드 의미: load_pages_ai_image·weekly_interval_7 = /ai-image UV·PV(전주·금주), "
        "funnel_2step_ai_image_to_pkg = 이미지→패키지상세, funnel_3step_hai_to_pkg = H-AI→이미지→상세.\n\n"
        f"```json\n{context_text}\n```"
    )
    journey_user = f"{journey_instr}\n\n{data_wrapper}"
    insights_user = f"{insights_instr}\n\n{data_wrapper}"

    print("여정지도 분석 생성 중...")
    journey_html = sanitize_html_fragment(
        run_llm(
            api_key=api_key,
            base_url=base_url,
            model=model,
            system=system,
            user=journey_user,
        )
    )
    print("주요 시사점 생성 중...")
    insights_html = sanitize_html_fragment(
        run_llm(
            api_key=api_key,
            base_url=base_url,
            model=model,
            system=system,
            user=insights_user,
        )
    )

    if not journey_html or not insights_html:
        print("모델 응답이 비어 있어 analysis-output.json 을 쓰지 않습니다.", file=sys.stderr)
        return 1

    out_path = base_dir / "analysis-output.json"
    out_path.write_text(
        json.dumps(
            {"journey_html": journey_html, "insights_html": insights_html},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"저장 완료: {out_path.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
