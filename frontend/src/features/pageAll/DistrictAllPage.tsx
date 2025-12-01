import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";

export default function CommuneAllPage() {
  const { t } = useTranslation();
  return (
    <PageAll
      title={t("dashboardSidebar.places.district._")}
      entity="district"
      initialPerPage={15}
    />
  );
}