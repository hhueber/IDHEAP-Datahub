from zipfile import ZipFile
import asyncio
import os
import tempfile as tf


from geoalchemy2.shape import from_shape
from pandas.core.config_init import colheader_justify_doc
from shapely.geometry import shape
from shapely.ops import transform
from sqlalchemy import select
import fiona
import requests
import shapely.wkb


from backend.app.db import SessionLocal
from backend.app.models import Canton, CantonMap, Commune, CommuneMap, Country, District, DistrictMap, Lake, LakeMap


YEARS = [1988, 1994, 1998, 2005, 2009, 2017, 2023]

# The year where swisstopo changed their way to access data
THRESHOLD_YEAR = 2016

lac_number = 0


async def populate_async_geo() -> None:
    has_country_populated = False
    async with SessionLocal() as session:
        for year in [1988, 1994, 1998, 2005, 2009, 2017, 2023]:
            lac_number = 0
            print(f"year: {year}")
            if year < 2016:
                continue
                year = year if year != 1988 else 1989  # Because we dont have data for 1988 but we have for 1989
                url = f"https://data.geo.admin.ch/ch.bfs.historisierte-administrative_grenzen_g1/historisierte-administrative_grenzen_g1_{year}-01-01/historisierte-administrative_grenzen_g1_{year}-01-01_2056.gpkg"
            else:
                zip_file = tf.NamedTemporaryFile(suffix=".zip", delete=False, dir=".")
                url = f"https://data.geo.admin.ch/ch.swisstopo.swissboundaries3d/swissboundaries3d_{year}-01/swissboundaries3d_{year}-01_2056_5728.gpkg.zip"
                response = requests.get(url)
                zip_file.write(response.content)
                zip_file.close()
                with ZipFile(zip_file.name) as zip:
                    url = zip.namelist()[0]
                    zip.extractall()
                os.remove(zip_file.name)

            layers = fiona.listlayers(url)
            async with session.begin():

                for layer in layers:
                    with fiona.open(url, layer=layer) as src:
                        if "tlm_hoheitsgebiet" in layer:
                            for feature in src:
                                # if feature["properties"]["bezirksnummer"] is None and feature["properties"]["objektart"] == "Kantonsgebiet":
                                if "Lac de Joux " in feature["properties"]["name"]:
                                    print(feature["properties"])
                                if (
                                    feature["properties"]["see_flaeche"] > 0.0
                                    and feature["properties"]["objektart"] == "Kantonsgebiet"
                                ):
                                    lac_number += 1
                                    # print(feature["properties"])

                        continue
                        # Insertion of country boarderies
                        if "Country" in layer and not has_country_populated:
                            feat = src.get(1)
                            multi = shapely.geometry.shape(feat["geometry"])
                            db_country = Country(
                                geometry=from_shape(multi, srid=2056),
                            )
                            print(f">>>[{year}] INSERTING country shape")
                            has_country_populated = True

                        # Insertion of commune data
                        if "tlm_hoheitsgebiet" in layer or "Communes" in layer:
                            for feature in src:
                                if year < 2016:
                                    if (
                                        feature["properties"]["GDENR"] == 253
                                        or feature["properties"]["GARTE"] != 11
                                        or feature["properties"]["CODE_ISO"] != "CH"
                                    ):
                                        continue
                                    bfs_number = feature["properties"]["GDENR"]
                                else:
                                    # Si le type de l'objet est un lac (mais seulement la partie cantonale d'un lac, on passe
                                    if (
                                        feature["properties"]["objektart"] != "Gemeindegebiet"
                                        or feature["properties"]["icc"] != "CH"
                                    ):
                                        continue
                                    bfs_number = feature["properties"]["bfs_nummer"]
                                result = await session.execute(select(Commune).filter_by(code=str(bfs_number)))
                                db_commune = result.scalar_one_or_none()
                                multi = shape(feature["geometry"])
                                multi = transform(lambda x, y, z=None: (x, y), multi)
                                db_commune_map = CommuneMap(
                                    year=year,
                                    commune=db_commune,
                                    type=feature["geometry"]["type"],
                                    geometry=from_shape(multi, srid=2056),
                                )
                                print(f">>>[{year}] INSERTING GEOMETRY DATA FOR {db_commune.name}")
                                session.add(db_commune_map)
                                await session.flush()

                        if "kanton" in layer or "Canton" in layer:
                            for feature in src:
                                # Well beacuse in the pre 2016 dataset and post 2016 we dont have the same info we must do a little trick
                                if year < 2016:
                                    bfs_number = feature["properties"]["KTNR"]
                                else:
                                    bfs_number = feature["properties"]["kantonsnummer"]
                                result = await session.execute(select(Canton).filter_by(ofs_id=bfs_number))
                                db_canton = result.scalar_one_or_none()
                                multi = shapely.geometry.shape(feature["geometry"])
                                multi = transform(lambda x, y, z=None: (x, y), multi)
                                db_canton_map = CantonMap(
                                    year=year,
                                    type=feature["geometry"]["type"],
                                    geometry=from_shape(multi, srid=2056),
                                    canton=db_canton,
                                )
                                print(f">>>[{year}] INSERTING GEOMETRY DATA FOR CANTON {db_canton.name}")
                                session.add(db_canton_map)
                                await session.flush()

                        if "bezirk" in layer or "District" in layer:
                            # The bfs number isnt the same the geopackage
                            for feature in src:
                                if year < 2016:
                                    canton_number = feature["properties"]["KTNR"]
                                    bfs_number = feature["properties"]["BEZNR"]
                                    name = feature["properties"]["BEZNAME"]
                                else:
                                    canton_number = feature["properties"]["kantonsnummer"]
                                    name = feature["properties"]["name"]
                                    bfs_number = feature["properties"]["bezirksnummer"]

                                result = await session.execute(select(District).filter_by(code="B" + str(bfs_number)))
                                db_district = result.scalar_one_or_none()
                                multi = shapely.geometry.shape(feature["geometry"])
                                multi = transform(lambda x, y, z=None: (x, y), multi)
                                # If district not in db
                                if db_district is None:
                                    result = await session.execute(select(Canton).filter_by(ofs_id=canton_number))
                                    db_canton = result.scalar_one_or_none()
                                    db_district = District(
                                        code="B" + str(bfs_number),
                                        name=name,
                                        name_fr=name,
                                        name_en=name,
                                        name_de=name,
                                        name_ro=name,
                                        name_it=name,
                                        canton=db_canton,
                                    )
                                    print(f">>> INSERTING DISTRICT {db_district.name}")
                                    session.add(db_district)
                                    await session.flush()

                                db_district_map = DistrictMap(
                                    year=year,
                                    geometry=from_shape(multi, srid=2056),
                                    type=feature["geometry"]["type"],
                                    district=db_district,
                                )
                                print(f">>>[{year}] INSERTING GEOMETRY DATA FOR DISTRICT {db_district.name}")
                                session.add(db_district_map)
                                await session.flush()

                        if "Lac" in layer:

                            result = await session.execute(select(Lake).filter_by(code=feature["properties"]["SEENR"]))
                            db_lake = result.scalar_one_or_none()
                            if db_lake is None:
                                db_lake = Lake(
                                    code=feature["properties"]["SEENR"], name=feature["properties"]["SEENAME"]
                                )
                                session.add(db_lake)
                                await session.flush()
                                print(f">>> INSERTING LAKE {db_lake.name}")
                            multi = shapely.geometry.shape(feature["geometry"])
                            multi = transform(lambda x, y, z=None: (x, y), multi)
                            db_lake_map = LakeMap(
                                year=year,
                                geometry=from_shape(multi, srid=2056),
                                type=feature["geometry"]["type"],
                                lake=db_lake,
                            )
                            session.add(db_lake_map)
                            await session.flush()

            os.remove(url)
            print(f"lac count: {lac_number}")


if __name__ == "__main__":
    asyncio.run(populate_async_geo())
