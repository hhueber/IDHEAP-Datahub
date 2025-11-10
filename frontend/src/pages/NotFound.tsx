import { useTranslation } from "react-i18next";


export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="text-center py-20">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-gray-600 mt-2">{t("notFound.message")}</p>
    </div>
  );
}
