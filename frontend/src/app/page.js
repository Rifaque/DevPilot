import ProjectsList from '../components/ProjectsList';

export default function Home() {
  return (
    <div className="container">
      <h1 style={{marginTop:20}}>Projects</h1>
      <ProjectsList />
    </div>
  );
}
