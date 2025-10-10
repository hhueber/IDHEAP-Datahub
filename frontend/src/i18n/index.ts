import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/eng/translation.json";
import fr from "./locales/fra/translation.json";
import de from "./locales/deu/translation.json";
import it from "./locales/ita/translation.json";
import rm from "./locales/rom/translation.json";

i18n
  .use(LanguageDetector)       // <— ajoute le détecteur
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, fr: { translation: fr }, de: { translation: de }, it: { translation: it }, rm: { translation: rm } },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      // d’abord localStorage, puis navigateur
      order: ["localStorage", "navigator"],
      caches: ["localStorage"], // stocke dans localStorage (clé par défaut: i18nextLng)
    },
  });

export default i18n;
