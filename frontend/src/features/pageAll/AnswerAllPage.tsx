import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";
import type { ColumnConfig, ActionsConfig } from "@/features/pageAll/all_types";

export default function AnswerAllPage() {
  const { t } = useTranslation();

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
      { key: "uid", label: t("dashboardSidebar.pageAll.uid") },
      { key: "year", label: t("dashboardSidebar.pageAll.year") },
      { key: "question_uid", label: t("dashboardSidebar.pageAll.questionUid") },
      { key: "commune_uid", label: t("dashboardSidebar.pageAll.communeUid") },
      { key: "value", label: t("dashboardSidebar.pageAll.value") },
      { key: "entity", label: t("dashboardSidebar.pageAll.entity") },
    ],
    [t]
  );

  const actions: ActionsConfig = {
    show: true,
    edit: true,
    delete: true,
  };

  return (
    <PageAll
      title={t("dashboardSidebar.answer._")}
      entity="answer"
      initialPerPage={20}
      columns={columns}
      actions={actions}
    />
  );
}
