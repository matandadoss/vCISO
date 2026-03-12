CREATE CONSTRAINT obj_id_asset IF NOT EXISTS FOR (n:Asset) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT obj_id_vuln IF NOT EXISTS FOR (n:Vulnerability) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT obj_id_threat_actor IF NOT EXISTS FOR (n:ThreatActor) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT obj_id_indicator IF NOT EXISTS FOR (n:Indicator) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT obj_id_vendor IF NOT EXISTS FOR (n:Vendor) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT obj_id_control IF NOT EXISTS FOR (n:Control) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT obj_id_identity IF NOT EXISTS FOR (n:Identity) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT obj_id_finding IF NOT EXISTS FOR (n:Finding) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT obj_id_framework IF NOT EXISTS FOR (n:Framework) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT obj_id_technique IF NOT EXISTS FOR (n:Technique) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT obj_id_gcp_project IF NOT EXISTS FOR (n:GCPProject) REQUIRE n.id IS UNIQUE;

CREATE INDEX asset_type IF NOT EXISTS FOR (n:Asset) ON (n.type);
CREATE INDEX vuln_cve IF NOT EXISTS FOR (n:Vulnerability) ON (n.cve_id);
CREATE INDEX indicator_value IF NOT EXISTS FOR (n:Indicator) ON (n.value);
CREATE INDEX finding_type IF NOT EXISTS FOR (n:Finding) ON (n.type);
