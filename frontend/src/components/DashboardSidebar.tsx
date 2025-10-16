// Sidebar (navbar) de l’espace privé : menu arborescent avec contrôle par rôles
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Role = "ADMIN" | "MEMBER";
type MenuItem = {
  key: string;
  label: string;
  to?: string; // route (si absent -> nœud parent)
  roles?: Role[]; // rôles autorisés
  children?: MenuItem[];
};

// autorisation d’affichage par rôle
const canSee = (role: Role | undefined, item?: MenuItem) =>
  !item?.roles || (role ? item.roles.includes(role) : false);

// actif si chemin exact ou sous-chemin
const isPathActive = (path: string, current: string) =>
  current === path || current.startsWith(path + "/");

function ItemLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
          isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

// élément de l’arbre
function TreeItem({
  item,
  depth = 0,
  isOpen,
  onToggle,
  currentPath,
  userRole,
}: {
  item: MenuItem;
  depth?: number;
  isOpen: (k: string) => boolean;
  onToggle: (k: string) => void;
  currentPath: string;
  userRole?: Role;
}) {
  if (!canSee(userRole, item)) return null;

  const hasChildren = !!item.children?.some((c) => canSee(userRole, c));
  const padding = 12 + depth * 12;
  const activeHere = item.to ? isPathActive(item.to, currentPath) : false;
  const activeChild =
    hasChildren &&
    item.children!.some((c) =>
      c.to ? isPathActive(c.to, currentPath) : c.children?.some((gc) => gc.to && isPathActive(gc.to, currentPath))
    );
  const active = activeHere || !!activeChild;

  // feuille simple -> lien direct
  if (!hasChildren && item.to) {
    return (
      <div style={{ paddingLeft: padding }}>
        <ItemLink to={item.to}>
          <span>{item.label}</span>
        </ItemLink>
      </div>
    );
  }

  // nœud parent -> bouton pliable + enfants
  return (
    <div className="select-none">
      <button
        type="button"
        onClick={() => onToggle(item.key)}
        className={[
          "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold",
          active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100",
        ].join(" ")}
        style={{ paddingLeft: padding }}
        aria-expanded={isOpen(item.key)}
      >
        <span className="flex items-center gap-2">{item.label}</span>
        <span aria-hidden>{isOpen(item.key) ? "▾" : "▸"}</span>
      </button>

      {isOpen(item.key) && hasChildren && (
        <div className="mt-1 space-y-1">
          {item.children!
            .filter((c) => canSee(userRole, c))
            .map((child) => (
              <TreeItem
                key={child.key}
                item={child}
                depth={depth + 1}
                isOpen={isOpen}
                onToggle={onToggle}
                currentPath={currentPath}
                userRole={userRole}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardSidebar() {
  const { user, logout } = useAuth();
  const userRole = (user?.role as Role) || undefined;
  const location = useLocation();

  // 5 sections top-level (Dashboard en premier)
  // définition du menu (contrôlé par rôle)
  const menu: MenuItem[] = [
    { key: "dashboard", label: "Dashboard", to: "/dashboard", roles: ["ADMIN", "MEMBER"] },
    {
      key: "survey",
      label: "Survey",
      roles: ["ADMIN"],
      children: [
        { key: "survey-all", label: "All", to: "/admin/surveys", roles: ["ADMIN"] },
        { key: "survey-edit", label: "New / Edit", to: "/admin/surveys/new", roles: ["ADMIN"] },
        { key: "survey-show", label: "Show", to: "/admin/surveys/show", roles: ["ADMIN"] },
      ],
    },
    {
      key: "qa",
      label: "Questions & Answers",
      roles: ["ADMIN"],
      children: [
        {
          key: "qps",
          label: "QuestionPerSurvey",
          roles: ["ADMIN"],
          children: [
            { key: "qps-all", label: "All", to: "/admin/qps", roles: ["ADMIN"] },
            { key: "qps-edit", label: "New / Edit", to: "/admin/qps/new", roles: ["ADMIN"] },
            { key: "qps-show", label: "Show", to: "/admin/qps/show", roles: ["ADMIN"] },
          ],
        },
        {
          key: "qglobal",
          label: "QuestionGlobal",
          roles: ["ADMIN"],
          children: [
            { key: "qglobal-all", label: "All", to: "/admin/qglobal", roles: ["ADMIN"] },
            { key: "qglobal-edit", label: "New / Edit", to: "/admin/qglobal/new", roles: ["ADMIN"] },
            { key: "qglobal-show", label: "Show", to: "/admin/qglobal/show", roles: ["ADMIN"] },
          ],
        },
        {
          key: "qcat",
          label: "QuestionCategory",
          roles: ["ADMIN"],
          children: [
            { key: "qcat-all", label: "All", to: "/admin/qcat", roles: ["ADMIN"] },
            { key: "qcat-edit", label: "New / Edit", to: "/admin/qcat/new", roles: ["ADMIN"] },
            { key: "qcat-show", label: "Show", to: "/admin/qcat/show", roles: ["ADMIN"] },
          ],
        },
        {
          key: "answer",
          label: "Answer",
          roles: ["ADMIN"],
          children: [
            { key: "answer-all", label: "All", to: "/admin/answers", roles: ["ADMIN"] },
            { key: "answer-edit", label: "New / Edit", to: "/admin/answers/new", roles: ["ADMIN"] },
            { key: "answer-show", label: "Show", to: "/admin/answers/show", roles: ["ADMIN"] },
          ],
        },
        {
          key: "option",
          label: "Option",
          roles: ["ADMIN"],
          children: [
            { key: "option-all", label: "All", to: "/admin/options", roles: ["ADMIN"] },
            { key: "option-edit", label: "New / Edit", to: "/admin/options/new", roles: ["ADMIN"] },
            { key: "option-show", label: "Show", to: "/admin/options/show", roles: ["ADMIN"] },
          ],
        },
      ],
    },
    {
      key: "places",
      label: "Places",
      roles: ["ADMIN"],
      children: [
        {
          key: "commune",
          label: "Commune",
          roles: ["ADMIN"],
          children: [
            { key: "commune-all", label: "All", to: "/admin/places/communes", roles: ["ADMIN"] },
            { key: "commune-show", label: "Show", to: "/admin/places/communes/show", roles: ["ADMIN"] },
          ],
        },
        {
          key: "district",
          label: "District",
          roles: ["ADMIN"],
          children: [
            { key: "district-all", label: "All", to: "/admin/places/districts", roles: ["ADMIN"] },
            { key: "district-show", label: "Show", to: "/admin/places/districts/show", roles: ["ADMIN"] },
          ],
        },
        {
          key: "canton",
          label: "Canton",
          roles: ["ADMIN"],
          children: [
            { key: "canton-all", label: "All", to: "/admin/places/cantons", roles: ["ADMIN"] },
            { key: "canton-show", label: "Show", to: "/admin/places/cantons/show", roles: ["ADMIN"] },
          ],
        },
      ],
    },
    {
      key: "administration",
      label: "Administration",
      roles: ["ADMIN", "MEMBER"],
      children: [
        { key: "admin-password", label: "Changer mon mot de passe", to: "/dashboard/password", roles: ["ADMIN", "MEMBER"] },
        {
          key: "admin-users",
          label: "Utilisateurs",
          roles: ["ADMIN"],
          children: [
            { key: "admin-users-new", label: "Ajouter un membre", to: "/admin/users/new", roles: ["ADMIN"] },
            { key: "admin-users-del", label: "Supprimer un membre", to: "/admin/users/delete", roles: ["ADMIN"] },
          ],
        },
      ],
    },
  ];

  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  // ouvre automatiquement les parents du chemin actif
  React.useEffect(() => {
    const next = { ...open };
    const visit = (items: MenuItem[], parents: string[]) => {
      for (const it of items) {
        const active = it.to ? isPathActive(it.to, location.pathname) : false;
        if (active) parents.forEach((k) => (next[k] = true));
        if (it.children) visit(it.children, [...parents, it.key]);
      }
    };
    visit(menu, []);
    setOpen(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // helpers d’état d’ouverture
  const isOpen = (k: string) => !!open[k];
  const onToggle = (k: string) => setOpen((s) => ({ ...s, [k]: !s[k] }));

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r bg-white">
      {/* en-tête */}
      <div className="h-16 border-b px-4 flex items-center">
        <span className="text-lg font-semibold">Espace privé</span>
      </div>

      {/* contenu + menu */}
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <nav className="px-3 py-4 space-y-1 overflow-auto">
          {menu
            .filter((m) => canSee(userRole, m))
            .map((m) => (
              <TreeItem
                key={m.key}
                item={m}
                isOpen={isOpen}
                onToggle={onToggle}
                currentPath={location.pathname}
                userRole={userRole}
              />
            ))}
        </nav>

        {/* pied : infos utilisateur + logout */}
        <div className="mt-auto border-t p-4">
          <div className="mb-3 text-sm">
            <div className="font-medium">{user?.full_name}</div>
            <div className="text-gray-500">{user?.email}</div>
            <div className="text-xs text-gray-400">Rôle : {user?.role}</div>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </aside>
  );
}
