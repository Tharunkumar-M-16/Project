import Navbar from './Navbar.jsx';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl animate-fade-in px-4 py-8 sm:px-6 lg:py-10">{children}</main>
    </div>
  );
}
