// Sidebar (navbar) de l’espace privé : menu arborescent avec contrôle par rôles
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { loadThemeConfig } from "@/theme/themeStorage";
import { hexToRgba, getAdaptiveTextColor } from "@/utils/color";
import { useThemeMode } from "@/theme/ThemeContext";

type Role = "ADMIN" | "MEMBER";
type MenuItem = {
  key: string;
  labelKey?: string; // <- clé i18n
  label?: string;
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
  const { mode } = useThemeMode();
  const cfg = loadThemeConfig();
  const primary = (mode === "dark" ? cfg.colour_dark_primary : cfg.colour_light_primary) ?? cfg.colour_light_primary;
  const textBase = (mode === "dark" ? cfg.colour_dark_text : cfg.colour_light_text) ?? cfg.colour_light_text;
  const hoverBg = hexToRgba(primary, 0.06);
  const activeText = getAdaptiveTextColor(primary);
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
          "--sidebar-link-hover-bg": hoverBg,
          "--sidebar-link-text": textBase,
          "--sidebar-link-active-text": activeText,
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
  userRole,
}: {
  item: MenuItem;
  depth?: number;
  isOpen: (k: string) => boolean;
  onToggle: (k: string) => void;
  currentPath: string;
  userRole?: Role;
}) {
  const { t } = useTranslation();
  if (!canSee(userRole, item)) return null;

  const { mode } = useThemeMode();
  const cfg = loadThemeConfig();
  const primary = (mode === "dark" ? cfg.colour_dark_primary : cfg.colour_light_primary) ?? cfg.colour_light_primary;
  const textBase = (mode === "dark" ? cfg.colour_dark_text : cfg.colour_light_text) ?? cfg.colour_light_text;
  const hoverBg = hexToRgba(primary, 0.06);
  const activeText = getAdaptiveTextColor(primary);

  const label = item.labelKey ? t(item.labelKey) : (item.label ?? "");
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
            "--sidebar-section-hover-bg": hoverBg,
            "--sidebar-section-text": textBase,
            "--sidebar-section-active-text": activeText,
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
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const userRole = (user?.role as Role) || undefined;
  const location = useLocation();

  const { mode } = useThemeMode();
  const cfg = loadThemeConfig();
  const bg = (mode === "dark" ? cfg.colour_dark_background : cfg.colour_light_background) ?? cfg.colour_light_background;
  const border = (mode === "dark" ? cfg.colour_dark_secondary : cfg.colour_light_secondary) ?? cfg.colour_light_secondary;
  const text = (mode === "dark" ? cfg.colour_dark_text : cfg.colour_light_text) ?? cfg.colour_light_text;
  const primary = (mode === "dark" ? cfg.colour_dark_primary : cfg.colour_light_primary) ?? cfg.colour_light_primary;

  const logoutText = getAdaptiveTextColor(primary);

  // 5 sections top-level (Dashboard en premier)
  // définition du menu (contrôlé par rôle)
  const menu: MenuItem[] = [
    { key: "dashboard", labelKey: "dashboardSidebar.sections.dashboard", to: "/dashboard", roles: ["ADMIN", "MEMBER"] },
    {
      key: "survey",
      labelKey: "dashboardSidebar.sections.survey",
      roles: ["ADMIN", "MEMBER"],
      children: [
        { key: "survey-all",  labelKey: "dashboardSidebar.survey.all",     to: "/admin/surveys",     roles: ["ADMIN", "MEMBER"] },
        { key: "survey-edit", labelKey: "dashboardSidebar.survey.newEdit", to: "/admin/surveys/new", roles: ["ADMIN", "MEMBER"] },
        { key: "survey-show", labelKey: "dashboardSidebar.survey.show",    to: "/admin/surveys/show",roles: ["ADMIN", "MEMBER"] },
      ],
    },
    {
      key: "qa",
      labelKey: "dashboardSidebar.sections.qa",
      roles: ["ADMIN", "MEMBER"],
      children: [
        {
          key: "qps",
          labelKey: "dashboardSidebar.qa.qps._",
          roles: ["ADMIN", "MEMBER"],
          children: [
            { key: "qps-all",  labelKey: "dashboardSidebar.qa.qps.all",     to: "/admin/qps",     roles: ["ADMIN", "MEMBER"] },
            { key: "qps-edit", labelKey: "dashboardSidebar.qa.qps.newEdit", to: "/admin/qps/new", roles: ["ADMIN", "MEMBER"] },
            { key: "qps-show", labelKey: "dashboardSidebar.qa.qps.show",    to: "/admin/qps/show",roles: ["ADMIN", "MEMBER"] },
          ],
        },
        {
          key: "qglobal",
          labelKey: "dashboardSidebar.qa.qglobal._",
          roles: ["ADMIN", "MEMBER"],
          children: [
            { key: "qglobal-all",  labelKey: "dashboardSidebar.qa.qglobal.all",     to: "/admin/qglobal",     roles: ["ADMIN", "MEMBER"] },
            { key: "qglobal-edit", labelKey: "dashboardSidebar.qa.qglobal.newEdit", to: "/admin/qglobal/new", roles: ["ADMIN", "MEMBER"] },
            { key: "qglobal-show", labelKey: "dashboardSidebar.qa.qglobal.show",    to: "/admin/qglobal/show",roles: ["ADMIN", "MEMBER"] },
          ],
        },
        {
          key: "qcat",
          labelKey: "dashboardSidebar.qa.qcat._",
          roles: ["ADMIN", "MEMBER"],
          children: [
            { key: "qcat-all",  labelKey: "dashboardSidebar.qa.qcat.all",     to: "/admin/qcat",     roles: ["ADMIN", "MEMBER"] },
            { key: "qcat-edit", labelKey: "dashboardSidebar.qa.qcat.newEdit", to: "/admin/qcat/new", roles: ["ADMIN", "MEMBER"] },
            { key: "qcat-show", labelKey: "dashboardSidebar.qa.qcat.show",    to: "/admin/qcat/show",roles: ["ADMIN", "MEMBER"] },
          ],
        },
        {
          key: "answer",
          labelKey: "dashboardSidebar.qa.answer._",
          roles: ["ADMIN", "MEMBER"],
          children: [
            { key: "answer-all",  labelKey: "dashboardSidebar.qa.answer.all",     to: "/admin/answers",     roles: ["ADMIN", "MEMBER"] },
            { key: "answer-edit", labelKey: "dashboardSidebar.qa.answer.newEdit", to: "/admin/answers/new", roles: ["ADMIN", "MEMBER"] },
            { key: "answer-show", labelKey: "dashboardSidebar.qa.answer.show",    to: "/admin/answers/show",roles: ["ADMIN", "MEMBER"] },
          ],
        },
        {
          key: "option",
          labelKey: "dashboardSidebar.qa.option._",
          roles: ["ADMIN", "MEMBER"],
          children: [
            { key: "option-all",  labelKey: "dashboardSidebar.qa.option.all",     to: "/admin/options",     roles: ["ADMIN", "MEMBER"] },
            { key: "option-edit", labelKey: "dashboardSidebar.qa.option.newEdit", to: "/admin/options/new", roles: ["ADMIN", "MEMBER"] },
            { key: "option-show", labelKey: "dashboardSidebar.qa.option.show",    to: "/admin/options/show",roles: ["ADMIN", "MEMBER"] },
          ],
        },
      ],
    },
    {
      key: "places",
      labelKey: "dashboardSidebar.sections.places",
      roles: ["ADMIN", "MEMBER"],
      children: [
        {
          key: "commune",
          labelKey: "dashboardSidebar.places.commune._",
          roles: ["ADMIN", "MEMBER"],
          children: [
            { key: "commune-all",  labelKey: "dashboardSidebar.places.commune.all",  to: "/admin/places/communes",       roles: ["ADMIN", "MEMBER"] },
            { key: "commune-show", labelKey: "dashboardSidebar.places.commune.show", to: "/admin/places/communes/show",  roles: ["ADMIN", "MEMBER"] },
          ],
        },
        {
          key: "district",
          labelKey: "dashboardSidebar.places.district._",
          roles: ["ADMIN", "MEMBER"],
          children: [
            { key: "district-all",  labelKey: "dashboardSidebar.places.district.all",  to: "/admin/places/districts",      roles: ["ADMIN", "MEMBER"] },
            { key: "district-show", labelKey: "dashboardSidebar.places.district.show", to: "/admin/places/districts/show", roles: ["ADMIN", "MEMBER"] },
          ],
        },
        {
          key: "canton",
          labelKey: "dashboardSidebar.places.canton._",
          roles: ["ADMIN", "MEMBER"],
          children: [
            { key: "canton-all",  labelKey: "dashboardSidebar.places.canton.all",  to: "/admin/places/cantons",      roles: ["ADMIN", "MEMBER"] },
            { key: "canton-show", labelKey: "dashboardSidebar.places.canton.show", to: "/admin/places/cantons/show", roles: ["ADMIN", "MEMBER"] },
          ],
        },
      ],
    },
    {
      key: "administration",
      labelKey: "dashboardSidebar.sections.administration",
      roles: ["ADMIN", "MEMBER"],
      children: [
        { key: "admin-password", labelKey: "dashboardSidebar.administration.changePassword", to: "/dashboard/password", roles: ["ADMIN", "MEMBER"] },
        {
          key: "admin-users",
          labelKey: "dashboardSidebar.administration.users._",
          roles: ["ADMIN"],
          children: [
            { key: "admin-users-new", labelKey: "dashboardSidebar.administration.users.add",    to: "/admin/users/new",    roles: ["ADMIN"] },
            { key: "admin-users-del", labelKey: "dashboardSidebar.administration.users.delete", to: "/admin/users/delete", roles: ["ADMIN"] },
          ],
        },
        {
          key: "admin-config",
          labelKey: "dashboardSidebar.administration.config._",
          roles: ["ADMIN"],
          children: [
            { key: "admin-config-placeOfInterest", labelKey: "dashboardSidebar.administration.config.placeOfInterest", to: "/admin/config/placeOfInterest", roles: ["ADMIN"], },
            { key: "admin-config-theme", labelKey: "dashboardSidebar.administration.config.theme", to: "/admin/config/theme", roles: ["ADMIN"], },
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
    <aside className="fixed left-0 top-16 w-64 border-r" style={{ backgroundColor: bg, borderColor: border, color: text }}>

      {/* contenu + menu */}
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <nav className="flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto">
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

      </div>
    </aside>
  );
}
