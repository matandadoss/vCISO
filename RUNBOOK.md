# Virtual CISO Platform - Runbook

## Adding a New AI Provider
The AI Provider Abstraction Layer is designed to be easily extensible. To add a new provider:
1.  **Add to Enum**: Open `/app/core/ai_provider.py` and add your provider to `AIProvider` enum.
2.  **Add Pricing**: Add the per-million token pricing to `AIProviderClient.PRICING`.
3.  **Map Tiers**: Update `resolve_model` to map `ModelTier` values to the specific model names for your provider.
4.  **Implement Logic**: Add a private method like `_complete_custom_provider(request, model)` handling the SDK calls, retries, and structured output logic.
5.  **Dispatch**: Call your new method inside `AIProviderClient.complete()`.

## Adjusting Budgets per Org
Budgets are managed in the `org_ai_budgets` Cloud SQL table.
- They dictate the threshold for auto-downgrading from deep analysis (TIER 3) to cheaper tiers to prevent cost overruns.
- Use the admin endpoint `PATCH /api/v1/ai/budget` (to be implemented) or directly modify the database record.

## Adding a New Correlation Rule
1. Open `/app/correlation/rule_engine.py`.
2. Define a new `RULE_X` trigger and check logic inside `evaluate_all`.
3. Create the `CorrelatedFinding` if conditions are met.

## Enabling/Disabling Workflows
Workflows are intended to run on a Cloud Scheduler schedule. Pause or enable the specific Cloud Scheduler Job in the GCP console that pushes to the target workflow's ingest endpoint.

## Manual Correlation Pipeline Execution
Use the CLI management command (running in the backend container):
`python -m app.correlation.run --org-id <uuid> --full`

## Cost Optimization Tips
1.  **Change Fallback Provider**: Edit `AI_FALLBACK_PROVIDER` in `.env` or Secret Manager to a cheaper tier model like `vertex_ai` (Flash).
2.  **Adjust Orchestrator Frequency**: Change the Cloud Scheduler jobs for Workflow Engines and Correlation Engine to run less frequently (e.g., daily instead of hourly).
3.  **Lower Default Budget Limit**: Change default org budget limits to restrict TIER 3 execution severely.
