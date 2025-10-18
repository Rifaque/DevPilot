import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ProjectsList from "../../components/ProjectsList";
import styles from "./Dashboard.module.css";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const token = session?.accessToken;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const projects = await res.json();

  const user = session.user;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.greeting}>
        Hi, {user?.name} ({user?.email})
      </p>

      <ProjectsList initialProjects={projects} initialSession={session} />
    </div>
  );
}
