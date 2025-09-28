import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test Academia Page",
  description: "Minimal test page to isolate webpack issue",
};

export default async function TestAcademiaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Test Academia Page
        </h1>
        <p className="text-xl text-slate-600">
          This is a minimal test page to check if the basic routing works.
        </p>
      </main>
    </div>
  );
}