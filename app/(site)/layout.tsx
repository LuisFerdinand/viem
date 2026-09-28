import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
