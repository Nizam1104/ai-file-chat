import PrimaryLayout from "@/components/layouts/PrimaryLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PrimaryLayout>
      {children}
    </PrimaryLayout>
  );
}
