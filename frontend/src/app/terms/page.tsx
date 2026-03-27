"use client";

export default function TermsOfServicePage() {
  return (
    <div className="flex-1 overflow-auto bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8 bg-card p-8 rounded-xl border border-border shadow-sm">
        <div className="hidden">
          {/* Title moved to global AppHeader */}
        </div>

        <div className="space-y-6 text-foreground/90 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing and using SKPR.ai and the vCISO platform, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">2. Provision of Services</h2>
            <p>
              SKPR.ai constantly innovating in order to provide the best possible experience for its users. You acknowledge and agree that the form and nature of the services which SKPR.ai provides may change from time to time without prior notice to you.
            </p>
            <p>
              As part of this continuing innovation, you acknowledge and agree that SKPR.ai may stop (permanently or temporarily) providing the Services (or any features within the Services) to you or to users generally at SKPR.ai's sole discretion, without prior notice to you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">3. Use of the Services by You</h2>
            <p>
              In order to access certain Services, you may be required to provide information about yourself (such as identification or contact details) as part of the registration process for the Service, or as part of your continued use of the Services. You agree that any registration information you give to SKPR.ai will always be accurate, correct and up to date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">4. Billing and Payments</h2>
            <p>
              Use of premium tier services requires payment. By submitting a payment authorization, you agree that SKPR.ai is permitted to charge your provided payment method on a recurring monthly basis for the agreed upon subscription fees. Charges will occur automatically until the subscription is officially downgraded or cancelled via the platform portal.
            </p>
            <p>
              We reserve the right to modify our pricing tiers and features at any time, but will provide at least 30 days notice prior to applying any changes to existing active subscriptions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">5. Privacy and Personal Information</h2>
            <p>
              For information about SKPR.ai's data protection practices, please read our privacy policy. This policy explains how SKPR.ai treats your personal information, and protects your privacy, when you use the Services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">6. Limitation of Liability</h2>
            <p>
              You expressly understand and agree that SKPR.ai shall not be liable to you for any direct, indirect, incidental, special consequential or exemplary damages which may be incurred by you, however caused and under any theory of liability. This shall include, but not be limited to, any loss of profit (whether incurred directly or indirectly), any loss of goodwill or business reputation, any loss of data suffered, cost of procurement of substitute goods or services, or other intangible loss.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
