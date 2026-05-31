# Deployment

Recommended first deployment:

- Vercel for the Next.js app and lightweight API routes
- Neon Postgres for aggregate features and predictions
- GitHub Actions for scheduled refresh and retraining

Environment variables:

```text
DATABASE_URL=
NWS_USER_AGENT=
MODEL_VERSION=
DEMO_DATA_MODE=true
```

If model serving becomes too heavy for Vercel Functions, keep the frontend on Vercel and move inference to a small FastAPI service.
