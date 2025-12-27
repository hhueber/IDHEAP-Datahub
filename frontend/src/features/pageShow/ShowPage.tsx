import CommunePageShow from "@/components/EntityShow";
import EntityShow from "@/components/EntityShow";
import { useParams } from "react-router-dom";
import { Entity } from "./show_type";

function getEntityEnum(entity: string | undefined): Entity | undefined {
  if (entity == undefined) return undefined;
  return Object.values(Entity).find(
    (e) => e.toLowerCase() === entity.toLowerCase()
  );
}

export default function ShowPage() {
  let params = useParams();
  const entity = getEntityEnum(params.entity);
  console.log(params);
  if (params.id === undefined) return;
  if (entity === undefined) return;
  return <EntityShow id={Number(params.id)} entity={entity} />;
}
