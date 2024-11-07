import ast
import json
import os


from sqlalchemy import create_engine
from sqlalchemy.orm import Session
import numpy as np
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
print("memory leak lol")
#DF_QUESTIONS = pd.read_excel("./data/demo_questions.xlsx")
#DF_QUESTIONS_GLOBAL = pd.read_csv("./webapp/data/QuestionsGlobales.csv")
print("db questions loaded")
# DF_ANSWERS = pd.read_excel("../data/demo_answers.xlsx")
# print("db ansers loaded")
DF_COMMUNES_RESPONSES_COMBINED = pd.read_csv("./data/commune_responses_combined.csv").set_index("gemid")
#DF_DEMO_ANSWERS = pd.read_csv("./data/df_answers_demo.csv").set_index("gemid")
# print(DF_COMMUNES_RESPONSES_COMBINED)
DF_2023 = pd.read_excel("./data/GSB 2023_V1.xlsx").set_index("gemid")

#DF_LABELS = pd.read_excel("./data/answer_labels.xlsx")

# Réponses spéciales à extraire
SPECIAL_ANSWERS = {
    -1.0: "(no data)",
    -99.0: "(did not answer)",
    99.0: "(no opinion)",
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
    "#BEBEBE",
]
COLOR_SCALE_SPECIAL = [((0.0, color), (1.0, color)) for color in COLOR_SCALE_SPECIAL]


def cast_lol(x):
    try:
        x = float(x)
        if x.is_integer():
            return int(x)
    except ValueError:
        pass
    return x


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


def fig_map_with_data(df, chosen_question):
    # Values
    df_int = df[[chosen_question]]
    # df_int[chosen_question] = df_int[chosen_question].apply(lambda x: cast_lol(x))

    # Labels
    #if chosen_question in DF_LABELS["code"].values:
        #df_labels = DF_LABELS[DF_LABELS["code"] == chosen_question]
        #labels = {}
    #else:
        #labels = None

    # Generate empty basic map
    fig = fig_switzerland_empty()  # In a future version, we can refactor so that we generate that one only once

    # Now for the fun partS!

    # We take the chose questions, and extract their unique answers
    answers_unique = list(df_int[chosen_question].unique())

    # We remove the special values
    for value in SPECIAL_ANSWERS.keys():
        try:
            answers_unique.remove(value)
        except ValueError:
            pass

    # Continuous or too many differents answers
    if len(answers_unique) > len(COLOR_SCALE_10):
        # We take only the answers which are not special answers
        dfp = df_int[~df_int[chosen_question].isin(SPECIAL_ANSWERS.keys())]

        # And we add the layer
        fig.add_choroplethmapbox(
            geojson=MUNICIPALITIES_DATA,
            locations=dfp.index,
            z=dfp[chosen_question],
            featureidkey="properties.id",
            hoverinfo="text",
            text=[f"{name}: {value}" for name, value in zip(MUNICIPALITIES.values(), dfp[chosen_question])],
        )
    # Discrete or few answers
    else:
        # For each unique answer, we create a layer for the map, and assign it a value
        for i, value in enumerate(answers_unique):
            # We extract the rows that have that value
            dfp = df_int[df_int[chosen_question] == value]

            # We create the text
            text_answer = value

            # And we add the layer
            fig.add_choroplethmapbox(
                geojson=MUNICIPALITIES_DATA,
                locations=dfp.index,
                z=[i] * len(dfp),
                featureidkey="properties.id",
                showlegend=True,
                name=text_answer,
                colorscale=COLOR_SCALE_10[i],
                showscale=False,  # Hidding the scale lol
                hoverinfo="text",
                text=[f"{name}: {text_answer}" for name in MUNICIPALITIES.values()],
            )

    # And FINALLY, we add the special values!
    for i, value in enumerate(SPECIAL_ANSWERS):
        # We extract the rows that have that value
        dfp = df_int[df_int[chosen_question] == value]

        # We create the text
        text_answer = SPECIAL_ANSWERS[value]

        # And we add the layer
        fig.add_choroplethmapbox(
            geojson=MUNICIPALITIES_DATA,
            locations=dfp.index,
            z=[i] * len(dfp),
            featureidkey="properties.id",
            showlegend=True,
            name=text_answer,
            colorscale=COLOR_SCALE_SPECIAL[i],
            showscale=False,  # Hidding the scale lol
            hoverinfo="text",
            text=[f"{name}: {text_answer}" for name in MUNICIPALITIES.values()],
        )

    fig.add_choroplethmapbox(
        geojson=MUNICIPALITIES_DATA,
        locations=[None] * len(MUNICIPALITIES_DATA),
        z=[None] * len(MUNICIPALITIES_DATA),
        featureidkey="properties.id",
        showlegend=True,
        name="(no value)",
        colorscale=COLOR_SCALE_SPECIAL[0],
        showscale=False,  # Hidding the scale lol
        hoverinfo="text",
        text=[f"{name}: (no data)" for name in MUNICIPALITIES.values()],
    )

    return fig
