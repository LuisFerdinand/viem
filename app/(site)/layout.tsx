import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { PdfViewerProvider } from "@/components/site/PdfViewer";
import { getSiteContent } from "@/lib/settings";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const { documents } = await getSiteContent();

  return (
    <PdfViewerProvider documents={documents}>
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
    </PdfViewerProvider>
  );
}
