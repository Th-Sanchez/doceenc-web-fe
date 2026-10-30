import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router";
import { z } from "zod";
import arrowIcon from "@/assets/login-arrow.svg";
import auditIcon from "@/assets/login-audit.svg";
import backIcon from "@/assets/login-back.svg";
import bakeryIcon from "@/assets/login-bakery.svg";
import costIcon from "@/assets/login-cost.svg";
import emailIcon from "@/assets/login-email.svg";
import eyeIcon from "@/assets/login-eye.svg";
import googleIcon from "@/assets/login-google.svg";
import heartIcon from "@/assets/login-heart.svg";
import heroImage from "@/assets/login-hero.png";
import lockIcon from "@/assets/login-lock.svg";
import logoIcon from "@/assets/login-logo.svg";
import marginIcon from "@/assets/login-margin.svg";
import priceIcon from "@/assets/login-price.svg";
import quoteIcon from "@/assets/login-quote.svg";
import secureIcon from "@/assets/login-secure.svg";
import trendIcon from "@/assets/login-trend.svg";
import { Button } from "@/components/ui/button";
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
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="flex min-h-screen items-center justify-center bg-[#fbf9f6] p-4 sm:p-8">
      <div className="grid w-full max-w-[1152px] grid-cols-1 overflow-hidden rounded-xl bg-white shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] lg:min-h-[720px] lg:grid-cols-2">
        <section className="relative flex flex-col items-start gap-[14.5px] overflow-hidden bg-[#f5f3f0] p-6 sm:p-8 lg:p-12">
          <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-[#f9d8d2] opacity-40 blur-[64px]" />
          <div className="pointer-events-none absolute -bottom-24 -right-20 size-80 rounded-full bg-[#ffd9de] opacity-30 blur-[40px]" />

          <div className="relative flex w-full flex-col items-start gap-[11.4px]">
            <div className="flex items-center gap-2 rounded-full bg-[#f9d8d2] px-3 py-1.5">
              <img src={bakeryIcon} alt="" />
              <span className="text-[11px] font-bold leading-[14px] text-[#765d58]">
                {messages.login.marketingBadge}
              </span>
            </div>
            <h1 className="w-full pt-3 font-display text-[28px] font-bold leading-9 tracking-[-0.8px] text-[#802740] sm:text-[32px] sm:leading-10">
              {messages.login.marketingTitle}
            </h1>
            <p className="max-w-[448px] text-sm leading-[22.75px] text-[#554245]">
              {messages.login.marketingDescription}
            </p>
          </div>

          <div className="relative w-full py-4 lg:py-8">
            <div className="flex w-full flex-col gap-4">
              <div className="relative h-52 w-full overflow-hidden rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] sm:h-60 lg:h-64">
                <img
                  src={heroImage}
                  alt={messages.login.heroImageAlt}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(27,28,26,0.35)] to-transparent" />
                <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-xl bg-[rgba(251,249,246,0.95)] p-3.5 shadow-md backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#abf1d1]">
                      <img src={trendIcon} alt="" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase leading-[14px] tracking-[0.55px] text-[#554245]">
                        {messages.login.marginLabel}
                      </span>
                      <span className="whitespace-nowrap font-display text-xl font-bold leading-5 text-[#00523b]">
                        {messages.login.marginValue}
                      </span>
                    </span>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-[rgba(144,213,181,0.4)] px-2.5 py-1 text-[11px] font-bold leading-[14px] text-[#00523b]">
                    <img src={auditIcon} alt="" />
                    {messages.login.auditStatus}
                  </span>
                </div>
              </div>

              <div className="flex w-full items-start justify-center gap-3">
                {messages.login.features.map((feature, index) => {
                  const featureIcons = [costIcon, priceIcon, marginIcon];

                  return (
                    <div
                      key={feature.title}
                      className={`flex min-w-0 flex-1 flex-col items-start gap-1 rounded-xl bg-[#efeeeb] p-3 ${
                        index < 2 ? "pb-7" : ""
                      }`}
                    >
                      <div className="flex w-full items-center gap-1.5">
                        <img src={featureIcons[index]} alt="" />
                        <span className="whitespace-nowrap text-[11px] font-bold leading-[14px] text-[#802740]">
                          {feature.title}
                        </span>
                      </div>
                      <p className="text-xs leading-4 text-[#554245]">{feature.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative w-full pt-1 lg:pt-4">
            <blockquote className="flex w-full items-start gap-3.5 rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f9d8d2]">
                <img src={quoteIcon} alt="" />
              </span>
              <div className="min-w-0">
                <p className="text-xs italic leading-[16.5px] text-[#1b1c1a]">
                  {messages.login.testimonial}
                </p>
                <footer className="mt-1 flex flex-wrap items-center gap-2 text-[11px] leading-4">
                  <span className="font-bold text-[#1b1c1a]">{messages.login.testimonialAuthor}</span>
                  <span className="text-[#554245]">•</span>
                  <span className="text-[#554245]">{messages.login.testimonialBusiness}</span>
                </footer>
              </div>
            </blockquote>
          </div>
        </section>

        <section className="flex flex-col justify-between bg-white p-6 sm:p-8 lg:p-14">
          <div className="flex w-full flex-col items-start gap-5">
            <div className="flex w-full items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#802740] shadow-md">
                <img src={logoIcon} alt="" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-display text-xl font-semibold leading-5 tracking-[-0.5px] text-[#802740]">
                  {messages.login.brand}
                </span>
                <span className="text-[11px] font-bold uppercase leading-[14px] tracking-[1.1px] text-[#715954]">
                  {messages.login.brandSubtitle}
                </span>
              </span>
            </div>

            <div className="flex w-full flex-col items-start gap-1 pt-1">
              <h2 className="w-full font-display text-2xl font-semibold leading-8 tracking-[-0.6px] text-[#1b1c1a]">
                {messages.login.title}
              </h2>
              <p className="w-full text-sm leading-5 text-[#554245]">{messages.login.description}</p>
            </div>

            <div className="flex w-full items-center gap-3 rounded-xl bg-[rgba(249,216,210,0.6)] p-3.5">
              <img src={backIcon} alt="" />
              <p className="text-xs leading-4 text-[#765d58]">{messages.login.welcomeNote}</p>
            </div>

            <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-4 pt-1">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-sm font-semibold leading-5 text-[#1b1c1a]">
                  {messages.login.email}
                </Label>
                <div className="relative flex w-full items-center">
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    placeholder={messages.login.emailPlaceholder}
                    className="h-[50px] rounded-xl border-transparent bg-[#fbf9f6] pl-11 pr-4 text-sm placeholder:text-[#877275] focus-visible:ring-[#802740]"
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    {...register("email")}
                  />
                  <img src={emailIcon} alt="" className="pointer-events-none absolute left-4" />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password" className="text-sm font-semibold leading-5 text-[#1b1c1a]">
                    {messages.login.password}
                  </Label>
                  <span className="text-[11px] font-bold leading-[14px] text-[#802740]">
                    {messages.login.forgotPassword}
                  </span>
                </div>
                <div className="relative flex w-full items-center">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder={messages.login.passwordPlaceholder}
                    className="h-[50px] rounded-xl border-transparent bg-[#fbf9f6] pl-11 pr-12 text-sm placeholder:text-[#877275] focus-visible:ring-[#802740]"
                    aria-invalid={errors.password ? true : undefined}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    {...register("password")}
                  />
                  <img src={lockIcon} alt="" className="pointer-events-none absolute left-[17px]" />
                  <button
                    type="button"
                    aria-label={showPassword ? messages.login.hidePassword : messages.login.showPassword}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 flex size-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#802740]"
                  >
                    <img src={eyeIcon} alt="" />
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 pt-1">
                <Label htmlFor="remember" className="flex cursor-pointer items-center gap-2.5 text-xs leading-4 text-[#554245]">
                  <input
                    id="remember"
                    type="checkbox"
                    className="size-4 accent-[#802740]"
                  />
                  {messages.login.rememberMe}
                </Label>
                <span className="flex items-center gap-1 rounded-full bg-[#efeeeb] px-2.5 py-1 text-[11px] leading-4 text-[#554245]">
                  <img src={secureIcon} alt="" />
                  {messages.login.secureEnvironment}
                </span>
              </div>

              {login.isError && (
                <p role="alert" className="text-sm text-destructive">
                  {messageForError(login.error)}
                </p>
              )}

              <Button
                type="submit"
                disabled={login.isPending}
                className="h-[50px] w-full rounded-xl bg-[#802740] text-base font-semibold text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] hover:bg-[#702137]"
              >
                {login.isPending ? messages.login.submitting : messages.login.submit}
                <img src={arrowIcon} alt="" />
              </Button>

              {/* <div className="relative flex w-full items-center justify-center pt-1">
                <div className="h-px w-full bg-[#e4e2df]" />
                <span className="absolute bg-white px-3 text-[11px] font-bold leading-[14px] tracking-[0.55px] text-[#877275]">
                  {messages.login.or}
                </span>
              </div> */}

              {/* <button
                type="button"
                disabled
                title={messages.login.googleUnavailable}
                className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-[#fbf9f6] pt-1 text-sm font-semibold text-[#1b1c1a] disabled:cursor-not-allowed disabled:opacity-100"
              >
                <img src={googleIcon} alt="" />
                {messages.login.google}
              </button> */}
            </form>
          </div>

          <div className="flex w-full flex-col items-start pt-8">
            <div className="flex w-full flex-col items-center gap-4 pt-4 text-center">
              {/* <p className="text-sm leading-5 text-[#554245]">
                {messages.login.noAccount}{" "}
                <span className="font-semibold text-[#802740]">{messages.login.createAccount}</span>
              </p> */}
              <div className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#f5f3f0] p-3 text-center text-xs leading-4 text-[#554245]">
                <img src={heartIcon} alt="" />
                {messages.login.footerNote}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
