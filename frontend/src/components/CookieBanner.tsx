import { useTranslation } from "react-i18next";

export default function CookieBanner() {
  const { t } = useTranslation();

  const acceptCookie = () => {
    console.log("Clicked accept");
  };

  const denyCookie = () => {
    console.log("Clicked deny");
  };

  return (
    <div className=" bg-white shadow-xl rounded-md border border-gray-200 p-4 z-50 ">
      <p className="flex justify-center text-xl">{t("cookie.bannerTitle")}</p>
      <p>{t("cookie.bannerText")}</p>
      <div className="flex justify-between">
        <button className="border rounded-md" onClick={acceptCookie}>
          {t("cookie.acceptButton")}
        </button>
        <button className="border rounded-md" onClick={denyCookie}>
          {t("cookie.denyButton")}
        </button>
      </div>
    </div>
  );
}
