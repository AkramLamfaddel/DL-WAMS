import Link from "next/link";

function CTA() {
  return (
    <section className="py-24 px-8">
      <div className="max-w-5xl mx-auto bg-[#2d3449]/60 backdrop-blur-2xl p-12 md:p-20 rounded-xl text-center relative overflow-hidden border border-[#45464d]">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#adc6ff]/20 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#4edea3]/20 blur-[100px] rounded-full"></div>

        <h2 className="font-headline text-4xl md:text-5xl font-bold mb-6 z-10 relative text-white">
          Start detecting fake images in seconds.
        </h2>

        <p className="text-[#c6c6cd] text-lg mb-10 max-w-xl mx-auto z-10 relative">
          Upload an image, analyze it with AI, and instantly know if it’s real
          or manipulated. Simple, fast, and built for real use.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center z-10 relative">
          <Link
            href={"/dashboard"}
            className="w-full md:w-auto bg-linear-to-br from-[#adc6ff] to-[#357df1] text-[#002e6a] uppercase font-bold px-10 py-5 rounded-xl transition-all duration-200 active:scale-95 shadow-lg"
          >
            Analyze an Image
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CTA;
