import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/shared/Navbar";
import RecommendedCompetitions from "@/components/student/RecommendedCompetitions";
import { getAllCompetitions } from "@/app/actions/competitions";

export const dynamic = "force-dynamic";

export default async function CompetitionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("skills")
    .eq("id", user!.id)
    .single();

  const competitions = await getAllCompetitions(profile?.skills ?? []);

  return (
    <div className="min-h-full">
      <Navbar
        title="Competitions"
        subtitle="Discover hackathons & challenges matched to your skills"
      />
      <div className="p-6">
        <RecommendedCompetitions competitions={competitions} />
      </div>
    </div>
  );
}
