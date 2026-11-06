import { ApiError } from "@/api/problem";

/** All user-facing text lives here (single locale, so no i18n library). */
export const messages = {
  appName: import.meta.env.VITE_APP_NAME ?? "Doceenc",
  loading: "Carregando…",
  nav: {
    main: "Principal",
    home: "Início",
    ingredients: "Insumos",
    logout: "Sair",
    operational: "OPERACIONAL",
    soon: "EM BREVE",
    soonBadge: "Breve",
    orders: "Pedidos",
    customers: "Clientes",
    reports: "Relatórios",
  },
  ingredients: {
    title: "Insumos",
    count: (n: number) => `${n} ${n === 1 ? "insumo" : "insumos"}`,
    new: "Novo Insumo",
    searchLabel: "Buscar insumos",
    searchPlaceholder: "Buscar por nome ou marca/fornecedor...",
    showArchived: "Mostrar arquivados",
    sortLabel: "Ordenar por",
    sort: { name: "Nome (A-Z)", variation: "Maior variação de preço", recent: "Compra mais recente" },
    categories: "Categorias",
    categoryFilter: "Filtrar por categoria",
    allCategories: "Todos",
    columns: {
      ingredient: "Insumo",
      category: "Categoria",
      package: "Embalagem",
      price: "Preço pago",
      unitCost: "Custo por unidade",
      variation: "Variação recente",
      lastPurchase: "Última compra",
      actions: "Ações",
    },
    archivedTag: "Arquivado",
    noVariation: "Sem variação: só há uma compra registrada",
    packagePrice: "Preço do pacote",
    costLabel: { GRAM: "Custo por grama", MILLILITER: "Custo por ml", UNIT: "Custo por unidade" },
    lastPurchase: "Última compra",
    adjust: "Ajustar",
    actions: {
      menu: (name: string) => `Ações para ${name}`,
      adjustPrice: "Ajustar preço",
      edit: "Editar dados",
      archive: "Arquivar",
      restore: "Restaurar",
    },
    empty: {
      title: "Nenhum insumo cadastrado ainda",
      description: "Cadastre seu primeiro insumo para começar a calcular custos.",
      search: "Nenhum insumo encontrado para a busca",
    },
    loadError: "Não foi possível carregar os insumos.",
    retry: "Tentar novamente",
    pagination: {
      label: "Paginação",
      summary: (shown: number, total: number) => `Mostrando ${shown} de ${total} ${total === 1 ? "insumo" : "insumos"}`,
      page: (page: number, count: number) => `Página ${page} de ${count}`,
      previous: "Anterior",
      next: "Próxima",
    },
    archiveDialog: {
      title: "Arquivar este insumo?",
      description:
        "Ele deixa de aparecer na lista principal, mas o histórico de preços é mantido. Você pode restaurá-lo depois.",
      confirm: "Arquivar",
      archiving: "Arquivando…",
      cancel: "Cancelar",
    },
  },
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
    required: "Campo obrigatório.",
    decimalInvalid: "Informe um número válido. Ex: 7,90",
    min: "O valor mínimo é 0,01.",
    priceMax: "O valor máximo é R$ 99.999,99.",
    quantityMax: "A quantidade máxima é 999.999,9999.",
    decimals: (n: number) => `Use no máximo ${n} ${n === 1 ? "casa decimal" : "casas decimais"}.`,
    dateFuture: "A data da compra não pode ser no futuro.",
    categoryRequired: "Escolha uma categoria.",
    textTooLong: "Use no máximo 120 caracteres.",
  },
  form: { required: "Obrigatório", optional: "Opcional", cancel: "Cancelar", saving: "Salvando…" },
  units: { GRAM: "g", MILLILITER: "ml", UNIT: "un" },
  months: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
  dates: { today: "Hoje", yesterday: "Ontem" },
  ingredientForm: {
    newTitle: "Novo insumo",
    editTitle: "Editar insumo",
    back: "Insumos",
    name: "Nome do insumo",
    namePlaceholder: "ex: Leite condensado integral 395g",
    brandSupplier: "Marca / Fornecedor",
    brandSupplierPlaceholder: "ex: Nestlé Moça - Atacado",
    category: "Categoria",
    categoryPlaceholder: "Selecione uma categoria",
    noCategories: "Nenhuma categoria ainda. Crie a primeira para continuar.",
    manageCategories: "Gerenciar categorias",
    unit: "Unidade de medida",
    unitHint: "Não poderá ser alterada depois",
    unitLocked: "A unidade não pode ser alterada",
    units: { GRAM: "g (gramas)", MILLILITER: "ml (mililitros)", UNIT: "un (unidades)" },
    packagePrice: "Preço pago na embalagem",
    packageQuantity: "Quantidade na embalagem",
    quantityRead: (text: string) => `Quantidade lida: ${text}`,
    quickFill: "Ajuste rápido da embalagem",
    purchasedOn: "Data da compra",
    purchasedOnHint: "Padrão: hoje",
    save: "Salvar insumo",
    saveChanges: "Salvar alterações",
    currentPrice: "Preço atual",
    adjustPrice: "Ajustar preço",
    archive: "Arquivar insumo",
    restore: "Restaurar insumo",
    notFound: "Insumo não encontrado.",
    backToList: "Voltar para a lista",
    restoreExisting: "Restaurar o existente",
    restoring: "Restaurando…",
  },
  priceForm: {
    title: "Ajustar preço",
    currentCost: "Custo atual",
    submit: "Registrar compra",
    submitting: "Registrando…",
    history: "Histórico de Preços",
    records: (n: number) => `${n} ${n === 1 ? "registro" : "registros"}`,
    chartLabel: "Evolução do custo por unidade",
    current: "Atual",
    historyError: "Não foi possível carregar o histórico.",
  },
  categoriesDialog: {
    title: "Categorias de insumos",
    description: "Organize seus insumos em categorias.",
    newLabel: "Nova categoria",
    newPlaceholder: "ex: Laticínios",
    add: "Adicionar",
    adding: "Adicionando…",
    rename: (name: string) => `Renomear ${name}`,
    renameField: (name: string) => `Novo nome para ${name}`,
    delete: (name: string) => `Excluir ${name}`,
    save: "Salvar",
    cancel: "Cancelar",
    confirmDelete: "Excluir categoria?",
    confirm: "Excluir",
    empty: "Nenhuma categoria ainda. Crie a primeira para organizar seus insumos.",
    loadError: "Não foi possível carregar as categorias.",
    close: "Fechar",
  },
} as const;

/** Maps the stable "code" returned by the API to a user-facing message. */
const errorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: "E-mail ou senha inválidos.",
  UNAUTHENTICATED: "Sua sessão expirou. Entre novamente.",
  ACCESS_DENIED: "Você não tem permissão para fazer isso.",
  MISSING_CSRF_HEADER: "Requisição recusada. Recarregue a página e tente novamente.",
  INTERNAL_ERROR: "Algo deu errado do nosso lado. Tente novamente em instantes.",
  VALIDATION_FAILED: "Revise os campos destacados.",
  MALFORMED_REQUEST: "Não foi possível entender os dados enviados. Recarregue a página e tente novamente.",
  INGREDIENT_NOT_FOUND: "Insumo não encontrado.",
  INGREDIENT_ALREADY_EXISTS: "Já existe um insumo com este nome e marca.",
  ARCHIVED_INGREDIENT_EXISTS: "Já existe um insumo arquivado com este nome e marca. Restaure-o em vez de criar outro.",
  CATEGORY_NOT_FOUND: "Categoria não encontrada.",
  CATEGORY_NAME_ALREADY_EXISTS: "Já existe uma categoria com este nome.",
  CATEGORY_IN_USE: "Esta categoria está em uso e não pode ser excluída.",
  CATEGORY_TYPE_MISMATCH: "Esta categoria não pode ser usada em insumos.",
  INCOMPATIBLE_UNIT: "A unidade informada não combina com a unidade do insumo.",
  PURCHASE_DATE_IN_FUTURE: "A data da compra não pode ser no futuro.",
  PRICE_OUT_OF_RANGE: "O preço é muito baixo para essa quantidade.",
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

const fieldErrorMessages: Record<string, string> = {
  NotBlank: "Campo obrigatório.",
  NotNull: "Campo obrigatório.",
  Size: "Texto longo demais.",
  DecimalMin: "O valor mínimo é 0,01.",
  Digits: "Valor grande demais ou com casas decimais demais.",
};

export function messageForFieldError(code: string): string {
  return fieldErrorMessages[code] ?? "Valor inválido.";
}
