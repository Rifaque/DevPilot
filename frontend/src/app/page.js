import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // User not logged in → go to login page
    redirect("/login");
  } else {
    // User logged in → auto redirect to dashboard
    redirect("/dashboard");
  }

  // This return is never actually reached, but needed to satisfy React
  return null;
}
