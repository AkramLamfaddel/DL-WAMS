import Image from "next/image";
import Link from "next/link";
import { Play, AlertTriangle, ShieldCheck, Activity } from "lucide-react";

function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center px-8 max-w-7xl mx-auto overflow-hidden">
      <div className="grid grid-cols-12 gap-8 w-full items-center">
        {/* Left Content */}
        <div className="col-span-12 lg:col-span-7 z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#222a3d] rounded-full mb-6 border border-[#45464d]">
            <Activity size={14} className="text-[#4edea3] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c6c6cd]">
              AI Detection Active
            </span>
          </div>

          <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1] text-white">
            Detect Fake Images.
            <br />
            <span className="bg-clip-text text-transparent bg-linear-to-br from-[#adc6ff] to-[#357df1]">
              Verify What’s Real
            </span>
            .
          </h1>

          <p className="text-lg md:text-xl text-[#c6c6cd] max-w-xl mb-10 leading-relaxed font-light">
            Upload any image and instantly check if it’s real or manipulated
            using AI. Get a clear authenticity score and prevent fake content
            from entering your platform.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/dashboard/analyze">
              <button className="bg-linear-to-br from-[#adc6ff] to-[#357df1] text-[#002e6a] font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-95 shadow-lg shadow-blue-500/20 cursor-pointer flex items-center gap-2">
                <ShieldCheck size={20} />
                Analyze Image
              </button>
            </Link>

            <button className="bg-[#2d3449] text-[#adc6ff] font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all duration-200 hover:bg-[#31394d] active:scale-95 cursor-pointer border border-[#45464d]">
              <Play size={20} fill="currentColor" />
              Watch Demo
            </button>
          </div>
        </div>

        {/* Right Visual */}
        <div className="col-span-12 lg:col-span-5 relative mt-12 lg:mt-0 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-125 aspect-square">
            <div className="absolute inset-0 bg-[#2d3449]/40 backdrop-blur-2xl rounded-4xl border border-[#45464d] overflow-hidden z-0">
              <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,#357df1_0%,transparent_70%)]"></div>

              <Image
                fill
                alt="AI Image Analysis"
                className="object-cover mix-blend-lighten opacity-60 scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSN88gkMFDVnM9F5ILE8dOpDKDzIaaIFzFAX2tdynjT1WlMDPQlvnJMU7m4iVDPXDhfQgRGxIeu0MVHbyzjY-kl6HT9aEytLs3d0b2NlDrTTrZ71a_Nv-4egBjw18GkMdKrt7cZUbdxf-qToRXWY1Oa8zXFMKe1mHXSmZQhKC6eTFdR8HLelrmzWmn3Op6DABd1hTBP-vGdy1hhnZobZkwQ5TTfzvETNPG0bpnFFz-geTmVub466qOXy646bwVgXP0E0Ns1n4wBeM"
                priority
              />
            </div>

            {/* Floating Data Cards */}
            <div className="absolute -top-6 -right-4 bg-[#2d3449]/90 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-[#45464d] z-10">
              <div className="text-[10px] text-[#c6c6cd] font-bold uppercase tracking-widest mb-1">
                AI Confidence
              </div>
              <div className="text-2xl font-headline font-extrabold text-[#4edea3] tracking-tighter">
                99.8%
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 bg-[#2d3449]/90 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-[#45464d] z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#93000a]/20 rounded-lg border border-[#93000a]/50">
                  <AlertTriangle size={18} className="text-[#ffb4ab]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#c6c6cd] font-bold uppercase tracking-widest">
                    Manipulation Detected
                  </div>
                  <div className="text-xs font-semibold text-white">
                    Suspicious Editing Found
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
