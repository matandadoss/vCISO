import uuid
import asyncio
from typing import List, Dict, Any, Tuple

# Baseline mock graph representing the current state of a generic medium-sized org
BASELINE_NODES = [
    {"id": "internet", "label": "Internet", "type": "internet", "status": "neutral"},
    {"id": "waf", "label": "Legacy WAF", "type": "firewall", "status": "warning"},
    {"id": "private_subnet", "label": "Private Subnet", "type": "network", "status": "secure"},
    {"id": "customer_db", "label": "Customer DB", "type": "database", "status": "secure"},
    {"id": "internal_api", "label": "Internal API", "type": "service", "status": "secure"},
    {"id": "helpdesk", "label": "IT Helpdesk", "type": "human", "status": "warning"},
    {"id": "idp", "label": "Okta / Entra ID", "type": "idp", "status": "secure"},
    {"id": "cloud_admin", "label": "Cloud Admin Console", "type": "service", "status": "secure"},
    {"id": "core_servers", "label": "Production Servers", "type": "server", "status": "secure"},
    {"id": "threat_actor", "label": "Threat Actor", "type": "threat_actor", "status": "critical"},
]

BASELINE_EDGES = [
    {"source": "internet", "target": "waf", "label": "ingress"},
    {"source": "waf", "target": "internal_api", "label": "filtered web traffic"},
    {"source": "internal_api", "target": "customer_db", "label": "queries"},
    {"source": "internal_api", "target": "private_subnet", "label": "hosted in"},
    {"source": "customer_db", "target": "private_subnet", "label": "hosted in"},
    {"source": "helpdesk", "target": "idp", "label": "administers"},
    {"source": "idp", "target": "cloud_admin", "label": "authenticates"},
    {"source": "cloud_admin", "target": "core_servers", "label": "manages"},
]

class GraphDelta:
    def __init__(self):
        self.nodes_to_add: List[Dict[str, Any]] = []
        self.nodes_to_remove: List[str] = []
        self.edges_to_add: List[Dict[str, Any]] = []
        self.edges_to_remove: List[Tuple[str, str]] = []

class SimulationEngine:
    
    @staticmethod
    async def parse_scenario(query: str) -> GraphDelta:
        """
        Mock LLM interaction: Parses the natural language query into GraphDeltas.
        In a real implementation, this would call GPT-4 or Claude with a strict JSON schema.
        """
        delta = GraphDelta()
        query_lower = query.lower()
        
        # Scenario 1: MGM Ransomware Attack
        if "mgm" in query_lower or "scattered spider" in query_lower:
            delta.nodes_to_add.append({"id": "social_eng", "label": "Social Engineering", "type": "attack", "status": "critical"})
            delta.edges_to_add.append({"source": "threat_actor", "target": "helpdesk", "label": "Vishing / SIM Swap"})
            delta.edges_to_add.append({"source": "helpdesk", "target": "idp", "label": "MFA Reset Defeat"})
            delta.edges_to_add.append({"source": "idp", "target": "cloud_admin", "label": "Account Takeover"})
            delta.edges_to_add.append({"source": "cloud_admin", "target": "core_servers", "label": "Ransomware Deployment"})
            
        # Scenario 2: Target Supply Chain
        elif "target" in query_lower or "supply chain" in query_lower:
            delta.nodes_to_add.append({"id": "vendor_hvac", "label": "HVAC Vendor", "type": "vendor", "status": "vulnerable"})
            delta.nodes_to_add.append({"id": "pos_network", "label": "POS Network", "type": "network", "status": "secure"})
            delta.nodes_to_add.append({"id": "billing_system", "label": "Billing System", "type": "service", "status": "secure"})
            
            delta.edges_to_add.append({"source": "threat_actor", "target": "vendor_hvac", "label": "Phishing"})
            delta.edges_to_add.append({"source": "vendor_hvac", "target": "billing_system", "label": "Vendor Portal Access"})
            delta.edges_to_add.append({"source": "billing_system", "target": "pos_network", "label": "Lateral Movement (No Segmentation)"})
            
        # Scenario 3: Move DB to DMZ
        elif "dmz" in query_lower and "db" in query_lower:
            delta.nodes_to_add.append({"id": "dmz_subnet", "label": "Public DMZ", "type": "network", "status": "warning"})
            delta.nodes_to_add.append({"id": "new_waf", "label": "NextGen WAF", "type": "firewall", "status": "secure"})
            
            delta.edges_to_remove.append(("customer_db", "private_subnet"))
            delta.edges_to_remove.append(("internet", "waf"))
            delta.nodes_to_remove.append("waf") # remove legacy waf
            
            delta.edges_to_add.append({"source": "internet", "target": "new_waf", "label": "ingress"})
            delta.edges_to_add.append({"source": "new_waf", "target": "dmz_subnet", "label": "routes to"})
            delta.edges_to_add.append({"source": "customer_db", "target": "dmz_subnet", "label": "hosted in"})
            delta.edges_to_add.append({"source": "internet", "target": "customer_db", "label": "direct exposure risk"}) # The vulnerability
            
        # Scenario 4: Open Port 22
        elif "port 22" in query_lower:
            delta.edges_to_add.append({"source": "internet", "target": "core_servers", "label": "Port 22 (SSH) Open"})
            
        # Fallback generic scenario
        else:
            delta.nodes_to_add.append({"id": "new_asset", "label": "Proposed Asset", "type": "service", "status": "warning"})
            delta.edges_to_add.append({"source": "internet", "target": "new_asset", "label": "Exposed"})

        return delta

    @staticmethod
    def apply_deltas(nodes: List[Dict], edges: List[Dict], delta: GraphDelta) -> Tuple[List[Dict], List[Dict]]:
        """Applies the parsed GraphDeltas to the baseline graph."""
        proposed_nodes = [n for n in nodes if n["id"] not in delta.nodes_to_remove]
        proposed_edges = [e for e in edges if (e["source"], e["target"]) not in delta.edges_to_remove]
        
        proposed_nodes.extend(delta.nodes_to_add)
        proposed_edges.extend(delta.edges_to_add)
        
        return proposed_nodes, proposed_edges

    @staticmethod
    def analyze_attack_paths(nodes: List[Dict], edges: List[Dict]) -> Tuple[List[Dict], List[Dict], List[str]]:
        """
        Runs a BFS pathfinding algorithm from threat sources to critical nodes.
        Marks edges that form successful attack paths with `isAttackPath = True`.
        """
        # Build adjacency list
        adj_list = {}
        for node in nodes:
            adj_list[node["id"]] = []
            
        for edge in edges:
            if edge["source"] in adj_list:
                adj_list[edge["source"]].append(edge)
                
        # Find critical destinations
        critical_targets = {"customer_db", "core_servers", "idp", "pos_network", "cloud_admin"}
        
        # Start nodes typical for external actors
        start_nodes = ["threat_actor", "internet"]
        
        attack_edges = set()
        compromised_nodes = set()
        
        for start in start_nodes:
            if start not in adj_list:
                continue
                
            queue = [(start, [])]
            visited = set()
            
            while queue:
                curr_node, current_path = queue.pop(0)
                
                if curr_node in visited:
                    continue
                visited.add(curr_node)
                
                if curr_node in critical_targets and curr_node != start:
                    # We found a path to a critical target! Mark all edges in this path
                    for edge in current_path:
                        attack_edges.add((edge["source"], edge["target"]))
                        compromised_nodes.add(edge["source"])
                        compromised_nodes.add(edge["target"])
                
                for edge in adj_list.get(curr_node, []):
                    if edge["target"] not in visited:
                        queue.append((edge["target"], current_path + [edge]))
                        
        # Rebuild edges with attack path markings
        evaluated_edges = []
        for edge in edges:
            eval_edge = edge.copy()
            if (eval_edge["source"], eval_edge["target"]) in attack_edges:
                eval_edge["isAttackPath"] = True
            evaluated_edges.append(eval_edge)
            
        # Update node statuses based on compromise
        evaluated_nodes = []
        for node in nodes:
            eval_node = node.copy()
            if eval_node["id"] in compromised_nodes and eval_node["type"] != "threat_actor" and eval_node["type"] != "internet":
                eval_node["status"] = "vulnerable" if eval_node["status"] != "critical" else "critical"
            evaluated_nodes.append(eval_node)
            
        return evaluated_nodes, evaluated_edges, list(compromised_nodes)

    @staticmethod
    def calculate_metrics(compromised_nodes: List[str]) -> Tuple[int, int]:
        """Calculates simulated risk and compliance scores based on blast radius."""
        base_risk = 65
        base_compliance = 88
        
        risk_penalty = len(compromised_nodes) * 8
        comp_penalty = len(compromised_nodes) * 5
        
        sim_risk = min(100, base_risk + risk_penalty)
        sim_comp = max(0, base_compliance - comp_penalty)
        
        return sim_risk, sim_comp

    @staticmethod
    async def generate_narrative(query: str, risk: int, comp: int, compromised_nodes: List[str]) -> str:
        """
        Mock LLM interaction: Generates the markdown narrative based on the pathfinding results.
        """
        if "mgm" in query.lower():
            return f"""### Agentic Risk Assessment: Identity-Driven Ransomware
**Analysis Complete.** Simulated Scattered Spider TTPs against your architecture.
**Blast Radius:** The actor reached {len(compromised_nodes)} internal nodes.
**Critical Findings:**
1. **Helpdesk Verification:** Your IT Helpdesk can be bypassed via social engineering.
2. **MFA Exposure:** Okta is vulnerable to token theft and SMS reset.
**Recommendation:** Implement Phishing-Resistant MFA immediately."""
        
        elif "dmz" in query.lower():
            return f"""### Agentic Risk Assessment: DMZ Database Move
**Analysis Complete.** Simulated moving the Customer Database to the DMZ.
**Blast Radius:** The exposure reached {len(compromised_nodes)} internal nodes.
**Critical Findings:**
1. **SOC 2 Violation:** Moving PII to a DMZ drops compliance by {88 - comp}%.
2. **Direct Internet Exposure:** The database is directly routable from the internet.
**Recommendation:** DO NOT PROCEED. Keep the database in a private subnet and proxy via the internal API."""
            
        elif "port 22" in query.lower():
             return f"""### Agentic Risk Assessment: Open SSH
**Analysis Complete.** Simulated opening Port 22 globally.
**Critical Findings:** 
1. **Brute Force Risk:** Exposure of core servers directly to automated botnets.
**Recommendation:** Restrict Port 22 to internal VPN or Bastion Host IPs only."""

        return f"""### Agentic Risk Assessment
**Analysis Complete.** Evaluated scenario: "{query}"
**Blast Radius:** {len(compromised_nodes)} nodes compromised.
Risk increased to {risk}/100 and Compliance dropped to {comp}/100.
**Recommendation:** Review the highlighted attack paths in the topology graph to identify missing compensating controls."""

    @classmethod
    async def run_simulation(cls, query: str) -> Dict[str, Any]:
        """Orchestrates the entire simulation pipeline."""
        # 1. Parse LLM Delta
        delta = await cls.parse_scenario(query)
        
        # 2. Apply Delta to Baseline
        import copy
        base_nodes = copy.deepcopy(BASELINE_NODES)
        base_edges = copy.deepcopy(BASELINE_EDGES)
        proposed_nodes, proposed_edges = cls.apply_deltas(base_nodes, base_edges, delta)
        
        # 3. Run Pathfinding
        eval_nodes, eval_edges, compromised = cls.analyze_attack_paths(proposed_nodes, proposed_edges)
        
        # 4. Calculate Scores
        sim_risk, sim_comp = cls.calculate_metrics(compromised)
        
        # 5. Generate Narrative
        narrative = await cls.generate_narrative(query, sim_risk, sim_comp, compromised)
        
        return {
            "simulation_id": str(uuid.uuid4()),
            "original_query": query,
            "metrics": {
                "risk_score_before": 65,
                "risk_score_after": sim_risk,
                "risk_delta": sim_risk - 65,
                "compliance_before": 88,
                "compliance_after": sim_comp,
                "compliance_delta": sim_comp - 88,
            },
            "graph": {
                "nodes": eval_nodes,
                "edges": eval_edges
            },
            "assessment_narrative": narrative
        }
