import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";
import type { ColumnConfig, ActionsConfig } from "@/features/pageAll/all_types";

export default function CommuneAllPage() {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
      {
        key: "code",
        labelKey: "dashboardSidebar.pageAll.code",
        sortKey: "code",
      },
      {
        key: "name",
        labelKey: "dashboardSidebar.pageAll.name",
        sortKey: "name",
        truncate: true,
        maxWidthClassName: "max-w-[360px]",
      },
    ],
    []
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
      defaultSortBy="name"
    />
  );
}
