import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-[#0b1326] w-full border-t border-[#45464d]/15">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 py-12 gap-8 max-w-7xl mx-auto font-inter text-[10px] md:text-xs uppercase tracking-[0.2em]">
        {/* Branding */}
        <div className="uppercase text-lg font-bold text-slate-500 tracking-widest">
          Verifai
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-8 text-slate-500">
          <Link
            href="/privacy"
            className="hover:text-[#adc6ff] transition-colors duration-300"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="hover:text-[#adc6ff] transition-colors duration-300"
          >
            Terms of Service
          </Link>
          <Link
            href="/docs"
            className="hover:text-[#adc6ff] transition-colors duration-300"
          >
            Documentation
          </Link>
          <Link
            href="/status"
            className="hover:text-[#adc6ff] transition-colors duration-300"
          >
            API Status
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-slate-500 uppercase text-center md:text-right opacity-60">
          © 2026 Verifai FORENSICS. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
