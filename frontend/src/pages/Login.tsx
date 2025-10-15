import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-lg rounded-2xl bg-white/90 backdrop-blur shadow-xl ring-1 ring-black/5 p-8">
      <h2 className="text-2xl font-bold text-gray-900">{t("login.title")}</h2>
      <p className="text-gray-600 mt-2">{t("login.subtitle")}</p>
      {/* TODO: Ici mettre le formulaire plus tard */}
    </section>
  );
}
