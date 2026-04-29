import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/lib/models/Notification";
import { User } from "@/lib/models/User";
import { serializeNotification } from "@/lib/serializers";
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    const { id } = await params;

    await connectToDatabase();

    const user = await User.findOne({ clerkId: authUser.userId });
    if (!user) return notFoundResponse("User");

    const notification = await Notification.findById(id);
    if (!notification) return notFoundResponse("Notification");

    if (notification.userId !== user._id.toString()) return forbiddenResponse();

    notification.read = true;
    await notification.save();

    return Response.json({ notification: serializeNotification(notification) });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
