export type Dictionary = {
  common: {
    save: string
    saving: string
    cancel: string
    add: string
    edit: string
    delete: string
    deleting: string
    name: string
    icon: string
    color: string
    search: string
    none: string
    or: string
    user: string
    errorNameRequired: string
  }
  nav: {
    overview: string
    transactions: string
    reports: string
    limits: string
    settings: string
  }
  header: {
    settings: string
    signOut: string
  }
  login: {
    tagline: string
    signInSubtitle: string
    continueWithGoogle: string
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    forgotPassword: string
    signIn: string
    noAccount: string
    signUp: string
    errorFillAll: string
    resetTitle: string
    resetSubtitle: string
    sendResetLink: string
    backToSignIn: string
    checkEmail: string
    checkEmailResetBody: (email: string) => string
    createAccount: string
    createAccountSubtitle: string
    fullNameLabel: string
    fullNamePlaceholder: string
    passwordMinChars: string
    confirmPasswordLabel: string
    confirmPasswordPlaceholder: string
    errorPasswordsMismatch: string
    errorPasswordTooShort: string
    alreadyHaveAccount: string
    checkEmailConfirmBody: (email: string) => string
  }
  settings: {
    sections: {
      account: { label: string; description: string }
      finances: { label: string; description: string }
      categories: { label: string; description: string }
    }
    account: {
      title: string
      subtitle: string
      languageLabel: string
      dangerZone: string
      deleteAccount: string
      deleteAccountSubtitle: string
      deleteConfirmTitle: string
      deleteConfirmBody: string
    }
    currency: {
      title: string
      selectPlaceholder: string
      searchPlaceholder: string
      notFound: string
      modalTitle: string
    }
    accounts: {
      title: string
      addButton: string
      editTitle: string
      addTitle: string
      namePlaceholder: string
      balance: string
      balancePlaceholder: string
      balanceError: string
      excludeFromTotal: string
      excludeShort: string
    }
    creditCards: {
      title: string
      addButton: string
      editTitle: string
      addTitle: string
      namePlaceholder: string
      creditLimit: string
      closingDay: string
      dueDay: string
      defaultAccount: string
      noAccounts: string
      closingInfo: (closing: number, due: number) => string
      iconGeneric: string
      iconInstitutions: string
      errorClosingDay: string
      errorDueDay: string
      errorCreditLimit: string
    }
    categories: {
      title: string
      subtitle: string
      expense: string
      income: string
      addButton: string
      modalTitle: (action: "edit" | "add", type: "expense" | "income") => string
      namePlaceholder: string
    }
  }
  pages: {
    overview: string
    transactions: string
    reports: string
    limits: string
  }
  transactions: {
    newExpense: string
    newIncome: string
    newTransfer: string
    descriptionPlaceholder: string
    amountLabel: string
    dateLabel: string
    accountLabel: string
    categoryLabel: string
    categorySearchPlaceholder: string
    notesLabel: string
    notesPlaceholder: string
    recurringLabel: string
    recurrenceTypeLabel: string
    weekly: string
    monthly: string
    yearly: string
    dueDayLabel: string
    fromAccount: string
    toAccount: string
    noTransactions: string
    filterPlaceholder: string
    dayBalance: string
    overdueAlert: (n: number) => string
    noAccounts: string
    addTransaction: string
    expense: string
    income: string
    transfer: string
    selectAccount: string
    selectCategory: string
    validationError: string
    validationErrorMsg: string
    recurringCreated: string
    statusConfirmed: string
    statusPending: string
    confirmAction: string
  }
  overview: {
    greeting: (name: string) => string
    accounts: string
    noAccounts: string
    totalBalance: string
    thisMonth: string
    income: string
    expenses: string
    net: string
    recentTransactions: string
    noTransactions: string
    spendingLimits: string
    noLimits: string
    limitOf: (spent: string, total: string) => string
    myCards: string
    billsToPay: string
    billsToReceive: string
    overdue: string
    upcoming: string
    noBills: string
    topSpending: string
    comingSoon: string
    quickAccess: string
  }
}
