"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

// GDPR Consent Types
export type ConsentType = 
  | "essential" 
  | "functional" 
  | "analytics" 
  | "marketing" 
  | "third_party";

export type ConsentStatus = "granted" | "denied" | "pending" | "withdrawn";

export interface ConsentItem {
  type: ConsentType;
  status: ConsentStatus;
  timestamp: Date;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentItems: ConsentItem[];
  locale: string;
  lastUpdated: Date;
  expiresAt: Date;
  legalBasis: string;
  processingPurpose: string[];
  dataRetentionPeriod: number; // days
  version: string;
}

export interface ConsentManagerProps {
  userId?: string;
  locale?: string;
  onConsentChange?: (consents: ConsentRecord) => void;
  onConsentGranted?: (type: ConsentType) => void;
  onConsentWithdrawn?: (type: ConsentType) => void;
  showOnFirstVisit?: boolean;
  autoShow?: boolean;
  position?: "bottom" | "top" | "center" | "modal";
  theme?: "light" | "dark" | "auto";
  className?: string;
}

// Consent categories configuration
const CONSENT_CATEGORIES = {
  essential: {
    name: "Essential",
    nameTranslations: {
      en: "Essential",
      es: "Esenciales",
      ca: "Essencials",
    },
    description: "Necessary for the website to function properly",
    descriptionTranslations: {
      en: "Necessary for the website to function properly",
      es: "Necesarias para que el sitio web funcione correctamente",
      ca: "Necessàries perquè el lloc web funcione correctament",
    },
    required: true,
    canToggle: false,
    defaultValue: true,
    purposes: [
      "Authentication and session management",
      "Security and fraud prevention",
      "Load balancing and performance",
      "Legal compliance",
    ],
    legalBasis: "legitimate_interest",
    retentionDays: 365,
    cookies: ["session_id", "csrf_token", "auth_token", "security_flags"],
  },
  functional: {
    name: "Functional",
    nameTranslations: {
      en: "Functional",
      es: "Funcionales",
      ca: "Funcionals",
    },
    description: "Enable enhanced functionality and personalization",
    descriptionTranslations: {
      en: "Enable enhanced functionality and personalization",
      es: "Permiten funcionalidad mejorada y personalización",
      ca: "Permeten funcionalitat millorada i personalització",
    },
    required: false,
    canToggle: true,
    defaultValue: false,
    purposes: [
      "User preferences and settings",
      "Language and locale settings",
      "Accessibility features",
      "User interface customization",
    ],
    legalBasis: "consent",
    retentionDays: 730,
    cookies: ["user_prefs", "language", "theme", "accessibility_settings"],
  },
  analytics: {
    name: "Analytics",
    nameTranslations: {
      en: "Analytics",
      es: "Analíticas",
      ca: "Analítiques",
    },
    description: "Help us understand how visitors interact with the website",
    descriptionTranslations: {
      en: "Help us understand how visitors interact with the website",
      es: "Nos ayudan a entender cómo interactúan los visitantes con el sitio web",
      ca: "Ens ajuden a comprendre com interactuen els visitants amb el lloc web",
    },
    required: false,
    canToggle: true,
    defaultValue: false,
    purposes: [
      "Website performance analysis",
      "User behavior tracking",
      "Error monitoring and debugging",
      "Feature usage statistics",
    ],
    legalBasis: "consent",
    retentionDays: 1095, // 3 years
    cookies: ["_ga", "_gid", "analytics_session", "performance_metrics"],
  },
  marketing: {
    name: "Marketing",
    nameTranslations: {
      en: "Marketing",
      es: "Marketing",
      ca: "Màrqueting",
    },
    description: "Deliver relevant advertisements and marketing content",
    descriptionTranslations: {
      en: "Deliver relevant advertisements and marketing content",
      es: "Entregar anuncios y contenido de marketing relevantes",
      ca: "Lliurar anuncis i contingut de màrqueting rellevants",
    },
    required: false,
    canToggle: true,
    defaultValue: false,
    purposes: [
      "Personalized advertising",
      "Marketing campaign tracking",
      "Cross-platform targeting",
      "Conversion measurement",
    ],
    legalBasis: "consent",
    retentionDays: 365,
    cookies: ["marketing_id", "campaign_data", "conversion_tracking", "ad_personalization"],
  },
  third_party: {
    name: "Third Party",
    nameTranslations: {
      en: "Third Party",
      es: "Terceros",
      ca: "Tercers",
    },
    description: "Integration with third-party services and social media",
    descriptionTranslations: {
      en: "Integration with third-party services and social media",
      es: "Integración con servicios de terceros y redes sociales",
      ca: "Integració amb serveis de tercers i xarxes socials",
    },
    required: false,
    canToggle: true,
    defaultValue: false,
    purposes: [
      "Social media integration",
      "Third-party authentication",
      "External service integration",
      "Content sharing and embedding",
    ],
    legalBasis: "consent",
    retentionDays: 365,
    cookies: ["social_login", "embed_consent", "third_party_widgets", "share_buttons"],
  },
} as const;

// Default consent expiration (13 months as per GDPR recommendations)
const DEFAULT_CONSENT_EXPIRY_DAYS = 395;

export default function ConsentManager({
  userId,
  locale = "en",
  onConsentChange,
  onConsentGranted,
  onConsentWithdrawn,
  showOnFirstVisit = true,
  autoShow = true,
  position = "bottom",
  theme = "auto",
  className = "",
}: ConsentManagerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentConsents, setCurrentConsents] = useState<Record<ConsentType, boolean>>({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    third_party: false,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [hasExistingConsent, setHasExistingConsent] = useState(false);
  const [consentRecord, setConsentRecord] = useState<ConsentRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Determine current theme
  const resolvedTheme = useMemo(() => {
    if (theme !== "auto") return theme;
    
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }, [theme]);

  // Get localized text
  const getText = useCallback((key: string, fallback: string) => {
    // In a real app, this would use a proper i18n system
    const category = CONSENT_CATEGORIES[key as ConsentType];
    if (category?.nameTranslations[locale as keyof typeof category.nameTranslations]) {
      return category.nameTranslations[locale as keyof typeof category.nameTranslations];
    }
    return fallback;
  }, [locale]);

  const getDescription = useCallback((key: string, fallback: string) => {
    const category = CONSENT_CATEGORIES[key as ConsentType];
    if (category?.descriptionTranslations[locale as keyof typeof category.descriptionTranslations]) {
      return category.descriptionTranslations[locale as keyof typeof category.descriptionTranslations];
    }
    return fallback;
  }, [locale]);

  // Load existing consent data
  useEffect(() => {
    const loadConsentData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check for existing consent in localStorage first (for anonymous users)
        const localConsent = localStorage.getItem("gdpr_consent");
        if (localConsent) {
          try {
            const parsed = JSON.parse(localConsent);
            const expiresAt = new Date(parsed.expiresAt);
            
            if (expiresAt > new Date()) {
              // Valid existing consent
              setCurrentConsents(parsed.consents);
              setHasExistingConsent(true);
              setConsentRecord(parsed);
              
              // Don't show banner if consent is still valid
              if (!showOnFirstVisit || !autoShow) {
                setIsVisible(false);
              }
              
              setIsLoading(false);
              return;
            }
          } catch (e) {
            // Invalid localStorage data, continue with normal flow
            localStorage.removeItem("gdpr_consent");
          }
        }

        // If user is logged in, try to fetch from database
        if (userId) {
          const { data, error: dbError } = await supabase
            .from("user_consent")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (data && !dbError) {
            const expiresAt = new Date(data.expires_at);
            
            if (expiresAt > new Date()) {
              // Valid database consent
              const consents = data.consent_data as Record<ConsentType, boolean>;
              setCurrentConsents(consents);
              setHasExistingConsent(true);
              setConsentRecord({
                id: data.id,
                userId: data.user_id,
                consentItems: Object.entries(consents).map(([type, granted]) => ({
                  type: type as ConsentType,
                  status: granted ? "granted" : "denied" as ConsentStatus,
                  timestamp: new Date(data.created_at),
                  version: data.version || "1.0",
                  ipAddress: data.ip_address,
                  userAgent: data.user_agent,
                })),
                locale: data.locale || locale,
                lastUpdated: new Date(data.updated_at || data.created_at),
                expiresAt,
                legalBasis: data.legal_basis || "consent",
                processingPurpose: data.processing_purpose || [],
                dataRetentionPeriod: data.retention_days || DEFAULT_CONSENT_EXPIRY_DAYS,
                version: data.version || "1.0",
              });

              // Store in localStorage as backup
              localStorage.setItem("gdpr_consent", JSON.stringify({
                consents,
                expiresAt: data.expires_at,
                timestamp: data.created_at,
              }));

              setIsLoading(false);
              return;
            }
          }
        }

        // No valid consent found - show banner if configured
        if (showOnFirstVisit && autoShow) {
          setIsVisible(true);
        }

      } catch (err) {
        console.error("Error loading consent data:", err);
        setError("Failed to load consent preferences");
        
        // Show banner on error if configured
        if (showOnFirstVisit && autoShow) {
          setIsVisible(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadConsentData();
  }, [userId, locale, showOnFirstVisit, autoShow, supabase]);

  // Apply consent changes to third-party services
  const applyConsentChanges = useCallback((consents: Record<ConsentType, boolean>) => {
    // Google Analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: consents.analytics ? "granted" : "denied",
        ad_storage: consents.marketing ? "granted" : "denied",
        functionality_storage: consents.functional ? "granted" : "denied",
        personalization_storage: consents.marketing ? "granted" : "denied",
        security_storage: "granted", // Always granted for essential functionality
      });
    }

    // Facebook Pixel
    if (typeof window !== "undefined" && window.fbq) {
      if (!consents.marketing) {
        window.fbq("consent", "revoke");
      } else {
        window.fbq("consent", "grant");
      }
    }

    // Other third-party consent updates can be added here
    
    // Trigger callbacks
    Object.entries(consents).forEach(([type, granted]) => {
      const previousValue = currentConsents[type as ConsentType];
      if (previousValue !== granted) {
        if (granted) {
          onConsentGranted?.(type as ConsentType);
        } else {
          onConsentWithdrawn?.(type as ConsentType);
        }
      }
    });
  }, [currentConsents, onConsentGranted, onConsentWithdrawn]);

  // Save consent data
  const saveConsentData = useCallback(async (consents: Record<ConsentType, boolean>) => {
    setIsSaving(true);
    setError(null);

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (DEFAULT_CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
      const ipAddress = await getClientIP();
      const userAgent = navigator.userAgent;

      const consentData = {
        consents,
        expiresAt: expiresAt.toISOString(),
        timestamp: now.toISOString(),
        locale,
        ipAddress,
        userAgent,
        version: "1.0",
      };

      // Save to localStorage
      localStorage.setItem("gdpr_consent", JSON.stringify(consentData));

      // Save to database if user is logged in
      if (userId) {
        const { error: dbError } = await supabase
          .from("user_consent")
          .upsert({
            user_id: userId,
            consent_data: consents,
            locale,
            ip_address: ipAddress,
            user_agent: userAgent,
            expires_at: expiresAt.toISOString(),
            legal_basis: "consent",
            processing_purpose: Object.entries(consents)
              .filter(([, granted]) => granted)
              .map(([type]) => CONSENT_CATEGORIES[type as ConsentType].purposes)
              .flat(),
            retention_days: DEFAULT_CONSENT_EXPIRY_DAYS,
            version: "1.0",
          });

        if (dbError) {
          console.error("Error saving consent to database:", dbError);
          // Don't fail the entire operation if database save fails
        }
      }

      // Create consent record
      const record: ConsentRecord = {
        id: `consent_${Date.now()}`,
        userId: userId || "anonymous",
        consentItems: Object.entries(consents).map(([type, granted]) => ({
          type: type as ConsentType,
          status: granted ? "granted" : "denied" as ConsentStatus,
          timestamp: now,
          version: "1.0",
          ipAddress,
          userAgent,
        })),
        locale,
        lastUpdated: now,
        expiresAt,
        legalBasis: "consent",
        processingPurpose: Object.entries(consents)
          .filter(([, granted]) => granted)
          .map(([type]) => CONSENT_CATEGORIES[type as ConsentType].purposes)
          .flat(),
        dataRetentionPeriod: DEFAULT_CONSENT_EXPIRY_DAYS,
        version: "1.0",
      };

      setConsentRecord(record);
      setCurrentConsents(consents);
      setHasExistingConsent(true);

      // Apply consent changes to third-party services
      applyConsentChanges(consents);

      // Trigger callback
      onConsentChange?.(record);

    } catch (err) {
      console.error("Error saving consent data:", err);
      setError("Failed to save consent preferences");
    } finally {
      setIsSaving(false);
    }
  }, [userId, locale, supabase, applyConsentChanges, onConsentChange]);

  // Handle accepting all cookies
  const handleAcceptAll = useCallback(async () => {
    const allConsents = Object.keys(CONSENT_CATEGORIES).reduce((acc, key) => ({
      ...acc,
      [key]: true,
    }), {} as Record<ConsentType, boolean>);

    await saveConsentData(allConsents);
    setIsVisible(false);
  }, [saveConsentData]);

  // Handle rejecting optional cookies
  const handleRejectOptional = useCallback(async () => {
    const essentialOnly = Object.keys(CONSENT_CATEGORIES).reduce((acc, key) => ({
      ...acc,
      [key]: CONSENT_CATEGORIES[key as ConsentType].required,
    }), {} as Record<ConsentType, boolean>);

    await saveConsentData(essentialOnly);
    setIsVisible(false);
  }, [saveConsentData]);

  // Handle saving custom preferences
  const handleSavePreferences = useCallback(async () => {
    await saveConsentData(currentConsents);
    setIsVisible(false);
    setShowDetails(false);
  }, [currentConsents, saveConsentData]);

  // Handle consent toggle
  const handleConsentToggle = useCallback((type: ConsentType, granted: boolean) => {
    if (CONSENT_CATEGORIES[type].required && !granted) {
      // Can't disable required cookies
      return;
    }

    setCurrentConsents(prev => ({
      ...prev,
      [type]: granted,
    }));
  }, []);

  // Get client IP address (simplified - in production, this should be done server-side)
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip || "unknown";
    } catch {
      return "unknown";
    }
  };

  // Show consent manager
  const showConsentManager = useCallback(() => {
    setIsVisible(true);
    setShowDetails(false);
  }, []);

  // Hide consent manager
  const hideConsentManager = useCallback(() => {
    setIsVisible(false);
    setShowDetails(false);
  }, []);

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  const themeClasses = resolvedTheme === "dark" 
    ? "bg-gray-900 text-white border-gray-700" 
    : "bg-white text-gray-900 border-gray-200";

  const buttonThemeClasses = resolvedTheme === "dark"
    ? "bg-blue-600 hover:bg-blue-700 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  const secondaryButtonThemeClasses = resolvedTheme === "dark"
    ? "bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
    : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300";

  return (
    <div className={`gdpr-consent-manager ${className}`}>
      {/* Backdrop for modal position */}
      {position === "modal" && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={hideConsentManager}
        />
      )}

      {/* Consent Banner/Modal */}
      <div
        className={`
          fixed z-50 max-w-4xl mx-auto
          ${position === "bottom" ? "bottom-0 left-0 right-0 p-4" : ""}
          ${position === "top" ? "top-0 left-0 right-0 p-4" : ""}
          ${position === "center" ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" : ""}
          ${position === "modal" ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg" : ""}
        `}
        onClick={(e) => {
          if (position === "modal") {
            e.stopPropagation();
          }
        }}
        role="dialog"
        aria-labelledby="consent-title"
        aria-describedby="consent-description"
        aria-modal={position === "modal"}
      >
        <div
          className={`
            border rounded-lg shadow-lg p-6
            ${themeClasses}
            ${position === "modal" ? "max-h-[80vh] overflow-y-auto" : ""}
          `}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 id="consent-title" className="text-lg font-semibold mb-2">
                {locale === "ca" ? "Configuració de galetes" :
                 locale === "es" ? "Configuración de cookies" :
                 "Cookie Settings"}
              </h2>
              <p id="consent-description" className="text-sm opacity-80">
                {locale === "ca" ? 
                  "Utilitzem galetes per millorar la teua experiència. Pots gestionar les teues preferències ací." :
                 locale === "es" ?
                  "Utilizamos cookies para mejorar tu experiencia. Puedes gestionar tus preferencias aquí." :
                  "We use cookies to enhance your experience. You can manage your preferences here."
                }
              </p>
            </div>
            
            {position === "modal" && (
              <button
                onClick={hideConsentManager}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Quick Actions */}
          {!showDetails && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAcceptAll}
                  disabled={isSaving}
                  className={`
                    px-4 py-2 rounded-md font-medium transition-colors
                    ${buttonThemeClasses}
                    ${isSaving ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"/>
                      </svg>
                      {locale === "ca" ? "Guardant..." :
                       locale === "es" ? "Guardando..." :
                       "Saving..."}
                    </span>
                  ) : (
                    <>
                      {locale === "ca" ? "Acceptar tot" :
                       locale === "es" ? "Aceptar todo" :
                       "Accept All"}
                    </>
                  )}
                </button>

                <button
                  onClick={handleRejectOptional}
                  disabled={isSaving}
                  className={`
                    px-4 py-2 rounded-md font-medium border transition-colors
                    ${secondaryButtonThemeClasses}
                    ${isSaving ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {locale === "ca" ? "Sols essencials" :
                   locale === "es" ? "Solo esenciales" :
                   "Essential Only"}
                </button>

                <button
                  onClick={() => setShowDetails(true)}
                  disabled={isSaving}
                  className={`
                    px-4 py-2 rounded-md font-medium border transition-colors
                    ${secondaryButtonThemeClasses}
                    ${isSaving ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {locale === "ca" ? "Personalitzar" :
                   locale === "es" ? "Personalizar" :
                   "Customize"}
                </button>
              </div>
            </div>
          )}

          {/* Detailed Settings */}
          {showDetails && (
            <div className="space-y-4">
              {Object.entries(CONSENT_CATEGORIES).map(([type, config]) => (
                <div
                  key={type}
                  className={`
                    p-4 border rounded-md
                    ${resolvedTheme === "dark" ? "border-gray-600" : "border-gray-200"}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-medium">
                          {getText(type, config.name)}
                        </h3>
                        {config.required && (
                          <span className="ml-2 px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                            {locale === "ca" ? "Obligatori" :
                             locale === "es" ? "Obligatorio" :
                             "Required"}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm opacity-80 mb-3">
                        {getDescription(type, config.description)}
                      </p>

                      <details className="text-xs opacity-70">
                        <summary className="cursor-pointer hover:opacity-100">
                          {locale === "ca" ? "Veure detalls" :
                           locale === "es" ? "Ver detalles" :
                           "View Details"}
                        </summary>
                        <div className="mt-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                          <p><strong>
                            {locale === "ca" ? "Propòsit:" :
                             locale === "es" ? "Propósito:" :
                             "Purpose:"}
                          </strong></p>
                          <ul className="list-disc list-inside mb-2">
                            {config.purposes.map((purpose, index) => (
                              <li key={index}>{purpose}</li>
                            ))}
                          </ul>
                          <p><strong>
                            {locale === "ca" ? "Base legal:" :
                             locale === "es" ? "Base legal:" :
                             "Legal basis:"}
                          </strong> {config.legalBasis}</p>
                          <p><strong>
                            {locale === "ca" ? "Retenció:" :
                             locale === "es" ? "Retención:" :
                             "Retention:"}
                          </strong> {config.retentionDays} 
                          {locale === "ca" ? " dies" :
                           locale === "es" ? " días" :
                           " days"}
                          </p>
                          <p><strong>
                            {locale === "ca" ? "Galetes:" :
                             locale === "es" ? "Cookies:" :
                             "Cookies:"}
                          </strong> {config.cookies.join(", ")}</p>
                        </div>
                      </details>
                    </div>

                    <div className="ml-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentConsents[type as ConsentType]}
                          onChange={(e) => handleConsentToggle(type as ConsentType, e.target.checked)}
                          disabled={config.required}
                          className="sr-only"
                        />
                        <div
                          className={`
                            relative w-12 h-6 rounded-full transition-colors
                            ${currentConsents[type as ConsentType] 
                              ? "bg-blue-600" 
                              : "bg-gray-300 dark:bg-gray-600"
                            }
                            ${config.required ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                          `}
                        >
                          <div
                            className={`
                              absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                              ${currentConsents[type as ConsentType] ? "translate-x-6" : "translate-x-0"}
                            `}
                          />
                        </div>
                        <span className="sr-only">
                          Toggle {config.name} cookies
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className={`
                    flex-1 px-4 py-2 rounded-md font-medium transition-colors
                    ${buttonThemeClasses}
                    ${isSaving ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"/>
                      </svg>
                      {locale === "ca" ? "Guardant..." :
                       locale === "es" ? "Guardando..." :
                       "Saving..."}
                    </span>
                  ) : (
                    <>
                      {locale === "ca" ? "Guardar preferències" :
                       locale === "es" ? "Guardar preferencias" :
                       "Save Preferences"}
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowDetails(false)}
                  disabled={isSaving}
                  className={`
                    px-4 py-2 rounded-md font-medium border transition-colors
                    ${secondaryButtonThemeClasses}
                    ${isSaving ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {locale === "ca" ? "Tornar" :
                   locale === "es" ? "Volver" :
                   "Back"}
                </button>
              </div>
            </div>
          )}

          {/* Links */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-wrap gap-4 text-xs">
              <a
                href="/privacy-policy"
                className="text-blue-600 dark:text-blue-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {locale === "ca" ? "Política de privacitat" :
                 locale === "es" ? "Política de privacidad" :
                 "Privacy Policy"}
              </a>
              <a
                href="/cookie-policy"
                className="text-blue-600 dark:text-blue-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {locale === "ca" ? "Política de galetes" :
                 locale === "es" ? "Política de cookies" :
                 "Cookie Policy"}
              </a>
              <a
                href="/terms-of-service"
                className="text-blue-600 dark:text-blue-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {locale === "ca" ? "Termes del servei" :
                 locale === "es" ? "Términos del servicio" :
                 "Terms of Service"}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Settings Button (when banner is hidden) */}
      {hasExistingConsent && !isVisible && (
        <button
          onClick={showConsentManager}
          className={`
            fixed bottom-4 right-4 z-40 p-3 rounded-full shadow-lg transition-transform hover:scale-105
            ${buttonThemeClasses}
          `}
          aria-label={
            locale === "ca" ? "Obrir configuració de galetes" :
            locale === "es" ? "Abrir configuración de cookies" :
            "Open cookie settings"
          }
          title={
            locale === "ca" ? "Configuració de galetes" :
            locale === "es" ? "Configuración de cookies" :
            "Cookie Settings"
          }
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </button>
      )}

      <style jsx>{`
        .gdpr-consent-manager {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        /* Custom scrollbar for modal */
        .gdpr-consent-manager .max-h-[80vh]::-webkit-scrollbar {
          width: 6px;
        }
        
        .gdpr-consent-manager .max-h-[80vh]::-webkit-scrollbar-track {
          background: ${resolvedTheme === "dark" ? "#374151" : "#f1f5f9"};
          border-radius: 3px;
        }
        
        .gdpr-consent-manager .max-h-[80vh]::-webkit-scrollbar-thumb {
          background: ${resolvedTheme === "dark" ? "#6b7280" : "#cbd5e1"};
          border-radius: 3px;
        }
        
        .gdpr-consent-manager .max-h-[80vh]::-webkit-scrollbar-thumb:hover {
          background: ${resolvedTheme === "dark" ? "#9ca3af" : "#94a3b8"};
        }

        /* Animation for the toggle switches */
        .gdpr-consent-manager input[type="checkbox"] + div > div {
          transition: transform 0.2s ease-in-out;
        }

        /* Focus styles for accessibility */
        .gdpr-consent-manager button:focus-visible,
        .gdpr-consent-manager a:focus-visible,
        .gdpr-consent-manager label:focus-visible {
          outline: 2px solid ${resolvedTheme === "dark" ? "#60a5fa" : "#3b82f6"};
          outline-offset: 2px;
        }

        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .gdpr-consent-manager * {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Export utility functions for managing consent outside the component
export const consentUtils = {
  // Check if a specific consent type is granted
  hasConsent: (type: ConsentType): boolean => {
    try {
      const consent = localStorage.getItem("gdpr_consent");
      if (!consent) return false;

      const parsed = JSON.parse(consent);
      const expiresAt = new Date(parsed.expiresAt);
      
      if (expiresAt <= new Date()) return false;

      return parsed.consents[type] === true;
    } catch {
      return false;
    }
  },

  // Get all current consent settings
  getAllConsents: (): Record<ConsentType, boolean> | null => {
    try {
      const consent = localStorage.getItem("gdpr_consent");
      if (!consent) return null;

      const parsed = JSON.parse(consent);
      const expiresAt = new Date(parsed.expiresAt);
      
      if (expiresAt <= new Date()) return null;

      return parsed.consents;
    } catch {
      return null;
    }
  },

  // Check if consent data exists and is valid
  hasValidConsent: (): boolean => {
    try {
      const consent = localStorage.getItem("gdpr_consent");
      if (!consent) return false;

      const parsed = JSON.parse(consent);
      const expiresAt = new Date(parsed.expiresAt);
      
      return expiresAt > new Date();
    } catch {
      return false;
    }
  },

  // Clear all consent data
  clearConsent: (): void => {
    localStorage.removeItem("gdpr_consent");
  },
};

// Type definitions for window extensions
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}