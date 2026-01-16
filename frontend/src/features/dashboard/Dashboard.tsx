// Tableau de bord (zone privée) : affiche l’utilisateur connecté et pour l'instant un bouton de déconnexion
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { loadThemeConfig } from "@/theme/themeStorage";
import { useThemeMode } from "@/theme/ThemeContext";
import { hexToRgba, getAdaptiveTextColor } from "@/utils/color";

type Kpi = { label: string; value: string; sub?: string };

function Card({
  children,
  bg,
  border,
}: {
  children: React.ReactNode;
  bg: string;
  border: string;
}) {
  return (
    <div
      className="rounded-2xl border p-5 sm:p-6 shadow-sm backdrop-blur"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {children}
    </div>
  );
}

/** Donut chart (SVG) – sans lib */
function Donut({
  value, // 0..100
  size = 140,
  stroke = 14,
  color,
  track,
  textColor,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color: string;
  track: string;
  textColor: string;
  label: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="48%"
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill={textColor}
      >
        {pct}%
      </text>
      <text x="50%" y="64%" textAnchor="middle" fontSize="11" fill={hexToRgba(textColor, 0.75)}>
        {label}
      </text>
    </svg>
  );
}

function Pill({
  children,
  bg,
  border,
  color,
}: {
  children: React.ReactNode;
  bg: string;
  border: string;
  color: string;
}) {
  return (
    <span
      className="text-xs px-3 py-1 rounded-full border font-medium"
      style={{ backgroundColor: bg, borderColor: border, color }}
    >
      {children}
    </span>
  );
}

function KpiCard({
  label,
  value,
  sub,
  bg,
  border,
  primary,
  text,
}: {
  label: string;
  value: string;
  sub?: string;
  bg: string;
  border: string;
  primary: string;
  text: string;
}) {
  return (
    <div
      className="rounded-2xl border p-5 sm:p-6 shadow-sm backdrop-blur transition hover:translate-y-[-1px]"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <div className="text-sm" style={{ color: hexToRgba(text, 0.75) }}>
        {label}
      </div>

      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="text-2xl font-bold" style={{ color: primary }}>
          {value}
        </div>
        {/* déco: mini “sparkline” bar */}
        <div
          className="h-2 w-20 rounded-full overflow-hidden border"
          style={{ borderColor: hexToRgba(primary, 0.25), backgroundColor: hexToRgba(primary, 0.08) }}
          aria-hidden
        >
          <div className="h-full w-[60%]" style={{ backgroundColor: hexToRgba(primary, 0.45) }} />
        </div>
      </div>

      {sub && (
        <div className="mt-2 text-xs" style={{ color: hexToRgba(text, 0.6) }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { mode } = useThemeMode();
  const cfg = loadThemeConfig();
  const isDark = mode === "dark";

  const primary =
    (isDark ? cfg.colour_dark_primary : cfg.colour_light_primary) ?? cfg.colour_light_primary;
  const secondary =
    (isDark ? cfg.colour_dark_secondary : cfg.colour_light_secondary) ?? cfg.colour_light_secondary;
  const bg =
    (isDark ? cfg.colour_dark_background : cfg.colour_light_background) ?? cfg.colour_light_background;
  const text =
    (isDark ? cfg.colour_dark_text : cfg.colour_light_text) ?? cfg.colour_light_text;

  const cardBg = hexToRgba(bg, isDark ? 0.65 : 0.78);
  const subtleText = hexToRgba(text, 0.75);
  const chipBg = hexToRgba(primary, 0.10);
  const chipText = primary;
  const chipBorder = hexToRgba(primary, 0.35);

  const name = user?.full_name ?? t("dashboard.anonymous", "Anonyme");
  const role = user?.role ? String(user.role) : t("dashboard.roleUnknown", "Utilisateur");

  // placeholders (brancher API plus tard)
  const kpis: Kpi[] = [
    { label: t("dashboard.kpi.surveys", "Questionnaires"), value: "—", sub: t("dashboard.kpi.surveysSub", "Publiés / Brouillons") },
    { label: t("dashboard.kpi.questions", "Questions"), value: "—", sub: t("dashboard.kpi.questionsSub", "Nombre total de questions") },
    { label: t("dashboard.kpi.answers", "Réponses"), value: "—", sub: t("dashboard.kpi.answersSub", "Réponses validées") },
    { label: t("dashboard.kpi.places", "Lieux suisses"), value: "—", sub: t("dashboard.kpi.placesSub", "Cantons / Districts / Communes") },
  ];

  // faux data (juste pour le rendu)
  const coverage = 76; // 0..100

  return (
    <section className="space-y-6" style={{ color: text }}>
      {/* HERO HEADER (plus premium) */}
      <div
        className="rounded-3xl border p-5 sm:p-6 backdrop-blur"
        style={{
          borderColor: secondary,
          background: `linear-gradient(135deg, ${hexToRgba(primary, 0.16)}, ${hexToRgba(bg, isDark ? 0.65 : 0.78)})`,
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate" style={{ color: primary }}>
              {t("dashboard.title", "Tableau de bord")}
            </h1>
            <p className="mt-1" style={{ color: subtleText }}>
              {role
                ? t("dashboard.welcomeWithRole", { name, role })
                : t("dashboard.welcome", { name })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Pill bg={chipBg} border={chipBorder} color={chipText}>
              {t("dashboard.role", "Rôle")}: {role}
            </Pill>
            <Pill bg={"transparent"} border={secondary} color={subtleText}>
              {t("dashboard.env", "Environnement")}: {t("dashboard.envValue", "Dev")}
            </Pill>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard
            key={k.label}
            label={k.label}
            value={k.value}
            sub={k.sub}
            bg={cardBg}
            border={secondary}
            primary={primary}
            text={text}
          />
        ))}
      </div>

      {/* ROW: Couverture + Accès direct */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Couverture */}
        <Card bg={cardBg} border={secondary}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm" style={{ color: subtleText }}>
                {t("dashboard.chart2.label", "Traductions")}
              </div>
              <div className="mt-1 font-semibold" style={{ color: primary }}>
                {t("dashboard.chart2.title", "Couverture")}
              </div>
              <div className="mt-1 text-xs" style={{ color: hexToRgba(text, 0.6) }}>
                {t("dashboard.chart2.sub", "EN / FR / DE / IT / RM")}
              </div>
            </div>

            <Pill bg={hexToRgba(primary, 0.10)} border={hexToRgba(primary, 0.25)} color={primary}>
              {coverage}%
            </Pill>
          </div>

          <div className="mt-5 flex items-center justify-center">
            <Donut
              value={coverage}
              color={primary}
              track={hexToRgba(secondary, 0.45)}
              textColor={text}
              label={t("dashboard.chart2.centerLabel", "couverture")}
            />
          </div>

          <div className="mt-3 text-xs text-center" style={{ color: hexToRgba(text, 0.65) }}>
            {t("dashboard.chart2.note", "Plus tard : calculer le pourcentage via les tables de traduction.")}
          </div>
        </Card>

        {/* Accès direct (plus “cards”) */}
        <div className="xl:col-span-2">
          <Card bg={cardBg} border={secondary}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm" style={{ color: subtleText }}>
                  {t("dashboard.quickActions.label", "Actions rapides")}
                </div>
                <div className="mt-1 font-semibold" style={{ color: primary }}>
                  {t("dashboard.quickActions.title", "Accès direct")}
                </div>
              </div>

              <div className="text-xs" style={{ color: hexToRgba(text, 0.6) }}>
                {t("dashboard.quickActions.note", "Raccourcis vers les sections principales")}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/admin/surveys/new"
                className="rounded-2xl border p-4 transition hover:translate-y-[-1px]"
                style={{
                  borderColor: hexToRgba(primary, 0.35),
                  backgroundColor: hexToRgba(primary, 0.10),
                  color: primary,
                }}
              >
                <div className="text-sm font-semibold">{t("dashboard.quickActions.newSurvey", "Créer un questionnaire")}</div>
                <div className="mt-1 text-xs" style={{ color: hexToRgba(text, 0.65) }}>
                  {t("dashboard.quickActions.newSurveySub", "Nouveau formulaire")}
                </div>
              </Link>

              <Link
                to="/admin/qps"
                className="rounded-2xl border p-4 transition hover:translate-y-[-1px]"
                style={{
                  borderColor: secondary,
                  backgroundColor: "transparent",
                  color: primary,
                }}
              >
                <div className="text-sm font-semibold">{t("dashboard.quickActions.manageQuestions", "Gérer les questions")}</div>
                <div className="mt-1 text-xs" style={{ color: hexToRgba(text, 0.65) }}>
                  {t("dashboard.quickActions.manageQuestionsSub", "Banque de questions")}
                </div>
              </Link>

              <Link
                to="/admin/places/communes"
                className="rounded-2xl border p-4 transition hover:translate-y-[-1px]"
                style={{
                  borderColor: secondary,
                  backgroundColor: "transparent",
                  color: primary,
                }}
              >
                <div className="text-sm font-semibold">{t("dashboard.quickActions.browsePlaces", "Communes suisses")}</div>
                <div className="mt-1 text-xs" style={{ color: hexToRgba(text, 0.65) }}>
                  {t("dashboard.quickActions.browsePlacesSub", "Données géographiques")}
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* ROW: Vérifications + Tâches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vérifications */}
        <Card bg={cardBg} border={secondary}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm" style={{ color: subtleText }}>
                {t("dashboard.health.label", "Système")}
              </div>
              <div className="mt-1 font-semibold" style={{ color: primary }}>
                {t("dashboard.health.title", "Vérifications")}
              </div>
            </div>

            <Pill bg={hexToRgba(primary, 0.10)} border={hexToRgba(primary, 0.25)} color={primary}>
              {t("dashboard.health.status", "Statut")}
            </Pill>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            {[
              { label: t("dashboard.health.db", "Base de données"), status: t("dashboard.health.ok", "OK"), kind: "ok" as const },
              { label: t("dashboard.health.config", "Configuration"), status: t("dashboard.health.ok", "OK"), kind: "ok" as const },
              { label: t("dashboard.health.translations", "Traductions"), status: t("dashboard.health.todo", "À faire"), kind: "todo" as const },
            ].map((row) => {
              const ok = row.kind === "ok";
              const badgeBg = ok ? hexToRgba(primary, 0.12) : hexToRgba("#f59e0b", 0.15);
              const badgeColor = ok ? primary : "#f59e0b";
              return (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <span style={{ color: subtleText }}>{row.label}</span>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: badgeBg, color: badgeColor }}>
                    {row.status}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ backgroundColor: hexToRgba(primary, 0.10) }}>
            <div className="h-full w-[70%]" style={{ backgroundColor: hexToRgba(primary, 0.45) }} />
          </div>

          <div className="mt-3 text-xs" style={{ color: hexToRgba(text, 0.6) }}>
            {t("dashboard.health.note", "Plus tard : brancher un endpoint /systéme simple.")}
          </div>
        </Card>

        {/* Tâches en cours */}
        <Card bg={cardBg} border={secondary}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm" style={{ color: subtleText }}>
                {t("dashboard.tasks.label", "Organisation")}
              </div>
              <div className="mt-1 font-semibold" style={{ color: primary }}>
                {t("dashboard.tasks.title", "Tâches en cours")}
              </div>
            </div>

            <Pill bg={hexToRgba(primary, 0.10)} border={hexToRgba(primary, 0.25)} color={primary}>
              3
            </Pill>
          </div>

          <ul className="mt-4 space-y-3 text-sm" style={{ color: subtleText }}>
            {[
              t("dashboard.tasks.li1", "Créer /dashboard/stats (compteurs par table)."),
              t("dashboard.tasks.li2", "Calculer la couverture des traductions (clés manquantes)."),
              t("dashboard.tasks.li3", "Ajouter un endpoint /health (DB + config)."),
            ].map((task) => (
              <li key={task} className="flex gap-3 items-start">
                <span
                  className="mt-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: hexToRgba(primary, 0.85) }}
                  aria-hidden
                />
                <span className="leading-relaxed">{task}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 text-xs" style={{ color: hexToRgba(text, 0.6) }}>
            {t("dashboard.tasks.note", "Liste statique pour l’instant a rendre dynamique plus tard.")}
          </div>
        </Card>
      </div>
    </section>
  );
}
