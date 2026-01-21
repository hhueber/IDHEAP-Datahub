import EntityShow from "@/components/EntityShow";
import { useParams, useNavigate } from "react-router-dom";
import { Entity } from "./show_type";

function getEntityEnum(entity: string | undefined): Entity | undefined {
  if (!entity) return undefined;
  return Object.values(Entity).find((e) => e.toLowerCase() === entity.toLowerCase());
}

export default function ShowPage() {
  const params = useParams();
  const navigate = useNavigate();
  const entity = getEntityEnum(params.entity);
  const id = params.id ? Number(params.id) : null;

  if (!entity || !id) return null;

  return (
    <EntityShow
      id={id}
      entity={entity}
      onEdit={(e, i) => {
        // TODO: plus tard: route edit dédiée
        console.log("EDIT", e, i);
      }}
      onDelete={(e, i) => {
        // TODO: plus tard: confirm modal + delete endpoint
        console.log("DELETE", e, i);
      }}
    />
  );
}
