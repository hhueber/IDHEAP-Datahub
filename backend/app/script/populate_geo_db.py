from zipfile import ZipFile
import asyncio
import os
import tempfile as tf


from geoalchemy2.shape import from_shape
from shapely.geometry import shape
from shapely.ops import transform
from sqlalchemy import select
import fiona
import requests
import shapely.wkb


from backend.app.db import SessionLocal
from backend.app.models import Canton, CantonMap, Commune, CommuneMap, Country, District, DistrictMap


async def populate_async_geo() -> None:
    has_country_populated = False
    async with SessionLocal() as session:
        for year in [1988, 1994, 1998, 2005, 2009, 2017, 2023]:
            if year < 2016:
                year = year if year != 1988 else 1989  # Because we dont have data for 1988 but we have for 1989
                url = f"https://data.geo.admin.ch/ch.bfs.historisierte-administrative_grenzen_g0/historisierte-administrative_grenzen_g0_{year}-01-01/historisierte-administrative_grenzen_g0_{year}-01-01_2056.gpkg"
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
                            print(">>> INSERTING country shape")
                            has_country_populated = True

                        # Insertion of commune data
                        if "tlm_hoheitsgebiet" in layer and "Communes" in layer:
                            for feature in src:
                                if year < 2016:
                                    bfs_number = feature["properties"]["GDENR"]
                                else:
                                    bfs_number = feature["properties"]["bfs_nummer"]
                                print(str(bfs_number))
                                result = await session.execute(select(Commune).filter_by(code=str(bfs_number)))
                                db_commune = result.scalar_one_or_none()
                                func = lambda geom: shapely.wkb.loads(shapely.wkb.dumps(geom, output_dimension=2))
                                feature["geometry"] = feature["geometry"].apply(func)
                                multi = shape(feature["geometry"])
                                db_commune_map = CommuneMap(
                                    year=year,
                                    commune=db_commune,
                                    type=feature["geometry"]["type"],
                                    geometry=from_shape(multi, srid=2056),
                                )
                                print(f">>> INSERTING GEOMETRY DATA FOR {db_commune.name}")
                                session.add(db_commune_map)
                                await session.flush()

                        if "kanton" in layer and "Canton" in layer:
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
                                print(f">>> INSERTING GEOMETRY DATA FOR CANTON {db_canton.name}")
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
                                    canton_number = feature["properties"]["KTNR"]
                                    name = feature["properties"]["BEZNAME"]
                                    bfs_number = feature["properties"]["BEZNR"]

                                print(bfs_number)
                                result = await session.execute(select(District).filter_by(code="B" + str(bfs_number)))
                                db_district = result.scalar_one_or_none()
                                multi = shapely.geometry.shape(feature["geometry"])
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
                                print(f">>> INSERTING GEOMETRY DATA FOR DISTRICT {db_district.name}")
                                session.add(db_district_map)
                                await session.flush()


if __name__ == "__main__":
    asyncio.run(populate_async_geo())
