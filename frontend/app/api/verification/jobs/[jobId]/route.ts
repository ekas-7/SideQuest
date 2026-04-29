import { connectToDatabase } from "@/lib/mongodb";
import { VerificationJob } from "@/lib/models/VerificationJob";
import {
  getAuthUser,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    const { jobId } = await params;

    await connectToDatabase();

    const job = await VerificationJob.findById(jobId).lean();
    if (!job) return notFoundResponse("Verification job");

    return Response.json({
      job: {
        id: job._id.toString(),
        status: job.status,
        approvals: job.approvals,
        rejections: job.rejections,
        requiredVotes: job.requiredVotes,
      },
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
