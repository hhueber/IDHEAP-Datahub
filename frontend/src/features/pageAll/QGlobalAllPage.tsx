import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";
import type { ColumnConfig, ActionsConfig } from "@/features/pageAll/all_types";

export default function QuestionGlobalAllPage() {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
      {
        key: "name",
        labelKey: "dashboardSidebar.pageAll.question",
        sortKey: "name",
        truncate: true,
        maxWidthClassName: "max-w-[460px]",
        kind: "text",
        editable: true,
        editKey: (lang) => `text_${lang}`,
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
      title={t("dashboardSidebar.qa.qglobal._")}
      entity="question_global"
      initialPerPage={15}
      columns={columns}
      actions={actions}
      defaultSortBy="name"
    />
  );
}
