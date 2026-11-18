# Incident response checklist

This is an operational checklist, not a legal reporting determination. All legal deadlines and authority notifications require qualified counsel review; see `docs/brain/compliance.md`.

## First response

- [ ] Record detection time in UTC, reporter role, affected service, alert source and a non-sensitive incident reference.
- [ ] Assign the incident commander and technical lead. If the contacts are unresolved, use the accountable roles in `launch-checklist.md`; do not invent a person or phone number.
- [ ] Preserve relevant security and infrastructure evidence in access-controlled storage. Redact patient identifiers, clinical content, credentials and payment data from incident notes and exported logs.
- [ ] Assess availability, integrity and confidentiality separately. Do not inspect clinical records unless necessary and authorized.
- [ ] Contain with the least disruptive action that stops ongoing harm: isolate affected service, revoke exposed credentials, block a source, or pause affected processing. Record action and UTC time.
- [ ] For suspected patient-data exposure, notify the clinic owner and privacy/legal lead immediately. Counsel determines applicable notice duties and recipients.
- [ ] For suspected clinical harm or unsafe AI output, disable the affected workflow and notify the clinical lead. Emergency and triage instructions require clinician approval.
- [ ] For payment incidents, involve the payment provider and finance owner through approved secure channels; never collect card data.

## Recovery and closure

- [ ] Confirm a clean deployment or isolated restore; use `backup-restore.md` and preserve the production copy.
- [ ] Validate health endpoints, authorization boundaries, backup freshness, certificate, provider callbacks and consent-gated notifications before reopening.
- [ ] Obtain incident commander and clinic owner approval for service restoration.
- [ ] Complete a timeline, root-cause analysis, impact assessment, required notices (as counsel determines), corrective actions, owners and due dates.
- [ ] Run a lessons-learned review without copying sensitive data into general tickets.
- [ ] Verify credentials/secrets were rotated and temporary evidence or restore material was handled under the retention policy.

## Contact and decision roles

Contact details and deputies are TBD and must be stored in the clinic's restricted operations directory, not in this repository. Minimum assigned roles: incident commander, technical on-call, clinic owner, clinical lead, privacy/legal lead, finance/payment lead, and communications lead. Confirm an out-of-hours escalation route before launch.
