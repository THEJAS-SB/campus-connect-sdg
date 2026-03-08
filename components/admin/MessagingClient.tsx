"use client";

import { useState, useCallback } from "react";
import AudienceSelector from "@/components/admin/AudienceSelector";
import MessageComposer from "@/components/admin/MessageComposer";
import BroadcastHistory from "@/components/admin/BroadcastHistory";
import MultiPlatformShare from "@/components/shared/MultiPlatformShare";
import type { AudienceFilter, Recipient } from "@/app/actions/admin";

interface MessagingClientProps {
  departments: string[];
  roleCounts: Record<string, number>;
}

export default function MessagingClient({
  departments,
  roleCounts,
}: MessagingClientProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter | null>(
    null,
  );

  const handleRecipientsChange = useCallback(
    (newRecipients: Recipient[], filter: AudienceFilter) => {
      setRecipients(newRecipients);
      setAudienceFilter(filter);
    },
    [],
  );

  return (
    <div className="space-y-6">
      <AudienceSelector
        departments={departments}
        roleCounts={roleCounts}
        onRecipientsChange={handleRecipientsChange}
      />
      <MessageComposer
        recipients={recipients}
        audienceFilter={audienceFilter}
      />
      <MultiPlatformShare />
      <BroadcastHistory />
    </div>
  );
}
