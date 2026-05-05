import { UploadCloud, Fingerprint, FileCheck } from "lucide-react";

function Features() {
  const steps = [
    {
      id: "01",
      title: "Upload",
      icon: <UploadCloud size={32} strokeWidth={1.5} />,
      desc: "Upload your image easily through a simple and secure interface.",
    },
    {
      id: "02",
      title: "Analyze",
      icon: <Fingerprint size={32} strokeWidth={1.5} />,
      desc: "Our AI scans the image and detects hidden signs of manipulation or editing.",
    },
    {
      id: "03",
      title: "Result",
      icon: <FileCheck size={32} strokeWidth={1.5} />,
      desc: "Get an instant result showing if the image is real or fake with a confidence score.",
    },
  ];

  return (
    <section className="py-24 md:py-32 px-6 md:px-8 bg-[#131b2e] border-y border-[#45464d]/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 md:mb-24">
          <h2 className="font-headline text-3xl md:text-5xl font-extrabold mb-4 text-white tracking-tight">
            How It Works
          </h2>
          <p className="text-[#c6c6cd] text-lg font-light max-w-2xl mx-auto">
            A simple 3-step process to detect manipulated images using AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Subtle connecting lines for Desktop */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-linear-to-r from-transparent via-[#45464d] to-transparent z-0"></div>

          {steps.map((feature) => (
            <div
              key={feature.id}
              className="group relative z-10 flex flex-col items-start"
            >
              {/* Icon */}
              <div
                className="mb-8 w-16 h-16 bg-[#222a3d] rounded-2xl flex items-center justify-center 
                            text-[#adc6ff] border border-[#45464d] 
                            group-hover:bg-[#00163a] group-hover:border-[#adc6ff]/50 
                            group-hover:text-white transition-all duration-500 shadow-xl"
              >
                {feature.icon}
              </div>

              {/* Text */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-bold text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded border border-[#4edea3]/20">
                    STEP {feature.id}
                  </span>
                  <h3 className="font-headline text-2xl font-bold text-white">
                    {feature.title}
                  </h3>
                </div>

                <p className="text-[#c6c6cd] leading-relaxed font-light text-base md:text-lg">
                  {feature.desc}
                </p>
              </div>

              {/* Hover effect */}
              <div className="absolute -inset-4 rounded-3xl bg-[#adc6ff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
