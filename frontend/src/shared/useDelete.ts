// src/shared/useDelete.ts
import React from "react";
import { apiFetch } from "@/shared/apiFetch";
import type { DeleteResponse } from "@/features/pageAll/all_types";
import { useTranslation } from "react-i18next";

export type DeleteBody = {
  // on peut mettre `entity?: string` ou pas
  // selon le besoin du hook si on veux l'utiliser ailleurs que pour pageAll
  entity?: string;
  filters: { field: string; value: number | string }[];
  clear_fields?: string[];
};

export type UseDeleteReturn<TTarget> = {
  target: TTarget | null;
  loading: boolean;
  error: string | null;
  openConfirm: (row: TTarget) => void;
  confirm: () => Promise<boolean>;
  cancel: () => void;
};

/**
 * Hook générique pour gérer une suppression (ou un "clear") avec modale.
 *
 * `buildBody(target)` construit le payload envoyé à /delete.
 */
export function useDelete<TTarget>(
  buildBody: (target: TTarget) => DeleteBody
): UseDeleteReturn<TTarget> {
  const { t } = useTranslation();
  const [target, setTarget] = React.useState<TTarget | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const openConfirm = (row: TTarget) => {
    setTarget(row);
    setError(null);
  };

  const cancel = () => {
    setTarget(null);
  };

  const confirm = async (): Promise<boolean> => {
    if (!target) return false;

    setLoading(true);
    setError(null);

    try {
      const body = buildBody(target);

      const json = await apiFetch<DeleteResponse>("/delete", {
        method: "DELETE",
        auth: true,
        body,
      });

      if (!json.success) {
        throw new Error(json.detail || t("common.unknown"));
      }

      setTarget(null);
      return true;
    } catch (e: any) {
      console.error(e);
      setError(e?.message || t("common.error"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    target,
    loading,
    error,
    openConfirm,
    confirm,
    cancel,
  };
}