import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";
import type { ColumnConfig, ActionsConfig } from "@/features/pageAll/all_types";

export default function AnswerAllPage() {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
      {
        key: "year",
        labelKey: "dashboardSidebar.pageAll.year",
        align: "right",
        sortKey: "year",
        kind: "year",
        editable: true,
        editKey: "year",
      },
      {
        key: "question",
        labelKey: "dashboardSidebar.pageAll.question",
        sortKey: "question",
        truncate: true,
        maxWidthClassName: "max-w-[460px]",
        editable: false,
      },
      {
        key: "commune",
        labelKey: "dashboardSidebar.pageAll.commune",
        sortKey: "commune",
        truncate: true,
        maxWidthClassName: "max-w-[260px]",
        editable: false,
      },
      {
        key: "value",
        labelKey: "dashboardSidebar.pageAll.value",
        sortKey: "value",
        truncate: true,
        maxWidthClassName: "max-w-[220px]",
        kind: "text",
        editable: true,
        editKey: "value",
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
      title={t("dashboardSidebar.qa.answer._")}
      entity="answer"
      initialPerPage={20}
      columns={columns}
      actions={actions}
      defaultSortBy="year"
      defaultSortDir="desc" // force le tri desc
    />
  );
}
