// Sidebar (navbar) de l’espace privé : menu arborescent avec contrôle par rôles
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/useTheme";
import type { PermissionLevel, PermissionScope } from "@/config/roles";

type MenuPermission = {
  scope: PermissionScope;
  level: PermissionLevel;
};

type MenuItem = {
  key: string;
  labelKey?: string; // <- clé i18n
  label?: string;
  to?: string; // route (si absent -> nœud parent)
  permission?: MenuPermission;
  children?: MenuItem[];
};

// autorisation d’affichage par rôle
const canSee = (
  can: (scope: PermissionScope, level: PermissionLevel) => boolean,
  item?: MenuItem
) => {
  if (!item?.permission) return true;
  return can(item.permission.scope, item.permission.level);
};

// actif si chemin exact ou sous-chemin
const isPathActive = (path: string, current: string) =>
  current === path || current.startsWith(path + "/");

function ItemLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { primary, textColor, adaptiveTextColorPrimary, hoverPrimary06 } = useTheme();
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
          isActive
            ? "[background-color:var(--sidebar-link-active-bg)] [color:var(--sidebar-link-active-text)]"
            : "[color:var(--sidebar-link-text)] hover:[background-color:var(--sidebar-link-hover-bg)]",
        ].join(" ")
      }
      style={
        {
          "--sidebar-link-active-bg": primary,
          "--sidebar-link-hover-bg": hoverPrimary06,
          "--sidebar-link-text": textColor,
          "--sidebar-link-active-text": adaptiveTextColorPrimary,
        } as React.CSSProperties
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
  can,
}: {
  item: MenuItem;
  depth?: number;
  isOpen: (k: string) => boolean;
  onToggle: (k: string) => void;
  currentPath: string;
  can: (scope: PermissionScope, level: PermissionLevel) => boolean;
}) {
  const { t } = useTranslation();
  if (!canSee(can, item)) return null;

  const { primary, textColor, adaptiveTextColorPrimary, hoverPrimary06 } = useTheme();

  const label = item.labelKey ? t(item.labelKey) : (item.label ?? "");
  const hasChildren = !!item.children?.some((c) => canSee(can, c));
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
          <span>{label}</span>
        </ItemLink>
      </div>
    );
  }

  // noeud parent -> bouton pliable + enfants
  return (
    <div className="select-none">
      <button
        type="button"
        onClick={() => onToggle(item.key)}
        className={[
          "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition",
          active
            ? "[background-color:var(--sidebar-section-active-bg)] [color:var(--sidebar-section-active-text)]"
            : "[color:var(--sidebar-section-text)] hover:[background-color:var(--sidebar-section-hover-bg)]",
        ].join(" ")}
        style={
          {
            paddingLeft: padding,
            "--sidebar-section-active-bg": primary,
            "--sidebar-section-hover-bg": hoverPrimary06,
            "--sidebar-section-text": textColor,
            "--sidebar-section-active-text": adaptiveTextColorPrimary,
          } as React.CSSProperties
        }
        aria-expanded={isOpen(item.key)}
        aria-label={t("dashboardSidebar.toggleSection", { section: label })}
      >
        <span className="flex items-center gap-2">{label}</span>
        <span aria-hidden>{isOpen(item.key) ? "\u25BE" : "\u25B8"}</span>
      </button>

      {isOpen(item.key) && hasChildren && (
        <div className="mt-1 space-y-1">
          {item.children!
            .filter((c) => canSee(can, c))
            .map((child) => (
              <TreeItem
                key={child.key}
                item={child}
                depth={depth + 1}
                isOpen={isOpen}
                onToggle={onToggle}
                currentPath={currentPath}
                can={can}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardSidebar() {
  const { t } = useTranslation();
  const { user, logout, can } = useAuth();
  const location = useLocation();

  const { primary, background, borderColor, textColor, adaptiveTextColorPrimary, hoverText05, hoverText07 } = useTheme();

  // 5 sections top-level (Dashboard en premier)
  // définition du menu (contrôlé par rôle)
  const menu: MenuItem[] = [
    { key: "dashboard", labelKey: "dashboardSidebar.sections.dashboard", to: "/dashboard", permission: { scope: "DATASET", level: "READ" } },
    {
      key: "survey",
      labelKey: "dashboardSidebar.sections.survey",
      permission: { scope: "DATASET", level: "READ" },
      children: [
        { key: "survey-all",  labelKey: "dashboardSidebar.survey.all",     to: "/admin/surveys",     permission: { scope: "DATASET", level: "READ" } },
        { key: "survey-edit", labelKey: "dashboardSidebar.survey.newEdit", to: "/admin/surveys/new", permission: { scope: "DATASET", level: "WRITE" } },
      ],
    },
    {
      key: "qa",
      labelKey: "dashboardSidebar.sections.qa",
      permission: { scope: "DATASET", level: "READ" },
      children: [
        {
          key: "qps",
          labelKey: "dashboardSidebar.qa.qps._",
          permission: { scope: "DATASET", level: "READ" },
          children: [
            { key: "qps-all",  labelKey: "dashboardSidebar.qa.qps.all",     to: "/admin/qps",     permission: { scope: "DATASET", level: "READ" } },
            { key: "qps-edit", labelKey: "dashboardSidebar.qa.qps.newEdit", to: "/admin/qps/new", permission: { scope: "DATASET", level: "WRITE" } },
          ],
        },
        {
          key: "qglobal",
          labelKey: "dashboardSidebar.qa.qglobal._",
          permission: { scope: "DATASET", level: "READ" },
          children: [
            { key: "qglobal-all",  labelKey: "dashboardSidebar.qa.qglobal.all",     to: "/admin/qglobal",     permission: { scope: "DATASET", level: "READ" } },
            { key: "qglobal-edit", labelKey: "dashboardSidebar.qa.qglobal.newEdit", to: "/admin/qglobal/new", permission: { scope: "DATASET", level: "WRITE" } },
          ],
        },
        {
          key: "qcat",
          labelKey: "dashboardSidebar.qa.qcat._",
          permission: { scope: "DATASET", level: "READ" },
          children: [
            { key: "qcat-all",  labelKey: "dashboardSidebar.qa.qcat.all",     to: "/admin/qcat",     permission: { scope: "DATASET", level: "READ" } },
            { key: "qcat-edit", labelKey: "dashboardSidebar.qa.qcat.newEdit", to: "/admin/qcat/new", permission: { scope: "DATASET", level: "WRITE" } },
          ],
        },
        {
          key: "answer",
          labelKey: "dashboardSidebar.qa.answer._",
          permission: { scope: "DATASET", level: "READ" },
          children: [
            { key: "answer-all",  labelKey: "dashboardSidebar.qa.answer.all",     to: "/admin/answers",     permission: { scope: "DATASET", level: "READ" } },
            { key: "answer-edit", labelKey: "dashboardSidebar.qa.answer.newEdit", to: "/admin/answers/new", permission: { scope: "DATASET", level: "WRITE" } },
          ],
        },
        {
          key: "option",
          labelKey: "dashboardSidebar.qa.option._",
          permission: { scope: "DATASET", level: "READ" },
          children: [
            { key: "option-all",  labelKey: "dashboardSidebar.qa.option.all",     to: "/admin/options",     permission: { scope: "DATASET", level: "READ" } },
            { key: "option-edit", labelKey: "dashboardSidebar.qa.option.newEdit", to: "/admin/options/new", permission: { scope: "DATASET", level: "WRITE" } },
          ],
        },
      ],
    },
    {
      key: "places",
      labelKey: "dashboardSidebar.sections.places",
      permission: { scope: "DATASET", level: "READ" },
      children: [
        {
          key: "commune",
          labelKey: "dashboardSidebar.places.commune._",
          permission: { scope: "DATASET", level: "READ" },
          children: [
            { key: "commune-all",  labelKey: "dashboardSidebar.places.commune.all",  to: "/admin/places/communes", permission: { scope: "DATASET", level: "READ" } },
          ],
        },
        {
          key: "district",
          labelKey: "dashboardSidebar.places.district._",
          permission: { scope: "DATASET", level: "READ" },
          children: [
            { key: "district-all",  labelKey: "dashboardSidebar.places.district.all",  to: "/admin/places/districts", permission: { scope: "DATASET", level: "READ" } },
          ],
        },
        {
          key: "canton",
          labelKey: "dashboardSidebar.places.canton._",
          permission: { scope: "DATASET", level: "READ" },
          children: [
            { key: "canton-all",  labelKey: "dashboardSidebar.places.canton.all",  to: "/admin/places/cantons", permission: { scope: "DATASET", level: "READ" } },
          ],
        },
      ],
    },
    {
      key: "administration",
      labelKey: "dashboardSidebar.sections.administration",
      permission: { scope: "DATASET", level: "READ" },
      children: [
        { key: "admin-password", labelKey: "dashboardSidebar.administration.changePassword", to: "/dashboard/password", permission: { scope: "DATASET", level: "READ" } },
        {
          key: "admin-users",
          labelKey: "dashboardSidebar.administration.users._",
          permission: { scope: "PROJECT", level: "READ" },
          children: [
            { key: "admin-users-new", labelKey: "dashboardSidebar.administration.users.add",    to: "/admin/users/new",    permission: { scope: "PROJECT", level: "WRITE" } },
            { key: "admin-users-list", labelKey: "dashboardSidebar.administration.users.list", to: "/admin/users", permission: { scope: "PROJECT", level: "READ" } },
          ],
        },
        {
          key: "admin-config",
          labelKey: "dashboardSidebar.administration.config._",
          permission: { scope: "PROJECT", level: "READ" },
          children: [
            { key: "admin-config-placeOfInterest", labelKey: "dashboardSidebar.administration.config.placeOfInterest", to: "/admin/config/placeOfInterest", permission: { scope: "PROJECT", level: "READ" } },
            { key: "admin-config-theme", labelKey: "dashboardSidebar.administration.config.theme", to: "/admin/config/theme", permission: { scope: "PROJECT", level: "READ" } },
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

  const roleKey = `roles.${String(user?.role || "").toLowerCase()}`;
  const roleLabel = /roles\./.test(roleKey) ? ( (roleKey && roleKey !== "roles.") ? ( ( ( (t as any)(roleKey) !== roleKey ) ? t(roleKey) : (user?.role || "") ) ) : "" ) : "";

  return (
    <aside className="fixed left-0 top-16 w-64 border-r" style={{ backgroundColor: background, borderColor: borderColor, color: textColor }}>

      {/* contenu + menu */}
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <nav className="flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto">
          {menu
            .filter((m) => canSee(can, m))
            .map((m) => (
              <TreeItem
                key={m.key}
                item={m}
                isOpen={isOpen}
                onToggle={onToggle}
                currentPath={location.pathname}
                can={can}
              />
            ))}
        </nav>

      </div>
    </aside>
  );
}
