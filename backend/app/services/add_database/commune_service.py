from typing import Any, Dict, List
from zipfile import ZipFile
import os
import tempfile as tf
import xml.etree.ElementTree as ET


from app.models.canton import Canton
from app.models.canton_map import CantonMap
from app.models.commune import Commune
from app.models.commune_map import CommuneMap
from app.models.district import District
from app.models.district_map import DistrictMap
from geoalchemy2.shape import from_shape
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import fiona
import pandas as pd
import requests


transformer = Transformer.from_crs("EPSG:2056", "EPSG:4326", always_xy=True)


def dl_extract_commune_data(url: str, temp_dir: str = ".") -> str:
    zip_file = tf.NamedTemporaryFile(suffix=".zip", delete=False, dir=temp_dir)
    response = requests.get(url)
    zip_file.write(response.content)
    zip_file.close()
    with ZipFile(zip_file.name) as zip:
        xml_files = [
            f for f in zip.namelist() if f.lower().endswith(".xml") and ("1.2.0/" in f or f.startswith("1.2.0"))
        ]
        zip.extractall(members=xml_files)
    os.remove(zip_file.name)
    return xml_files[0]


def get_xml_root(url: str) -> ET.Element:
    xml_file = dl_extract_commune_data(url)
    tree = ET.parse(xml_file)
    return tree.getroot()


def get_canton_mapping(root: ET.Element) -> Dict[int, Any]:
    canton_mapping = {}
    for canton in root.findall("./cantons/canton"):
        canton_id = int(canton.find("cantonId").text)
        canton_name = canton.find("cantonLongName").text
        canton_code = canton.find("cantonAbbreviation").text

        if canton_id not in canton_mapping:
            canton_mapping[canton_id] = {"ofs_id": canton_id, "code": canton_code, "name": canton_name}
    return canton_mapping


def get_district_mapping(root: ET.Element) -> Dict[int, Any]:
    district_mapping = {}

    for district in root.findall("./districts/district"):
        canton_id = int(district.find("cantonId").text)
        district_id = int(district.find("districtHistId").text)
        district_ofs = "B" + district.find("districtId").text
        district_name = district.find("districtLongName").text

        if district_id not in district_mapping:
            district_mapping[district_id] = {
                "code": district_ofs,
                "name": district_name,
                "canton_bfs": canton_id,
            }

    return district_mapping


def get_commune_mapping(root: ET.Element) -> Dict[int, Any]:
    commune_mapping = {}

    for commune in root.findall("./municipalities/municipality"):
        district_id = int(commune.find("districtHistId").text)
        commune_id = commune.find("municipalityId").text
        commune_name = commune.find("municipalityLongName").text

        if commune_id not in commune_mapping:
            commune_mapping[commune_id] = {"name": commune_name, "district_id": district_id}

    return commune_mapping


async def insert_canton(db: AsyncSession, canton_mapping: Dict[int, Any]) -> List[Canton]:
    result = await db.execute(select(Canton.ofs_id))
    existing_canton_ofs = set(result.scalars().all())

    canton_to_insert = []

    for _, data in canton_mapping.items():
        if data["ofs_id"] not in existing_canton_ofs:
            new_canton = Canton(code=str(data["code"]), ofs_id=data["ofs_id"], name=data["name"])
            canton_to_insert.append(new_canton)
            db.add(new_canton)

    if canton_to_insert:
        await db.commit()

    final_result = await db.execute(select(Canton))
    return list(final_result.scalars().all())


async def insert_district(db: AsyncSession, district_mapping: Dict[int, Any], cantons: List[Canton]) -> List[District]:
    result = await db.execute(select(District.hist_id))
    existing_district_code = set(result.scalars().all())
    district_to_insert = []
    existing_codde = set()

    for district_id, data in district_mapping.items():
        if district_id not in existing_district_code:
            bfs_code = data["canton_bfs"]

            canton_found = None

            for canton in cantons:
                if canton.ofs_id == bfs_code:
                    canton_found = canton
                    break

            if canton_found:
                new_district = District(code=data["code"], name=data["name"], canton=canton_found, hist_id=district_id)
                db.add(new_district)
                district_to_insert.append(new_district)

    if district_to_insert:
        await db.commit()

    final_result = await db.execute(select(District))
    return list(final_result.scalars().all())


async def insert_commune(db: AsyncSession, commune_mapping: Dict[int, Any], districts: List[District]) -> List[Commune]:
    result = await db.execute(select(Commune.code))
    existing_commune_code = set(result.scalars().all())

    commune_to_insert = []

    for commune_id, data in commune_mapping.items():
        if commune_id not in existing_commune_code:
            district_id = data["district_id"]

            district_found = None

            for district in districts:
                district.hist_id == district_id
                if district.hist_id == district_id:
                    district_found = district

            if district_found:
                new_commune = Commune(code=commune_id, name=data["name"], district=district_found)
                db.add(new_commune)
                commune_to_insert.append(new_commune)
            else:
                print(f"PROBLEM WITH COMMUNE {data["name"]} NO DISTRICT")

    if commune_to_insert:
        await db.commit()

    final_result = await db.execute(select(Commune))
    return list(final_result.scalars().all())


async def add_update_geo_data(db: AsyncSession, years: List[int]):
    root = get_xml_root("https://www.agvchapp.bfs.admin.ch/file/xml/dz-b-00.04-hgv-02.zip")

    canton_mapping = get_canton_mapping(root)

    district_mapping = get_district_mapping(root)

    commune_mapping = get_commune_mapping(root)

    list_canton = await insert_canton(db, canton_mapping)

    list_district = await insert_district(db, district_mapping, list_canton)

    list_commune = await insert_commune(db, commune_mapping, list_district)

    result = await db.execute(select(CantonMap.year).distinct().order_by(CantonMap.year))
    years_in_db = result.scalars().all()

    existing_set = set(years_in_db)

    years_to_process = [y for y in years if y not in existing_set]
    for year in years_to_process:
        await add_commune_geodata_for_year(db, year, list_commune, list_district, list_canton)


def extract_geo_package(url: str, tempdir: str) -> str:
    """Extract the geopackage fetched from url

    Args:
        url (str): url to extract from
    """
    zip_file = tf.NamedTemporaryFile(suffix=".zip", delete=False, dir=tempdir)
    response = requests.get(url)
    zip_file.write(response.content)
    zip_file.close()
    with ZipFile(zip_file.name) as zip:
        url = zip.namelist()[0]
        zip.extractall()
    os.remove(zip_file.name)
    return url


def get_geodata_url(year: int) -> str:
    if year < 2016:
        url = f"https://data.geo.admin.ch/ch.bfs.historisierte-administrative_grenzen_g1/historisierte-administrative_grenzen_g1_{year}-01-01/historisierte-administrative_grenzen_g1_{year}-01-01_2056.gpkg"
    else:
        url = f"https://data.geo.admin.ch/ch.swisstopo.swissboundaries3d/swissboundaries3d_{year}-01/swissboundaries3d_{year}-01_2056_5728.gpkg.zip"

    return url


async def get_closest_year(db: AsyncSession, target_year: int):
    distinct_year_req = select(CommuneMap.year).distinct()
    result = await db.execute(distinct_year_req)
    available_years = [row[0] for row in result.all()]

    if not available_years:
        raise ValueError("Cannot find years")

    closest_year = min(available_years, key=lambda y: abs(y - target_year))
    return closest_year


async def get_commune_mapping_year(db: AsyncSession, year: int):
    target_year = 1989 if year == 1988 else year

    year_existing_req = select(CommuneMap.year == target_year).limit(1)
    year_existing_result = await db.execute(year_existing_req)

    if year_existing_result.scalar_one_or_none() is None:
        query_year = await get_closest_year(db, target_year)
    else:
        query_year = target_year

    query = (
        select(Commune.uid, Commune.code)
        .join(CommuneMap, Commune.uid == CommuneMap.commune_uid)
        .filter(CommuneMap.year == query_year)
    )

    result = await db.execute(query)
    return {row.code: row.uid for row in result.all()}


async def add_commune_geodata_for_year(
    db: AsyncSession, year: int, communes: List[Commune], districts: List[District], cantons: List[Canton]
):
    url = get_geodata_url(year)

    commune_map = {int(commune.code): commune for commune in communes}
    district_map = {district.code: district for district in districts}
    cantons_map = {canton.ofs_id: canton for canton in cantons}

    if year < 2016:
        url = extract_geo_package(url, ".")

    layers = fiona.listlayers(url)

    if year < 2016:
        layers.reverse()

    for layer in layers:

        with fiona.open(url, layer=layer) as src:
            if "tlm_hoheitsgebiet" in layer or "Communes" in layer:
                for feature in src:
                    props = feature.get("properties")
                    if year < 2016:
                        if props.get("GDENR") == 253 or props.get("GARTE") != 11 or props.get("CODE_ISO") != "CH":
                            continue

                        bfs_number = props.get("GDENR")
                    else:
                        if props.get("objektart") != "Gemeindegebiet" or props.get("icc") != "CH":
                            continue

                        bfs_number = props.get("bfs_nummer")

                    commune = commune_map.get(bfs_number)
                    multi = shape(feature["geometry"])
                    multi = transform(lambda x, y, z=None: (x, y), multi)
                    multi = transform(transformer.transform, multi)
                    db_commune_map = CommuneMap(
                        year=year,
                        commune=commune,
                        geo_data_type=feature["geometry"]["type"],
                        geometry=from_shape(multi, srid=4326),
                    )
                    db.add(db_commune_map)

                await db.commit()

            if "kanton" in layer or "Canton" in layer:
                for feature in src:
                    props = feature["properties"]
                    if year < 2016:
                        bfs_number = props.get("KTNR")
                    else:
                        bfs_number = props.get("kantonsnummer")

                    canton = cantons_map.get(bfs_number)
                    multi = shape(feature["geometry"])
                    multi = transform(lambda x, y, z=None: (x, y), multi)
                    multi = transform(transformer.transform, multi)
                    db_canton_map = CantonMap(
                        year=year,
                        geo_data_type=feature["geometry"]["type"],
                        geometry=from_shape(multi, srid=4326),
                        canton=canton,
                    )
                    db.add(db_canton_map)

                await db.commit()

            if "bezirk" in layer or "District" in layer:
                for feature in src:
                    props = feature["properties"]
                    if year < 2016:
                        bfs_number = props.get("BEZNR")
                    else:
                        bfs_number = props.get("bezirksnummer")

                    district = district_map.get("B" + str(bfs_number))
                    multi = shape(feature["geometry"])
                    multi = transform(lambda x, y, z=None: (x, y), multi)
                    multi = transform(transformer.transform, multi)
                    db_district_map = DistrictMap(
                        year=year,
                        geometry=from_shape(multi, srid=4326),
                        geo_data_type=feature["geometry"]["type"],
                        district=district,
                    )
                    db.add(db_district_map)
                    # print(f"Adding district {district.name}")

            await db.commit()
