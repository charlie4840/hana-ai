# AI 이미지 주간 리포트 — 정책·기능 정의

Amplitude_weekly report 프로젝트에서 **지금까지 합의·구현된 동작**을 한곳에 정리한 문서입니다.

### 문서 갱신 규칙

- **기능·정책·스크립트·환경변수가 바뀌면 이 파일(`docs/POLICIES-AND-FEATURES.md`)을 같은 작업 안에서 바로 수정한다.**
- MCP 예시 JSON은 `docs/examples/amplitude_mcp_context.example.json` — 구조 변경 시 함께 맞춘다.
- **Cursor Agent Skill:** 워크플로 요약은 `.cursor/skills/amplitude-weekly-report/SKILL.md` — 파이프라인이 바뀌면 해당 스킬도 함께 수정한다.

**목차:** `docs/README.md`에서 본 문서로 연결된다.

---

## 1. 프로젝트 목적

- **H-AI × AI 이미지** 주간 성과를 Amplitude 수치와 함께 **HTML 메일**로 발송한다.
- **선택한 리포트 기간**과 메일에 찍히는 KPI·비교 구간이 **일치**해야 한다.
- 여정·시사점 블록은 LLM(Gemini)이 `amplitude_mcp_context.json` 등과 프롬프트를 바탕으로 생성한 HTML을 사용한다.

---

## 2. Amplitude 데이터: REST · MCP · 자동화

| 경로 | 누가 / 언제 | 비고 |
|------|-------------|------|
| **Dashboard REST** | `send_email.py`, `report_builder` 미리보기, `fetch_amplitude_context.py` | `.env`에 `AMPLITUDE_API_KEY` + `AMPLITUDE_SECRET_KEY`(또는 `AMPLITUDE_SECRET`). **작업 스케줄러·cron**으로 주기 실행 가능. |
| **Cursor Amplitude MCP** | **Cursor 채팅/에이전트**만 | MCP는 IDE 안에서만 동작. **Python 웹서버·스케줄러 프로세스는 MCP를 호출할 수 없음.** 조회 후 결과를 `amplitude_snapshot.json` 등에 저장하면 CLI/UI가 읽음. |
| **`amplitude_snapshot.json`** | MCP·수동 편집 | `send_email.py --mcp` 또는 REST 키 없을 때 `report_builder`가 **스냅샷 규칙**으로 사용. |

- **자동 발송(매주 메일):** MCP 없이 **REST 키 + `run-scheduled-email.ps1` → `send_email.py`** 로 동작한다.
- **cron 등으로 “데이터만” 주기 갱신:** `fetch_amplitude_context.py` — 메일/분석 없이 `amplitude_mcp_context.json`만 갱신.

---

## 3. 핵심 정책

### 3.1 발송 파이프라인 (`send_email.py`)

다음 순서를 **항상** 따른다. 중간 단계가 실패하면 **메일을 보내지 않는다.**

1. `.env` 로드  
2. 리포트 기간 확정 (아래 5절)  
3. **데이터 소스 (둘 중 하나)**  
   - **`--mcp`:** REST 키 불필요. `validate_mcp_files_for_cli_period` 통과 필요.  
   - **`--mcp` 아니고 REST 키 있음:** `fetch_amplitude_kpi_and_persist_context`  
   - **키 없고 `--mcp` 아님:** 안내 후 exit 1  
4. **`generate_analysis.py` 항상 실행** — 실패 시 exit 1, 타임아웃 10분  
5. `send_weekly_report_email` — `kpi_overlay`로 KPI 치환 후 SMTP 발송  

### 3.2 스냅샷 검증 (`validate_mcp_files_for_cli_period`)

- **`load_pages_ai_image.weekly_interval_7`**에 리포트 **시작일이 속한 주의 월요일** 키(예: `2026-03-09`)와 `uniques`, `totals_pv`가 **반드시** 있어야 한다.  
- 없을 때 오류 메시지에 **현재 파일에 있는 주차 키 예시**를 넣어 MCP/REST로 무엇을 채울지 안내한다.  
- **`report_week.range_kst`**는 메타 정보일 뿐, **선택 기간과 달라도 오류로 막지 않는다.** (퍼널·전환 표시 정합성은 `kpi_tokens_from_snapshot` / `_snapshot_matches_report_week`가 처리.)

### 3.3 분석 생성 (`generate_analysis.py`)

- 기본: **`GEMINI_API_KEY` 필수** — 없으면 exit 1.  
- **예외:** `SKIP_AI_ANALYSIS=1`이면 API 생략·exit 0 — 여정·시사점은 이전 `analysis-output.json`일 수 있음.

### 3.4 KPI·템플릿

- **`prepare_email_html`:** 먼저 `kpi_tokens_from_snapshot`, 이어서 `kpi_overlay`로 덮어씀. REST 성공 시 REST가 우선.  
- **전주(비교 구간):** REST는 `prior_period_for_range(report_start, report_end)` (리포트와 **동일 일수** 직전 구간).

### 3.5 설정·비밀

- **`.env`:** Amplitude, SMTP, `RECEIVER_EMAIL`, (선택) `MAIL_SUBJECT`, (선택) `FLASK_SECRET_KEY`, `CONTROL_PANEL_PORT`  
- 저장소에는 **`.env.example`만** 커밋한다.

---

## 4. 리포트 기간 결정

| 방식 | 동작 |
|------|------|
| `--start` + `--end` | 해당 구간 |
| 하나만 지정 | 오류 |
| 인자 없음 | `get_report_week_range(now)` — 직전 완료 **월~일** 한 주 |

`fetch_amplitude_context.py`도 동일한 `--start`/`--end`/생략 규칙을 따른다 (발송은 하지 않음).

---

## 5. 기능 정의 (구성 요소)

### 5.1 `send_email.py`

- CLI 발송 진입점. `--mcp` / REST 분기.  
- 예: `python send_email.py --start 2026-03-09 --end 2026-03-15`  
- 예: `python send_email.py --mcp --start … --end …` (스냅샷만)

### 5.2 `fetch_amplitude_context.py`

- **발송·`generate_analysis` 없음.**  
- REST로 KPI 조회 후 **`amplitude_mcp_context.json`만** 갱신.  
- **cron / Linux·macOS·WSL** 등 주기 실행용. Windows는 동일 명령을 **작업 스케줄러**에 등록하면 됨.  
- 인자 없으면 `get_report_week_range` 기준 “지난 완료 주”.

### 5.3 `report_mail.py`

- `fetch_amplitude_kpi_and_persist_context`, `prepare_email_html`, `send_weekly_report_email`  
- `validate_mcp_files_for_cli_period`, `refresh_mcp_context_period_metadata`, `parse_range_kst_bounds`  
- `kpi_tokens_from_snapshot` — 주차·퍼널 정합성

### 5.4 `amplitude_collect.py`

- Amplitude Dashboard REST — 세그멘테이션·퍼널·플랫폼·(선택)지역

### 5.5 `generate_analysis.py`

- 스냅샷 + `amplitude_mcp_context.json` 병합 → LLM → `analysis-output.json`

### 5.6 `control_server.py` + `control_panel.html` + `report_builder.html`

- `/` — 프롬프트 편집·저장  
- `/report-builder` — 날짜 선택 → 미리보기 → 발송  
- **브라우저는 MCP를 호출할 수 없음** — 서버 쪽은 REST 또는 스냅샷(`report_builder_service.build_weekly_report_preview`).  
- Flask **세션**으로 미리보기 HTML·`kpi_overlay` 캐시. 선택 `FLASK_SECRET_KEY`.  
- `http://127.0.0.1:포트` 로 열 것 (`file://` 불가).

### 5.7 `run-scheduled-email.ps1`

- `send_email.py` 실행 (인자 없으면 자동 지난주). 로그: `logs/weekly-send.log`.

### 5.8 `register-weekly-report-task.ps1`

- 스케줄 등록. **`SCHEDULE_*`는 프로젝트 루트 `.env`에서 읽음.**

---

## 6. 산출물·파일

| 파일 | 역할 |
|------|------|
| `amplitude_mcp_context.json` | REST/패널 메타·수치, LLM 컨텍스트 (gitignore) |
| `amplitude_snapshot.json` | MCP·수동 스냅샷 |
| `analysis-output.json` | 여정·시사점 HTML (gitignore) |
| `weekly-report-email.html` | 메일 템플릿 |
| `docs/examples/amplitude_mcp_context.example.json` | MCP 수동 채움 참고 |

---

## 7. 운영 체크리스트

- [ ] `.env`: Amplitude(자동 발송 시), SMTP, `RECEIVER_EMAIL`  
- [ ] 분석: `GEMINI_API_KEY` 또는 `SKIP_AI_ANALYSIS=1`  
- [ ] 주간 자동 메일: 작업 스케줄러 → `run-scheduled-email.ps1`  
- [ ] 주기로 **데이터만** 갱신: cron 등 → `python fetch_amplitude_context.py`  
- [ ] Cursor에서만 MCP로 채운 뒤 `--mcp` 또는 스냅샷 + `report_builder` (키 없을 때)

---

*최종 갱신: 2026-04-02 — REST/MCP 구분, 스냅샷 검증 완화, `fetch_amplitude_context.py`, 문서 즉시 갱신 규칙 반영.*
