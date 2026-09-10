# Invbroker E2E Smoke Tests

Repositorio ligero y centralizado para integración continua (CI/CD) en pipelines de desarrollo.

## Ejecución por Proyecto

```bash
# Instalar dependencias
npm install
npx playwright install --with-deps chromium

# Correr solo tests de Whitelabel
npx playwright test --project=whitelabel

# Correr todo
npx playwright test
```
