import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import styles from "./Dashboard.module.css";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome, {session.user?.name}</h1>
        <p className={styles.text}>
          You are now logged in. Your projects will appear here soon.
        </p>
      </div>
    </div>
  );
}
