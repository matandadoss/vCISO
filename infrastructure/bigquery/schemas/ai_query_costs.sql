CREATE TABLE IF NOT EXISTS `vciso_analytics.ai_query_costs` (
    query_id STRING NOT NULL,
    org_id STRING NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    workflow STRING NOT NULL,
    query_tier STRING NOT NULL,
    provider_used STRING NOT NULL,
    model_used STRING NOT NULL,
    input_tokens INT64,
    output_tokens INT64,
    cost_usd FLOAT64,
    latency_ms INT64,
    was_downgraded BOOL,
    downgrade_reason STRING,
    user_query_hash STRING
)
PARTITION BY DATE(timestamp)
CLUSTER BY org_id, workflow, query_tier;
