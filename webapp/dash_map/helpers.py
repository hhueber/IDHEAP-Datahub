import json
import os
import pandas as pd
import plotly.graph_objects as go
from webapp.config import BASEDIR

# Define where all our GeoJSON files live
BASE_PATH = os.path.join(BASEDIR, "data", "geojson")

# Load geographic boundaries for Switzerland, its lakes, and municipalities
with open(os.path.join(BASE_PATH, "country.json"), encoding="utf-8") as f:
    COUNTRY_DATA = json.load(f)

with open(os.path.join(BASE_PATH, "lakes.json"), encoding="utf-8") as f:
    LAKES_DATA = json.load(f)

with open(os.path.join(BASE_PATH, "municipalities.json"), encoding="utf-8") as f:
    MUNICIPALITIES_DATA = json.load(f)

# Build a lookup from municipality ID to its human-readable name
MUNICIPALITIES = {
    feature["properties"]["id"]: feature["properties"]["name"] for feature in MUNICIPALITIES_DATA["features"]
}
MUNICIPALITIES_IDS = list(MUNICIPALITIES.keys())

# Define special answer codes and their display labels
SPECIAL_ANSWERS = {
    -1.0: "(no data)",
    -99.0: "(did not answer)",
    99.0: "(no opinion)",
    -1: "(no data)",
    -99: "(did not answer)",
    99: "(no opinion)",
}

# Prepare color scales for up to 10 distinct answer categories
# and a separate scale for special values
COLOR_SCALE_10 = [
    "#66c2a5",
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

# Convert each hex color into a Plotly-compatible scale
COLOR_SCALE_10 = [((0.0, color), (1.0, color)) for color in COLOR_SCALE_10]
COLOR_SCALE_SPECIAL = ["#FFFFFF", "#C0C0C0", "#BEBEBE", "#BEBEBE"]
COLOR_SCALE_SPECIAL = [((0.0, color), (1.0, color)) for color in COLOR_SCALE_SPECIAL]

# Define a small set of major Swiss cities for map annotations
MAIN_CITIES = ["Zurich", "Genève", "Bâle", "Lausanne", "Berne", "Winterthour", "Lucerne", "Saint-Gall", "Lugano"]
CITIES_DATA = {
    "features": [
        {"properties": {"name": "Zurich", "latitude": 47.3769, "longitude": 8.5417}},
        {"properties": {"name": "Genève", "latitude": 46.2044, "longitude": 6.1432}},
        {"properties": {"name": "Bâle", "latitude": 47.5596, "longitude": 7.5886}},
        {"properties": {"name": "Lausanne", "latitude": 46.5197, "longitude": 6.6323}},
        {"properties": {"name": "Berne", "latitude": 46.9481, "longitude": 7.4474}},
        {"properties": {"name": "Winterthour", "latitude": 47.4988, "longitude": 8.7237}},
        {"properties": {"name": "Lucerne", "latitude": 47.0502, "longitude": 8.3093}},
        {"properties": {"name": "Saint-Gall", "latitude": 47.4245, "longitude": 9.3767}},
        {"properties": {"name": "Lugano", "latitude": 46.0037, "longitude": 8.9511}},
    ]
}


def fig_switzerland_empty():
    """
    Create a blank map of Switzerland:
    - White base layers for country and municipalities
    - Blue overlay for lakes
    - Markers for main cities
    Returns a Plotly Figure ready for further data traces.
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

    # Add lakes layer in light blue
    fig.add_trace(
        go.Choroplethmapbox(
            name="base_lakes",
            geojson=LAKES_DATA,
            locations=[feature["properties"]["id"] for feature in LAKES_DATA["features"]],
            z=[1] * len(LAKES_DATA["features"]),
            colorscale=[[0, "#4DA6FF"], [1, "#4DA6FF"]],  # ArcGIS-like blue color
            featureidkey="properties.id",
            hoverinfo="none",
            showscale=False,
            marker=dict(opacity=0.6),
        )
    )

    # Add city markers and labels
    fig.add_trace(
        go.Scattermapbox(
            name="Main Cities",
            lat=[
                feature["properties"]["latitude"]
                for feature in CITIES_DATA["features"]
                if feature["properties"]["name"] in MAIN_CITIES
            ],
            lon=[
                feature["properties"]["longitude"]
                for feature in CITIES_DATA["features"]
                if feature["properties"]["name"] in MAIN_CITIES
            ],
            text=[
                feature["properties"]["name"]
                for feature in CITIES_DATA["features"]
                if feature["properties"]["name"] in MAIN_CITIES
            ],
            mode="markers+text",
            textposition="top center",
            marker=dict(size=15, color="black"),
            hoverinfo="none",
            textfont=dict(
                size=20,
                color="black",
            ),
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
    """
    Build a map by adding data layers for a specific survey question:
    - Handles discrete, continuous, and special-coded answers
    - Applies appropriate color scales and legend settings
    """
    # Extract only the column of interest
    df_int = df[[chosen_question]]

    # Generate empty basic map
    fig = fig_switzerland_empty()  # In a future version, we can refactor so that we generate that one only once

    # Determine which answers are present (excluding special codes)
    answers_unique = list(df_int[chosen_question].unique())

    # Remove special values
    for value in SPECIAL_ANSWERS.keys():
        try:
            answers_unique.remove(value)
        except ValueError:
            pass

    # Continuous data or too many categories: single-layer choropleth
    if len(answers_unique) > len(COLOR_SCALE_10):
        # Take only the answers that are not special answers
        dfp = df_int[~df_int[chosen_question].isin(SPECIAL_ANSWERS.keys())]

        # Add the layer
        fig.add_choroplethmapbox(
            geojson=MUNICIPALITIES_DATA,
            locations=dfp.index,
            z=dfp[chosen_question],
            featureidkey="properties.id",
            hoverinfo="text",
            text=[f"{name}: {value}" for name, value in zip(MUNICIPALITIES.values(), dfp[chosen_question])],
        )
    # Discrete data: one layer per unique answer
    else:
        # For each unique answer, create a layer for the map, and assign it a value
        for i, value in enumerate(answers_unique):
            # We extract the rows that have that value
            dfp = df_int[df_int[chosen_question] == value]

            # Create the text
            text_answer = value

            # Add the layer
            fig.add_choroplethmapbox(
                geojson=MUNICIPALITIES_DATA,
                locations=dfp.index,
                z=[i] * len(dfp),
                featureidkey="properties.id",
                showlegend=True,
                name=text_answer,
                colorscale=COLOR_SCALE_10[i],
                showscale=False,  # Hiding the scale
                hoverinfo="text",
                text=[f"{name}: {text_answer}" for name in MUNICIPALITIES.values()],
            )

    # Finally, add layers for any special answer codes
    for i, value in enumerate(SPECIAL_ANSWERS):
        # Extract the rows that have that value
        dfp = df_int[df_int[chosen_question] == value]

        # Create the text
        text_answer = SPECIAL_ANSWERS[value]

        # Add the layer
        fig.add_choroplethmapbox(
            geojson=MUNICIPALITIES_DATA,
            locations=dfp.index,
            z=[i] * len(dfp),
            featureidkey="properties.id",
            showlegend=True,
            name=text_answer,
            colorscale=COLOR_SCALE_SPECIAL[i],
            showscale=False,  # Hiding the scale
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
        showscale=False,  # Hiding the scale
        hoverinfo="text",
        text=[f"{name}: (no data)" for name in MUNICIPALITIES.values()],
    )

    return fig

def create_figure(variable_values, communes, labels=None):
    """
    Generate a final choropleth map from raw variable values:
    - Chooses between a continuous color scale or discrete categories
    - Integrates special answer codes with their own colors
    - Optionally applies human-readable labels for each category
    """
    # Identify unique numeric values, excluding NaN
    unique_values = set([v for v in variable_values if isinstance(v, (int, float)) and not pd.isna(v)])
    num_unique_values = len(unique_values)

    # Pull out special codes so we can add them later
    keep_special_values = set()
    for value in SPECIAL_ANSWERS.keys():
        try:
            unique_values.remove(value)
            keep_special_values.add(value)
        except KeyError:
            pass

    # Base map
    fig = fig_switzerland_empty()

    # Continuous or too many discrete categories
    if num_unique_values > len(COLOR_SCALE_10):
        fig.add_trace(
            go.Choroplethmapbox(
                geojson=MUNICIPALITIES_DATA,
                locations=communes,
                z=variable_values,
                colorscale="Blues",
                featureidkey="properties.id",
                hoverinfo="text",
                text=[
                    f"{feature['properties']['name']}: "
                    f"{'No Data' if value == -1 else ('Voluntary no response' if value == -99 else ('No opinion' if value == 99 else value))}"
                    for value, feature in zip(variable_values, MUNICIPALITIES_DATA["features"])
                ],
                showscale=True,
            )
        )
    # Discrete categories: one layer per unique value
    else:
        for i, value in enumerate(unique_values):
            temp_answers = [x for x in zip(communes, variable_values) if x[1] == value]
            fig.add_trace(
                go.Choroplethmapbox(
                    geojson=MUNICIPALITIES_DATA,
                    locations=[x[0] for x in temp_answers],
                    z=[i] * len(temp_answers),
                    featureidkey="properties.id",
                    showlegend=True,
                    name=labels[str(int(value))] if labels else value,
                    colorscale=COLOR_SCALE_10[i],
                    hoverinfo="text",
                    text=[f"{MUNICIPALITIES[temp_name]}: {temp_value}" for (temp_name, temp_value) in temp_answers],
                    showscale=False,  # Hidding the scale
                )
            )

    # Add back the special codes as their own layers
    for i, value in enumerate(keep_special_values):
        temp_answers = [x for x in zip(communes, variable_values) if x[1] == value]
        text_answer = SPECIAL_ANSWERS[value]
        fig.add_trace(
            go.Choroplethmapbox(
                geojson=MUNICIPALITIES_DATA,
                locations=[x[0] for x in temp_answers],
                z=[i] * len(temp_answers),
                featureidkey="properties.id",
                showlegend=True,
                name=text_answer,
                colorscale=COLOR_SCALE_SPECIAL[i],
                hoverinfo="text",
                text=[f"{MUNICIPALITIES[temp_name]}: {text_answer}" for (temp_name, temp_value) in temp_answers],
                showscale=False,  # Hidding the scale
            )
        )

    return fig
