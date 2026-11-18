# Clinic administrator guide

This guide covers the administrator workspace currently delivered by the application. It uses role-scoped APIs; the system administrator role does not imply unrestricted clinical-record access.

## Sign in and secure the account

1. Open the approved clinic deployment URL supplied by the clinic administrator. The URL is TBD until the clinic domain is approved.
2. Sign in using the individually assigned staff account and complete TOTP MFA.
3. Never share credentials, MFA codes, recovery material, or session screenshots. Sign out on shared devices and report suspected account exposure immediately.

## Routine workspace tasks

- **Calendar and appointments:** use the date/calendar filters to review scheduled work and allowed appointment status actions. The clinic's final transition and cancellation policies must be approved before staff are trained on them.
- **Services and public content:** changes remain subject to the clinic's approval and publishing workflow. Verify facts, prices and claims with the authorized owner before publishing. Never add unverified clinic facts.
- **Reports:** use aggregate reports for operational review. Do not export patient-level data unless a separate approved workflow and permission allow it.
- **Audit records:** review sensitive actions only for assigned operational purposes. Do not copy audit details into external tools or general chat.
- **Staff access:** request accounts and role changes through the named clinic access owner. Give each person only the role needed; remove access promptly when duties change.

## Help and escalation

For account/access problems contact the authorized clinic access owner via the clinic's restricted contact directory. For a suspected privacy or security issue follow `incident-response.md`. Payment disputes go to the finance/payment owner. Do not use this workspace to diagnose, prescribe, or communicate a treatment recommendation unless qualified and authorized clinical workflows permit it.

Clinic-specific names, contact routes, escalation timings, service catalogue, cancellation rules and reporting permissions remain TBD; this guide intentionally contains no example patient or clinic records.
