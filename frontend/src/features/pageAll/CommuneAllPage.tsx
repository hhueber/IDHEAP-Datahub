import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";
import type { ColumnConfig, ActionsConfig } from "@/features/pageAll/all_types";

export default function CommuneAllPage() {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
      { key: "uid", label: t("dashboardSidebar.pageAll.uid") },
      { key: "code", label: t("dashboardSidebar.pageAll.code") },
      { key: "name", label: t("dashboardSidebar.pageAll.name") },
      { key: "entity", label: t("dashboardSidebar.pageAll.entity") },
    ],
    [t]
  );

  const actions: ActionsConfig = {
    show: true,
    edit: false,
    delete: false, // On ne supprime pas les communes
  };

  return (
    <PageAll
      title={t("dashboardSidebar.places.commune._")}
      entity="commune"
      initialPerPage={20}
      columns={columns}
      actions={actions}
    />
  );
}