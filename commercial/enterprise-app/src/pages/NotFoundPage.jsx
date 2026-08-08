export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center glass-dark">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-sky-400 mb-4">404</h1>
        <p className="text-xl text-gray-300 mb-8">Page not found</p>
        <a href="/" className="bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors">
          Go Home
        </a>
      </div>
    </div>
  );
}
