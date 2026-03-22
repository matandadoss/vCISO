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
        query_lower = query.lower()
        if "mgm" in query_lower or "ransomware" in query_lower or "scattered spider" in query_lower or "attack" in query_lower:
            return f"""### Simulation Results: Identity Theft & Ransomware
**Attack Summary:** An attacker successfully tricked the IT Helpdesk and reset employee passwords, gaining full access to {len(compromised_nodes)} internal systems.

**Critical Vulnerabilities:**
1. **Helpdesk Verification:** The support desk does not securely verify who is calling them.
2. **Password Security:** The login system allows weak password resets via text messages.

**Security Plan (Mitigations):**
1. **Priority 1:** Require hardware security keys (e.g. YubiKey) instead of text messages for login.
2. **Priority 2:** Train IT Helpdesk staff to require visual identity proof before resetting passwords.
3. **Priority 3:** Segment the network so a hacked employee account cannot immediately access core servers."""
        
        elif "dmz" in query_lower or "database" in query_lower or "public" in query_lower:
            return f"""### Simulation Results: Moving the Database to Public Access
**Attack Summary:** Safely reviewed the plan to move the Customer Database to a public-facing network. This change would expose {len(compromised_nodes)} internal systems to the internet.

**Critical Vulnerabilities:**
1. **Compliance Failure:** Moving personal data to a public network directly violates security laws (SOC 2), dropping your score by {88 - comp}%.
2. **Direct Internet Exposure:** Hackers on the public internet can directly scan and attempt to break into the database.

**Security Plan (Mitigations):**
1. **Priority 1:** DO NOT PROCEED with this architecture change.
2. **Priority 2:** Keep the database hidden in a private network, and require all access to go through a secure, monitored API gateway.
3. **Priority 3:** Add an internal firewall (WAF) to inspect data requests before they reach the database."""
            
        elif "port 22" in query_lower or "ssh" in query_lower or "open port" in query_lower:
             return f"""### Simulation Results: Opening Server Remote Access
**Attack Summary:** Reviewed the risk of opening remote management ports globally to the internet.

**Critical Vulnerabilities:** 
1. **Automated Hacking:** Automated internet bots will immediately try thousands of passwords to break into your servers.

**Security Plan (Mitigations):**
1. **Priority 1:** Close the port immediately on the public internet.
2. **Priority 2:** Require administrators to connect to a secure VPN before they can reach the server management ports.
3. **Priority 3:** Implement an alert when someone repeatedly fails to login to a server."""

        return f"""### Simulation Results Summary
**Attack Summary:** Evaluated the scenario: "{query}"

**Affected Systems:** {len(compromised_nodes)} internal systems could be compromised.
**Security Impact:** Your overall security score worsened to {risk}/100 and compliance dropped to {comp}/100.

**Security Plan (Mitigations):**
1. **Priority 1:** Review the highlighted red paths in the Threat Graph below to see exactly how the attacker got in.
2. **Priority 2:** Add security checks, like firewalls or multi-factor authentication, along those specific paths.
3. **Priority 3:** Re-run this simulation to verify the fix works."""

    @staticmethod
    def generate_findings(query: str, compromised_nodes: List[str]) -> List[Dict[str, Any]]:
        """
        Maps the simulated attack paths into structured UI findings identical to pentest cards.
        """
        findings = []
        query_lower = query.lower()
        
        target = "Multiple Assets"
        if compromised_nodes:
            target = ", ".join(compromised_nodes[:2]) + ("..." if len(compromised_nodes) > 2 else "")

        if "mgm" in query_lower or "ransomware" in query_lower or "scattered spider" in query_lower:
            findings.append({
                "title": "Helpdesk Social Engineering Bypass",
                "severity": "Critical",
                "description": "IT Support desk workflows can be bypassed via Vishing to reset employee credentials.",
                "affected_asset": "IT Helpdesk",
                "remediation": "Mandate visual identity verification for all credential resets.",
                "mitre_tactic": "Initial Access"
            })
            findings.append({
                "title": "Weak MFA Implementation",
                "severity": "High",
                "description": "SMS-based MFA allows attackers to reset authentication tokens post-AD compromise.",
                "affected_asset": target,
                "remediation": "Migrate to Phishing-Resistant MFA (FIDO2/WebAuthn).",
                "mitre_tactic": "Credential Access"
            })

        elif "dmz" in query_lower or "database" in query_lower or "public" in query_lower:
            findings.append({
                "title": "Direct Database Web Exposure",
                "severity": "Critical",
                "description": "The customer database is directly Internet-routable, violating SOC 2 architecture standards.",
                "affected_asset": "Customer DB",
                "remediation": "Isolate database in private subnet and expose only via internal API gateway.",
                "mitre_tactic": "Initial Access"
            })

        elif "port 22" in query_lower or "ssh" in query_lower:
             findings.append({
                "title": "Open SSH Port Detection",
                "severity": "High",
                "description": "Port 22 is exposed to 0.0.0.0/0, allowing automated botnet brute-forcing.",
                "affected_asset": target,
                "remediation": "Restrict Port 22 strictly to internal Bastion host or VPN subnet IPs.",
                "mitre_tactic": "Initial Access"
            })
            
        else:
             findings.append({
                "title": f"Simulated Exploitation: {query[:30]}...",
                "severity": "Medium",
                "description": "The simulation correlation engine discovered a high-probability attack path resulting in network compromise.",
                "affected_asset": target,
                "remediation": "Review the Threat Graph below and implement compensating controls along the highlighted path.",
                "mitre_tactic": "Lateral Movement"
            })

        return findings

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
        
        # 6. Generate Findings List
        findings = cls.generate_findings(query, compromised)
        
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
            "assessment_narrative": narrative,
            "findings": findings
        }
