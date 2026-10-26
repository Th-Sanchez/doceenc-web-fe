import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageForError, messages } from "@/i18n/messages";
import { useLogin, useSession } from "./session";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, messages.validation.emailRequired)
    .pipe(z.email(messages.validation.emailInvalid)),
  password: z.string().min(1, messages.validation.passwordRequired),
});

type LoginForm = z.infer<typeof loginSchema>;

function destinationAfterLogin(state: unknown): string {
  const from = (state as { from?: { pathname?: string } } | null)?.from?.pathname;
  return from && from !== "/login" ? from : "/";
}

export function LoginPage() {
  const session = useSession();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (session.data) {
    return <Navigate to={destinationAfterLogin(location.state)} replace />;
  }

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => navigate(destinationAfterLogin(location.state), { replace: true }),
    });
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{messages.login.title}</CardTitle>
          <CardDescription>{messages.login.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{messages.login.email}</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{messages.login.password}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {login.isError && (
              <p role="alert" className="text-sm text-destructive">
                {messageForError(login.error)}
              </p>
            )}

            <Button type="submit" disabled={login.isPending}>
              {login.isPending ? messages.login.submitting : messages.login.submit}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
