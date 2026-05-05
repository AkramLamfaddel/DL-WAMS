import Image from "next/image";
import { ShieldCheck, BarChart3 } from "lucide-react";

function Trust() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-8 bg-[#0b1326]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Visual */}
        <div className="order-2 lg:order-1 relative group">
          <div className="absolute -inset-4 bg-[#357df1]/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

          <div className="relative rounded-xl aspect-video overflow-hidden shadow-2xl bg-[#171f33]">
            <Image
              fill
              alt="AI Analysis Visualization"
              className="w-full h-full object-cover grayscale brightness-75 contrast-125 transition-transform duration-700 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPLXiTWSfkr_1XKzGaIm0sZPuxTJwD803YjE5FR3kQbUsDIUvkO9Hh_iuysMJVv8WpBhv6-5WkR8E1KApJiTJCpFLVpnpamZosIs0BYNyQtOry5W2_NvMocwBgRoxfJL3wJei50V0OwgK7DF0SRVJ5zo4UX80xhkRf9RDf1Ba-RLGIrO4T2emyAewywpqPNAqaw0N_fvjkaZXL3hpjgWpplI0Dq9jlP3F0AF7Yxlxiq8alqQvf3tvnfjKe7SdCqN1jiX2AeDxNkw0"
            />
          </div>
        </div>

        {/* Content */}
        <div className="order-1 lg:order-2 space-y-8">
          <div className="space-y-4">
            <h2 className="font-headline text-3xl md:text-5xl font-extrabold leading-tight text-white tracking-tight">
              Reliable Detection,{" "}
              <span className="text-[#adc6ff]">Simple and Clear.</span>
            </h2>

            <p className="text-[#c6c6cd] text-lg font-light leading-relaxed">
              This platform uses AI to help detect whether an image is real or
              manipulated. It provides fast results and a confidence score to
              support better decisions when uploading or sharing visual content.
            </p>
          </div>

          <div className="space-y-10">
            {/* Feature 1 */}
            <div className="flex gap-6 group">
              <div className="shrink-0 w-14 h-14 bg-[#4edea3]/10 rounded-2xl flex items-center justify-center border border-[#4edea3]/20 group-hover:bg-[#4edea3]/20 transition-colors duration-300">
                <ShieldCheck
                  className="text-[#4edea3]"
                  size={28}
                  strokeWidth={1.5}
                />
              </div>

              <div>
                <h4 className="font-bold text-xl mb-2 text-white">
                  Secure Image Processing
                </h4>

                <p className="text-[#c6c6cd] font-light leading-relaxed">
                  Images are processed only for analysis purposes. The system
                  focuses on providing results without unnecessary data storage.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-6 group">
              <div className="shrink-0 w-14 h-14 bg-[#adc6ff]/10 rounded-2xl flex items-center justify-center border border-[#adc6ff]/20 group-hover:bg-[#adc6ff]/20 transition-colors duration-300">
                <BarChart3
                  className="text-[#adc6ff]"
                  size={28}
                  strokeWidth={1.5}
                />
              </div>

              <div>
                <h4 className="font-bold text-xl mb-2 text-white">
                  AI-Based Results
                </h4>

                <p className="text-[#c6c6cd] font-light leading-relaxed">
                  The model analyzes patterns in the image and provides a
                  prediction (real or fake) along with a confidence score.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Trust;
