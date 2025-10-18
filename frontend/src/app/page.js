import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ProjectsList from "../components/ProjectsList";
import styles from "./page.module.css";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Projects</h1>
      <ProjectsList />
    </div>
  );
}
