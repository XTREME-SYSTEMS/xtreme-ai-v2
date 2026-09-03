import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Phone, MapPin, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";

export default function VisualizerContactCapture({ sessionData, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [contact, setContact] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    project_address: "",
  });

  const update = (field, val) => setContact({ ...contact, [field]: val });

  const save = async () => {
    if (!contact.customer_email) {
      toast({ title: "Email required", description: "Please enter your email to save your estimate.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const session = await base44.entities.VisualizerSession.create({
        ...sessionData,
        ...contact,
        status: "contact_captured",
      });
      toast({ title: "Estimate saved!", description: "We'll email you a detailed proposal shortly." });
      onSaved(session);
    } catch (err) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-lg font-bold text-white">Save Your Estimate</h3>
        <p className="text-xs text-white/50">Enter your details and we'll send you a detailed proposal</p>
      </div>
      <div className="space-y-2.5">
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-white/30" />
          <Input
            value={contact.customer_name}
            onChange={(e) => update("customer_name", e.target.value)}
            placeholder="Your name"
            className="bg-white/5 border-white/10 text-white pl-10"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-white/30" />
          <Input
            type="email"
            value={contact.customer_email}
            onChange={(e) => update("customer_email", e.target.value)}
            placeholder="Email (required)"
            className="bg-white/5 border-white/10 text-white pl-10"
          />
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-white/30" />
          <Input
            type="tel"
            value={contact.customer_phone}
            onChange={(e) => update("customer_phone", e.target.value)}
            placeholder="Phone (optional)"
            className="bg-white/5 border-white/10 text-white pl-10"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-white/30" />
          <Input
            value={contact.project_address}
            onChange={(e) => update("project_address", e.target.value)}
            placeholder="Project address or city"
            className="bg-white/5 border-white/10 text-white pl-10"
          />
        </div>
      </div>
      <Button
        onClick={save}
        disabled={saving}
        className="w-full bg-amber-400 text-black font-bold hover:bg-amber-400/90"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
          </>
        ) : (
          "Save My Estimate"
        )}
      </Button>
      <p className="text-center text-[10px] text-white/30">
        No obligation. We'll never share your information.
      </p>
    </div>
  );
}