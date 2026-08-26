import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";
import type { ColumnConfig, ActionsConfig } from "@/features/pageAll/all_types";

export default function QuestionCategoryAllPage() {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
      {
        key: "name",
        labelKey: "dashboardSidebar.pageAll.label",
        sortKey: "name",
        truncate: true,
        maxWidthClassName: "max-w-[520px]",
        kind: "text",
        editable: true,
        editKey: "label",
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
      title={t("dashboardSidebar.qa.qcat._")}
      entity="question_category"
      initialPerPage={15}
      columns={columns}
      actions={actions}
      defaultSortBy="name"
    />
  );
}
