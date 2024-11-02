import json
import os


from sqlalchemy import create_engine
from sqlalchemy.orm import Session
import pandas as pd
import plotly.graph_objects as go


from webapp.database import Commune, QuestionGlobal, Survey


# L'endroit où t'as tes geojson en gros
try:
    from webapp.config import BASEDIR, DB_URI

    BASE_PATH = os.path.join(BASEDIR, "data", "geojson")
except:
    BASE_PATH = os.path.join("data", "geojson")

# Geojson
with open(os.path.join(BASE_PATH, "country.json"), encoding="utf-8") as f:
    COUNTRY_DATA = json.load(f)

with open(os.path.join(BASE_PATH, "lakes.json"), encoding="utf-8") as f:
    LAKES_DATA = json.load(f)

with open(os.path.join(BASE_PATH, "municipalities.json"), encoding="utf-8") as f:
    MUNICIPALITIES_DATA = json.load(f)

# Data en plus sur les communes
MUNICIPALITIES = {
    feature["properties"]["id"]: feature["properties"]["name"] for feature in MUNICIPALITIES_DATA["features"]
}
MUNICIPALITIES_IDS = list(MUNICIPALITIES.keys())

# TODO en attendant
DF_COMMUNES_RESPONES_COMBINED = pd.read_csv("./data/commune_responses_combined.csv")
print(DF_COMMUNES_RESPONES_COMBINED)

# Réponses spéciales à extraire
SPECIAL_ANSWERS = {
    "-1": "(no data)",
    "-99": "(did not answer)",
    "99": "(no opinion)",
}

# Color scale
COLOR_SCALE_10 = [
    "#a6cee3",
    "#1f78b4",
    "#b2df8a",
    "#33a02c",
    "#fb9a99",
    "#e31a1c",
    "#fdbf6f",
    "#ff7f00",
    "#cab2d6",
    "#6a3d9a",
]
COLOR_SCALE_10 = [((0.0, color), (1.0, color)) for color in COLOR_SCALE_10]
COLOR_SCALE_SPECIAL = [
    "#FFFFFF",
    "#404040",
    "#C0C0C0",
]
COLOR_SCALE_SPECIAL = [((0.0, color), (1.0, color)) for color in COLOR_SCALE_SPECIAL]


def fig_switzerland_empty():
    """
    Function to create an empty map figure when no data is available.

    :return:
    """
    fig = go.Figure()

    # Add base layer for the country, in white
    fig.add_trace(
        go.Choroplethmapbox(
            name="base_country",
            geojson=COUNTRY_DATA,
            locations=[feature["properties"]["id"] for feature in COUNTRY_DATA["features"]],
            z=[1] * len(COUNTRY_DATA["features"]),
            colorscale=[[0, "white"], [1, "white"]],
            featureidkey="properties.id",
            showscale=False,
        )
    )

    # Add municipalities layer in white
    fig.add_trace(
        go.Choroplethmapbox(
            name="base_municipalities_empty",
            geojson=MUNICIPALITIES_DATA,
            locations=[feature["properties"]["id"] for feature in MUNICIPALITIES_DATA["features"]],
            z=[1] * len(MUNICIPALITIES_DATA["features"]),
            colorscale=[[0, "white"], [1, "white"]],
            featureidkey="properties.id",
            hoverinfo="text",
            text=[feature["properties"]["name"] for feature in MUNICIPALITIES_DATA["features"]],
            showscale=False,
        )
    )

    # Add lakes layer in blue
    fig.add_trace(
        go.Choroplethmapbox(
            name="base_lakes",
            geojson=LAKES_DATA,
            locations=[feature["properties"]["id"] for feature in LAKES_DATA["features"]],
            z=[1] * len(LAKES_DATA["features"]),
            colorscale="Blues",
            featureidkey="properties.id",
            hoverinfo="text",
            text=[feature["properties"]["name"] for feature in LAKES_DATA["features"]],
            showscale=False,
        )
    )

    # Map layout configuration for an empty view
    fig.update_layout(
        margin={"r": 0, "t": 0, "l": 0, "b": 0},
        # height=10,
        # width=1200,
        autosize=True,
        dragmode="zoom",
        uirevision=True,
        mapbox=dict(layers=[], zoom=7.8, center={"lat": 46.8, "lon": 8.1}, style="white-bg"),
    )

    return fig
