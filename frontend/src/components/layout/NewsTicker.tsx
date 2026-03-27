import { AlertTriangle, ShieldAlert, Bug, Activity, ServerCrash } from "lucide-react";

// Mock stream of global intelligence
const THREAT_NEWS = [
  {
    id: 1,
    title: "Critical RCE Vulnerability Discovered in Popular Logging Framework (CVE-2026-X892)",
    url: "https://nvd.nist.gov/",
    icon: Bug,
    color: "text-red-500"
  },
  {
    id: 2,
    title: "Major Financial Institution Suffers Data Breach Affecting 1.2M Customers",
    url: "https://thehackernews.com/",
    icon: ShieldAlert,
    color: "text-orange-500"
  },
  {
    id: 3,
    title: "New Ransomware Gang 'CryptoLocker-V2' Targeting Healthcare Sector",
    url: "https://www.cisa.gov/",
    icon: AlertTriangle,
    color: "text-red-500"
  },
  {
    id: 4,
    title: "Nation-State Actors Suspected in Coordinated Supply Chain Attack",
    url: "https://krebsonsecurity.com/",
    icon: Activity,
    color: "text-yellow-500"
  },
  {
    id: 5,
    title: "Zero-Day Exploit Found in Enterprise VPN Appliances - Patch Immediately",
    url: "https://www.bleepingcomputer.com/",
    icon: Bug,
    color: "text-red-500"
  },
  {
    id: 6,
    title: "Massive DDoS Campaign Takes Down Key Infrastructure in APAC Region",
    url: "https://www.darkreading.com/",
    icon: ServerCrash,
    color: "text-orange-600"
  }
];

export function NewsTicker() {
  return (
    <div className="w-full bg-slate-950 border-t border-slate-800 overflow-hidden flex items-center h-8 shrink-0 relative z-50">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
      
      <div className="flex bg-slate-950 animate-marquee whitespace-nowrap items-center hover:[animation-play-state:paused] py-1 w-max">
        {[...THREAT_NEWS, ...THREAT_NEWS, ...THREAT_NEWS, ...THREAT_NEWS].map((news, idx) => {
          const Icon = news.icon;
          return (
            <div key={`${news.id}-${idx}`} className="flex items-center mx-6 group">
              <Icon className={`w-3.5 h-3.5 mr-2 ${news.color} shrink-0`} />
              <a 
                href={news.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors cursor-pointer"
              >
                {news.title}
              </a>
              <span className="ml-6 text-slate-800 select-none text-xs">|</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
