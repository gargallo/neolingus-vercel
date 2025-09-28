/**
 * Exam Engine Certification Configurations Index
 * Central hub for all certification module configurations
 */

import eoiEnglishConfig from "./eoi-english";
import jqcvValencianoConfig from "./jqcv-valenciano";
import type { ExamConfiguration } from "../types";

// Phase 1 Certifications (Active)
export const phase1Certifications = {
  eoi_en: eoiEnglishConfig,
  jqcv_va: jqcvValencianoConfig,
};

// Future Phase 2 Certifications (Planned)
export const phase2Certifications = {
  // DELF French - Future implementation
  // Goethe German - Future implementation
  // CILS Italian - Future implementation
};

// Future Phase 3 Certifications (Planned)
export const phase3Certifications = {
  // Professional certifications - Future implementation
  // Academic certifications - Future implementation
};

// All certification configurations
export const certificationConfigs = {
  ...phase1Certifications,
  ...phase2Certifications,
  ...phase3Certifications,
};

// Helper function to get configuration by certification code
export function getCertificationConfig(certificationCode: string) {
  return certificationConfigs[
    certificationCode as keyof typeof certificationConfigs
  ];
}

// Helper function to get component configuration
export function getComponentConfig(
  certificationCode: string,
  component: string,
  level: string
) {
  const config = getCertificationConfig(certificationCode);
  if (!config) return null;

  // Fix the type issue by using a more specific type
  const components = config.components as Record<string, Record<string, unknown>>;
  return components?.[component]?.[level] || null;
}

// Active certifications list
export const activeCertifications = Object.keys(phase1Certifications);

// All available certifications
export const allCertifications = Object.keys(certificationConfigs);

export { eoiEnglishConfig, jqcvValencianoConfig };

export default certificationConfigs;