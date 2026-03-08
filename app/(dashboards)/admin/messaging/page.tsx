import { requireAdmin } from "@/lib/auth/session";
import { getAudienceOptions } from "@/app/actions/admin";
import Navbar from "@/components/shared/Navbar";
import MessagingClient from "@/components/admin/MessagingClient";

export const dynamic = "force-dynamic";

export default async function MessagingPage() {
  await requireAdmin();
  const { departments, roleCounts } = await getAudienceOptions();

  return (
    <div className="min-h-full">
      <Navbar
        title="Messaging"
        subtitle="Send messages to users via email & WhatsApp"
      />
      <div className="mx-auto max-w-4xl p-6">
        <MessagingClient departments={departments} roleCounts={roleCounts} />
      </div>
    </div>
  );
}
