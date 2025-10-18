// app/login/page.jsx OR app/login/page.js
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import styles from "./Login.module.css";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error || "Invalid credentials");
      return;
    }

    // redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <h1>DevPilot</h1>
        <p>Lightweight project & task management with roles and JWT-backed auth.</p>
        <ul>
          <li>Admin: manage users, projects, tasks</li>
          <li>Project Manager: create projects & assign tasks</li>
          <li>Developer: view assigned tasks and update status</li>
        </ul>
        <p className={styles.small}>If you don't have an account ask your Admin to register you.</p>
      </div>

      <div className={styles.right}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2>Login to DevPilot</h2>
          {error && <p className={styles.error}>{error}</p>}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />

          <button type="submit" className={styles.button}>Login</button>
        </form>
      </div>
    </div>
  );
}
