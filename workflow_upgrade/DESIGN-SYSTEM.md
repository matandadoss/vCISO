# MERIDIAN Design System — Supply Chain Cyber Risk

## Platform Overview

MERIDIAN replaces the CISO function with an outcome-driven supply chain cyber risk management platform. Instead of hiring a CISO, an organisation deploys MERIDIAN to manage the security posture of its supplier ecosystem — tracking risk, driving remediation, preparing for regulators, and reporting to internal leadership.

The primary objects are **suppliers** (third parties you depend on), **outcomes** (risk goals you're driving toward), **threats** (intelligence mapped to your specific supply chain), and **reports** (regulatory evidence and internal risk briefs).

## Cognitive Principles (Supply Chain Application)

### Singular Attention
Track 5-20 suppliers without cognitive overload. Default view is cross-supply-chain. Supplier-specific depth on demand. Cognitive load indicator warns when you're carrying too many active risk threads.

### Narrative Memory  
Each supplier relationship is a story: assessed → findings → escalation → remediation → verification. Threats are narrated against specific suppliers with downstream impact. Regulatory submissions are narrative generators, not checkbox exports.

### Momentum Over Guilt
"19 of 22 supplier vulnerabilities remediated, posture up from C to C+" beats "3 critical remaining, 8 SLAs approaching." Per-supplier remediation velocity shows who's responsive. Clean assessments get celebration banners.

### Context as Atmosphere
Four modes reshape the UI: Risk management (daily operations), Onboarding (new supplier due diligence), Incident (supply chain breach response), Audit prep (regulatory evidence packaging).

### Why Before What
Every finding answers: "What does this supplier weakness mean for MY organisation?" Threats show per-supplier exposure AND downstream business impact. Escalations include contractual leverage and regulatory context.

## Key Supply Chain Concepts

**Concentration risk** — When Tier-1 (most critical) suppliers have the weakest security posture, that's a structural problem. MERIDIAN surfaces this pattern visually in the posture matrix and calls it out in insight cards.

**Inherited regulatory exposure** — Under FCA operational resilience, GDPR, and EU AI Act, your organisation is responsible for supplier security. A weakness at CoreAxis is YOUR compliance problem.

**Contractual leverage** — SLA remediation clauses, right-to-audit provisions, penalty triggers, and exit strategies are first-class actions in the UI, not afterthoughts. Steps reference specific contractual mechanisms.

**Tiered criticality** — Tier-1 suppliers (revenue-critical, handles customer data) get more visual weight, stricter urgency framing, and higher priority in the outcome stack. Tier-3 suppliers recede.

**Supplier responsiveness** — Remediation velocity per supplier reveals which partners take security seriously and which stall. This data feeds contract renewal decisions.

## Views

| View | Purpose | Key Components |
|------|---------|----------------|
| **Command** | Daily cockpit. Cross-supplier risk outcomes, prioritised by urgency × tier | Portfolio stats, outcome cards with supplier attribution, momentum |
| **Supply Chain** | Comparative posture across all suppliers | Posture matrix, concentration risk insight, remediation velocity |
| **Threat Intel** | Intelligence mapped to YOUR suppliers | Threat cards with supplier exposure pills, downstream impact framing |
| **Governance** | Compliance readiness per supplier × framework | Compliance bars, regulatory deadline tracking, assessment coverage |
| **Reporting** | Regulatory evidence + internal risk briefs | FCA evidence packages, Risk Committee briefs, narrative drafting steps |

## File Structure

```
meridian-supply-chain-system/
├── tokens.css          # Design tokens
├── components.css      # Component library
├── DESIGN-SYSTEM.md    # This document
├── IDE-PROMPTS.md      # AI IDE prompts (supply chain context)
└── prototype.html      # Working interactive prototype
```
