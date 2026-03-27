export const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/threat-intel": "Threat Intelligence",
  "/vendor-risk": "Ecosystem Risk",
  "/risk-register": "Risk Register",
  "/compliance": "Compliance Status",
  "/company": "Company Setup",
  "/pentest": "Pentest Findings",
  "/findings": "All Findings",
  "/playbooks": "Playbooks",
  "/settings": "Settings",
  "/profile": "My Profile",
  "/audit-trail": "Audit Trail",
  "/correlation": "Cyber Threat Analyzer",
  "/simulator": "Security Testing",
  "/terms": "Terms of Service",
  "/guide": "User Guide",
  "/settings/security": "Security Settings",
  "/settings/notifications": "Notifications",
  "/settings/subscription": "Subscription & Billing",
  "/settings/ai": "AI Budgets & Config",
  "/settings/integrations": "Integrations",
  "/settings/slas": "SLA Management",
  "/settings/threat-feeds": "Threat Intel Feeds",
  "/settings/users": "User Management",
  "/settings/workflows": "Playbook Workflows",
};

export function getPageTitle(pathname: string): string {
  // Check for exact matches
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname];
  }

  // Check for dynamic routes (e.g., /correlation/123)
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const parentPath = `/${segments[0]}`;
    if (ROUTE_TITLES[parentPath]) {
      // Return parent title + details indication or just parent title
      return ROUTE_TITLES[parentPath];
    }
  }

  return "Virtual CISO";
}
