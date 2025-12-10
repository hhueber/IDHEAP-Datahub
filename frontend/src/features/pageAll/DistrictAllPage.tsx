import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";
import type { ColumnConfig, ActionsConfig } from "@/features/pageAll/all_types";

export default function DistrictAllPage() {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
      { key: "uid", label: t("dashboardSidebar.pageAll.uid") },
      { key: "code", label: t("dashboardSidebar.pageAll.code") },
      { key: "name", label: t("dashboardSidebar.pageAll.name") },
    ],
    [t]
  );

  const actions: ActionsConfig = {
    show: true,
    edit: false,
    delete: false,
  };

  return (
    <PageAll
      title={t("dashboardSidebar.places.district._")}
      entity="district"
      initialPerPage={15}
      columns={columns}
      actions={actions}
    />
  );
}
