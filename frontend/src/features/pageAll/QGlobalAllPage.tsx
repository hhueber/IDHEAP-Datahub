import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";
import type { ColumnConfig, ActionsConfig } from "@/features/pageAll/all_types";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_ACTIONS = {
  show: true,
  edit: true,
  delete: true,
} as const;

export default function QuestionGlobalAllPage() {
  const { t } = useTranslation();
  const { can } = useAuth();

  const allowShow = PAGE_ACTIONS.show && can("DATASET", "READ");
  const allowEdit = PAGE_ACTIONS.edit && can("DATASET", "WRITE");
  const allowDelete = PAGE_ACTIONS.delete && can("DATASET", "MANAGE");

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
      {
        key: "name",
        labelKey: "dashboardSidebar.pageAll.question",
        sortKey: "name",
        truncate: true,
        maxWidthClassName: "max-w-[460px]",
        kind: "text",
        editable: allowEdit,
        editKey: (lang) => `text_${lang}`,
      },
    ],
    [allowEdit]
  );

  const actions: ActionsConfig = {
    show: allowShow,
    edit: allowEdit,
    delete: allowDelete,
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
