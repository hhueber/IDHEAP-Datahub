import { CommuneItem, CommuneResponse } from "@/features/pageShow/show_type";
import { apiFetch } from "@/shared/apiFetch";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type PageAllProps = {
  id: number;
};

export default function CommunePageShow({ id }: PageAllProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [commune, setCommune] = useState<CommuneItem>();

  const loadCommune = useCallback(
    async (id: number) => {
      // setLoading(true);
      const json = await apiFetch<CommuneResponse>(`/show/commune/${id}`);
      if (json.data) setCommune(json.data);
    },
    [id]
  );

  useEffect(() => {
    loadCommune(id);
  }, [id]);

  return (
    <div className="w-full h-full flex gap-x-10 ">
      <div className="w-2/3 bg-transparent h-full flex flex-col gap-y-5">
        <div className="bg-gray-50 p-6 rounded-xl outline flex-grow outline-black/25 shadow-lg">
          <h2 className="text-5xl pt-2 pb-6 text-center text-gray-800 border-b border-gray-300 mb-6">
            {commune?.name}
          </h2>

          <div className="grid grid-cols-[150px_1fr] gap-x-6 gap-y-3 text-lg">
            <p className="font-semibold text-gray-600">Uid</p>
            <p className="text-gray-800">{commune?.uid}</p>

            <p className="font-semibold text-gray-600">Code</p>
            <p className="text-gray-800">{commune?.code}</p>

            <div className="col-span-2 my-4 border-t border-gray-200"></div>

            <p className="font-semibold text-gray-600">Nom Allemand</p>
            <p className="text-gray-800 italic">{commune?.name_de || "N/A"}</p>

            <p className="font-semibold text-gray-600">Nom Français</p>
            <p className="text-gray-800 italic">{commune?.name_fr || "N/A"}</p>

            <p className="font-semibold text-gray-600">Nom Anglais</p>
            <p className="text-gray-800 italic">{commune?.name_en || "N/A"}</p>

            <p className="font-semibold text-gray-600">Nom Italien</p>
            <p className="text-gray-800 italic">{commune?.name_it || "N/A"}</p>

            <p className="font-semibold text-gray-600">Nom Romanche</p>
            <p className="text-gray-800 italic">{commune?.name_ro || "N/A"}</p>

            {/* ...etc. */}
          </div>
        </div>

        {/* 1.2. SOUS-PANNEAU DU BAS */}
        <div className="bg-gray-50 p-4 rounded-xl outline flex-grow outline-black/25">
          {/* flex-grow pour partager la hauteur */}
          <h3 className="text-3xl text-gray-700">Children</h3>
          <p className="mt-4">Et la on mets les enfants</p>
        </div>
      </div>

      {/* 3. Enfant 2 : Prend 1/3 de la largeur du parent */}
      <div className="w-1/3 bg-gray-50 h-full p-4 rounded-xl outline outline-black/25">
        Carte, stat, info
      </div>
    </div>
  );
}
