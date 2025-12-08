import React from "react";
import { apiFetch } from "@/shared/apiFetch";
import type {
  AllItem,
  Entity,
  DeleteResponse,
} from "@/features/pageAll/all_types";
import { useTranslation } from "react-i18next";

type UsePageAllDeleteReturn = {
  deleteTarget: AllItem | null;
  deleteLoading: boolean;
  deleteError: string | null;
  openDeleteConfirm: (row: AllItem) => void;
  handleConfirmDelete: () => Promise<boolean>;
  handleCancelDelete: () => void;
};

export function usePageAllDelete(entity: Entity): UsePageAllDeleteReturn {
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = React.useState<AllItem | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const openDeleteConfirm = (row: AllItem) => {
    setDeleteTarget(row);
    setDeleteError(null);
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async (): Promise<boolean> => {
    if (!deleteTarget) return false;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const json = await apiFetch<DeleteResponse>("/pageAll/delete", {
        method: "DELETE",
        auth: true,
        body: {
          entity,
          filters: [
            {
              field: "uid",
              value: deleteTarget.uid,
            },
          ],
        },
      });

      if (!json.success) {
        throw new Error(json.detail || t("common.unknown"));
      }

      setDeleteTarget(null);
      return true;
    } catch (e: any) {
      console.error(e);
      setDeleteError(e?.message || t("common.error"));
      return false;
    } finally {
      setDeleteLoading(false);
    }
  };

  return {
    deleteTarget,
    deleteLoading,
    deleteError,
    openDeleteConfirm,
    handleConfirmDelete,
    handleCancelDelete,
  };
}