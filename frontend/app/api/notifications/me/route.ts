import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/lib/models/Notification";
import { User } from "@/lib/models/User";
import { serializeNotification } from "@/lib/serializers";
import {
  getAuthUser,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return unauthorizedResponse();

    await connectToDatabase();

    const user = await User.findOne({ clerkId: authUser.userId });
    if (!user) return notFoundResponse("User");

    const notifications = await Notification.find({ userId: user._id.toString() })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: user._id.toString(),
      read: false,
    });

    return Response.json({
      notifications: notifications.map(serializeNotification),
      unreadCount,
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
