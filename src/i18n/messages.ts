import { ApiError } from "@/api/problem";

/** All user-facing text lives here (single locale, so no i18n library). */
export const messages = {
  appName: import.meta.env.VITE_APP_NAME ?? "Doceenc",
  loading: "Carregando…",
  nav: { home: "Início", logout: "Sair" },
  login: {
    title: "Entrar",
    description: "Acesse com seu e-mail e senha.",
    email: "E-mail",
    password: "Senha",
    submit: "Entrar",
    submitting: "Entrando…",
  },
  home: {
    title: "Bem-vinda!",
    description: "Em breve você poderá cadastrar insumos, receitas e produtos por aqui.",
  },
  notFound: { title: "Página não encontrada", back: "Voltar ao início" },
  sessionError: {
    title: "Não foi possível verificar sua sessão",
    retry: "Tentar novamente",
  },
  validation: {
    emailRequired: "Informe seu e-mail.",
    emailInvalid: "Informe um e-mail válido.",
    passwordRequired: "Informe sua senha.",
  },
} as const;

/** Maps the stable "code" returned by the API to a user-facing message. */
const errorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: "E-mail ou senha inválidos.",
  UNAUTHENTICATED: "Sua sessão expirou. Entre novamente.",
  ACCESS_DENIED: "Você não tem permissão para fazer isso.",
  MISSING_CSRF_HEADER: "Requisição recusada. Recarregue a página e tente novamente.",
  INTERNAL_ERROR: "Algo deu errado do nosso lado. Tente novamente em instantes.",
};

const fallbackErrorMessage = "Algo deu errado. Tente novamente.";
const networkErrorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";

export function messageForError(error: unknown): string {
  if (error instanceof ApiError) {
    return (error.code && errorMessages[error.code]) || fallbackErrorMessage;
  }
  // fetch() rejects with a TypeError when the network is down or the server is unreachable
  if (error instanceof TypeError) {
    return networkErrorMessage;
  }
  return fallbackErrorMessage;
}
