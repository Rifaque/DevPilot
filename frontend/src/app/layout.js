// app/layout.js
import './globals.css';
import Nav from '../components/Nav';
import Providers from '../components/Providers';

export const metadata = {
  title: 'DevPilot',
  description: 'Project management tool'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
