/**
 * Admin layout: wraps all /admin routes. Role-based access is enforced in middleware.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
