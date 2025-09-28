/**
 * Valenciano Language Support
 * Neolingus Academy - Localization System
 * 
 * Complete Valenciano (Catalan Valencian) localization with cultural adaptations
 * and regional linguistic variations for the Academia system
 */

// Valenciano translations and localization data
export const valencianoTranslations = {
  // Navigation and General
  navigation: {
    home: "Inici",
    academia: "Acadèmia",
    dashboard: "Tauler",
    courses: "Cursos",
    exams: "Exàmens",
    progress: "Progrés",
    profile: "Perfil",
    settings: "Configuració",
    help: "Ajuda",
    logout: "Tancar sessió",
    login: "Iniciar sessió",
    signup: "Registrar-se",
    back: "Tornar",
    next: "Següent",
    previous: "Anterior",
    cancel: "Cancel·lar",
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    view: "Veure",
    close: "Tancar",
    open: "Obrir",
    loading: "Carregant...",
    error: "Error",
    success: "Èxit",
    warning: "Advertència",
    info: "Informació",
  },

  // Course and Exam Related
  courses: {
    title: "Cursos d'Idiomes",
    description: "Cursos certificats per a l'aprenentatge d'idiomes",
    level: "Nivell",
    language: "Idioma",
    duration: "Duració",
    difficulty: "Dificultat",
    beginner: "Principiant",
    intermediate: "Intermedi", 
    advanced: "Avançat",
    expert: "Expert",
    enroll: "Inscriure's",
    continue: "Continuar",
    completed: "Completat",
    inProgress: "En progrés",
    notStarted: "No començat",
    certificate: "Certificat",
    provider: "Proveïdor",
    examTypes: "Tipus d'exàmens",
    totalLessons: "Total lliçons",
    estimatedTime: "Temps estimat",
    prerequisites: "Prerequisits",
    objectives: "Objectius",
    methodology: "Metodologia",
    materials: "Materials",
  },

  // Language Levels (CEFR)
  levels: {
    a1: "A1 - Principiant",
    a2: "A2 - Bàsic",
    b1: "B1 - Intermedi",
    b2: "B2 - Intermedi Alt",
    c1: "C1 - Avançat",
    c2: "C2 - Competència",
    description: {
      a1: "Pot comprendre i utilitzar expressions familiars i frases molt bàsiques",
      a2: "Pot comunicar-se en tasques simples i quotidianes",
      b1: "Pot comprendre els punts principals de temes familiars",
      b2: "Pot comprendre les idees principals de textos complexos",
      c1: "Pot comprendre una àmplia varietat de textos exigents i llargs",
      c2: "Pot comprendre amb facilitat pràcticament tot el que escolta o llig"
    }
  },

  // Languages
  languages: {
    english: "Anglés",
    valenciano: "Valencià",
    spanish: "Castellà",
    french: "Francés",
    german: "Alemany",
    italian: "Italià",
    portuguese: "Portuguès",
    chinese: "Xinés",
    japanese: "Japonés",
    russian: "Rus",
  },

  // Components (Language Skills)
  components: {
    reading: "Comprensió Lectora",
    writing: "Expressió Escrita",
    listening: "Comprensió Auditiva",
    speaking: "Expressió Oral",
    grammar: "Gramàtica",
    vocabulary: "Vocabulari",
    pronunciation: "Pronunciació",
    culture: "Cultura",
    readingDescription: "Desenvolupar habilitats de comprensió de textos escrits",
    writingDescription: "Millorar l'expressió i composició escrita",
    listeningDescription: "Comprendre l'idioma parlat en diferents contextos",
    speakingDescription: "Expressar-se oralment amb fluïdesa i precisió",
  },

  // Exam Interface
  exam: {
    title: "Examen de {component}",
    subtitle: "Nivell {level}",
    instructions: "Instruccions",
    question: "Pregunta",
    questions: "Preguntes",
    of: "de",
    timeRemaining: "Temps restant",
    timeLimit: "Temps límit",
    minutes: "minuts",
    seconds: "segons",
    hours: "hores",
    pause: "Pausar",
    resume: "Continuar",
    submit: "Entregar",
    finish: "Finalitzar",
    review: "Revisar",
    answer: "Resposta",
    answers: "Respostes",
    selectAnswer: "Selecciona una resposta",
    writeAnswer: "Escriu la teua resposta",
    recordAnswer: "Grava la teua resposta",
    uploadFile: "Puja un arxiu",
    skipQuestion: "Ometre pregunta",
    flagQuestion: "Marcar pregunta",
    questionOverview: "Visió general",
    answered: "Contestades",
    unanswered: "Sense contestar",
    flagged: "Marcades",
    current: "Actual",
    score: "Puntuació",
    totalScore: "Puntuació total",
    percentage: "Percentatge",
    correct: "Correcta",
    incorrect: "Incorrecta",
    partiallyCorrect: "Parcialment correcta",
    feedback: "Comentaris",
    explanation: "Explicació",
    hint: "Pista",
    example: "Exemple",
    solution: "Solució",
  },

  // Question Types
  questionTypes: {
    multipleChoice: "Elecció múltiple",
    trueFalse: "Vertader/Fals",
    fillInTheBlank: "Omplir els buits",
    matching: "Relacionar",
    ordering: "Ordenar",
    essay: "Redacció",
    shortAnswer: "Resposta curta",
    listening: "Comprensió auditiva",
    speaking: "Expressió oral",
    reading: "Comprensió lectora",
    dictation: "Dictat",
    translation: "Traducció",
    cloze: "Text amb buits",
    dragAndDrop: "Arrossegar i deixar",
  },

  // Progress and Analytics
  progress: {
    title: "El Teu Progrés",
    overall: "Progrés general",
    byComponent: "Per component",
    byLevel: "Per nivell",
    overTime: "Al llarg del temps",
    statistics: "Estadístiques",
    achievements: "Èxits",
    certificates: "Certificats",
    studyTime: "Temps d'estudi",
    sessionsCompleted: "Sessions completades",
    averageScore: "Puntuació mitjana",
    bestScore: "Millor puntuació",
    improvementRate: "Taxa de millora",
    consistency: "Consistència",
    strengths: "Punts forts",
    weaknesses: "Punts febles",
    recommendations: "Recomanacions",
    nextSteps: "Pròxims passos",
    studyPlan: "Pla d'estudi",
    goals: "Objectius",
    milestones: "Fites",
    timeline: "Cronograma",
    performance: "Rendiment",
    trends: "Tendències",
    insights: "Perspectives",
    readinessScore: "Puntuació de preparació",
    estimatedLevel: "Nivell estimat",
    timeToNextLevel: "Temps fins al pròxim nivell",
  },

  // Dashboard
  dashboard: {
    welcome: "Benvingut/da, {name}",
    welcomeBack: "Benvingut/da de nou",
    yourCourses: "Els Teus Cursos",
    recentActivity: "Activitat recent",
    upcomingExams: "Pròxims exàmens",
    quickActions: "Accions ràpides",
    takeExam: "Fer examen",
    practiceMode: "Mode pràctica",
    studyMaterials: "Materials d'estudi",
    viewProgress: "Veure progrés",
    continueStudy: "Continuar estudiant",
    newCourse: "Nou curs",
    aiTutor: "Tutor IA",
    flashcards: "Targetes de memòria",
    grammar: "Gramàtica",
    vocabulary: "Vocabulari",
    pronunciation: "Pronunciació",
    conversation: "Conversació",
    notifications: "Notificacions",
    messages: "Missatges",
    calendar: "Calendari",
    achievements: "Èxits",
    leaderboard: "Classificació",
    community: "Comunitat",
  },

  // AI Tutor
  aiTutor: {
    title: "Tutor d'IA",
    subtitle: "El teu assistent personal per a l'aprenentatge d'idiomes",
    startConversation: "Començar conversa",
    askQuestion: "Fer una pregunta",
    getHelp: "Obtindre ajuda",
    practiceWith: "Practicar amb IA",
    typeMessage: "Escriu el teu missatge...",
    send: "Enviar",
    clear: "Netejar",
    suggestions: "Suggeriments",
    examples: "Exemples",
    grammar: "Ajuda de gramàtica",
    vocabulary: "Ajuda de vocabulari",
    pronunciation: "Ajuda de pronunciació",
    translation: "Ajuda de traducció",
    conversation: "Pràctica de conversa",
    correction: "Correcció",
    explanation: "Explicació",
    context: "Context",
    usage: "Ús",
    synonyms: "Sinònims",
    antonyms: "Antònims",
    relatedWords: "Paraules relacionades",
    difficulty: "Dificultat",
    level: "Nivell",
    topic: "Tema",
    skill: "Habilitat",
  },

  // User Interface
  ui: {
    search: "Cercar",
    filter: "Filtrar",
    sort: "Ordenar",
    sortBy: "Ordenar per",
    filterBy: "Filtrar per",
    showAll: "Mostrar tot",
    showMore: "Mostrar més",
    showLess: "Mostrar menys",
    expand: "Expandir",
    collapse: "Contraure",
    selectAll: "Seleccionar tot",
    deselectAll: "Deseleccionar tot",
    refresh: "Actualitzar",
    sync: "Sincronitzar",
    download: "Descarregar",
    upload: "Pujar",
    import: "Importar",
    export: "Exportar",
    print: "Imprimir",
    share: "Compartir",
    copy: "Copiar",
    paste: "Enganxar",
    cut: "Tallar",
    undo: "Desfer",
    redo: "Refer",
    reset: "Restablir",
    clear: "Netejar",
    apply: "Aplicar",
    confirm: "Confirmar",
    required: "Obligatori",
    optional: "Opcional",
    placeholder: "Espai reservat",
    noResults: "No s'han trobat resultats",
    noData: "No hi ha dades",
    loading: "Carregant...",
    processing: "Processant...",
    completed: "Completat",
    failed: "Ha fallat",
    retry: "Tornar a intentar",
    tryAgain: "Intentar de nou",
  },

  // Forms and Validation
  forms: {
    name: "Nom",
    firstName: "Nom",
    lastName: "Cognoms",
    email: "Correu electrònic",
    password: "Contrasenya",
    confirmPassword: "Confirmar contrasenya",
    username: "Nom d'usuari",
    phone: "Telèfon",
    address: "Adreça",
    city: "Ciutat",
    country: "País",
    language: "Idioma",
    timezone: "Zona horària",
    dateOfBirth: "Data de naixement",
    gender: "Gènere",
    male: "Home",
    female: "Dona",
    other: "Altre",
    preferNotToSay: "Prefereixc no dir-ho",
    bio: "Biografia",
    interests: "Interessos",
    goals: "Objectius",
    experience: "Experiència",
    level: "Nivell",
    motivation: "Motivació",
    availability: "Disponibilitat",
    preferences: "Preferències",
    notifications: "Notificacions",
    privacy: "Privacitat",
    terms: "Termes",
    conditions: "Condicions",
    agreement: "Acord",
    consent: "Consentiment",
    subscribe: "Subscriure's",
    newsletter: "Butlletí",
    updates: "Actualitzacions",
    marketing: "Màrqueting",
    thirdParty: "Tercers",
    cookies: "Galetes",
    analytics: "Analítiques",
    required: "Aquest camp és obligatori",
    invalid: "Format no vàlid",
    tooShort: "Massa curt",
    tooLong: "Massa llarg",
    passwordMismatch: "Les contrasenyes no coincideixen",
    emailInvalid: "Correu electrònic no vàlid",
    phoneInvalid: "Telèfon no vàlid",
    dateInvalid: "Data no vàlida",
    numberInvalid: "Número no vàlid",
  },

  // Time and Dates
  time: {
    now: "Ara",
    today: "Hui",
    yesterday: "Ahir",
    tomorrow: "Demà",
    thisWeek: "Esta setmana",
    lastWeek: "La setmana passada",
    nextWeek: "La pròxima setmana",
    thisMonth: "Este mes",
    lastMonth: "El mes passat",
    nextMonth: "El pròxim mes",
    thisYear: "Este any",
    lastYear: "L'any passat",
    nextYear: "El pròxim any",
    morning: "Matí",
    afternoon: "Vesprada",
    evening: "Vespre",
    night: "Nit",
    am: "AM",
    pm: "PM",
    minute: "minut",
    minutes: "minuts",
    hour: "hora",
    hours: "hores",
    day: "dia",
    days: "dies",
    week: "setmana",
    weeks: "setmanes",
    month: "mes",
    months: "mesos",
    year: "any",
    years: "anys",
    ago: "fa",
    in: "en",
    since: "des de",
    until: "fins a",
    from: "de",
    to: "a",
  },

  // Days of the week
  days: {
    monday: "Dilluns",
    tuesday: "Dimarts",
    wednesday: "Dimecres",
    thursday: "Dijous",
    friday: "Divendres",
    saturday: "Dissabte",
    sunday: "Diumenge",
    mon: "Dll",
    tue: "Dmt",
    wed: "Dmc",
    thu: "Dij",
    fri: "Div",
    sat: "Dss",
    sun: "Diu",
  },

  // Months
  months: {
    january: "Gener",
    february: "Febrer",
    march: "Març",
    april: "Abril",
    may: "Maig",
    june: "Juny",
    july: "Juliol",
    august: "Agost",
    september: "Setembre",
    october: "Octubre",
    november: "Novembre",
    december: "Desembre",
    jan: "Gen",
    feb: "Feb",
    mar: "Mar",
    apr: "Abr",
    may: "Mai",
    jun: "Jun",
    jul: "Jul",
    aug: "Ago",
    sep: "Set",
    oct: "Oct",
    nov: "Nov",
    dec: "Des",
  },

  // Errors and Messages
  errors: {
    generic: "S'ha produït un error",
    network: "Error de xarxa",
    server: "Error del servidor",
    notFound: "No trobat",
    unauthorized: "No autoritzat",
    forbidden: "Prohibit",
    timeout: "Temps d'espera esgotat",
    offline: "Sense connexió",
    sessionExpired: "Sessió caducada",
    invalidCredentials: "Credencials no vàlides",
    accountLocked: "Compte bloquejat",
    emailNotVerified: "Correu electrònic no verificat",
    passwordTooWeak: "Contrasenya massa feble",
    fileTooBig: "Arxiu massa gran",
    unsupportedFormat: "Format no admés",
    quotaExceeded: "Quota excedida",
    permissionDenied: "Permís denegat",
    dataCorrupted: "Dades corruptes",
    updateRequired: "Actualització necessària",
  },

  // Success Messages
  success: {
    saved: "Guardat correctament",
    updated: "Actualitzat correctament",
    deleted: "Eliminat correctament",
    created: "Creat correctament",
    sent: "Enviat correctament",
    uploaded: "Pujat correctament",
    downloaded: "Descarregat correctament",
    imported: "Importat correctament",
    exported: "Exportat correctament",
    synchronized: "Sincronitzat correctament",
    verified: "Verificat correctament",
    activated: "Activat correctament",
    deactivated: "Desactivat correctament",
    registered: "Registrat correctament",
    loggedIn: "Sessió iniciada correctament",
    loggedOut: "Sessió tancada correctament",
    passwordChanged: "Contrasenya canviada correctament",
    profileUpdated: "Perfil actualitzat correctament",
    settingsSaved: "Configuració guardada correctament",
    examCompleted: "Examen completat correctament",
    courseEnrolled: "Inscrit al curs correctament",
    certificateEarned: "Certificat obtingut correctament",
  },

  // Offline and Connectivity
  offline: {
    title: "Mode fora de línia",
    message: "Estàs treballant sense connexió",
    dataWillSync: "Les dades es sincronitzaran quan es restablisca la connexió",
    someFeatures: "Algunes funcions podrien no estar disponibles",
    reconnecting: "Reconnectant...",
    backOnline: "Tornes a estar en línia",
    syncInProgress: "Sincronitzant dades...",
    syncComplete: "Sincronització completada",
    syncFailed: "Ha fallat la sincronització",
    retrySync: "Tornar a intentar sincronitzar",
    offlineMode: "Mode fora de línia",
    onlineMode: "Mode en línia",
    connectionLost: "S'ha perdut la connexió",
    connectionRestored: "Connexió restablerta",
  },

  // Accessibility
  accessibility: {
    skipToContent: "Anar al contingut principal",
    openMenu: "Obrir menú",
    closeMenu: "Tancar menú",
    openDialog: "Obrir diàleg",
    closeDialog: "Tancar diàleg",
    previousPage: "Pàgina anterior",
    nextPage: "Pàgina següent",
    firstPage: "Primera pàgina",
    lastPage: "Última pàgina",
    increaseVolume: "Augmentar volum",
    decreaseVolume: "Disminuir volum",
    playAudio: "Reproduir àudio",
    pauseAudio: "Pausar àudio",
    stopAudio: "Parar àudio",
    muteAudio: "Silenciar àudio",
    unmuteAudio: "Activar àudio",
    fullscreen: "Pantalla completa",
    exitFullscreen: "Eixir de pantalla completa",
    zoomIn: "Augmentar zoom",
    zoomOut: "Disminuir zoom",
    resetZoom: "Restablir zoom",
    highContrast: "Alt contrast",
    normalContrast: "Contrast normal",
    largeText: "Text gran",
    normalText: "Text normal",
    screenReader: "Lector de pantalla",
    keyboardNavigation: "Navegació per teclat",
    voiceControl: "Control per veu",
    reducedMotion: "Moviment reduït",
    autoplay: "Reproducció automàtica",
    captions: "Subtítols",
    transcript: "Transcripció",
    audioDescription: "Descripció d'àudio",
    signLanguage: "Llengua de signes",
  },

  // GDPR and Privacy
  gdpr: {
    title: "Protecció de Dades",
    cookieConsent: "Consentiment de galetes",
    privacyPolicy: "Política de privacitat",
    termsOfService: "Termes del servei",
    dataProcessing: "Processament de dades",
    consent: "Consentiment",
    withdraw: "Retirar consentiment",
    manage: "Gestionar preferències",
    essential: "Galetes essencials",
    functional: "Galetes funcionals",
    analytics: "Galetes analítiques",
    marketing: "Galetes de màrqueting",
    thirdParty: "Galetes de tercers",
    accept: "Acceptar tot",
    reject: "Rebutjar tot",
    customize: "Personalitzar",
    savePreferences: "Guardar preferències",
    dataRetention: "Retenció de dades",
    dataExport: "Exportar dades",
    dataDelete: "Eliminar dades",
    rightToAccess: "Dret d'accés",
    rightToRectify: "Dret de rectificació",
    rightToErase: "Dret d'eliminació",
    rightToPortability: "Dret de portabilitat",
    rightToObject: "Dret d'oposició",
    dataController: "Responsable del tractament",
    dataProcessor: "Encarregat del tractament",
    legalBasis: "Base legal",
    cookieNotice: "Avís de galetes",
    privacyNotice: "Avís de privacitat",
    consentForm: "Formulari de consentiment",
    optIn: "Acceptar",
    optOut: "Rebutjar",
    necessary: "Necessàries",
    preferences: "Preferències",
    statistics: "Estadístiques",
    marketing: "Màrqueting",
  },

  // Mobile Specific
  mobile: {
    swipeLeft: "Lliscar cap a l'esquerra",
    swipeRight: "Lliscar cap a la dreta",
    swipeUp: "Lliscar cap amunt",
    swipeDown: "Lliscar cap avall",
    tapToSelect: "Tocar per seleccionar",
    doubleTap: "Doble toc",
    longPress: "Mantenir premut",
    pinchToZoom: "Pelliscar per fer zoom",
    rotate: "Girar",
    landscape: "Horitzontal",
    portrait: "Vertical",
    fullscreen: "Pantalla completa",
    minimized: "Minimitzat",
    maximized: "Maximitzat",
    notifications: "Notificacions",
    vibration: "Vibració",
    soundEffects: "Efectes de so",
    hapticFeedback: "Resposta hàptica",
    gestureNavigation: "Navegació per gestos",
    voiceInput: "Entrada de veu",
    cameraAccess: "Accés a la càmera",
    microphoneAccess: "Accés al micròfon",
    locationAccess: "Accés a la ubicació",
    storageAccess: "Accés a l'emmagatzematge",
    networkAccess: "Accés a la xarxa",
    bluetoothAccess: "Accés al Bluetooth",
    nfcAccess: "Accés al NFC",
    biometricAuth: "Autenticació biomètrica",
    faceID: "Face ID",
    touchID: "Touch ID",
    fingerprint: "Empremta digital",
    voiceRecognition: "Reconeixement de veu",
  },

  // Cultural and Regional Adaptations
  cultural: {
    greeting: "Bon dia",
    farewell: "Adéu",
    pleaseAndThankYou: "Per favor i gràcies",
    excuse: "Perdó",
    sorry: "Ho sent",
    congratulations: "Enhorabona",
    goodLuck: "Bona sort",
    welcome: "Benvingut/da",
    thankYou: "Gràcies",
    youAreWelcome: "De res",
    yes: "Sí",
    no: "No",
    maybe: "Potser",
    ok: "D'acord",
    fine: "Bé",
    excellent: "Excel·lent",
    good: "Bo",
    bad: "Dolent",
    help: "Ajuda",
    support: "Suport",
    contact: "Contacte",
    feedback: "Comentaris",
    suggestion: "Suggeriment",
    complaint: "Queixa",
    compliment: "Elogi",
    recommendation: "Recomanació",
    review: "Ressenya",
    rating: "Valoració",
    opinion: "Opinió",
  },
};

// Number formatting for Valenciano locale
export const valencianoNumberFormat = {
  decimal: ",",
  thousands: ".",
  currency: "€",
  currencyPosition: "after", // €10,50
  dateFormat: "dd/mm/yyyy",
  timeFormat: "HH:mm",
  dateTimeFormat: "dd/mm/yyyy HH:mm",
  firstDayOfWeek: 1, // Monday
};

// Cultural preferences and regional settings
export const valencianoCulturalSettings = {
  // Formal vs informal addressing
  addressingStyle: "formal", // "tu" vs "vostè"
  
  // Regional linguistic variations
  dialectVariation: "central", // central, northern, southern
  
  // Cultural context adaptations
  culturalContext: {
    // Educational system references
    educationSystem: "spanish",
    gradingScale: "0-10",
    academicLevels: ["primària", "secundària", "batxillerat", "universitat"],
    
    // Time references
    workingHours: "9:00-17:00",
    lunchTime: "14:00-15:00",
    businessHours: "9:00-13:00, 16:00-19:00",
    
    // Holiday and calendar references
    holidays: [
      "Any Nou",
      "Reis",
      "Sant Josep",
      "Setmana Santa",
      "Festa del Treball",
      "Dia de la Comunitat Valenciana",
      "Assumpció",
      "Dia de la Hispanitat",
      "Tots Sants",
      "Constitució",
      "Immaculada",
      "Nadal"
    ],
    
    // Regional references
    region: "Comunitat Valenciana",
    provinces: ["València", "Castelló", "Alacant"],
    capital: "València",
    language: "Valencià",
    coofficial: ["Castellà", "Valencià"],
  },
  
  // Measurement preferences
  measurements: {
    temperature: "celsius",
    distance: "kilometers",
    weight: "kilograms",
    currency: "euro",
    paper: "A4",
  },
  
  // Communication style
  communication: {
    formality: "medium",
    directness: "moderate",
    contextLevel: "high",
    relationshipOriented: true,
  },
};

// Text direction and typography settings
export const valencianoTypography = {
  direction: "ltr",
  script: "latin",
  fontFamily: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
  fontSize: {
    base: "16px",
    small: "14px",
    large: "18px",
    title: "24px",
    heading: "20px",
  },
  lineHeight: {
    base: 1.6,
    compact: 1.4,
    loose: 1.8,
  },
  letterSpacing: {
    normal: "0",
    wide: "0.05em",
  },
};

// Pluralization rules for Valenciano
export function valencianoPluralize(count: number, singular: string, plural: string): string {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural}`;
}

// Date formatting functions
export function formatValencianoDate(date: Date, format: "short" | "medium" | "long" = "medium"): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  switch (format) {
    case "short":
      return `${day}/${month}/${year}`;
    case "medium":
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    case "long":
      const monthNames = Object.values(valencianoTranslations.months);
      return `${day} de ${monthNames[month - 1].toLowerCase()} de ${year}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

// Time formatting functions
export function formatValencianoTime(date: Date, format: "12" | "24" = "24"): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  if (format === "24") {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  const isPM = hours >= 12;
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const period = isPM ? valencianoTranslations.time.pm : valencianoTranslations.time.am;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Number formatting functions
export function formatValencianoNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString('ca-ES-valencia', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Currency formatting
export function formatValencianoCurrency(amount: number): string {
  return `${formatValencianoNumber(amount, 2)} €`;
}

// Percentage formatting
export function formatValencianoPercentage(value: number, decimals: number = 1): string {
  return `${formatValencianoNumber(value, decimals)}%`;
}

// Relative time formatting
export function formatValencianoRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSeconds < 60) {
    return "ara mateix";
  } else if (diffInMinutes < 60) {
    return valencianoPluralize(diffInMinutes, "minut", "minuts") + " fa";
  } else if (diffInHours < 24) {
    return valencianoPluralize(diffInHours, "hora", "hores") + " fa";
  } else if (diffInDays === 1) {
    return "ahir";
  } else if (diffInDays < 7) {
    return valencianoPluralize(diffInDays, "dia", "dies") + " fa";
  } else {
    return formatValencianoDate(date, "short");
  }
}

// Text truncation with proper word boundaries
export function truncateValencianoText(text: string, maxLength: number, suffix: string = "..."): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  const truncated = text.substring(0, maxLength - suffix.length);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) { // Don't break if the last word is very long
    return truncated.substring(0, lastSpace) + suffix;
  }
  
  return truncated + suffix;
}

// Text transformation utilities
export function capitalizeValenciano(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function titleCaseValenciano(text: string): string {
  const articles = ['el', 'la', 'els', 'les', 'un', 'una', 'uns', 'unes'];
  const prepositions = ['de', 'del', 'dels', 'a', 'al', 'als', 'per', 'amb', 'sense', 'sobre', 'sota'];
  const conjunctions = ['i', 'o', 'però', 'que', 'si'];
  const dontCapitalize = [...articles, ...prepositions, ...conjunctions];
  
  return text.toLowerCase().split(' ').map((word, index) => {
    if (index === 0 || !dontCapitalize.includes(word)) {
      return capitalizeValenciano(word);
    }
    return word;
  }).join(' ');
}

// Validation utilities for Valenciano text
export function isValidValencianoText(text: string): boolean {
  // Basic validation for Valenciano text
  // This could be expanded with more sophisticated linguistic rules
  const valencianoPattern = /^[\p{L}\p{M}\p{N}\p{P}\p{S}\p{Z}]*$/u;
  return valencianoPattern.test(text);
}

// Language detection utility
export function detectValencianoContent(text: string): number {
  // Simple scoring system for Valenciano content detection
  // Returns a score between 0 and 1
  const valencianoWords = [
    'que', 'de', 'la', 'el', 'a', 'i', 'un', 'ser', 'se', 'no', 'te', 'un', 'per', 'amb', 'son',
    'este', 'del', 'teu', 'teva', 'meua', 'meu', 'nostre', 'vostra', 'seu', 'seua'
  ];
  
  const words = text.toLowerCase().split(/\W+/);
  const matches = words.filter(word => valencianoWords.includes(word)).length;
  
  return Math.min(1, matches / Math.max(1, words.length * 0.1));
}

// Gender agreement utility
export function applyValencianoGender(adjective: string, gender: 'masculine' | 'feminine', number: 'singular' | 'plural' = 'singular'): string {
  // Simplified gender agreement for adjectives
  // In a real implementation, this would use more comprehensive rules
  let result = adjective;
  
  if (gender === 'feminine') {
    if (result.endsWith('o')) {
      result = result.slice(0, -1) + 'a';
    }
  }
  
  if (number === 'plural') {
    if (result.endsWith('a') || result.endsWith('o')) {
      result = result + 's';
    } else if (!result.endsWith('s')) {
      result = result + 's';
    }
  }
  
  return result;
}

// Export the main translation object and utilities
export default {
  translations: valencianoTranslations,
  numberFormat: valencianoNumberFormat,
  cultural: valencianoCulturalSettings,
  typography: valencianoTypography,
  utils: {
    pluralize: valencianoPluralize,
    formatDate: formatValencianoDate,
    formatTime: formatValencianoTime,
    formatNumber: formatValencianoNumber,
    formatCurrency: formatValencianoCurrency,
    formatPercentage: formatValencianoPercentage,
    formatRelativeTime: formatValencianoRelativeTime,
    truncateText: truncateValencianoText,
    capitalize: capitalizeValenciano,
    titleCase: titleCaseValenciano,
    isValidText: isValidValencianoText,
    detectContent: detectValencianoContent,
    applyGender: applyValencianoGender,
  },
};