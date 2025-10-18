'use client';

import ProjectClient from "@/components/ProjectClient";

export default function ProjectDetailPage({ params }) {
  const projectId = params.id;

  return (
    <div className="container" style={{ marginTop: 20 }}>
      <ProjectClient projectId={projectId} />
    </div>
  );
}
