import { BookOpen } from "lucide-react";

export default function UserGuidePage() {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-12 pb-16">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <BookOpen className="h-10 w-10 text-primary" />
            Platform Guide
          </h1>
          <p className="text-xl text-muted-foreground mt-4 leading-relaxed">
            Welcome to your Virtual Chief Information Security Officer (vCISO). 
            This platform acts as your automated security leader, helping you understand and manage business risks without needing a master's degree in cybersecurity.
          </p>
        </div>

        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-3xl font-semibold text-foreground">1. The Big Picture</h2>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Dashboard (Home)</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Your daily health check.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How it helps your business:</strong> Instead of digging through ten different technical tools, the dashboard gives you a single "credit score" for your company's security. It shows you exactly where you stand, what needs urgent attention, and if your business is safe to operate today.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">vCISO Chat</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Your personal security advisor.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How it helps your business:</strong> Have a question about a weird email or a new regulation? Just ask the vCISO chat in plain English. It translates complex technical jargon into simple business advice, saving you the cost of calling an expensive consultant for every minor question.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-3xl font-semibold text-foreground">2. Keeping the Business Open (Compliance & Risk)</h2>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Findings</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Your prioritized to-do list for fixing problems.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How it helps your business:</strong> Computers generate thousands of meaningless "alerts" every day. This page uses AI to silence the noise and show you only the actual, critical problems that could cost you money or data. It tells you what broke and gives you a simple button to fix it.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Compliance Management</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Your automated auditor.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How it helps your business:</strong> To win big clients, you often need to prove you meet certain standards (like SOC 2, HIPAA, or PCI). Preparing for these audits manually takes months and costs hundreds of thousands of dollars. This page automatically collects the proof you need, ensuring you never fail an audit or lose a major deal.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Vendor Risk</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Background checks on the software you buy.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How it helps your business:</strong> If a company whose software you use gets hacked, *you* get hacked. This page automatically grades the security of all the third-party apps your employees use, protecting your company from other people's mistakes.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-3xl font-semibold text-foreground">3. Active Defense</h2>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Threat Intel</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">The neighborhood watch.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How it helps your business:</strong> This page constantly watches the dark web and global news to see what hackers are doing today. If a new scam or attack is trending, the platform warns you and checks if your business is vulnerable to it *before* the criminals target you.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">AI Pentesting</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Simulated ethical hacking.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How it helps your business:</strong> We deploy safe, automated AI "hackers" against your own company to find unlocked doors before the bad guys do. It guarantees your defenses actually work when it matters, without paying massive fees to manual testing firms.
            </p>
          </div>
        </section>
        
        <section className="space-y-6">
          <div className="border-b border-border pb-2">
            <h2 className="text-3xl font-semibold text-foreground">4. Automation (Saving Time)</h2>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-2">Playbooks</h3>
            <p className="font-medium text-foreground mb-4">What it is: <span className="font-normal text-muted-foreground">Auto-pilot for emergencies.</span></p>
            <p className="text-muted-foreground mb-4">
              <strong>How it helps your business:</strong> If a hacker tries to break in at 2:00 AM on a Sunday, you can't wait for an IT person to wake up. Playbooks are pre-written rules that instantly lock the doors, shut down compromised computers, and stop attacks in seconds, automatically.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
