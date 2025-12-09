import CommunePageShow from "@/components/CommunePageShow";
import PageShow from "@/components/CommunePageShow";
import { useParams } from "react-router-dom";

export default function CommuneShowPage() {
  let params = useParams();
  console.log(params);
  if (params.id === undefined) return;
  return <CommunePageShow id={Number(params.id)} />;
}
