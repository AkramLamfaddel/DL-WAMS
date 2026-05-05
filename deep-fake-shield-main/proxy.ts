// middleware.js
import { withAuth } from "next-auth/middleware";

export default withAuth({});

export const config = {
  // Protecting dashboard, profile, and any sub-routes
  // matcher: ["/dashboard/:path*"],
  matcher: [],
};
