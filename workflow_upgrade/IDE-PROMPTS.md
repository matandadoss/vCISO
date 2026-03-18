# MERIDIAN Supply Chain Cyber Risk — AI IDE Prompts

## SYSTEM CONTEXT PROMPT

> Paste this into `.cursorrules`, Windsurf rules, or equivalent.

```
You are building MERIDIAN, an outcome-driven supply chain cyber risk management platform. The user's organisation uses this IN LIEU OF a CISO — it is their cybersecurity command centre for managing third-party/supplier risk. Every UI decision follows five cognitive design principles grounded in neuroscience:

1. SINGULAR ATTENTION — The user tracks 5-20 suppliers simultaneously. The default view is CROSS-SUPPLY-CHAIN (outcomes across all suppliers, prioritised by risk and urgency). Supplier-specific depth is available on demand. Max 3 active risk threads shown. Cognitive load indicator tracks bandwidth.

2. NARRATIVE MEMORY — Each supplier relationship is a STORY with causality. "We assessed CoreAxis in February, found IAM gaps in March, escalated in week 3, they stalled on MFA — now the FCA review is 18 days out and we need to invoke the contractual clause." Threats are narrated against specific suppliers. Board/committee reports are narrative generators.

3. MOMENTUM OVER GUILT — Show "19 of 22 supplier vulnerabilities remediated, avg posture up from C to C+" not "3 critical remaining, 8 SLAs approaching." Resolved banners celebrate clean assessments. Per-supplier remediation velocity shows who's responsive and who's dragging.

4. CONTEXT AS ATMOSPHERE — Mode selector reshapes the UI:
   - Risk management: outcomes, remediation tracking, supplier escalation
   - Onboarding: new supplier assessment workflow, due diligence checklist
   - Incident: supply chain breach response, blast radius across suppliers, containment
   - Audit prep: regulatory evidence packages, TPRM programme documentation

5. WHY BEFORE WHAT — Every item answers "why does this supplier risk matter to MY organisation right now?" Threats include per-supplier exposure AND the downstream impact to the user's business. Escalations include the business case and contractual leverage, not just the technical finding.

DOMAIN CONTEXT:
- This replaces the CISO function — the platform IS the organisation's cybersecurity command centre for supply chain risk
- Suppliers are categorised by tier: Tier-1 (critical/revenue-dependent), Tier-2 (important/operational), Tier-3 (standard/low-impact)
- Each supplier has: security posture grade, service type, data access level, contractual SLAs, assessment history, remediation status
- The organisation inherits regulatory exposure from supplier weaknesses (FCA operational resilience, GDPR data processor obligations, EU AI Act for ML suppliers)
- Regulatory frameworks: FCA, ICO/GDPR, CRI FSP v2.1, SOC 2, ISO 27001, EU AI Act
- MITRE ATT&CK for threat mapping, MITRE ATLAS for AI/ML supply chain threats
- MACEE framework for AI governance assessment of ML model suppliers
- Key concept: CONCENTRATION RISK — when your most critical suppliers have your weakest posture, that's the headline risk
- Contractual enforcement: SLA clauses, right-to-audit, remediation deadlines, penalty provisions, exit strategies
- Stakeholders: Risk Committee, Board, regulators (FCA, ICO), supplier CISOs/CTOs, internal business owners

PRIMARY OBJECTS (not tasks or tickets):
- Outcomes: "Remediate CoreAxis IAM gaps before FCA review" (per-supplier or cross-chain)
- Suppliers: third parties with posture scores, tier classification, service type, active risk outcomes
- Narratives: story threads of each supplier relationship with assessment history and escalation points
- Threats: intelligence mapped to specific suppliers with downstream business impact
- Reports: regulatory evidence packages and internal risk committee briefs

VISUAL SYSTEM:
- Dark canvas (#06080D deep, #0B0F18 base, #151C2C cards) — figure-ground segregation
- Colour = semantic meaning ONLY: blue=progress, green=resolved/safe, amber=warning, orange=high, red=critical, purple=AI/intelligence
- Typography: Outfit (narrative), Newsreader (editorial), JetBrains Mono (data/metrics/grades)
- Font weights: 300=secondary, 400=body, 500=titles, 600=stats
- Motion: staggered entrance (50ms delay), spring easing on buttons, glow on progress bars
- Left accent bars on cards for pre-attentive severity encoding
- Supplier attribution on every outcome card (coloured dot + supplier name + tier + service type in mono)
- Supplier posture grades in sidebar for instant supply chain scanning
- Tier classification badges (Tier-1/2/3) with severity colouring
- Ambient gradient orbs + grain texture for living system feel

LAYOUT:
- 72px icon rail + 240px sidebar (supplier cards + risk outcomes + mode) + flex main
- Sidebar shows supplier cards with posture grades and tier classification
- Main view defaults to cross-supply-chain; can filter to single supplier
- Single-column vertical flow in main content

VIEWS:
- Command: daily cockpit, cross-supplier outcomes, portfolio stats, momentum
- Supply Chain: posture matrix (suppliers × CRI FSP functions), remediation velocity, concentration risk insight
- Threat Intel: threats mapped to specific suppliers with exposure pills and downstream business impact
- Governance: compliance readiness by supplier × framework, regulatory deadline tracking
- Reporting: FCA evidence packages, Risk Committee briefs, internal stakeholder deliverables

COMPONENT PATTERNS:
- outcome-card: supplier attribution tag (dot + name + tier + service) + accent bar + title + why text + progress + expandable steps
- supplier-card: avatar + name + service type + posture grade + tier badge (sidebar)
- posture-matrix: suppliers × CRI FSP functions, colour-coded cells, tier labels
- threat-card: accent bar + title + "Supply chain impact:" relevance + supplier exposure pills (high/medium/low) + MITRE tags
- report-card: deliverable type + audience + deadline + audience-specific framing + drafting steps
- step: dot(done/active/pending/blocked) + title + desc + why-box (with contractual context) + action button
- supplier-exposure-pill: "[Supplier] — [exposure level]" with severity colouring
- portfolio-stats: suppliers tracked, critical findings, avg posture, contract renewals
- concentration-risk-insight: narrative callout about Tier-1 weakness pattern

KEY SUPPLY CHAIN CONCEPTS TO ENCODE IN UI:
- Concentration risk: most critical suppliers ≠ best security posture (surface this pattern visually)
- Inherited regulatory exposure: supplier weakness = your compliance problem
- Contractual leverage: SLAs, remediation clauses, penalty provisions, exit strategies as action tools
- Tiered criticality: Tier-1 gets more visual weight, stricter SLAs, higher urgency
- Supplier responsiveness: some suppliers fix things fast, others stall — track and surface velocity
- Downstream impact: every supplier finding should answer "what does this mean for OUR customers/data/operations?"

NEVER:
- Show supplier data without tier classification and service type context
- Present threats without mapping to specific suppliers AND downstream business impact
- Use red badge counts showing accumulated failure
- Treat all suppliers equally in the UI (tier + urgency determines hierarchy)
- Show findings without contractual/regulatory context
- Use light backgrounds or decorative colour
- Present TPRM as a checkbox exercise — it's a risk management narrative

ALWAYS:
- Include supplier attribution (dot + name + tier + service) on every outcome card
- Lead with WHY: "this supplier risk matters because [downstream impact to your organisation]"
- Include contractual context in escalation steps (SLA deadlines, penalty clauses, exit provisions)
- Show concentration risk pattern when Tier-1 suppliers are weakest
- Map threats to specific suppliers with per-supplier exposure levels
- Frame regulatory exposure as inherited from supplier weakness
- Use momentum framing: "19 remediated, posture improving" not "8 SLAs breached"
```

---

## KEY COMPONENT PROMPTS

### Prompt: Supplier Card (Sidebar)

```
Build a supplier card for the MERIDIAN sidebar.

Structure:
- Container: flex row, gap 10px, padding 10px 12px, radius 8px, border 0.5px border-default, bg card
- Active: border-color blue, bg blue-soft
- Left: avatar (32px square, radius 8px, bg = posture-grade colour soft, text = posture-grade colour text, initials)
- Middle: supplier name (13px, weight 500, ellipsis) + service type (11px, text-tertiary, weight 300)
- Right: posture grade (12px, JetBrains Mono, weight 500, colour by severity)

The posture grade is the pre-attentive scanning element. Glance at the sidebar: green grades = healthy suppliers, red = risk concentration.
```

### Prompt: Supplier Attribution on Outcome Cards

```
Every outcome card needs a supplier attribution row at the TOP of the card body:

- Format: [6px coloured dot] [Supplier name] · [Tier-X] · [Service type]
- Font: 11px, JetBrains Mono, weight 300, text-tertiary
- Dot colour: matches the supplier's posture grade
- For cross-chain outcomes: "All suppliers" with neutral dot

This tells the user INSTANTLY which supplier this risk lives in, what tier they are (criticality), and what service they provide (impact context) — all before reading the outcome title.
```

### Prompt: Supplier Exposure Pills (Threat Cards)

```
Threat intelligence cards include supplier exposure pills:

- Container: flex wrap, gap 6px, margin-top 10px
- Each pill: 10px font, weight 500, pill radius, 0.5px border
- Severity variants:
  - .hi: red-soft bg, red text, red-15% border ("CoreAxis — direct exposure")
  - .md: amber-soft bg, amber text, amber-15% border ("NorthPoint — likely exposed")  
  - .lo: blue-soft bg, blue text, blue-15% border ("FortressReach — monitoring")

These answer "which of my suppliers does this threat affect?" BEFORE reading the full description. The colour encodes severity so peripheral scanning works.
```

### Prompt: Concentration Risk Insight

```
Build an insight card that surfaces concentration risk — the pattern where the most critical (Tier-1) suppliers have the weakest security posture.

Structure:
- metric-insight class: raised bg, radius 12px, 2px left border (blue or red), padding 14px 16px
- Text: 13px, weight 300, text-secondary, line-height 1.6
- Bold callout that names the specific concentration risk pattern
- Strategic question at the end (can you contractually enforce improvement, or evaluate alternatives?)

This is the most important insight in supply chain risk — the mismatch between business criticality and security posture. If Tier-1 suppliers are red and Tier-3 are green, that's a structural problem the user needs to see immediately.
```

---

## VIEW PROMPTS

### Prompt: Command View

```
The daily cockpit for supply chain risk. Cross-supplier, prioritised by risk and urgency.

Staggered order:
1. Greeting + portfolio state subtitle
2. Intent: "What supply chain risk are you managing?"
3. Cognitive load ring (moderate = amber, light = blue, heavy = red)
4. Status chips: incidents, regulatory deadlines, contract renewals
5. Resolved banner: latest clean assessment or remediation win
6. Portfolio stats: suppliers tracked, critical findings, avg posture, contract renewals
7. Section: "Active risk outcomes — across suppliers"
8. Outcome cards with supplier attribution, sorted by urgency × tier
9. Section: "Supply chain risk momentum"
10. Momentum card: quarter progress, remediation velocity, posture trending
```

### Prompt: Supply Chain View

```
Cross-supplier posture comparison.

1. Posture matrix: suppliers × CRI FSP functions (Govern, Identify, Protect, Detect, Respond, Recover)
   - Each supplier row shows tier badge and service type
   - Cells colour-coded: green >80%, amber 50-80%, red <50%
2. Concentration risk insight card
3. Remediation velocity bars (per-supplier, sorted worst to best)
4. Velocity insight card identifying the weakest/slowest supplier
```

### Prompt: Threat Intel View

```
Threats mapped to the supply chain.

Each threat card MUST include:
- Severity accent bar
- "Supply chain impact:" paragraph — names specific suppliers, describes downstream risk to the ORGANISATION (not just the supplier)
- Supplier exposure pills with severity levels
- MITRE technique tags
- The framing is always: "this threat at [supplier] means [this consequence] for your organisation"
```
