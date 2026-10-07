import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import { DataImportProjectMetadataData } from "@/features/dataImport/dataImportTypes";
import { getProjectMetadata } from "@/features/dataImport/dataImportApi";

type DataImportMetadataStepProps = {
    importId: string;
};

export function DataImportMetadataStep({
    importId,
}: DataImportMetadataStepProps) {
    const { t } = useTranslation();
    const { textColor, background, borderColor, hoverPrimary04, primary } =
        useTheme();

    const [projectMetadata, setProjectMetadata] =
        useState<DataImportProjectMetadataData | null>(null);

    useEffect(() => {
        async function load() {
            const json = await getProjectMetadata(importId);
            console.log(json);
        }
        void load();
    }, [importId, t]);

    const busy = false;
    const resetAllFromProject = () => {};
    return (
        <section className="flex flex-col gap-4">
            <div
                className="flex flex-col gap-3 rounded-3xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                style={{ backgroundColor: hoverPrimary04, borderColor }}
            >
                <div className="min-w-0">
                    <h2 className="text-lg font-semibold">
                        {t("dataImport.metadata.title")}
                    </h2>
                    <p className="mt-1 text-sm leading-6 opacity-70">
                        {t("dataImport.metadata.inheritedFrom")}{" "}
                        <span
                            className="font-semibold"
                            style={{ color: primary }}
                        >
                            {"projectMetadata"}
                        </span>
                    </p>
                </div>

                <button
                    type="button"
                    disabled={busy}
                    onClick={resetAllFromProject}
                    className="w-fit shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-80 disabled:opacity-40"
                    style={{ borderColor, backgroundColor: background }}
                >
                    ↺ {t("dataImport.metadata.resetAll")}
                </button>
            </div>
        </section>
    );
}
