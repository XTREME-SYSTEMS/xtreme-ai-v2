import { motion } from "framer-motion";
import { Star } from "lucide-react";

export default function Testimonial() {
  return (
    <section className="bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="rounded-3xl border border-black/10 bg-white p-8 shadow-xl shadow-black/5 sm:p-12">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
          </div>
          <p className="mt-6 text-lg font-medium leading-relaxed text-black/80 sm:text-xl">
            "I felt completely supported as soon as I joined the platform... These guys care about my business and have taken my business to the next level. The technology is continuing to shift and change while getting better and better. They are providing new services and things that I love."
          </p>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-base font-bold text-black">D</div>
            <div>
              <div className="text-sm font-bold text-black">Debbie DuBois</div>
              <div className="text-xs text-black/50">Compass Marketing Creative</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}