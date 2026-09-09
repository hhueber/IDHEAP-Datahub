import EntityShow from "@/components/EntityShow";
import { useParams } from "react-router-dom";
import { Entity } from "./show_type";
import { useAuth } from "@/contexts/AuthContext";

function getEntityEnum(entity: string | undefined): Entity | undefined {
  if (!entity) return undefined;
  return Object.values(Entity).find((e) => e.toLowerCase() === entity.toLowerCase());
}

export default function ShowPage() {
  const params = useParams();
  const { can } = useAuth();
  const entity = getEntityEnum(params.entity);
  const id = params.id ? Number(params.id) : null;

  if (!entity || !id) return null;

  const permissions = {
    show: can("DATASET", "READ"),
    edit: can("DATASET", "WRITE"),
    delete: can("DATASET", "MANAGE"),
  };

  return (
    <EntityShow
      id={id}
      entity={entity}
      permissions={permissions}
      onEdit={(e, i) => {}}
      onDelete={(e, i) => {}}
    />
  );
}
