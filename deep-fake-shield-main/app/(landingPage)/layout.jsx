import Header from "@/components/LandingPage/Header";
import Footer from "@/components/LandingPage/Footer";

function LandingPageLayout({ children }) {
  return (
    <>
      <Header />
      <div className="min-h-screen">{children}</div>
      <Footer />
    </>
  );
}

export default LandingPageLayout;
