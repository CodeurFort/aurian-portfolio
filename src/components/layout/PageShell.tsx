export function PageShell({ children }: { children: React.ReactNode }) {
  return <main className="relative w-full overflow-x-hidden">{children}</main>;
}
