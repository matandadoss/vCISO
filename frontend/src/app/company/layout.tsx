import { RoleGuard } from "@/components/layout/RoleGuard";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="admin">
      {children}
    </RoleGuard>
  );
}
