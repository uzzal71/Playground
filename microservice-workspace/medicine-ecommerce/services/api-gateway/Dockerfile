
FROM kong:3.7-ubuntu


USER root


RUN mkdir -p /usr/local/share/lua/5.1/kong/plugins/jwt-verifier
COPY plugins/jwt-verifier/ /usr/local/share/lua/5.1/kong/plugins/jwt-verifier/


RUN chown -R kong:kong /usr/local/share/lua/5.1/kong/plugins/jwt-verifier


COPY config/ /etc/kong/config/


USER kong


ENV KONG_PLUGINS=bundled,jwt-verifier
ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/etc/kong/config/kong.yml
ENV KONG_PROXY_LISTEN="0.0.0.0:8000, 0.0.0.0:8443 ssl"
ENV KONG_ADMIN_LISTEN="0.0.0.0:8001"
ENV KONG_STATUS_LISTEN="0.0.0.0:8100"
ENV KONG_LOG_LEVEL=info
ENV KONG_PROXY_ACCESS_LOG=/dev/stdout
ENV KONG_ADMIN_ACCESS_LOG=/dev/stdout
ENV KONG_PROXY_ERROR_LOG=/dev/stderr
ENV KONG_ADMIN_ERROR_LOG=/dev/stderr


EXPOSE 8000 8001 8100 8443


HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD kong health || exit 1
