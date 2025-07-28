import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to My Journal</h1>
      <p className="text-gray-600 mb-6">Track your day-to-day. Private. Simple.</p>
      <div className="flex gap-4">
        <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded">
          Log In
        </Link>
        <Link href="/signup" className="bg-gray-200 text-blue-600 px-6 py-3 rounded">
          Sign Up
        </Link> 
      </div>
    </main>
  );
}