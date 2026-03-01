from zipfile import ZipFile
import asyncio
import os
import tempfile as tf


from app.db import SessionLocal
from app.models import Canton, CantonMap, Commune, CommuneMap, Country, District, DistrictMap, Lake, LakeMap
from geoalchemy2.shape import from_shape
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform
from sqlalchemy import select
import fiona
import requests
import shapely.wkb


transformer = Transformer.from_crs("EPSG:2056", "EPSG:4326", always_xy=True)


async def populate_async_geo(is_demo: bool) -> None:
    has_country_populated = False
    if is_demo:
        years = [2017, 2023]
    else:
        years = [1988, 1994, 1998, 2005, 2009, 2017, 2023]
    async with SessionLocal() as session:
        for year in years:
            if year < 2016:
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
                                multi = transform(transformer.transform, multi)
                                print(bfs_number)
                                db_commune_map = CommuneMap(
                                    year=year,
                                    commune=db_commune,
                                    geo_data_type=feature["geometry"]["type"],
                                    geometry=from_shape(multi, srid=4326),
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
                                multi = transform(transformer.transform, multi)
                                db_canton_map = CantonMap(
                                    year=year,
                                    geo_data_type=feature["geometry"]["type"],
                                    geometry=from_shape(multi, srid=4326),
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
                                multi = transform(transformer.transform, multi)
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
                                    geometry=from_shape(multi, srid=4326),
                                    geo_data_type=feature["geometry"]["type"],
                                    district=db_district,
                                )
                                print(f">>>[{year}] INSERTING GEOMETRY DATA FOR DISTRICT {db_district.name}")
                                session.add(db_district_map)

                                await session.flush()

                        if "Lac" in layer:
                            for feature in src:

                                result = await session.execute(
                                    select(Lake).filter_by(code=str(feature["properties"]["SEENR"]))
                                )
                                db_lake = result.scalar_one_or_none()
                                if db_lake is None:
                                    db_lake = Lake(
                                        code=str(feature["properties"]["SEENR"]), name=feature["properties"]["SEENAME"]
                                    )
                                    session.add(db_lake)
                                    await session.flush()
                                    print(f">>> INSERTING LAKE {db_lake.name}")

                                multi = shapely.geometry.shape(feature["geometry"])
                                multi = transform(lambda x, y, z=None: (x, y), multi)
                                multi = transform(transformer.transform, multi)
                                db_lake_map = LakeMap(
                                    year=year,
                                    geometry=from_shape(multi, srid=4326),
                                    geo_data_type=feature["geometry"]["type"],
                                    lake=db_lake,
                                )
                                session.add(db_lake_map)
                                await session.flush()
                                print(f">>>[{year}] INSERTING LAKE GEODATA {db_lake.name}")

                                # We don't have data for years greater than 2016 so we used data from 2009
                                if year == 2009:
                                    for fake_year in [2017, 2023]:
                                        db_lake_map = LakeMap(
                                            year=fake_year,
                                            geometry=from_shape(multi, srid=4326),
                                            geo_data_type=feature["geometry"]["type"],
                                            lake=db_lake,
                                        )
                                        session.add(db_lake_map)
                                        await session.flush()
                                        print(f">>>[{fake_year}] INSERTING FAKE LAKE GEODATA {db_lake.name}")


if __name__ == "__main__":
    asyncio.run(populate_async_geo())
