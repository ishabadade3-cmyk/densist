"""Deterministic, development-only triage placeholder.

This ruleset is deliberately broad and conservative. It is NOT clinician-approved,
must never be enabled in production, and emits no clinical instructions. Production
assistant requests remain disabled until a clinician-approved ruleset is implemented.
"""

from __future__ import annotations

import re
from dataclasses import dataclass


PLACEHOLDER_RULESET_VERSION = "DEVELOPMENT_PLACEHOLDER_NOT_CLINICIAN_APPROVED"
_POTENTIAL_URGENT = re.compile(
    r"\b(emergency|urgent|severe|swelling|swollen|bleeding|blood|can't breathe|cannot breathe|"
    r"difficulty breathing|choking|fever|trauma|injury|knocked out|broken tooth|pain|toothache|"
    r"infection|pus|allerg\w*|dosage|dose|mg|medicin\w*|prescription|diagnos\w*|prescrib\w*)\b",
    re.IGNORECASE,
)
_INJECTION_OR_PRIVATE_DATA = re.compile(
    r"\b(ignore|override|bypass).{0,40}\b(instruction|system|prompt|rule)|"
    r"(system prompt|hidden prompt|hidden system|api key|secret|password|credential|token|patient record|"
    r"patient database|clinical records|other patient|database dump)|"
    r"\bpatient.{0,24}(record|data|name|visit|appointment)s?\b",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class UrgencyResult:
    escalated: bool
    rule_codes: tuple[str, ...]
    ruleset_version: str
    guidance: str | None


def deterministic_urgency_check(text: str) -> UrgencyResult:
    """Check before any LLM call. The placeholder treats clinical/symptom terms as handoff."""
    if _POTENTIAL_URGENT.search(text):
        return UrgencyResult(
            escalated=True,
            rule_codes=("PLACEHOLDER_CLINICAL_OR_URGENCY_HANDOFF",),
            ruleset_version=PLACEHOLDER_RULESET_VERSION,
            guidance=(
                "This development-only assistant cannot assess symptoms or provide emergency instructions. "
                "Please contact a qualified clinician or local emergency service for urgent help."
            ),
        )
    if _INJECTION_OR_PRIVATE_DATA.search(text):
        return UrgencyResult(
            escalated=True,
            rule_codes=("PLACEHOLDER_UNSAFE_OR_PRIVATE_DATA_HANDOFF",),
            ruleset_version=PLACEHOLDER_RULESET_VERSION,
            guidance=None,
        )
    return UrgencyResult(False, (), PLACEHOLDER_RULESET_VERSION, None)


def route_intent(text: str) -> str:
    lowered = text.lower()
    if _INJECTION_OR_PRIVATE_DATA.search(text):
        return "unsafe_or_private_data"
    if re.search(r"\b(diagnos|what do i have|what is wrong|should i take|how many mg|dosage|prescribe)\b", lowered):
        return "clinical_advice"
    if re.search(r"\b(price|cost|estimate|how much)\b", lowered):
        return "cost_estimate"
    if re.search(r"\b(service|treatment information|hours|open|location|address|contact|faq|parking)\b", lowered):
        return "approved_clinic_information"
    return "human_handoff"


def filter_output(answer: str) -> bool:
    """Reject likely diagnoses, drug/dose instructions, treatment steps and outcome promises."""
    patterns = (
        r"\byou (have|are suffering from|likely have)\b",
        r"\b(diagnosis|diagnosed as|diagnosed with)\b",
        r"\b(take|use|apply|ingest)\s+.{0,40}\b\d+\s*(mg|ml|tablet|dose)s?\b",
        r"\b(prescribe|prescription for)\b",
        r"\b(guaranteed|will definitely|permanent results|100% success|certain to cure)\b",
        r"\b(step\s*\d|do this procedure yourself|treatment plan for you)\b",
    )
    return not any(re.search(pattern, answer, re.IGNORECASE) for pattern in patterns)
