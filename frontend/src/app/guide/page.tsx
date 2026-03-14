import { BookOpen } from "lucide-react";

export default function UserGuidePage() {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-12 pb-16">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <BookOpen className="h-10 w-10 text-primary" />
            Platform Guide (How-To)
          </h1>
          <p className="text-xl text-muted-foreground mt-4 leading-relaxed">
            Welcome to your Virtual Chief Information Security Officer (vCISO). 
            This platform is designed for business leaders to manage risk without needing a technical degree. 
            Below is a simple breakdown of every page in the left menu and exactly how to use it.
          </p>
        </div>

        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-3xl font-semibold text-foreground">1. Overview</h2>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Dashboard</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Your daily health check.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> Log in every morning and look at the "Overall Security Score" at the top. If the number is green and high (like a credit score), your business is safe. If the number drops, look at the "Recent Findings" box below it to see what broke overnight.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Platform Guide</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">The page you are currently reading.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> Come back to this page whenever you forget what a certain button or page does, or when you are training a new employee on how to use the system.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">vCISO Chat</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Your personal security advisor.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> Type questions into the chat box exactly as if you were texting a human expert. For example, type "Is my database secure?" or "How do I pass a SOC 2 audit?". The AI understands plain English and will guide you step-by-step.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-3xl font-semibold text-foreground">2. Risk & Compliance</h2>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Findings</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Your prioritized to-do list for fixing problems.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> Review this list weekly. Look at the items marked "Critical" in red. Click the "View" button next to a critical finding. You will see an explanation of the problem. Click "Assign" to send the problem to your IT person, or click "Auto-Remediate" to let the software fix it for you automatically.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Compliance</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Your automated auditor.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> If a major client demands you meet standard security regulations (like HIPAA or PCI), click the "Add Framework" button to track it. The page will give you a percentage score. When the score hits 100%, you are ready to pass the audit and close the deal.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Vendor Risk</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Background checks on the software you buy.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> Before your company buys a new software subscription from a third-party vendor, add the vendor's name here. Click "Analyze" and the AI will scan the internet to see if that vendor has a history of getting hacked. Do not buy software from vendors with a "High Risk" score.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Audit Trail</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">The security camera for the app.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> You generally don't need to check this daily. If something goes wrong and you need to know *who* pushed a button and *when* they did it, open this page. You can search by employee name to see everything they clicked on.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-3xl font-semibold text-foreground">3. Threat Operations</h2>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Threat Intel</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">The neighborhood watch.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> This page shows what hackers are currently doing in the wild. Look at the top alert. If the system says "Your business is affected," it means you use a software program that hackers are currently breaking into globally. Assign it to your IT team immediately.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Correlation Graph</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">A map of how a hacker would break in.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> This looks like a spider web connecting red and green dots. Instead of reading boring logs, follow the red lines with your finger. If a red line connects from the internet all the way to your customer database, it means you have an open door that needs to be closed. Read the "AI Assessment" text box for plain English instructions on where to break the line.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">AI Pentesting</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Simulated ethical hacking.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> Once a week, click the "Start New Assessment" button. Our AI will pretend to be a criminal and try to break into your systems exactly like a real hacker would. When it finishes, read its report. If it successfully broke in, it will show you exactly how it did it so you can fix the lock.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">What-If Simulator</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">A safe playground for testing.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> Before your engineers install a new database or change a major firewall rule, use this page. Type in what they plan to do and click "Simulate." The AI will warn you if this planned change will accidentally open a door for hackers.
            </p>
          </div>
        </section>
        
        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-3xl font-semibold text-foreground">4. Automation & Data</h2>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Playbooks (SOAR)</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Auto-pilot for emergencies.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> Think of these like smart-home rules (e.g., "If someone opens the window, turn on the alarm"). Click "Create Rule". You can tell the system: "If a hacker logs in from Russia, instantly lock their account and text my phone." Once you set these rules, they run 24/7 without you doing anything.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Data Workflows</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Connecting the plumbing.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> This is a technical page primarily for your IT team. It tells the platform how to pull logs from your cloud providers. You do not need to check this page daily unless the Dashboard tells you a data source has disconnected.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Integrations Hub</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Linking your tools together.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> Find the logos of all the business tools you currently use (like Slack, Google Cloud, AWS, or Jira). Click "Connect" on each one. This allows the vCISO platform to see everything happening in your business and automatically send messages to your team if a problem happens.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-3xl font-semibold text-foreground">5. System</h2>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Settings</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Your billing and admin controls.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How to use it:</strong> Use this page to add new employee accounts or check how much the AI usage is costing you this month.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
