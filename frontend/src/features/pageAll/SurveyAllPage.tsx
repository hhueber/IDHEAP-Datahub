import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";
import type { ColumnConfig, ActionsConfig } from "@/features/pageAll/all_types";

export default function SurveyAllPage() {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
      {
        key: "name",
        labelKey: "dashboardSidebar.pageAll.name",
        sortKey: "name",
        truncate: true,
        maxWidthClassName: "max-w-[360px]",
      },
      {
        key: "year",
        labelKey: "dashboardSidebar.pageAll.year",
        sortKey: "year",
        align: "right",
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
      title={t("dashboardSidebar.survey._", "Surveys")}
      entity="survey"
      initialPerPage={10}
      columns={columns}
      actions={actions}
      defaultSortBy="year"
      defaultSortDir="desc"
    />
  );
}
