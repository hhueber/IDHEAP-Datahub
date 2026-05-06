import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";
import type { ColumnConfig, ActionsConfig } from "@/features/pageAll/all_types";

export default function OptionAllPage() {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
      {
        key: "code",
        labelKey: "dashboardSidebar.pageAll.value",
        sortKey: "value",
        truncate: true,
        maxWidthClassName: "max-w-[180px]",
      },
      {
        key: "name",
        labelKey: "dashboardSidebar.pageAll.label",
        sortKey: "name",
        truncate: true,
        maxWidthClassName: "max-w-[420px]",
      },
    ],
    []
  );

  const actions: ActionsConfig = {
    show: true,
    edit: true,
    delete: true,
  };

  return (
    <PageAll
      title={t("dashboardSidebar.qa.option._")}
      entity="option"
      initialPerPage={20}
      columns={columns}
      actions={actions}
      defaultSortBy="name"
    />
  );
}
