# vCISO Admin Portal

The **vCISO Admin Portal** is an isolated, internal control plane explicitly walled off from the main multi-tenant vCISO application. It is strictly accessible only to accounts bearing the raw `admin` structural role within Firebase. 

This repository enables operators to oversee multi-tenant health, modify strict pricing thresholds, and formally execute organization-level lifecycle events.

## 1. Dynamic Service Tiers
The **Service Tiers** architecture governs exactly how the main vCISO application markets and restricts capabilities. By modifying a tier within the Admin Portal, you are updating the core PostgreSQL `service_tier_configs` table.
- **Per-Seat Economics**: Tiers constrain the maximum mathematical `org_id` headcount (or set an arbitrary `price_per_user` multiplier).
- **Automated Synchronization**: Modifying features, pricing numbers, or colors instantly propagates down to the client-facing `/settings/subscription` page without requiring a backend release pipeline.

*Note: Critical blast-radius architectural features (such as Strict Middleware Isolation and PostgreSQL RLS) are explicitly pruned from client-facing lists and remain natively enforced on all tiers.*

## 2. Organization Lifecycle Management
The **Organizations** matrix permits administrators to formally orchestrate raw Tenant records.
- **Provisioning**: Creates a brand new `org_id` UUID physically inside the database.
- **Destruction**: Triggers an administrative `DELETE` cascading hook entirely wiping target infrastructures from the application payload tree.

## 3. FluidPay Billing Architecture (PCI-DSS)
To ensure uncompromised API PCI-DSS SAQ-A compliance, the vCISO application natively outsources all sensitive payment extraction schemas to the **FluidPay Customer Vaults**.
- Native vCISO users submit credit cards through the Next.js portal, capturing a secure, decoupled payload.
- The vCISO Python backend (`POST /api/v1/billing/checkout`) transmits this raw payload externally to the FluidPay REST Gateway, generating an isolated `fluidpay_customer_id`.
- Backends permanently attach the `fluidpay_customer_id` ID into the native PostgreSQL `Organization` object, never actively retaining readable raw transaction instruments.

## 4. Production Release Execution
The Admin Portal is a Vite + React + TypeScript Single Page Application (SPA). To continuously deliver iterations, rely exclusively on internal Firebase Hosting schemas:

```powershell
# Compiles typescript artifacts into ./dist, maps internal API targets, and executes the formal Firebase release sequence.
..\deploy_admin.ps1
```
