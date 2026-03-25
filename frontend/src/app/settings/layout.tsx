import { RoleGuard } from "@/components/layout/RoleGuard";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="admin">
      {children}
    </RoleGuard>
  );
}
