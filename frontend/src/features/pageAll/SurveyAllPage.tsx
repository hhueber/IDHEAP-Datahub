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

export default function SurveyAllPage() {
  const { t } = useTranslation();
  const { can } = useAuth();

  const allowShow = PAGE_ACTIONS.show && can("DATASET", "READ");
  const allowEdit = PAGE_ACTIONS.edit && can("DATASET", "WRITE");
  const allowDelete = PAGE_ACTIONS.delete && can("DATASET", "MANAGE");

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
      {
        key: "name",
        labelKey: "dashboardSidebar.pageAll.name",
        sortKey: "name",
        truncate: true,
        maxWidthClassName: "max-w-[360px]",
        kind: "text",
        editable: allowEdit,
        editKey: "name",
      },
      {
        key: "year",
        labelKey: "dashboardSidebar.pageAll.year",
        sortKey: "year",
        align: "right",
        kind: "year",
        editable: allowEdit,
        editKey: "year",
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
