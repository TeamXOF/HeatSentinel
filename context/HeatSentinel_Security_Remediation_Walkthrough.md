# Remediation Verification Report — HeatSentinel AI

**Date:** 2026-08-30  
**Scope:** All 8 findings (HSA-01 through HSA-08) from the security audit, plus bonus items.

---

## Fix Status Summary

| HSA ID | Title | Status | Note |
|---|---|---|---|
| HSA-01 | Gemini API key in URL query string | **Fixed** | Key moved to `x-goog-api-key` header. Verified no other call site leaks. |
| HSA-02 | Live API keys in `.env` on disk | **Requires Human Action** | Cannot rotate keys programmatically. Confirmed `.env` not tracked, `.env.example` has placeholders only. Added security notice to `README.md` with rotation instructions. |
| HSA-03 | All API endpoints unauthenticated | **Fixed** | `verify_api_key` dependency added to all routers except `health`. Health stays open for load balancer probes. `HEATSENTINEL_API_KEY` added to `.env.example`. |
| HSA-04 | No rate limiting | **Fixed** | `slowapi==0.1.9` added with `5/minute` on `/heat-hunt/start`, `30/minute` on `/fortyguard/test-scan` and `/analysis/basic-scan`. |
| HSA-05 | System prompt extractable via prompt injection | **Fixed** | `_sanitize_geojson_for_prompt()` sanitizer applied to both Anthropic and Gemini agent loops. |
| HSA-06 | Tool execution without input validation | **Fixed** | `jsonschema==4.24.0` validation added to `execute_tool()`. All 10 tools have `input_schema` defined. |
| HSA-07 | SSE stream timeout uncapped | **Fixed** | `timeout_seconds` capped with `ge=1.0, le=300.0`. |
| HSA-08 | `express` and build tools misplaced in frontend deps | **Fixed** | `express`, `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `dotenv` moved to `devDependencies`. `npm install` and `npm run build` verified clean. |

### Bonus Items

| Item | Status | Note |
|---|---|---|
| Wire `redact_sensitive_headers()` | **Fixed** | Imported into `fortyguard_client.py`, added `_safe_headers` property. Added `x-goog-api-key` to the redaction list in `errors.py`. |
| Pin exact versions in `requirements.txt` | **Fixed** | All `>=` specifiers converted to `==` based on installed venv versions. `slowapi==0.1.9` and `jsonschema==4.24.0` added. |
| Confirm frontend lockfile committed | **Verified** | `frontend/package-lock.json` is tracked in git. |

---

## Deviations from Audit's Suggested Diffs

| Fix | Deviation | Reason |
|---|---|---|
| HSA-03 | Auth reads `HEATSENTINEL_API_KEY` from `os.environ.get()` at module level rather than using `pydantic-settings`. | The existing `config.py` Settings model doesn't have this field. Adding it would require touching config validation logic. The `os.environ` approach is simpler and self-contained. |
| HSA-04 | Each router creates its own `limiter = Limiter(...)` instance in addition to the one in `main.py`. | `slowapi` requires a `@limiter.limit()` decorator reference. The `main.py` limiter handles exception handling; the per-router instances handle the actual rate limits. Both use `get_remote_address` for consistency. |
| HSA-04 | In `heat_hunt.py`, the body parameter was renamed from `request` to `payload` to avoid conflict with `slowapi`'s requirement for `Request` as the first parameter. | `slowapi` introspects the first parameter to extract the client IP. The original `request: Optional[StartHeatHuntRequest]` shadowed it. |
| HSA-05 | Sanitizer also strips strings containing `{`, `}`, `\n`, `\r` characters, not just by length. | Extra defense against prompt injection payloads embedded in string values that might contain structured instructions. |
| HSA-06 | Import aliased as `JsonSchemaValidationError` to avoid collision with Pydantic's `ValidationError`. | Both `jsonschema` and `pydantic` export a class named `ValidationError`. |

---

## New Risks Introduced by Fixes

| Fix | Residual Risk |
|---|---|
| HSA-03 | A **static API key** is a minimal access control. It does not provide per-user identity, audit trails, or token expiration. For production, implement OAuth 2.0 or JWT-based authentication. If the `HEATSENTINEL_API_KEY` value is leaked, an attacker has full API access. |
| HSA-04 | `slowapi` uses in-memory storage by default (`MemoryStorage`), which resets on server restart and does not work across multiple backend instances. For production behind a load balancer, configure a Redis-backed storage backend. |
| HSA-05 | The GeoJSON sanitizer is **best-effort**. It strips obvious prompt injection payloads but cannot prevent all adversarial inputs from reaching the LLM context. Runtime prompt injection testing with adversarial payloads is still recommended. |
| HSA-06 | `jsonschema` validation adds ~1-2ms latency per tool call. Negligible for the current 10 tools, but monitor if the tool surface grows significantly. |

---

## Outstanding Human Actions

> [!CAUTION]
> **1. Rotate all three API keys immediately:**
> - `FORTYGUARD_API_KEY` — FortyGuard developer portal
> - `GEMINI_API_KEY` — Google AI Studio / Google Cloud Console
> - `CENSUS_API_KEY` — US Census Bureau API key management
>
> The current keys in `backend/.env` should be considered compromised since they exist in plaintext on disk and were visible during the audit.

> [!WARNING]
> **2. Review the Content-Security-Policy header:**
> The current CSP (`default-src 'self'; frame-ancestors 'none';`) will block:
> - Inline styles injected by React/Emotion (if used)
> - External Google Fonts loaded via `<link>` in `index.html` (currently `fonts.googleapis.com` / `fonts.gstatic.com`)
> - MapLibre GL tile requests to external tile servers
>
> Before public deployment, audit the CSP by loading the app with DevTools open, observing CSP violation reports, and adding appropriate `font-src`, `style-src`, `img-src`, and `connect-src` directives.

---

## Files Modified

| File | Changes |
|---|---|
| [`orchestrator.py`](file:///c:/Users/USER/OneDrive/Documents/heatsentinel-ai/backend/app/agent/orchestrator.py) | HSA-01: Key → header. HSA-05: GeoJSON sanitizer in both loops. |
| [`main.py`](file:///c:/Users/USER/OneDrive/Documents/heatsentinel-ai/backend/app/main.py) | HSA-03: Auth gate. HSA-04: slowapi wiring. |
| [`heat_hunt.py`](file:///c:/Users/USER/OneDrive/Documents/heatsentinel-ai/backend/app/routers/heat_hunt.py) | HSA-04: Rate limit 5/min. HSA-07: Timeout cap 300s. |
| [`fortyguard.py`](file:///c:/Users/USER/OneDrive/Documents/heatsentinel-ai/backend/app/routers/fortyguard.py) | HSA-04: Rate limit 30/min. |
| [`analysis.py`](file:///c:/Users/USER/OneDrive/Documents/heatsentinel-ai/backend/app/routers/analysis.py) | HSA-04: Rate limit 30/min. |
| [`tool_registry.py`](file:///c:/Users/USER/OneDrive/Documents/heatsentinel-ai/backend/app/agent/tool_registry.py) | HSA-06: jsonschema validation. |
| [`errors.py`](file:///c:/Users/USER/OneDrive/Documents/heatsentinel-ai/backend/app/errors.py) | Bonus: Added `x-goog-api-key` to redaction list. |
| [`fortyguard_client.py`](file:///c:/Users/USER/OneDrive/Documents/heatsentinel-ai/backend/app/services/fortyguard_client.py) | Bonus: Wired `redact_sensitive_headers`, added `_safe_headers`. |
| [`requirements.txt`](file:///c:/Users/USER/OneDrive/Documents/heatsentinel-ai/backend/requirements.txt) | Pinned all versions `==`. Added `slowapi==0.1.9`, `jsonschema==4.24.0`. |
| [`package.json`](file:///c:/Users/USER/OneDrive/Documents/heatsentinel-ai/frontend/package.json) | HSA-08: 5 packages moved to `devDependencies`. |
| [`README.md`](file:///c:/Users/USER/OneDrive/Documents/heatsentinel-ai/README.md) | HSA-02: Security notice with rotation instructions. |
| [`.env.example`](file:///c:/Users/USER/OneDrive/Documents/heatsentinel-ai/backend/.env.example) | HSA-03: Added `HEATSENTINEL_API_KEY` placeholder. |

## Build Verification

- ✅ `npm install` — clean (0 vulnerabilities)
- ✅ `npm run build` — clean (1,792 kB bundle produced)
- ✅ `pytest` — **120 passed, 0 failed** (244s, 2 non-security warnings only)
