import { useTheme } from "@/theme/useTheme";
import { useState } from "react";

import { DropdownList } from "@/utils/DropdownList";
import { useTranslation } from "react-i18next";
import { NewProjectData, Link, Author } from "../../dataImportTypes";

export interface Project {
  uid: number;
  name: string;
  description?: string;
}

type ProjectSelectorProps = {
  canCreateProjet: boolean;
  projects: Project[];
  selectedProjUid: number;
  onSelectedExisting: (projectUid: number) => void;
  onCreatedNew: (newProject: NewProjectData) => void;
};

export function ProjectSelector({
  canCreateProjet = true,
  projects = [],
  onSelectedExisting,
  onCreatedNew,
  selectedProjUid,
}: ProjectSelectorProps) {
  const { borderColor, textColor, background, hoverPrimary04, primary } =
    useTheme();

  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const [newProject, setNewProject] = useState<NewProjectData>({
    name: "",
    description: "",
    licence: "",
    links: [],
    authors: [],
  });

  const [authors, setAuthors] = useState<Author[]>([
    { first_name: "", last_name: "", email: "" },
  ]);

  const [links, setLinks] = useState<Link[]>([]);

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

  const updateLink = (index: number, field: "name" | "url", value: string) => {
    const updated = [...links];
    updated[index][field] = value;
    setLinks(updated);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleChangeProject = (field: keyof NewProjectData, value: any) => {
    // We use this trick to update only one field in the state
    const updated = { ...newProject, [field]: value };
    setNewProject(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    newProject.links = links;
    newProject.authors = authors;
    onCreatedNew(newProject);
  };

  const selectedProject =
    projects.find((p) => p.uid === selectedProjUid) || null;

  return (
    <>
      <div
        className="rounded-2xl border p-4 sm:p-5 transition-all"
        style={{ backgroundColor: background, borderColor, color: textColor }}
      >
        <div
          className="mb-4 flex rounded-xl border p-1"
          style={{ borderColor, backgroundColor: hoverPrimary04 }}
        >
          <button
            onClick={() => setIsCreating(false)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              !isCreating ? "shadow-sm" : "opacity-60 hover:opacity-100"
            }`}
            style={{
              backgroundColor: !isCreating ? background : "transparent",
              color: !isCreating ? primary : textColor,
            }}
          >
            choisir projet
          </button>

          {canCreateProjet && (
            <button
              onClick={() => setIsCreating(true)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                isCreating ? "shadow-sm" : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor: isCreating ? background : "transparent",
                color: isCreating ? primary : textColor,
              }}
            >
              nouveau projet1
            </button>
          )}
        </div>
        {!isCreating && (
          <div className="space-y-3">
            <label className="block text-xs font-medium opacity-70">
              Selectionner votre projet
            </label>
            {projects.length == 0 ? (
              <div className="flex flex-col items-center justify-center space-y-2 py-2">
                <p className="text-xs opacity-70 text-center">
                  Aucun projet existant n'a été trouvé.
                </p>
                <button
                  className=" rounded-lg py-2 text-xs border p-1"
                  onClick={() => setIsCreating(true)}
                >
                  Créer un nouveau projet
                </button>
              </div>
            ) : (
              <DropdownList<Project>
                items={projects}
                selected={selectedProject}
                onSelect={(proj) => onSelectedExisting(proj.uid)}
                labelFor={(proj) => proj.name}
                keyFor={(proj) => proj.uid}
                isSelected={(item, selected) => item.uid === selected?.uid}
                placeholder={t("dataImport.upload.project.dropdownSelector")}
              ></DropdownList>
            )}
          </div>
        )}
        {isCreating && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="mb-1 block text-xs font-medium">
                {t("dataImport.upload.project.nameLabel")}
              </label>
              <input
                type="text"
                value={newProject.name}
                placeholder={t("dataImport.upload.project.namePlaceholder")} // TODO: Change this7
                onChange={(e) => handleChangeProject("name", e.target.value)}
                className="w-full h-10 rounded-xl border px-3 text-sm outline-none"
                style={{
                  borderColor,
                  backgroundColor: background,
                  color: textColor,
                }}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">
                {t("dataImport.upload.project.descriptionLabel")}
              </label>
              <textarea
                rows={2}
                value={newProject.description}
                placeholder={t(
                  "dataImport.upload.project.descriptionPlaceholder",
                )}
                onChange={(e) =>
                  handleChangeProject("description", e.target.value)
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
                {t("dataImport.upload.project.licenceLabel")}
              </label>
              <input
                type="text"
                value={newProject.licence}
                placeholder={t("dataImport.upload.project.licencePlaceholder")} // TODO: Change this7
                onChange={(e) => handleChangeProject("licence", e.target.value)}
                className="w-full h-10 rounded-xl border px-3 text-sm outline-none"
                style={{
                  borderColor,
                  backgroundColor: background,
                  color: textColor,
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Auteurs du projet</span>
              <button
                type="button"
                onClick={addAuthor}
                className="text-xs font-medium text-primary hover:underline"
              >
                + Ajouter un auteur
              </button>
            </div>
            {authors.map((author, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-xl border p-3 sm:grid-cols-3 relative"
                style={{ borderColor, backgroundColor: hoverPrimary04 }}
              >
                <input
                  type="text"
                  placeholder="Prénom"
                  value={author.first_name}
                  onChange={(e) =>
                    updateAuthor(index, "first_name", e.target.value)
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
                  placeholder="Nom"
                  value={author.last_name}
                  onChange={(e) =>
                    updateAuthor(index, "last_name", e.target.value)
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
                    placeholder="Email"
                    value={author.email}
                    onChange={(e) =>
                      updateAuthor(index, "email", e.target.value)
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
                Liens externes & Ressources
              </span>
              <button
                type="button"
                onClick={addLink}
                className="text-xs font-medium text-primary hover:underline"
              >
                + Ajouter un lien
              </button>
            </div>
            {links.length === 0 && (
              <p className="text-xs opacity-50 italic">Aucun lien ajouté.</p>
            )}
            {links.map((link, index) => (
              <div
                key={index}
                className="flex gap-2 rounded-xl border p-2.5 items-center"
                style={{ borderColor, backgroundColor: hoverPrimary04 }}
              >
                <input
                  type="text"
                  placeholder="Nom du lien (ex: Documentation)"
                  value={link.name}
                  onChange={(e) => updateLink(index, "name", e.target.value)}
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
                  onChange={(e) => updateLink(index, "url", e.target.value)}
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
              disabled={!newProject.name.trim()}
              className="w-full rounded-xl py-2.5 text-xs font-semibold border p-1 transition hover:opacity-90 disabled:opacity-50"
            >
              {t("dataImport.upload.project.submitButton")}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
