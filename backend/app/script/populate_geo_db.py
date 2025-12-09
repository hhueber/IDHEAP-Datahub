from zipfile import ZipFile
import asyncio
import logging
import os
import tempfile as tf


from app.data.cantons import CANTONS
from app.db import SessionLocal
from app.models import Canton, CantonMap, Commune, CommuneMap, Country, District, DistrictMap, Lake, LakeMap
from geoalchemy2.shape import from_shape
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform
from sqlalchemy import select
from tqdm import tqdm
import fiona
import requests
import shapely.wkb


logger = logging.getLogger(__name__)

transformer = Transformer.from_crs("EPSG:2056", "EPSG:4326", always_xy=True)


def extract_geo_package(url: str) -> str:
    """Extract the geopackage fetched from url

    Args:
        url (str): url to extract from
    """
    zip_file = tf.NamedTemporaryFile(suffix=".zip", delete=False, dir=".")
    response = requests.get(url)
    zip_file.write(response.content)
    zip_file.close()
    with ZipFile(zip_file.name) as zip:
        url = zip.namelist()[0]
        zip.extractall()
    os.remove(zip_file.name)
    return url


async def populate_async_geo() -> None:
    async with SessionLocal() as session:

        async with session.begin():
            for code, lang in tqdm(CANTONS.items(), total=len(CANTONS), desc="Processing cantons"):
                db_canton = Canton(
                    code=code,
                    name=lang["en"],
                    ofs_id=lang["ofs_id"],
                    name_de=lang["de"],
                    name_en=lang["en"],
                    name_fr=lang["fr"],
                    name_it=lang["it"],
                    name_ro=lang["ro"],
                )
                logging_message = f">>> CREATING CANTON {db_canton.name}"
                logger.info(logging_message)

                session.add(db_canton)

        for year in [1988, 1994, 1998, 2005, 2009, 2017, 2023]:
            if year < 2016:
                year = year if year != 1988 else 1989  # Because we dont have data for 1988 but we have for 1989
                url = f"https://data.geo.admin.ch/ch.bfs.historisierte-administrative_grenzen_g1/historisierte-administrative_grenzen_g1_{year}-01-01/historisierte-administrative_grenzen_g1_{year}-01-01_2056.gpkg"
            else:
                url = f"https://data.geo.admin.ch/ch.swisstopo.swissboundaries3d/swissboundaries3d_{year}-01/swissboundaries3d_{year}-01_2056_5728.gpkg.zip"
                url = extract_geo_package(url)

            layers = fiona.listlayers(url)

            # To ensure that we taking care of canton then district then commune
            if year < 2016:
                layers.reverse()

            async with session.begin():

                for layer in layers:

                    with fiona.open(url, layer=layer) as src:
                        if "bezirk" in layer or "District" in layer:
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
                                    logging_message = f">>> INSERTING DISTRICT {db_district.name}"
                                    logger.info(logging_message)
                                    session.add(db_district)
                                    await session.flush()

                                db_district_map = DistrictMap(
                                    year=year,
                                    geometry=from_shape(multi, srid=4326),
                                    geo_data_type=feature["geometry"]["type"],
                                    district=db_district,
                                )
                                logging_message = f">>>[{year}] INSERTING GEOMETRY DATA FOR DISTRICT {db_district.name}"
                                logger.info(logging_message)
                                session.add(db_district_map)

                                await session.flush()

                        # Insertion of commune data
                        # We scan layer by layer so its better to use an else if than consecutive if
                        elif "tlm_hoheitsgebiet" in layer or "Communes" in layer:
                            for feature in src:
                                if year < 2016:
                                    if (
                                        feature["properties"]["GDENR"] == 253
                                        or feature["properties"]["GARTE"] != 11
                                        or feature["properties"]["CODE_ISO"] != "CH"
                                    ):
                                        continue

                                    bfs_number = feature["properties"]["GDENR"]
                                    commune_name = feature["properties"]["GDENAME"]
                                    district_number = feature["properties"]["BEZNR"]
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
                                if db_commune is None:
                                    result = await session.execute(
                                        select(District).filter_by(code="B" + str(district_number))
                                    )
                                    db_district = result.scalar_one_or_none()
                                    db_commune = Commune(
                                        code=str(bfs_number),
                                        name=commune_name,
                                        name_fr=commune_name,
                                        name_en=commune_name,
                                        name_ro=commune_name,
                                        name_it=commune_name,
                                        name_de=commune_name,
                                        district=db_district,
                                    )
                                    session.add(db_commune)
                                multi = shape(feature["geometry"])
                                multi = transform(lambda x, y, z=None: (x, y), multi)
                                multi = transform(transformer.transform, multi)
                                db_commune_map = CommuneMap(
                                    year=year,
                                    commune=db_commune,
                                    geo_data_type=feature["geometry"]["type"],
                                    geometry=from_shape(multi, srid=4326),
                                )
                                logging_message = f">>>[{year}] INSERTING GEOMETRY DATA FOR {db_commune.name}"
                                logger.info(logging_message)
                                session.add(db_commune_map)
                                await session.flush()

                        elif "kanton" in layer or "Canton" in layer:
                            for feature in src:
                                # Well because in the pre 2016 dataset and post 2016 we don't have the same info we must do a little trick
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
                                logging_message = f">>>[{year}] INSERTING GEOMETRY DATA FOR CANTON {db_canton.name}"
                                logger.info(logging_message)
                                session.add(db_canton_map)
                                await session.flush()

                        elif "Lac" in layer:
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
                                    logging_message = f">>> INSERTING LAKE {db_lake.name}"
                                    logger.info(logging_message)

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
                                logging_message = f">>>[{year}] INSERTING LAKE GEODATA {db_lake.name}"
                                logger.info(logging_message)

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
                                        logging_message = f">>>[{fake_year}] INSERTING FAKE LAKE GEODATA {db_lake.name}"
                                        logger.info(logging_message)


if __name__ == "__main__":
    asyncio.run(populate_async_geo())
