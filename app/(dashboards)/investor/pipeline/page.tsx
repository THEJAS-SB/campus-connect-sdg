import { getInvestorPipeline } from "@/app/actions/investor";
import Navbar from "@/components/shared/Navbar";
import PipelineBoard from "@/components/investor/PipelineBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const pipeline = await getInvestorPipeline();

  return (
    <div className="min-h-full">
      <Navbar
        title="Investment Pipeline"
        subtitle="Track your deal flow with AI insights"
      />
      <div className="p-6">
        <PipelineBoard initialPipeline={pipeline} />
      </div>
    </div>
  );
}
