import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import {
    Author,
    Link,
    DataImportProjectMetadataData,
    MetadataDataset,
} from "@/features/dataImport/dataImportTypes";
import {
    getDatasetMetada,
    saveDatasetMetadata,
} from "@/features/dataImport/dataImportApi";

type DataImportMetadataStepProps = {
    importId: string;
};

export function DataImportMetadataStep({
    importId,
}: DataImportMetadataStepProps) {
    const { t } = useTranslation();
    const { textColor, background, borderColor, hoverPrimary04, primary } =
        useTheme();

    const [authors, setAuthors] = useState<Author[]>([
        { last_name: "", first_name: "", email: "" },
    ]);
    const [links, setLinks] = useState<Link[]>([]);
    const [projName, setProjName] = useState<string>("");
    const [datasetMetadata, setDatasetMetada] = useState<MetadataDataset>({
        name: "",
        description: "",
        licence: "",
        links: [],
        authors: [],
    });

    const addAuthor = () => {
        setAuthors([...authors, { first_name: "", last_name: "", email: "" }]);
    };

    const updateAuthor = (
        index: number,
        field: "first_name" | "last_name" | "email",
        value: string,
    ) => {
        const updated = [...authors];
        updated[index][field] = value;
        setAuthors(updated);
    };

    const removeAuthor = (index: number) => {
        setAuthors(authors.filter((_, i) => i !== index));
    };

    const addLink = () => {
        setLinks([...links, { name: "", url: "" }]);
    };

    const updateLink = (
        index: number,
        field: "name" | "url",
        value: string,
    ) => {
        const updated = [...links];
        updated[index][field] = value;
        setLinks(updated);
    };

    const removeLink = (index: number) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const handleChangeMetadata = (field: keyof MetadataDataset, value: any) => {
        const updated = { ...datasetMetadata, [field]: value };
        setDatasetMetada(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        datasetMetadata.links = links;
        datasetMetadata.authors = authors;
        saveDatasetMetadata(importId, datasetMetadata);
    };

    useEffect(() => {
        async function load() {
            const json = await getDatasetMetada(importId);
            setProjName(json.name);
            setLinks(json.links);
            setAuthors(json.authors);
            setDatasetMetada({
                name: json.name,
                description: json.description,
                licence: json.licence,
                links: [],
                authors: [],
            });
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
                            {projName}
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

            <div
                className="rounded-3xl border p-4 sm:p-5"
                style={{ backgroundColor: background, borderColor }}
            >
                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <div>
                        <label className="mb-1 block text-xs font-medium">
                            {t("dataImport.metadata.nameLabel")}
                        </label>
                        <input
                            type="text"
                            className="w-full h-10 rounded-xl border px-3 text-sm outline-none"
                            value={datasetMetadata.name}
                            onChange={(e) =>
                                handleChangeMetadata("name", e.target.value)
                            }
                            style={{
                                borderColor,
                                backgroundColor: background,
                                color: textColor,
                            }}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium">
                            {t("dataImport.metadata.descriptionLabel")}
                        </label>
                        <textarea
                            rows={2}
                            value={datasetMetadata.description}
                            placeholder={t(
                                "dataImport.metadata.descriptionPlaceholder",
                            )}
                            onChange={(e) =>
                                handleChangeMetadata(
                                    "description",
                                    e.target.value,
                                )
                            }
                            className="w-full rounded-xl border p-2.5 text-sm outline-none resize-none"
                            style={{
                                borderColor,
                                backgroundColor: background,
                                color: textColor,
                            }}
                        ></textarea>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium">
                            {t("dataImport.metadata.licenceLabel")}
                        </label>
                        <input
                            type="text"
                            value={datasetMetadata.licence}
                            placeholder={t(
                                "dataImport.metadata.licencePlaceholder",
                            )}
                            onChange={(e) =>
                                handleChangeMetadata("licence", e.target.value)
                            }
                            className="w-full h-10 rounded-xl border px-3 text-sm outline-none"
                            style={{
                                borderColor,
                                backgroundColor: background,
                                color: textColor,
                            }}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">
                            {t("dataImport.upload.project.projectAuthor")}
                        </span>
                        <button
                            type="button"
                            onClick={addAuthor}
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            + {t("dataImport.upload.project.addAuthor")}
                        </button>
                    </div>
                    {authors.map((author, index) => (
                        <div
                            key={index}
                            className="grid gap-2 rounded-xl border p-3 sm:grid-cols-3 relative"
                            style={{
                                borderColor,
                                backgroundColor: hoverPrimary04,
                            }}
                        >
                            <input
                                type="text"
                                placeholder={t(
                                    "dataImport.upload.project.authorFirstNamePlaceholder",
                                )}
                                value={author.first_name}
                                onChange={(e) =>
                                    updateAuthor(
                                        index,
                                        "first_name",
                                        e.target.value,
                                    )
                                }
                                className="h-9 w-full rounded-lg border px-2.5 text-xs outline-none"
                                style={{
                                    borderColor,
                                    backgroundColor: background,
                                    color: textColor,
                                }}
                            />
                            <input
                                type="text"
                                placeholder={t(
                                    "dataImport.upload.project.authorLastNamePlaceholder",
                                )}
                                value={author.last_name}
                                onChange={(e) =>
                                    updateAuthor(
                                        index,
                                        "last_name",
                                        e.target.value,
                                    )
                                }
                                className="h-9 w-full rounded-lg border px-2.5 text-xs outline-none"
                                style={{
                                    borderColor,
                                    backgroundColor: background,
                                    color: textColor,
                                }}
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="email"
                                    placeholder={t(
                                        "dataImport.upload.project.authorEmailPlaceHolder",
                                    )}
                                    value={author.email}
                                    onChange={(e) =>
                                        updateAuthor(
                                            index,
                                            "email",
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 w-full rounded-lg border px-2.5 text-xs outline-none"
                                    style={{
                                        borderColor,
                                        backgroundColor: background,
                                        color: textColor,
                                    }}
                                />
                                {authors.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeAuthor(index)}
                                        className="text-xs text-red-500 hover:opacity-80 px-1.5"
                                        title="Supprimer"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">
                            {t("dataImport.upload.project.linkText")}
                        </span>
                        <button
                            type="button"
                            onClick={addLink}
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            + {t("dataImport.upload.project.newLink")}
                        </button>
                    </div>
                    {links.length === 0 && (
                        <p className="text-xs opacity-50 italic">
                            {t("dataImport.upload.project.noLink")}
                        </p>
                    )}
                    {links.map((link, index) => (
                        <div
                            key={index}
                            className="flex gap-2 rounded-xl border p-2.5 items-center"
                            style={{
                                borderColor,
                                backgroundColor: hoverPrimary04,
                            }}
                        >
                            <input
                                type="text"
                                placeholder={t(
                                    "dataImport.upload.project.linkPlaceHolder",
                                )}
                                value={link.name}
                                onChange={(e) =>
                                    updateLink(index, "name", e.target.value)
                                }
                                className="h-9 flex-1 rounded-lg border px-2.5 text-xs outline-none"
                                style={{
                                    borderColor,
                                    backgroundColor: background,
                                    color: textColor,
                                }}
                            />
                            <input
                                type="text"
                                placeholder="URL (https://...)"
                                value={link.url}
                                onChange={(e) =>
                                    updateLink(index, "url", e.target.value)
                                }
                                className="h-9 flex-1 rounded-lg border px-2.5 text-xs outline-none"
                                style={{
                                    borderColor,
                                    backgroundColor: background,
                                    color: textColor,
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => removeLink(index)}
                                className="text-xs text-red-500 hover:opacity-80 px-2"
                                title="Supprimer"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button
                        type="submit"
                        disabled={!datasetMetadata.name.trim()}
                        className="w-full rounded-xl py-2.5 text-xs font-semibold border p-1 transition hover:opacity-90 disabled:opacity-50"
                    >
                        {t("dataImport.metadata.submitButton")}
                    </button>
                </form>
            </div>
        </section>
    );
}
