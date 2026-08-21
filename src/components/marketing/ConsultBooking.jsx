import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Calendar, Check, Loader2, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

// 15-minute consult booking section. Lets anyone book a quick strategy call
// without creating an account. Saves to the Contact entity and emails admin.
export default function ConsultBooking() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", business: "", date: "", time: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.date) {
      setError("Name, email, and preferred date are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Save as a Contact so the admin can see it in the CRM
      await base44.entities.Contact.create({
        first_name: form.name,
        email: form.email,
        phone: form.phone,
        notes: `15-min consult request — Business: ${form.business}, Date: ${form.date}, Time: ${form.time}, Notes: ${form.notes}`,
      });
      setSaved(true);
    } catch (e) {
      setError("Couldn't submit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

  return (
    <section id="consult" className="bg-black py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-400">
            <Phone className="h-3.5 w-3.5" /> Free 15-Minute Strategy Call
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Book a Call With Us.</h2>
          <p className="mt-4 text-lg text-white/60">Not sure which plan is right? Let's talk for 15 minutes. We'll review your business, your goals, and recommend the fastest path to more leads.</p>
        </motion.div>

        {saved ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="mx-auto mt-12 max-w-md rounded-2xl border border-lime-400/40 bg-lime-400/10 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lime-400">
              <Check className="h-8 w-8 text-black" strokeWidth={3} />
            </div>
            <h3 className="text-xl font-bold text-white">Booking Received!</h3>
            <p className="mt-2 text-sm text-white/60">We'll email you within 1 business day to confirm your time slot. Check your inbox for a confirmation.</p>
          </motion.div>
        ) : (
          <form onSubmit={submit} className="mx-auto mt-12 max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/80">Your Name</label>
                <input value={form.name} onChange={set("name")} placeholder="John Smith" className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">Email</label>
                  <input type="email" value={form.email} onChange={set("email")} placeholder="john@business.com" className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">Phone</label>
                  <input value={form.phone} onChange={set("phone")} placeholder="(555) 123-4567" className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/80">Business Name</label>
                <input value={form.business} onChange={set("business")} placeholder="Acme Epoxy Floors" className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">Preferred Date</label>
                  <input type="date" value={form.date} onChange={set("date")} className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white focus:border-lime-400 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">Preferred Time</label>
                  <select value={form.time} onChange={set("time")} className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white focus:border-lime-400 focus:outline-none">
                    <option value="">Select a time</option>
                    {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/80">What do you want to discuss? (optional)</label>
                <textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="Tell us about your goals…" className="w-full resize-none rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none" />
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={saving}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3.5 text-sm font-bold text-black transition-all hover:bg-lime-300 disabled:opacity-50">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Booking…</> : <><Calendar className="h-4 w-4" /> Book My Call</>}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/40">
              <Clock className="h-3.5 w-3.5" /> 15 minutes · No obligation · We'll confirm via email
            </div>
          </form>
        )}
      </div>
    </section>
  );
}