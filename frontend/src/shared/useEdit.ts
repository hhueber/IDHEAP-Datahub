import React from "react";
import { apiFetch } from "@/shared/apiFetch";
import { useTranslation } from "react-i18next";

export type EditBody = {
  entity?: string;
  filters: { field: string; value: number | string }[];
  updates: Record<string, string | number | boolean>;
};

type EditResponse = { success: boolean; detail: string };

export type UseEditReturn<TTarget> = {
  target: TTarget | null;
  loading: boolean;
  error: string | null;
  openConfirm: (row: TTarget) => void;
  confirm: () => Promise<boolean>;
  confirmWith: (body: EditBody) => Promise<boolean>;
  cancel: () => void;
};

export function useEdit<TTarget>(
  buildBody: (target: TTarget) => EditBody
): UseEditReturn<TTarget> {
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

  const run = async (body: EditBody): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      for (const [k, v] of Object.entries(body.updates ?? {})) {
        if (typeof v === "string" && v.trim() === "") {
          throw new Error(`${k}: empty value is not allowed`);
        }
      }

      const json = await apiFetch<EditResponse>("/edit", {
        method: "PATCH",
        auth: true,
        body,
      });

      if (!json.success) throw new Error(json.detail || t("common.unknown"));

      return true;
    } catch (e: any) {
      console.error(e);
      setError(e?.message || t("common.error"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const confirm = async (): Promise<boolean> => {
    if (!target) return false;
    const body = buildBody(target);
    const ok = await run(body);
    if (ok) setTarget(null);
    return ok;
  };

  const confirmWith = async (body: EditBody): Promise<boolean> => {
    const ok = await run(body);
    if (ok) setTarget(null);
    return ok;
  };

  return {
    target,
    loading,
    error,
    openConfirm,
    confirm,
    confirmWith,
    cancel,
  };
}
