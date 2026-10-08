import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, User, MapPin, Phone, Mail, Building2, Briefcase, Target, Sparkles } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { LOGO_ICON } from '@/lib/brandAssets';

const BUSINESS_TYPES = [
  { value: 'new', label: 'New Business', desc: 'Starting a brand new business from scratch' },
  { value: 'ai_enhancement', label: 'AI Enhancement', desc: 'Adding AI capabilities to my current business' },
  { value: 'rebrand', label: 'Rebrand', desc: 'Rebranding my existing business' },
];

export default function ClientOnboarding() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: '', address: '', phone: '', email: '',
    business_name: '', industry: '', services: '', target_audience: '', competitive_advantage: '', budget: '',
    business_type: 'new',
  });

  useEffect(() => {
    if (!token) { setLoading(false); return; } // No token — allow direct self-onboarding
    base44.entities.ClientInvitation.filter({ invitation_token: token }, { limit: 1 })
      .then(page => {
        const inv = page.items?.[0];
        if (!inv) { setError('This invitation link is invalid or has expired.'); return; }
        if (inv.status === 'completed') { setError('This onboarding form has already been submitted.'); return; }
        setInvitation(inv);
        if (inv.client_name) setForm(f => ({ ...f, full_name: inv.client_name, email: inv.client_email, phone: inv.client_phone || '', business_type: inv.business_type }));
        base44.entities.ClientInvitation.update(inv.id, { status: 'opened', opened_at: new Date().toISOString() }).catch(() => {});
      })
      .catch(() => setError('Could not load this invitation.'))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      const answers = {
        business_name: { answer_text: form.business_name, answered_at: new Date().toISOString() },
        owner_name: { answer_text: form.full_name, answered_at: new Date().toISOString() },
        industry: { answer_text: form.industry, answered_at: new Date().toISOString() },
        location: { answer_text: form.address, answered_at: new Date().toISOString() },
        services: { answer_text: form.services, answered_at: new Date().toISOString() },
        target_audience: { answer_text: form.target_audience, answered_at: new Date().toISOString() },
        competitive_advantage: { answer_text: form.competitive_advantage, answered_at: new Date().toISOString() },
        budget: { answer_text: form.budget, answered_at: new Date().toISOString() },
      };
      const session = await base44.entities.OnboardingSession.create({
        user_email: invitation?.client_email || form.email,
        session_id: crypto.randomUUID(),
        status: 'onboarding',
        current_step: 8,
        answers,
        client_phone: form.phone,
        client_address: form.address,
        business_type: invitation?.business_type || form.business_type,
        project_name: form.business_name || form.full_name,
      });
      if (invitation) await base44.entities.ClientInvitation.update(invitation.id, { status: 'completed', session_id: session.id, completed_at: new Date().toISOString() });
      // Trigger skip traces in the background for key answers
      for (const [key, val] of Object.entries(answers)) {
        if (val.answer_text && ['business_name', 'owner_name', 'industry', 'location'].includes(key)) {
          base44.functions.invoke('skipTraceAnswer', { session_id: session.id, question_key: key, answer_text: val.answer_text, context: answers }).catch(() => {});
        }
      }
      setDone(true);
    } catch (e) { setError(e.message || 'Could not submit. Please try again.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Shell><div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading your onboarding form…</div></Shell>;
  if (error) return <Shell><div className="rounded-xl border border-destructive/40 p-6 text-center"><p className="text-sm">{error}</p></div></Shell>;
  if (done) return <Shell><div className="rounded-xl border border-green-500/40 bg-green-500/5 p-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-green-500" /><h2 className="mt-4 text-xl font-semibold">Onboarding Complete!</h2><p className="mt-2 text-sm text-muted-foreground">Our system is now researching your business and industry. Your account manager will be in touch shortly with your brand assets for review.</p></div></Shell>;

  const canNext = step === 1 ? form.full_name && form.address && form.email : step === 2 ? true : form.business_name && form.industry;

  return <Shell>
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-border'}`} />)}
      </div>
      <p className="text-xs text-muted-foreground">Step {step} of 3</p>

      {step === 1 && <>
        <h2 className="text-lg font-semibold">Your Contact Information</h2>
        <Field icon={User} label="Full Name" value={form.full_name} onChange={v => setForm(f => ({ ...f, full_name: v }))} placeholder="John Smith" />
        <Field icon={MapPin} label="Street Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="123 Main St, Phoenix, AZ 85001" />
        <Field icon={Phone} label="Phone Number" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="(555) 123-4567" />
        <Field icon={Mail} label="Email Address" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="john@example.com" type="email" />
      </>}

      {step === 2 && <>
        <h2 className="text-lg font-semibold">Business Type</h2>
        <p className="text-sm text-muted-foreground">What best describes your situation?</p>
        <div className="space-y-3">
          {BUSINESS_TYPES.map(bt => (
            <button key={bt.value} onClick={() => setForm(f => ({ ...f, business_type: bt.value }))}
              className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${form.business_type === bt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary'}`}>
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${form.business_type === bt.value ? 'border-primary' : 'border-border'}`}>
                {form.business_type === bt.value && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </div>
              <div><p className="text-sm font-semibold">{bt.label}</p><p className="text-xs text-muted-foreground">{bt.desc}</p></div>
            </button>
          ))}
        </div>
        {invitation && <p className="text-xs text-muted-foreground">Your account manager pre-selected this type when sending the invitation.</p>}
      </>}

      {step === 3 && <>
        <h2 className="text-lg font-semibold">About Your Business</h2>
        <Field icon={Building2} label="Business Name" value={form.business_name} onChange={v => setForm(f => ({ ...f, business_name: v }))} placeholder="Smith Construction LLC" />
        <Field icon={Briefcase} label="Industry" value={form.industry} onChange={v => setForm(f => ({ ...f, industry: v }))} placeholder="Construction, Flooring, HVAC…" />
        <Field icon={Target} label="Services You Offer" value={form.services} onChange={v => setForm(f => ({ ...f, services: v }))} placeholder="Residential flooring, commercial epoxy, repairs…" textarea />
        <Field icon={Target} label="Target Audience" value={form.target_audience} onChange={v => setForm(f => ({ ...f, target_audience: v }))} placeholder="Homeowners in Phoenix, commercial property managers…" textarea />
        <Field icon={Sparkles} label="Competitive Advantage" value={form.competitive_advantage} onChange={v => setForm(f => ({ ...f, competitive_advantage: v }))} placeholder="What makes you different from competitors?" textarea />
        <Field icon={Sparkles} label="Budget Range" value={form.budget} onChange={v => setForm(f => ({ ...f, budget: v }))} placeholder="$5,000 - $10,000" />
      </>}

      {error && <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm">{error}</p>}

      <div className="flex gap-3">
        {step > 1 && <button onClick={() => setStep(s => s - 1)} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary">Back</button>}
        {step < 3 ? (
          <button onClick={() => canNext && setStep(s => s + 1)} disabled={!canNext} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">Continue</button>
        ) : (
          <button onClick={submit} disabled={submitting || !canNext} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><CheckCircle2 className="h-4 w-4" /> Complete Onboarding</>}
          </button>
        )}
      </div>
    </div>
  </Shell>;
}

function Shell({ children }) {
  return <div className="min-h-dvh bg-background text-foreground">
    <header className="border-b border-border bg-card px-4 py-3"><div className="mx-auto flex max-w-xl items-center gap-2"><Image src={LOGO_ICON} alt="Auto Builder" fittingType="fit" className="h-8 w-8" /><span className="text-sm font-semibold">Auto Builder · Client Onboarding</span></div></header>
    <main className="mx-auto max-w-xl p-4 py-8">{children}</main>
  </div>;
}

function Field({ icon: Icon, label, value, onChange, placeholder, textarea, type = 'text' }) {
  return <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-sm font-medium"><Icon className="h-3.5 w-3.5 text-muted-foreground" /> {label}</label>
    {textarea ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-border bg-background p-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" />
    )}
  </div>;
}