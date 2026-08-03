import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";
import type { ColumnConfig, ActionsConfig } from "@/features/pageAll/all_types";

export default function DistrictAllPage() {
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
        maxWidthClassName: "max-w-[320px]",
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
      title={t("dashboardSidebar.places.district._")}
      entity="district"
      initialPerPage={15}
      columns={columns}
      actions={actions}
      defaultSortBy="name"
    />
  );
}
