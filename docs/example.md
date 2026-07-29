--- ## 00-pulumi-outputs.yaml (lowest precedence)
yaml
outputs:
  database:
    endpoint: prod-db.internal
    port: 5432
schema_version: 1.10
--- ## 10-base.yaml
yaml
tls:
  enabled: no
  auto_renew: off
services:
  - name: api
    port: 8080
    config:
      base_timeout: 30
      read_timeout: "${.base_timeout}"
      listen_port: "${..port}"
  - name: web
    port: 8081
db:
  host: "${outputs.database.endpoint}"
  read_host: "${.host}"
routes:
  - path: /api
    upstream: api
  - upstream: web
--- ## 20-env-prod.yaml (highest precedence)
yaml
services:
  - id: api
    cpu: "1"
  - name: web
    cpu: "2"
db:
  port: "${outputs.database.port}"
---  