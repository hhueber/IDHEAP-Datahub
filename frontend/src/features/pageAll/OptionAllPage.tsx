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

export default function OptionAllPage() {
  const { t } = useTranslation();
  const { can } = useAuth();

  const allowShow = PAGE_ACTIONS.show && can("DATASET", "READ");
  const allowEdit = PAGE_ACTIONS.edit && can("DATASET", "WRITE");
  const allowDelete = PAGE_ACTIONS.delete && can("DATASET", "MANAGE");

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
<<<<<<< HEAD
      { key: "uid", label: t("dashboardSidebar.pageAll.uid") },
      { key: "code", label: t("dashboardSidebar.pageAll.value") },
      { key: "name", label: t("dashboardSidebar.pageAll.label") },
      { key: "entity", label: t("dashboardSidebar.pageAll.entity") },
=======
      {
        key: "code",
        labelKey: "dashboardSidebar.pageAll.value",
        sortKey: "value",
        truncate: true,
        maxWidthClassName: "max-w-[180px]",
        kind: "text",
        editable: allowEdit,
        editKey: "value",
      },
      {
        key: "name",
        labelKey: "dashboardSidebar.pageAll.label",
        sortKey: "name",
        truncate: true,
        maxWidthClassName: "max-w-[420px]",
        kind: "text",
        editable: allowEdit,
        editKey: "label_",
      },
>>>>>>> origin/Fix-#320-permettre-l-ajouts-de-plusieurs-fichier-en-meme-temps-partie-2
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
      title={t("dashboardSidebar.qa.option._")}
      entity="option"
      initialPerPage={20}
      columns={columns}
      actions={actions}
      defaultSortBy="name"
    />
  );
}
