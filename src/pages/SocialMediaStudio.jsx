import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Share2, Users, Image as ImageIcon, Calendar, Sparkles } from "lucide-react";
import BackButton from "@/components/client/BackButton";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientProject } from "@/hooks/useClientProject";
import SocialAccountsManager from "@/components/social/SocialAccountsManager";
import MediaLibrary from "@/components/social/MediaLibrary";
import ContentCalendar from "@/components/social/ContentCalendar";
import SocialGeneratePanel from "@/components/social/SocialGeneratePanel";

// Social Media Studio — the client's hub for managing everything social:
// connect accounts, upload images, generate on-brand templates, and manage
// the 30-day content calendar. Accessible from the client portal utilities.
export default function SocialMediaStudio() {
  const { user } = useClientUser();
  const { project } = useClientProject(user);
  const [pack, setPack] = useState(null);

  useEffect(() => { document.title = "Social Media Studio · Lead Gen Near You"; }, []);

  // Derive the social media pack from the project (preferred) or user record.
  useEffect(() => {
    const p = project?.social_media_pack ?? user?.socialMediaPack ?? null;
    setPack(p);
  }, [project, user]);

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton to="/client-portal" />
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Share2 className="h-4 w-4" /> Social Media Studio
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Manage your social media</h1>
        <p className="mt-1 text-sm text-white/60">
          Connect your accounts, upload photos, generate on-brand templates, and manage your 30-day content calendar — all in one place.
        </p>

        {!pack && (
          <div className="mt-4">
            <SocialGeneratePanel onGenerated={(d) => setPack(d)} />
          </div>
        )}

        <Tabs defaultValue="accounts" className="mt-5">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="accounts" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Accounts</TabsTrigger>
            <TabsTrigger value="media" className="gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Media</TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Calendar</TabsTrigger>
            <TabsTrigger value="generate" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Generate</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="mt-4"><SocialAccountsManager /></TabsContent>
          <TabsContent value="media" className="mt-4"><MediaLibrary pack={pack} /></TabsContent>
          <TabsContent value="calendar" className="mt-4"><ContentCalendar pack={pack} /></TabsContent>
          <TabsContent value="generate" className="mt-4"><SocialGeneratePanel onGenerated={(d) => setPack(d)} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}