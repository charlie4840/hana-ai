# 문서

- **정책·기능 (코드 변경 시 여기부터 갱신):** [POLICIES-AND-FEATURES.md](./POLICIES-AND-FEATURES.md)
- **Cursor 에이전트 스킬 (이 레포 전용):** `../.cursor/skills/amplitude-weekly-report/SKILL.md`
- **MCP 컨텍스트 예시(JSON):** [examples/amplitude_mcp_context.example.json](./examples/amplitude_mcp_context.example.json)

## 스크립트 요약 (상세는 POLICIES 문서)

| 스크립트 | 용도 |
|----------|------|
| `send_email.py` | 조회 + 분석 + **메일 발송** |
| `fetch_amplitude_context.py` | REST로 **`amplitude_mcp_context.json`만** 갱신 (cron·스케줄용) |
| `control_server.py` | 프롬프트 패널 + `/report-builder` 미리보기·발송 |
