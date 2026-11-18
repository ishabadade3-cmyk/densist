# Error and uptime monitoring

The production Compose profile defines container health checks for PostgreSQL, the API and web app. Caddy health can be checked through the public HTTPS origin. `ops/monitoring/check-endpoints.sh` checks the public homepage and `/api/v1/health` without sending application data; it emits only a timestamp and success marker.

Example manual check:

```sh
PUBLIC_BASE_URL=https://<configured-domain> sh ops/monitoring/check-endpoints.sh
```

For a supplementary same-host check, install `ops/monitoring/dental-uptime-probe.service` and `ops/monitoring/dental-uptime-probe.timer` on the host after setting `PUBLIC_BASE_URL` in `/etc/dental/monitoring.env` and adjusting the installation path. A systemd timer cannot detect host/network loss; the independent external monitor remains a required launch gate.

Run the probe from an independent monitoring host or a systemd timer outside the application host so host loss is observable. Configure failure notification to the approved on-call route. The monitor vendor, check interval, alert destination, and on-call owner are unresolved and assigned in the launch checklist.

Container stdout/stderr is available through Docker logs and is size-limited by the daemon's logging configuration where configured by the host. A centralized error-tracking provider and application SDK have not been selected or integrated: do not send patient data, request bodies, session tokens, payment payloads, OTPs, or clinical details to any tracker. Select a provider only after its data-processing, retention, residency, access and incident terms are reviewed. Until integration is approved and verified, deployment is not considered to have operational error tracking and is not launch-ready.

Set alerts for unavailable public probes, unhealthy containers, failed database health checks, stale/missing backups, low storage, certificate renewal failures, and repeated restart loops. Keep alert payloads to service name, timestamp, status code and deployment identifier; exclude patient identifiers and request content. Record escalation, acknowledgement and recovery tests in the operations log.
