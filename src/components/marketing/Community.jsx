import { motion } from "framer-motion";
import { Users, Lightbulb, Network, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CARDS = [
  { icon: Users, title: "By Marketers, For Marketers", desc: "Lead Generation Near Me was built and powered by marketers focused on the traditional issues marketing professionals face day to day. Once success was found, it was introduced to the market to help marketers face common challenges." },
  { icon: Lightbulb, title: "Community Driven Development", desc: "We're committed to helping the marketing world. We've built a community-driven Ideas Board where you can share and vote on ideas to help lead the direction of development." },
  { icon: Network, title: "Network With Other Successful Marketers", desc: "Connect with other ambitious agency owners, entrepreneurs and marketing professionals who are scaling successful businesses with Lead Generation Near Me." },
];

export default function Community() {
  return (
    <section id="about" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">Join the movement</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-black/60">
            Our thriving community of the most successful and visionary digital marketers on the planet. Get all the training and resources you need to start or grow your business.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {CARDS.map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-black/10 bg-zinc-50 p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-400/15">
                <c.icon className="h-6 w-6 text-lime-600" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-black">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-black/55">{c.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/register" className="group inline-flex items-center gap-2 rounded-xl bg-lime-400 px-7 py-4 text-base font-bold text-black transition-all hover:bg-lime-300 hover:shadow-xl hover:shadow-lime-400/40">
            Join the movement <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}