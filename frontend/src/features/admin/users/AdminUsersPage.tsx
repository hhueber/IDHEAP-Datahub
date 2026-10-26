import React from "react";
import AdminDataTable from "@/components/table/AdminDataTable";
import Pagination from "@/utils/Pagination";
import { ConfirmModal } from "@/utils/ConfirmModal";
import { SearchBar } from "@/utils/SearchBar";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { adminUsersApi } from "@/services/admin";
import { getAssignableRoles, ROLE_LABELS, roleCanGrantRole, type PermissionRole } from "@/config/roles";
import type {AdminUser, AdminUserUpdatePayload} from "@/features/admin/users/adminUsersTypes";
import type { AdminColumnConfig } from "@/components/table/adminDataTableTypes";

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { user, can, refreshUser } = useAuth();
  const canReadProject = can("PROJECT", "READ");
  const canWriteProject = can("PROJECT", "WRITE");
  const canManageProject = can("PROJECT", "MANAGE");
  const [items, setItems] = React.useState<AdminUser[]>([]);
  const [page, setPage] = React.useState(1);
  const [perPage] = React.useState(20);
  const [totalPages, setTotalPages] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [activeSearch, setActiveSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminUser | null>(null);

  const assignableRoles = React.useMemo(
    () => getAssignableRoles(user?.role),
    [user?.role]
  );

  const loadUsers = React.useCallback(async () => {
    if (!canReadProject) return;

    setLoading(true);
    setError(null);

    try {
      const json = await adminUsersApi.list({
        page,
        perPage,
        orderBy: "last_name",
        orderDir: "asc",
        q: activeSearch,
      });

      if (!json.success) {
        throw new Error(json.detail);
      }

      setItems(json.data.items);
      setTotalPages(json.data.pages);
    } catch (e: any) {
      setError(e?.message || t("admin.users.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [activeSearch, canReadProject, page, perPage, t]);

  React.useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const columns = React.useMemo<AdminColumnConfig<AdminUser>[]>(
    () => [
      {
        key: "first_name",
        label: t("admin.users.firstName"),
        editable: canWriteProject,
        kind: "text",
      },
      {
        key: "last_name",
        label: t("admin.users.lastName"),
        editable: canWriteProject,
        kind: "text",
      },
      {
        key: "email",
        label: t("admin.users.email"),
        editable: canWriteProject,
        kind: "email",
      },
      {
        key: "role",
        label: t("admin.users.role"),
        editable: canWriteProject,
        kind: "select",
        options: assignableRoles.map((role) => ({
          value: role,
          label: ROLE_LABELS[role],
        })),
        render: (row) => ROLE_LABELS[row.role] ?? row.role,
      },
      {
        key: "created_at",
        label: t("admin.users.createdAt"),
        editable: false,
      },
    ],
    [assignableRoles, canWriteProject, t]
  );

  const saveUser = async (
    row: AdminUser,
    updates: Partial<AdminUser>
  ): Promise<void> => {
    const body: AdminUserUpdatePayload = {
      first_name: updates.first_name,
      last_name: updates.last_name,
      email: updates.email,
      role: updates.role as PermissionRole | undefined,
    };

    setSaving(true);
    setError(null);
    setMsg(null);

    try {
      const json = await adminUsersApi.update(row.id, body);

      if (!json.success) {
        throw new Error(json.detail);
      }

      setMsg(t("admin.users.updated"));
      await loadUsers();

      if (row.id === user?.id) {
        await refreshUser();
      }
    } catch (e: any) {
      setError(e?.message || t("admin.users.errors.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (): Promise<void> => {
    if (!deleteTarget) return;

    setError(null);
    setMsg(null);

    try {
      const json = await adminUsersApi.remove(deleteTarget.id);

      if (!json.success) {
        throw new Error(json.detail);
      }

      setMsg(t("admin.users.deleted"));
      setDeleteTarget(null);
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || t("admin.users.errors.deleteFailed"));
    }
  };

  return (
    <div className="p-6 flex flex-col h-full">
      <h1 className="text-xl font-semibold mb-4">
        {t("admin.users.title")}
      </h1>

      <SearchBar
        search={search}
        searchLoading={false}
        suggestions={[]}
        onSearchChange={(e) => {
          setSearch(e.target.value);
          setError(null);
          setMsg(null);
        }}
        onClearSearch={() => {
          setSearch("");
          setActiveSearch("");
          setPage(1);
        }}
        onSuggestionClick={() => undefined}
        onSearchSubmit={() => {
          setActiveSearch(search.trim());
          setPage(1);
        }}
      />

      {msg && (
        <div className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-green-700 text-sm">
          {msg}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mt-4">
        <AdminDataTable<AdminUser>
          rows={items}
          getRowId={(row) => row.id}
          columns={columns}
          page={page}
          perPage={perPage}
          loading={loading}
          saving={saving}
          labels={{
            actions: t("dashboardSidebar.pageAll.actions"),
            noData: t("dashboardSidebar.pageAll.noData"),
            save: t("dashboardSidebar.pageAll.save"),
            edit: t("dashboardSidebar.pageAll.edit"),
            cancel: t("common.cancel"),
            delete: t("dashboardSidebar.pageAll.delete"),
          }}
          actions={{
            edit: (row) =>
            canWriteProject && roleCanGrantRole(user?.role, row.role),
            delete: (row) =>
            canManageProject &&
            row.id !== user?.id &&
            roleCanGrantRole(user?.role, row.role),
          }}
          onSave={saveUser}
          onDelete={(row) => setDeleteTarget(row)}
        />
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={(nextPage) => setPage(nextPage)}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title={t("admin.users.confirmDeleteTitle")}
        message={t("admin.users.confirmDeleteMessage", {
          name: deleteTarget
            ? `${deleteTarget.first_name} ${deleteTarget.last_name}`
            : "",
        })}
        confirmLabel={t("dashboardSidebar.pageAll.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={deleteUser}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
