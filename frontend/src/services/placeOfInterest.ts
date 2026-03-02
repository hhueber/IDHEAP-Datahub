import { makeConfigService } from "./configBase";

export type PlaceOfInterestDTO = {
  code?: string;
  default_name: string;
  name_fr?: string; name_de?: string; name_it?: string; name_ro?: string; name_en?: string;
  pos: [number, number];
};

export const PlaceOfInterestAPI = makeConfigService<PlaceOfInterestDTO>("/config/placeOfInterest");
