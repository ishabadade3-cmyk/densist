FROM postgres:16-alpine
RUN apk add --no-cache age bash tar gzip coreutils
COPY backup-loop.sh /usr/local/bin/backup-loop
COPY restore-copy.sh /usr/local/bin/restore-copy
RUN addgroup -S -g 10001 backup \
    && adduser -S -u 10001 -G backup backup \
    && chmod 0755 /usr/local/bin/backup-loop /usr/local/bin/restore-copy
USER backup:backup
ENTRYPOINT ["/usr/local/bin/backup-loop"]
