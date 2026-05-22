import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";
import type { ColumnConfig, ActionsConfig } from "@/features/pageAll/all_types";

export default function CantonAllPage() {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
      {
        key: "code",
        labelKey: "dashboardSidebar.pageAll.code",
        sortKey: "code",
        editable: false,
      },
      {
        key: "name",
        labelKey: "dashboardSidebar.pageAll.name",
        sortKey: "name",
        truncate: true,
        maxWidthClassName: "max-w-[320px]",
        editable: false,
      },
    ],
    []
  );

  const actions: ActionsConfig = {
    show: true,
    edit: false,
    delete: false,
  };

  return (
    <PageAll
      title={t("dashboardSidebar.places.canton._")}
      entity="canton"
      initialPerPage={10}
      columns={columns}
      actions={actions}
      defaultSortBy="name"
    />
  );
}
