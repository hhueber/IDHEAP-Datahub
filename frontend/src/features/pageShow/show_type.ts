export type CantonItem = {
  uid: number;
  code: string;
  name: string;
  ofs_id: number;
  name_de: string | null;
  name_fr: string | null;
  name_en: string | null;
  name_ro: string | null;
  name_it: string | null;
};

export type DistrictItem = {
  uid: number;
  code: string;
  name: string;
  name_de: string | null;
  name_fr: string | null;
  name_en: string | null;
  name_ro: string | null;
  name_it: string | null;
};

export type CommuneItem = {
  uid: number;
  code: string;
  name: string;
  name_de: string | null;
  name_fr: string | null;
  name_en: string | null;
  name_ro: string | null;
  name_it: string | null;
};

export type CommuneResponse = {
  success: boolean;
  detail: string;
  data: CommuneItem | null;
};

export type CantonResponse = {
  success: boolean;
  detail: string;
  data: CantonItem | null;
};

export type DistrictResponse = {
  success: boolean;
  detail: string;
  data: DistrictItem | null;
};
