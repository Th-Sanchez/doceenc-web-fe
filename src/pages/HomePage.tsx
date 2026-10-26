import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { messages } from "@/i18n/messages";

export function HomePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{messages.home.title}</CardTitle>
        <CardDescription>{messages.home.description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
