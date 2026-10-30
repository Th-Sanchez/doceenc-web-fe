import { ApiError } from "@/api/problem";

/** All user-facing text lives here (single locale, so no i18n library). */
export const messages = {
  appName: import.meta.env.VITE_APP_NAME ?? "Doceenc",
  loading: "Carregando…",
  nav: { home: "Início", logout: "Sair" },
  login: {
    brand: "Doce Encanto",
    brandSubtitle: "GESTÃO CONFEITEIRA",
    marketingBadge: "Espaço da Empreendedora Doce",
    marketingTitle: "Bem-vinda de volta à sua confeitaria",
    marketingDescription:
      "Aqui sua paixão pelo açúcar e chocolate caminha lado a lado com finanças saudáveis e produção organizada.",
    heroImageAlt: "Confeiteira decorando um bolo em sua cozinha",
    marginLabel: "MARGEM MÉDIA",
    marginValue: "+64.8% no mês",
    auditStatus: "Auditoria OK",
    features: [
      { title: "Custo ao Grama", description: "Precisão cirúrgica por ingrediente usado." },
      { title: "Preço Justo", description: "Valorize horas de mão de obra e gás." },
      { title: "Margem Real", description: "Sem surpresas no balanço do final do mês." },
    ],
    testimonial:
      "“Antes do Doce Encanto, eu calculava bolo por estimativa. Hoje tenho lucro real em cada brigadeiro e nunca mais vendi no prejuízo!”",
    testimonialAuthor: "Marina Duarte",
    testimonialBusiness: "Ateliê Doce Afeto (SP)",
    title: "Entrar na sua conta",
    description: "Digite seu e-mail e senha para gerenciar seus doces e receitas.",
    welcomeNote: "Que bom ter você aqui! Entre para gerenciar seus doces e pedidos de hoje.",
    email: "E-mail de acesso",
    emailPlaceholder: "ex: contato@doceencanto.com.br",
    password: "Sua senha secreta",
    passwordPlaceholder: "••••••••••••",
    forgotPassword: "Esqueceu a senha?",
    showPassword: "Mostrar senha",
    hidePassword: "Ocultar senha",
    rememberMe: "Lembrar de mim neste computador",
    secureEnvironment: "Ambiente Seguro",
    submit: "Entrar na Confeitaria",
    submitting: "Entrando…",
    or: "OU",
    google: "Acessar com o Google",
    googleUnavailable: "O acesso com Google ainda não está disponível.",
    noAccount: "Ainda não tem conta?",
    createAccount: "Criar espaço doce gratuitamente",
    footerNote: "Feito com carinho para confeiteiras que valorizam seu trabalho artesanal.",
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

function tooManyAttemptsMessage(retryAfterSeconds?: number): string {
  if (!retryAfterSeconds || retryAfterSeconds <= 0) {
    return "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.";
  }

  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Muitas tentativas de login. Tente novamente em ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`;
}

export function messageForError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "TOO_MANY_LOGIN_ATTEMPTS") {
      return tooManyAttemptsMessage(error.problem?.retryAfterSeconds);
    }

    return (error.code && errorMessages[error.code]) || fallbackErrorMessage;
  }
  // fetch() rejects with a TypeError when the network is down or the server is unreachable
  if (error instanceof TypeError) {
    return networkErrorMessage;
  }
  return fallbackErrorMessage;
}
