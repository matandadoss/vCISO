import os
import json
from enum import Enum
from typing import Dict, Any, List, Optional
from neo4j import AsyncGraphDatabase, AsyncSession

class GraphService:
    def __init__(self, uri: str = None, user: str = None, password: str = None):
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = user or os.getenv("NEO4J_USERNAME", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD", "password")
        self.driver = AsyncGraphDatabase.driver(self.uri, auth=(self.user, self.password), max_connection_pool_size=5)

    async def close(self):
        await self.driver.close()

    async def get_session(self) -> AsyncSession:
        return self.driver.session()

    async def health_check(self) -> bool:
        try:
            async with await self.get_session() as session:
                result = await session.run("RETURN 1 AS num")
                record = await result.single()
                return record["num"] == 1
        except Exception:
            return False

    async def sync_entity(self, entity_type: str, entity_data: Dict[str, Any]):
        """Upsert node from Cloud SQL data."""
        # Sanitize label and data to prevent cypher injection
        label = "".join([c for c in entity_type if c.isalnum()])
        properties_json = json.dumps(entity_data)
        query = f"""
        MERGE (n:{label} {{id: $id}})
        SET n += apoc.convert.fromJsonMap($props)
        RETURN n
        """
        async with await self.get_session() as session:
            await session.run(query, id=entity_data.get("id"), props=properties_json)

    async def add_relationship(self, from_type: str, from_id: str, rel_type: str, to_type: str, to_id: str, properties: Dict[str, Any] = None):
        flabel = "".join([c for c in from_type if c.isalnum()])
        tlabel = "".join([c for c in to_type if c.isalnum()])
        rtypesanitized = "".join([c for c in rel_type if c.isalnum() or c == "_"]).upper()
        
        props = properties or {}
        
        query = f"""
        MATCH (a:{flabel} {{id: $from_id}})
        MATCH (b:{tlabel} {{id: $to_id}})
        MERGE (a)-[r:{rtypesanitized}]->(b)
        SET r += $props
        RETURN r
        """
        async with await self.get_session() as session:
            await session.run(query, from_id=from_id, to_id=to_id, props=props)

    async def remove_relationship(self, from_type: str, from_id: str, rel_type: str, to_type: str, to_id: str):
        flabel = "".join([c for c in from_type if c.isalnum()])
        tlabel = "".join([c for c in to_type if c.isalnum()])
        rtypesanitized = "".join([c for c in rel_type if c.isalnum() or c == "_"]).upper()
        
        query = f"""
        MATCH (a:{flabel} {{id: $from_id}})-[r:{rtypesanitized}]->(b:{tlabel} {{id: $to_id}})
        DELETE r
        """
        async with await self.get_session() as session:
            await session.run(query, from_id=from_id, to_id=to_id)

    async def find_attack_paths(self, asset_id: str):
        """Paths from external exposure to target asset"""
        query = """
        MATCH path = (exposed:Asset {environment: 'production'})-[:HAS_VULNERABILITY]->(v:Vulnerability)
             -[:EXPLOITED_BY]->(ta:ThreatActor)
        WHERE v.exploit_status IN ['weaponized', 'actively_exploited']
        AND NOT EXISTS((exposed)-[:PROTECTED_BY]->(:Control)-[:PREVENTS]->(:Technique)<-[:USES]-(ta))
        RETURN path, length(path) as path_length, ta.name as actor
        ORDER BY path_length ASC
        LIMIT 20
        """
        async with await self.get_session() as session:
            result = await session.run(query)
            return [record.data() async for record in result]

    async def find_blast_radius(self, asset_id: str):
        """Compromise propagation via identity/network"""
        query = """
        MATCH (compromised:Asset {id: $asset_id})-[:COMMUNICATES_WITH*1..3]->(reachable:Asset)
        WHERE reachable.criticality = 'critical'
        RETURN reachable, length(path) as hops
        UNION
        MATCH (compromised:Asset {id: $asset_id})<-[:HAS_ACCESS_TO]-(i:Identity)-[:HAS_ACCESS_TO]->(other:Asset)
        WHERE other.criticality = 'critical'
        RETURN other as reachable, 2 as hops
        """
        async with await self.get_session() as session:
            result = await session.run(query, asset_id=asset_id)
            return [record.data() async for record in result]

    async def find_risk_clusters(self):
        """Community detection using GDS library"""
        query = """
        CALL gds.louvain.stream({
            nodeProjection: ['Asset', 'Vulnerability', 'ThreatActor', 'Vendor'],
            relationshipProjection: {
                HAS_VULNERABILITY: {orientation: 'UNDIRECTED'},
                PROVIDED_BY: {orientation: 'UNDIRECTED'},
                EXPLOITED_BY: {orientation: 'UNDIRECTED'}
            }
        })
        YIELD nodeId, communityId
        RETURN communityId, collect(nodeId) as members, count(*) as cluster_size
        ORDER BY cluster_size DESC LIMIT 10
        """
        async with await self.get_session() as session:
            result = await session.run(query)
            return [record.data() async for record in result]

    async def find_credential_chains(self):
        """Identity -> exposed credentials -> critical assets without MFA"""
        query = """
        MATCH (i:Identity)-[:EXPOSED_IN]->(f:Finding)
        WHERE f.type = 'credential_exposure' AND f.status = 'open'
        WITH i
        MATCH (i)-[r:HAS_ACCESS_TO {mfa_protected: false}]->(a:Asset)
        WHERE a.criticality IN ['critical', 'high'] AND r.privilege_level IN ['admin', 'power_user']
        RETURN i, a, r
        """
        async with await self.get_session() as session:
            result = await session.run(query)
            return [record.data() async for record in result]

    async def get_threat_actor_coverage(self, threat_actor_id: str):
        """Covered vs. gap techniques"""
        query = """
        MATCH (ta:ThreatActor {id: $ta_id})-[:USES]->(t:Technique)
        OPTIONAL MATCH (c:Control)-[:DETECTS|PREVENTS]->(t)
        RETURN t, collect(c) as controls
        """
        async with await self.get_session() as session:
            result = await session.run(query, ta_id=threat_actor_id)
            return [record.data() async for record in result]

    async def get_entity_neighborhood(self, entity_type: str, entity_id: str, depth: int = 2):
        label = "".join([c for c in entity_type if c.isalnum()])
        query = f"""
        MATCH path = (n:{label} {{id: $id}})-[*1..{depth}]-(m)
        RETURN path
        """
        async with await self.get_session() as session:
            result = await session.run(query, id=entity_id)
            return [record.data() async for record in result]

    async def find_gcp_cross_project_paths(self, project_id: str):
        """GCP-specific: IAM paths across project boundaries"""
        query = """
        MATCH (p1:GCPProject {id: $proj_id})-[:HAS_IAM_BINDING]->(i:Identity)-[:HAS_IAM_BINDING]->(p2:GCPProject)
        WHERE p1 <> p2
        RETURN p1, i, p2
        """
        async with await self.get_session() as session:
            result = await session.run(query, proj_id=project_id)
            return [record.data() async for record in result]
