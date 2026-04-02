---
name: amplitude-weekly-report
description: >-
  Operates the Amplitude_weekly report repo: weekly KPI HTML email, Dashboard REST vs MCP snapshot,
  send_email.py / fetch_amplitude_context.py / control_server report-builder, and docs maintenance.
  Use when the user works in this folder or mentions weekly Amplitude report, 주간 보고서, REST 키,
  amplitude_snapshot.json, report-builder, or automated email send.
---

# Amplitude 주간 리포트 프로젝트

## 역할

이 스킬은 **Amplitude_weekly report** 폴더 안에서 주간 메일 파이프라인·설정·문서를 다룰 때 따른다.

## 데이터 가져오기 (정리)

| 방식 | 조건 | 명령/동작 |
|------|------|-----------|
| **REST (CLI 자동)** | `.env`에 `AMPLITUDE_API_KEY` + `AMPLITUDE_SECRET_KEY`(또는 `AMPLITUDE_SECRET`) | `python fetch_amplitude_context.py` (컨텍스트만) / `python send_email.py` (분석+메일) |
| **스냅샷** | REST 키 없음 | Cursor **Amplitude MCP**로 조회 후 `amplitude_snapshot.json` 갱신 → `python send_email.py --mcp --start … --end …` |
| **웹 미리보기** | `python control_server.py` → `/report-builder` | 브라우저는 MCP 호출 불가. REST 또는 유효한 스냅샷(`weekly_interval_7`에 리포트 주 **월요일** 키 필수). |

- **작업 스케줄러 자동 발송:** MCP가 아니라 **REST + `run-scheduled-email.ps1` → `send_email.py`**.
- **MCP는 Cursor 채팅/에이전트에서만** 사용 가능. Python 서버·cron은 MCP에 연결할 수 없음.

## 스냅샷 검증 (`validate_mcp_files_for_cli_period`)

- `load_pages_ai_image.weekly_interval_7`에 **시작일이 속한 주의 월요일** 키 + `uniques`/`totals_pv` 필수.
- `report_week.range_kst`는 UI 기간과 달라도 **오류로 막지 않음** (퍼널 정합성은 `kpi_tokens_from_snapshot`이 처리).

## 코드 변경 시 문서

- 정책·기능이 바뀌면 **`docs/POLICIES-AND-FEATURES.md`**를 같은 작업에서 갱신한다.
- 요약 링크: `docs/README.md`.

## 주요 파일

- `send_email.py` — 조회 + `generate_analysis` + SMTP
- `fetch_amplitude_context.py` — REST로 `amplitude_mcp_context.json`만 (cron용)
- `report_mail.py` — KPI·메일 HTML·스냅샷 토큰
- `report_builder_service.py` + `control_server.py` — 웹 미리보기·발송
- `prompts/journey-prompt.txt`, `prompts/insights-prompt.txt` — LLM 지시문
- `.env.example` — 설정 템플릿 (비밀은 `.env`만)

## 에이전트 행동

1. Amplitude 수치가 필요하면 **REST 키 유무**를 먼저 구분하고, 키 없으면 **MCP로 스냅샷 갱신** 또는 사용자에게 키 설정 안내.
2. 파일·스크립트 수정 후 **POLICIES 문서**를 함께 업데이트할지 확인한다.
3. `.env` 내용은 로그/채팅에 **출력하지 않는다**.
