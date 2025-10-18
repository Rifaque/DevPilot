import './globals.css';
import Nav from '../components/Nav';

// Root layout (server component)
export const metadata = {
  title: 'DevPilot',
  description: 'Project management tool'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
