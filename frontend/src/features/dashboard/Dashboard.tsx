// Tableau de bord (zone privée) : affiche l’utilisateur connecté et pour l'instant un bouton de déconnexion
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { hexToRgba } from "@/utils/color";
import { useTheme } from "@/theme/useTheme";
import { Card, Donut, Pill, KpiCard, type Kpi } from "@/utils/UI";


export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { primary, textColor, borderColor, hoverText05, hoverText07, hoverPrimary10, hoverPrimary15, hoverPrimary30, hoverPrimary90, cardBg } = useTheme();

  const name = user?.full_name ?? t("dashboard.anonymous", "Anonyme");
  const role = user?.role ? String(user.role) : t("dashboard.roleUnknown", "Utilisateur");

  // placeholders KPI
  const kpis: Kpi[] = [
    { label: t("dashboard.kpi.surveys", "Questionnaires"), value: "—", sub: t("dashboard.kpi.surveysSub", "Publiés / Brouillons") },
    { label: t("dashboard.kpi.questions", "Questions"), value: "—", sub: t("dashboard.kpi.questionsSub", "Nombre total de questions") },
    { label: t("dashboard.kpi.answers", "Réponses"), value: "—", sub: t("dashboard.kpi.answersSub", "Réponses validées") },
    { label: t("dashboard.kpi.places", "Lieux suisses"), value: "—", sub: t("dashboard.kpi.placesSub", "Cantons / Districts / Communes") },
  ];

  // faux data (juste pour le rendu)
  const coverage = 76; // 0..100

  const quickLinkCls = `
    rounded-2xl border p-4
    transition
    hover:-translate-y-0.5
    hover:bg-[var(--qa-bg)]
    hover:border-[var(--qa-border)]
    hover:text-[var(--qa-text)]
  `;

  return (
    <section className="space-y-6" style={{ color: textColor }}>
      {/* HERO HEADER (plus premium) */}
      <div
        className="rounded-3xl border p-5 sm:p-6 backdrop-blur"
        style={{
          borderColor: borderColor,
          background: `linear-gradient(135deg, ${hoverPrimary15}, ${cardBg})`,
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate" style={{ color: primary }}>
              {t("dashboard.title", "Tableau de bord")}
            </h1>
            <p className="mt-1" style={{ color: hoverText07 }}>
              {role
                ? t("dashboard.welcomeWithRole", { name, role })
                : t("dashboard.welcome", { name })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Pill bg={hoverPrimary10} border={hoverPrimary15} color={primary}>
              {t("dashboard.role", "Rôle")}: {role}
            </Pill>
            <Pill bg={"transparent"} border={borderColor} color={hoverText07}>
              {t("dashboard.env", "Environnement")}: {t("dashboard.envValue", "Dev")}
            </Pill>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} />
        ))}
      </div>

      {/* ROW: Couverture + Accès direct */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Couverture */}
        <Card bg={cardBg} border={borderColor}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm" style={{ color: hoverText07 }}>
                {t("dashboard.chart2.label", "Traductions")}
              </div>
              <div className="mt-1 font-semibold" style={{ color: primary }}>
                {t("dashboard.chart2.title", "Couverture")}
              </div>
              <div className="mt-1 text-xs" style={{ color: hoverText05 }}>
                {t("dashboard.chart2.sub", "EN / FR / DE / IT / RM")}
              </div>
            </div>

            <Pill bg={hoverPrimary10} border={hoverPrimary30} color={primary}>
              {coverage}%
            </Pill>
          </div>

          <div className="mt-5 flex items-center justify-center">
            <Donut value={coverage} label={t("dashboard.chart2.centerLabel", "couverture")} />
          </div>

          <div className="mt-3 text-xs text-center" style={{ color: hoverText07 }}>
            {t("dashboard.chart2.note", "Plus tard : calculer le pourcentage via les tables de traduction.")}
          </div>
        </Card>

        {/* Accès direct (plus “cards”) */}
        <div className="xl:col-span-2">
          <Card bg={cardBg} border={borderColor}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm" style={{ color: hoverText07 }}>
                  {t("dashboard.quickActions.label", "Actions rapides")}
                </div>
                <div className="mt-1 font-semibold" style={{ color: primary }}>
                  {t("dashboard.quickActions.title", "Accès direct")}
                </div>
              </div>

              <div className="text-xs" style={{ color: hoverText05 }}>
                {t("dashboard.quickActions.note", "Raccourcis vers les sections principales")}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1) Créer un questionnaire */}
              <Link
                to="/admin/surveys/new"
                style={
                  {
                    // couleurs dynamiques venant de ton thème
                    "--qa-bg": hoverPrimary10,
                    "--qa-border": hoverPrimary30,
                    "--qa-text": primary,
                  } as React.CSSProperties
                }
                className={quickLinkCls}
              >
                <div className="text-sm font-semibold">
                  {t("dashboard.quickActions.newSurvey", "Créer un questionnaire")}
                </div>
                <div className="mt-1 text-xs opacity-70">
                  {t("dashboard.quickActions.newSurveySub", "Nouveau formulaire")}
                </div>
              </Link>

              {/* 2) Gérer les questions */}
              <Link
                to="/admin/qps"
                style={
                  {
                    "--qa-bg": hoverPrimary10,
                    "--qa-border": hoverPrimary30,
                    "--qa-text": primary,
                  } as React.CSSProperties
                }
                className={quickLinkCls}
              >
                <div className="text-sm font-semibold">
                  {t("dashboard.quickActions.manageQuestions", "Gérer les questions")}
                </div>
                <div className="mt-1 text-xs opacity-70">
                  {t("dashboard.quickActions.manageQuestionsSub", "Banque de questions")}
                </div>
              </Link>

              {/* 3) Communes suisses */}
              <Link
                to="/admin/places/communes"
                style={
                  {
                    "--qa-bg": hoverPrimary10,
                    "--qa-border": hoverPrimary30,
                    "--qa-text": primary,
                  } as React.CSSProperties
                }
                className={quickLinkCls}
              >
                <div className="text-sm font-semibold">
                  {t("dashboard.quickActions.browsePlaces", "Communes suisses")}
                </div>
                <div className="mt-1 text-xs opacity-70">
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
        <Card bg={cardBg} border={borderColor}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm" style={{ color: hoverText07 }}>
                {t("dashboard.health.label", "Système")}
              </div>
              <div className="mt-1 font-semibold" style={{ color: primary }}>
                {t("dashboard.health.title", "Vérifications")}
              </div>
            </div>

            <Pill bg={hoverPrimary10} border={hoverPrimary30} color={primary}>
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
              const badgeBg = ok ? hoverPrimary10 : hexToRgba("#f59e0b", 0.15);
              const badgeColor = ok ? primary : "#f59e0b";
              return (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <span style={{ color: hoverText07 }}>{row.label}</span>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: badgeBg, color: badgeColor }}>
                    {row.status}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ backgroundColor: hoverPrimary10 }}>
            <div className="h-full w-[70%]" style={{ backgroundColor: hoverPrimary30 }} />
          </div>

          <div className="mt-3 text-xs" style={{ color: hoverText05 }}>
            {t("dashboard.health.note", "Plus tard : brancher un endpoint /systéme.")}
          </div>
        </Card>

        {/* Tâches en cours */}
        <Card bg={cardBg} border={borderColor}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm" style={{ color: hoverText07 }}>
                {t("dashboard.tasks.label", "Organisation")}
              </div>
              <div className="mt-1 font-semibold" style={{ color: primary }}>
                {t("dashboard.tasks.title", "Tâches en cours")}
              </div>
            </div>

            <Pill bg={hoverPrimary10} border={hoverPrimary30} color={primary}>
              3
            </Pill>
          </div>

          <ul className="mt-4 space-y-3 text-sm" style={{ color: hoverText07 }}>
            {[
              t("dashboard.tasks.li1", "Créer /dashboard/stats (compteurs par table)."),
              t("dashboard.tasks.li2", "Calculer la couverture des traductions (clés manquantes)."),
              t("dashboard.tasks.li3", "Ajouter un endpoint /health (DB + config)."),
            ].map((task) => (
              <li key={task} className="flex gap-3 items-start">
                <span
                  className="mt-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: hoverPrimary90 }}
                  aria-hidden
                />
                <span className="leading-relaxed">{task}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 text-xs" style={{ color: hoverText05 }}>
            {t("dashboard.tasks.note", "Liste statique pour l’instant a rendre dynamique plus tard.")}
          </div>
        </Card>
      </div>
    </section>
  );
}
