import pytest
from app.core.query_router import QueryRouter, QueryContext
from app.core.ai_provider import ModelTier

def test_query_router_search_only():
    router = QueryRouter()
    context = QueryContext(org_id="test", user_role="admin", open_finding_count=10, critical_finding_count=2)
    classification = router.classify("how many critical findings do I have?", context)
    assert classification.tier == ModelTier.SEARCH_ONLY

def test_query_router_deep():
    router = QueryRouter()
    context = QueryContext(org_id="test", user_role="admin", open_finding_count=10, critical_finding_count=2)
    classification = router.classify("what are my biggest risks?", context)
    assert classification.tier == ModelTier.DEEP

def test_query_router_fast_cheap():
    router = QueryRouter()
    context = QueryContext(org_id="test", user_role="admin", open_finding_count=10, critical_finding_count=2)
    classification = router.classify("summarize my open vulnerabilities", context)
    assert classification.tier == ModelTier.FAST_CHEAP

def test_query_router_balanced():
    router = QueryRouter()
    context = QueryContext(org_id="test", user_role="admin", open_finding_count=10, critical_finding_count=2)
    classification = router.classify("do my dark web alerts correlate with open CVEs", context)
    assert classification.tier == ModelTier.BALANCED
