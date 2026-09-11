import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";
import type { ColumnConfig, ActionsConfig } from "@/features/pageAll/all_types";

export default function QuestionPerSurveyAllPage() {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
      {
        key: "code",
        labelKey: "dashboardSidebar.pageAll.code",
        sortKey: "code",
        truncate: true,
        maxWidthClassName: "max-w-[180px]",
        kind: "text",
        editable: true,
        editKey: "code",
      },
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
      title={t("dashboardSidebar.qa.qps._")}
      entity="question_per_survey"
      initialPerPage={20}
      columns={columns}
      actions={actions}
      defaultSortBy="code"
    />
  );
}
