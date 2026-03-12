# SKPR Product Guide

## SKPR Platform: The Basics
Welcome to the SKPR Virtual CISO Platform. If you are new to cybersecurity, think of this platform as your digital security command center. It acts as an automated, expert security guard for your business.

**The Main Problem We Solve:**
Today, hackers don't usually try to break into your company directly. They look for the weakest link. Often, that weak link is another company you do business with—like an accounting firm, a software vendor, or a cloud provider. If they get hacked, your data could be stolen. We call this "Supply Chain Risk."

### How SKPR Helps You
1. **Automated Threat Hunting:** Twice a day, our AI scans the internet (like reading millions of news articles and security reports in seconds) to see if any of the software you or your partners use has a newly discovered flaw.
2. **The Overwatch Assistant:** If a threat is found, you don't need a computer science degree to understand it. Our "Overwatch AI" explains exactly what the threat means for *your* business in plain English and tells you what steps to take.
3. **Your Global Health Score:** We give your entire network a simple score (like a credit score) so you can easily tell if your business is safe ("Operational") or at risk ("Degraded").

***Bottom Line: You focus on running your business. SKPR acts as your Chief Information Security Officer (CISO), translating complex cyber threats into simple, actionable business decisions.***

## Under the Hood: How SKPR Thinks
SKPR uses Artificial Intelligence (AI) to do the heavy lifting, but it always leaves the final decisions up to you.

### 1. The Two Brains of the AI
* **The Quick Scanner (Flash Lite):** This is a fast, lightweight AI that constantly runs in the background. It reads the news and checks for basic threats twice a day (6:00 AM and 1:00 PM) without you needing to do anything.
* **The Deep Thinker (Gemini Pro - "Overwatch"):** This is a highly advanced, reasoning AI. It costs more computer power to run, so it only activates when *you* ask it a question or click a button to analyze a specific, complex problem.

### 2. The Integrity Score Explained
Your main security score is based on three simple things:
* **Compliance (40%):** Are you following the basic rules and checklists required by your industry (like keeping doors locked)? 
* **Vulnerabilities (30%):** Do the security tools you use have any known bugs that need updating?
* **Intelligence (30%):** Is there active chatter on the internet about hackers targeting the specific software you use right now?

### 3. The Engine Integrity Meter
At the bottom of the left menu, you will see an "Engine Integrity" gauge. Think of this as your "Check Engine" light. As long as it is green, the system feels confident that your score is accurate and your environment is stable. If it drops below 50%, it means the system detects too much risk and enters a "Degraded" warning mode.

**Rule of Thumb:** Whenever you see an **"Update Now"** button on the platform, clicking it forces the AI to grab the absolute newest information from the internet, rather than relying on what it found during its last scheduled scan.

## Meet Your Virtual Security Expert
The **Overwatch AI** is your personal, on-demand security expert. It lives at the top of your screen and is ready to answer questions or perform tasks for you in plain English.

You don't need to know technical coding commands. Just type what you want to do.

### What Can Overwatch Do?
* **Analyze Partners:** You can ask, "Give me a full security summary on Microsoft." Overwatch will research Microsoft's current security posture and explain it to you simply.
* **Manage Your Profile:** You can tell Overwatch, "We just started using Slack for messaging. Add it to our stack." Overwatch will record that your company is now using Slack and start monitoring it for threats.
* **Explain Threats:** If you see a scary-sounding alert in the news ticker (like "CVE-2024-1234 exploited"), you can ask Overwatch, "What does this mean for us?" It will check if you actually use the vulnerable software and tell you if you need to panic or simply ignore it.

### How to Use It
Simply hover your mouse over the top title bar to reveal the **"Ask Overwatch AI"** input box, type your question, and hit Enter. Overwatch automatically knows what page you are looking at to give you better answers based on what you are doing.

👉 **[Open the AI Console](/#/console)**

## The Threat Ticker (Bottom Bar)
At the very bottom of your screen, you will see a scrolling list of alerts. This is the **Need to Know Ticker**.

### Why It Matters
Thousands of pieces of software are hacked or discovered to have flaws every single day. If you tried to read the security news yourself, you would be incredibly overwhelmed. 

This ticker uses AI to act as a filter. It reads all the global security news, but it *only* shows you the headlines that actually matter to your specific business and your partners.

### How It Works
Every 25 seconds, the system checks the internet for threats specifically targeting the software your company uses (your "Internal Stack") or the software your partners use.

* **Severity Colors:** Alerts are color-coded. Red (CRITICAL) means you should look at it right away. Yellow or Blue mean something happened, but it might not be dire.
* **Take Action:** If an alert looks concerning, click on it! Clicking an alert immediately sends it to your **Overwatch AI Assistant**, which will investigate the headline and tell you exactly what you should do about it in plain English.

## The Executive Dashboard (Home Page)
When you log in, this is the first page you see. It is designed to give business owners and executives the "Big Picture" at a single glance.

Instead of navigating through confusing technical logs, this dashboard tells you the overall health of your entire business network.

### Key Areas
* **Supply Chain Health (The Big Dial):** This is your main grade (0-100). The higher the score, the safer your network of partners is. It also tells you exactly how many of your partners are currently labeled "Risky."
* **Active Threats:** A simple counter showing how many active warning flags the system is currently looking at globally.
* **Internal Posture:** Your company's own security score, based on how well you follow industry best practices.
* **Partner Health Chart:** A bar chart that lets you visually compare how secure you are versus the companies you work with. If a partner's bar is much lower than yours, they represent a risk to your business. (You can click any bar to investigate that specific partner).

**Why This Page Is Useful:** Use this page to confidently report to your board of directors or investors, "Our current security score is 87%, and we are actively monitoring our 3 risky vendors."

👉 **[Go to Executive Dashboard](/#/)**

## Managing Your Vendor Risk
This module is the heart of protecting your supply chain. It lists every third-party company you do business with.

If a vendor gets hacked, the hackers might use that vendor's access to steal *your* data. This page ensures you know exactly how secure your partners are.

### Understanding "Stack Mapping" (The Icons)
In the main table, you will see a column full of small icons (like AWS, Slack, Office365, etc.). This is called **Stack Mapping**.

* **What is a "Tech Stack"?** A "tech stack" is simply the list of software and technology tools a company uses to run their business. Every company has a stack.
* **Why do we Map it?** If we know that "Vendor A" uses a database system called "MongoDB," and the news reports that MongoDB has a massive security hole today, our system instantly knows that "Vendor A" is now a major risk to *you*. We "map" their stack so we know exactly how they are built.
* **How to use it:** By clicking on a row in the table, you expand the "stack markers". This visually shows you the exact software that partner relies on, giving you clear visibility into their inner workings without having to send them confusing paper questionnaires. 

### The Inspection Hub
If a partner's score drops or they have a red risk label, click the **"Inspect Partner"** button next to their name. 
This opens a detailed file on them. The **Predictive AI** will read the news specific to that partner's "Tech Stack" and their geographic location, and generate a simple report explaining exactly what threats they might be facing right now, and whether you should be worried about doing business with them.

👉 **[View My Network](/#/network)**

## Following Rules & Running Fire Drills
This section is all about ensuring your own company's "house is in order."

### 1. Compliance (The Gap Radar)
Most industries have strict rules about how you must protect customer data (these rulebooks have acronyms like NIST, SOC2, or HIPAA). 
* **The Problem:** Proving you follow these rules usually costs tens of thousands of dollars in expensive auditor fees.
* **The Solution:** We automatically compare the security tools you use against these giant rulebooks. The "Gap Radar" will give you a list of exactly which rules you are failing to meet, creating a simple to-do list for your IT team to fix before a real audit.

### 2. The "What If" Simulator (War Gaming)
This is where you run digital "fire drills."
* **How it works:** You can pull a massive, real-world cyberattack from the recent news (like "The 2023 MoveIT Hack") and ask the AI, "What if this exact same attack hit *our* company today?"
* **The Result:** The AI looks at your current defenses and calculates the probability that the hackers would succeed against you. This is incredibly valuable for business owners because it proves *why* you need certain security software to protect against real threats that are happening to others right now.

👉 **[Visit Resilience Hub](/#/resilience)**

## Visualizing How Hackers Attack
This page might look a bit intimidating with its large grid, but it follows a very simple concept used by security professionals globally, called the **MITRE ATT&CK Framework**.

### The Anatomy of a Break-In
Think of a cyberattack like a physical bank robbery. The robbers don't just magically appear inside the vault. They follow a step-by-step path:
1. **Reconnaissance:** They case the bank from the outside (e.g., look at your public website).
2. **Initial Access:** They pick a lock or steal a key (e.g., trick an employee into giving up a password).
3. **Execution:** They sneak inside and disable the cameras (e.g., run a hidden virus).
4. **Exfiltration/Impact:** They steal the money and run away (e.g., silently steal your customer data).

The big grid on this page (The **14-Stage Matrix**) represents those exact steps from left to right. 

### How to Use the Grid
If a section of the grid is glowing red, it means our system has identified that your company is highly vulnerable at that specific stage of a break-in. 
* By clicking on the red stage, the system will tell you exactly which "lock" is broken and suggest which security rules you should implement to fix it before a real hacker tries the door.
* **Generate Threat Model:** You can click this button to have the AI write a professional, executive-summary report of these weaknesses. You can then download or copy this report and hand it to your IT provider to fix the issues.

👉 **[Go to Cyber Operations](/#/cyber-operations)**

## System Configurations
This module is where you control the basic settings of your platform.

### Key Features
* **Your Profile:** Define who you are so the AI can tailor its advice to your role (e.g., an Executive needs high-level business summaries, while an Engineer might need deep technical details).
* **Risk Logic Sliders:** You are in control of how strictly the system grades you. If you care more about following legal compliance rules than reading internet hacker news, you can slide those weights around to change how your score is calculated. 
* **The Research Vault:** Everything the AI ever researches for you is saved here locally on your computer. This saves time so the AI doesn't have to re-read the internet if you ask it a question you already asked yesterday. You can easily download this memory vault as a file to back it up or share it.

👉 **[Manage System Settings](/#/settings)**

## Module: Service Tiers & Feature Access
A definitive breakdown of the Virtual CISO platform's three service tiers, detailing feature allocations and their direct strategic value to the business.

[Return to Account Billing](/#/settings) or [View Pricing Overview](/#/pricing)

---

### 1. Essential Guard (Foundational Posture)
**Included Features:** My Company Stack Mapping, Basic Network (Up to 10 Vendors), Cyber Operations Dashboard, Static Compliance Reports, Up to 3 Read/Write Users.

* **Business Value:** Provides immediate, centralized visibility into the organization's technical footprint and third-party dependencies at a price point structured perfectly for SMBs and startups. It eliminates disjointed spreadsheets in favor of a live dashboard.
* **Risk Value:** Mitigates foundational "blind spots." By actively scoping and monitoring the top 10 most critical vendors, it solves the lowest-hanging fruit of supply-chain risk without requiring a dedicated internal compliance team. 

### 2. Tactical Pro (Proactive Defense)
**Included Features:** Everything in Essential Guard + Attack Analysis (14-Stage MITRE), Dynamic Threat Model Generator, Report Assistant (Overwatch AI Sidebar), Expanded Network (Up to 50 Vendors), Advanced RBAC (10 Users).

* **Business Value:** Replaces or heavily augments the work of a mid-level security analyst. The ability to instantly generate MITRE ATT&CK Threat Models manually saves tens of thousands of dollars in external consulting fees per engagement. The conversational AI assistant drastically accelerates management reporting.
* **Risk Value:** Shifts the organization from reactive monitoring to active defense. By mapping internal controls directly against known adversarial behaviors via the MITRE framework, it ensures security budgets actually neutralize likely attacks, rather than simply checking compliance boxes.

### 3. Enterprise vCISO (Predictive & Automated)
**Included Features:** Everything in Tactical Pro + Predictive Intelligence Forecast Engine, Full Console Access (Hybrid CLI/Chat workspace), Unlimited Vendor Tracking via API, Automated Ongoing Scoring, SSO Integration.

* **Business Value:** Acts as a massive force multiplier for mature security and GRC teams. The unrestricted AI console serves as a virtual senior analyst. The Predictive Forecast engine allows Chief Information Security Officers (CISOs) to justify multi-million dollar board-level security budgets based on empirical data mapped against future risk.
* **Risk Value:** Unbounded scalability for massively complex networks. The AI Predictive engine isolates emerging threats before they hit mainstream feeds, granting the enterprise "left of boom" priority to patch vulnerabilities weeks before they are exploited in the wild.

