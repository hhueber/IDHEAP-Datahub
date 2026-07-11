import React from "react";
import { useTranslation } from "react-i18next";
import PageAll from "@/components/PageAll";
import type { ColumnConfig, ActionsConfig } from "@/features/pageAll/all_types";
<<<<<<< HEAD

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
=======
import { useAuth } from "@/contexts/AuthContext";

const PAGE_ACTIONS = {
  show: true,
  edit: true,
  delete: true,
} as const;

export default function AnswerAllPage() {
  const { t } = useTranslation();
  const { can } = useAuth();

  const canReadDataset = can("DATASET", "READ");
  const canWriteDataset = can("DATASET", "WRITE");
  const canManageDataset = can("DATASET", "MANAGE");

  const allowShow = PAGE_ACTIONS.show && canReadDataset;
  const allowEdit = PAGE_ACTIONS.edit && canWriteDataset;
  const allowDelete = PAGE_ACTIONS.delete && canManageDataset;

  const columns = React.useMemo<ColumnConfig[]>(
    () => [
      {
        key: "year",
        labelKey: "dashboardSidebar.pageAll.year",
        align: "right",
        sortKey: "year",
        kind: "year",
        editable: allowEdit,
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
        editable: allowEdit,
        editKey: "value",
      },
    ],
    [allowEdit]
  );

  const actions: ActionsConfig = {
    show: allowShow,
    edit: allowEdit,
    delete: allowDelete,
>>>>>>> origin/Fix-#320-permettre-l-ajouts-de-plusieurs-fichier-en-meme-temps-partie-2
  };

  return (
    <PageAll
      title={t("dashboardSidebar.qa.answer._")}
      entity="answer"
      initialPerPage={20}
      columns={columns}
      actions={actions}
<<<<<<< HEAD
=======
      defaultSortBy="year"
      defaultSortDir="desc" // force le tri desc
>>>>>>> origin/Fix-#320-permettre-l-ajouts-de-plusieurs-fichier-en-meme-temps-partie-2
    />
  );
}
