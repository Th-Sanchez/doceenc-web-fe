import { Link } from "react-router";
import { messages } from "@/i18n/messages";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{messages.notFound.title}</h1>
      <Link to="/" className="text-primary underline underline-offset-4">
        {messages.notFound.back}
      </Link>
    </main>
  );
}
