import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import ClientLayout from "@/components/client/ClientLayout";

export default function ClientPortalRoute() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-lime-400" />
      </div>
    );
  }

  return <ClientLayout user={user} />;
}