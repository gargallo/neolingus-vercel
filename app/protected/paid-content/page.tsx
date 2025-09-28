import { createUpdateClient } from "@/utils/update/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AIExamGenerator } from "@/components/ai-exam-generator";
import { AITutor } from "@/components/ai-tutor";

export default async function PaidContent() {
  const client = await createUpdateClient();
  const { data, error } = await client.entitlements.check("premium");

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="mt-2 text-muted-foreground">
            There was an error fetching your subscriptions.
          </p>
        </Card>
      </div>
    );
  }

  if (!data.hasAccess) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">No Access</h2>
          <p className="mt-2 text-muted-foreground">
            You don&apos;t have access to any paid content.
          </p>
          <Button className="mt-4" variant="outline">
            Upgrade Now
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI-Powered Language Learning</h1>
        <p className="text-muted-foreground mt-2">
          Generate custom exams and get personalized tutoring with advanced AI
          technology
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">AI Exam Generator</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Create personalized language exams tailored to your level and
            learning goals.
          </p>
          <AIExamGenerator />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">AI Language Tutor</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Get instant help with grammar, vocabulary, pronunciation, and more.
          </p>
          <AITutor />
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          🚀 Powered by AI
        </h3>
        <p className="text-blue-800 text-sm">
          These features use advanced AI models to provide personalized language
          learning experiences. Generated content is tailored to official exam
          standards including Cambridge, CIEACOVA, and Cervantes.
        </p>
      </Card>
    </div>
  );
}
