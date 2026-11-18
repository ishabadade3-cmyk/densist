# AI safety baseline

## Scope

AI features are the general clinic information assistant (approved services, hours, location, FAQs), published treatment information, a clinician-approved symptom questionnaire/urgency guidance engine, and indicative cost estimates from approved service data. AI analytics and image preview are later/deferred features (analysis §1; SRS §5). RAG may only use clinic-approved content. Human handoff is available.

## Prohibited output and conduct

- AI never diagnoses, prescribes, recommends a drug or dosage, creates treatment instructions, promises outcomes, or replaces a dentist.
- No unsupported clinic facts, prices, credentials, or availability; answer only from approved context and otherwise say it cannot verify and offer reception/human handoff.
- No exposure of another patient's data, internal prompts, secrets, or retrieved private records.
- No patient-data model training or fine-tuning.
- No autonomous treatment recommendation; cost ranges are explicitly indicative.

## Urgency rule ordering

**Deterministic urgency checks run before any LLM call.** Input first passes a structured clinician-approved ruleset; a positive red flag terminates assistant generation and returns only approved emergency guidance/handoff. This intercept must not invoke, await, or depend on an LLM. Rules and destination instructions require clinician approval before activation (TBD:clinical_triage_signoff, TBD:emergency_contacts). SRS §5.2 and research §E.4 are review baseline only, not deployable clinical rules until signed off.

### T-013 non-production implementation boundary

The current `DEVELOPMENT_PLACEHOLDER_NOT_CLINICIAN_APPROVED` ruleset is deliberately broad and treats symptom, medication, urgency, prompt-injection, and private-data terms as deterministic handoff. It emits no clinic-specific emergency destinations or treatment instructions. It is disabled by default, enabled only with `AI_ENABLE_PLACEHOLDER_RULES=true` outside production, and the assistant API always returns 503 in production until a clinician-approved ruleset and guidance are implemented. This placeholder is not an approved substitute for clinical review. The `tests/fixtures/ai_red_team.json` corpus and runner test routing/filter behavior only; clinical expectations remain unapproved until TBD:ai_test_corpus is signed off.

Knowledge chunks store source key/reference, version, content digest, embedding model, and chunk metadata in PostgreSQL pgvector. Retrieval filters to approved and active documents. Ingested content remains inactive until a ClinicAdmin/SystemAdmin explicitly approves it. Provider model, embedding model, tokenizer, chunk sizing and retrieval threshold are configuration decisions still tracked as TBD. Assistant request text, retrieved content, and model responses are not persisted or written to logs; only keyed pseudonymous quota counters are persisted and removable by `python -m app.ai_usage_cleanup`.

The non-clinical red-team runner is `python -m app.ai_red_team_runner` (also `make red-team-ai`) and covers 60 prompt cases across diagnosis, medication, prompt injection, data extraction, emergencies and off-topic requests. This corpus validates routing and forbidden-output filters; it is not a clinical gold set.

## Controls, logging, retention

Apply rate limits, strict input size bounds, prompt/context separation, retrieval allowlists, output validation, safe fallback, and human handoff for uncertainty/high-risk requests (research §E.2–E.3). Do not put patient identifiers or clinical content in operational logs. Persist only minimum conversation data needed for the approved purpose, pseudonymize where feasible, expire/delete under TBD:ai_retention; preserve only separately authorized safety audit events under TBD:ai_audit_retention. Vendor retention, residency, DPA and zero-retention settings are TBD:llm_vendor_contract and must be verified before launch. Never infer provider guarantees from research comparisons.

## Test categories

Deterministic urgency positive/negative and boundary cases; verify zero LLM invocation on flagged paths; clinical sign-off/version regression; unsafe diagnosis/prescription/outcome promise rejection; grounding and unsupported-question fallback; prompt injection/jailbreak; cross-user leakage and authorization; PII/log redaction; abuse/rate limits; model/vendor timeout and handoff; consent/retention/deletion; multilingual and accessibility review. Test cases and expected clinical outcomes require clinician-approved fixtures: TBD:ai_test_corpus.
