import json


from dash import callback_context, Dash, dcc, html, Input, Output
import dash_bootstrap_components as dbc
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import topojson


# Load the GeoJSON files with utf-8 encoding
with open("lakes.json", encoding="utf-8") as f:
    lakes_data = json.load(f)

with open("municipalities.json", encoding="utf-8") as f:
    municipalities_data = json.load(f)

with open("country.json", encoding="utf-8") as f:
    country_data = json.load(f)

df_commune_responses = pd.read_csv("data/commune_responses.csv")
df_combined = pd.read_csv("data/combined_df.csv")
question_globale_NLP = pd.read_csv("data/QuestionGlobales_NLP.csv")


app = Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])  # Utiliser Bootstrap

app.layout = html.Div(
    [
        html.H1("Map with Dynamic Color Scale", style={"text-align": "left", "margin-bottom": "40px"}),
        # Dropdowns for survey and variable selection
        html.Div(
            [
                html.Div(
                    [
                        html.Label("Survey Selection"),
                        dcc.Dropdown(
                            id="survey-dropdown",
                            options=[
                                {"label": "Global Question", "value": "global_question"},
                                {"label": "Survey", "value": "survey"},
                            ],
                            value="survey",
                            clearable=False,
                        ),
                    ],
                    style={"width": "48%", "display": "inline-block"},
                ),
                html.Div(
                    [
                        html.Label("Variable Selection"),
                        dcc.Dropdown(id="variable-dropdown", options=[], value=None, clearable=False),
                    ],
                    style={"width": "48%", "display": "inline-block"},
                ),
            ],
            style={"display": "flex", "justify-content": "space-between"},
        ),
        # Graph for the map with dynamic color scale
        dcc.Graph(id="map-graph", style={"position": "relative", "z-index": "0"}),
        # Div for the slider --> do not display for the moment idk why
        html.Div(
            id="slider-container",
            style={"display": "none"},
            children=[
                html.Label("Adjust Slider"),
                dcc.Slider(id="slider", min=0, max=100, value=50, marks={i: str(i) for i in range(0, 101, 10)}, step=1),
            ],
        ),
    ],
    style={
        "height": "100vh",
        "width": "100vw",
        "overflow": "hidden",
        "padding": "20px",
        "margin": "0",
        "font-family": "Arial, sans-serif",
        "position": "relative",
    },
)


@app.callback(
    Output("variable-dropdown", "options"),
    Output("slider-container", "style"),
    Output("map-graph", "figure"),
    Input("survey-dropdown", "value"),
    Input("variable-dropdown", "value"),
)
def update_dropdown_and_map(selected_survey, selected_variable):
    # Update variable options based on selected survey
    if selected_survey == "global_question":
        codes = question_globale_NLP[question_globale_NLP["code_first_question"].isin(df_commune_responses.columns)]
        options = [
            {"label": df_combined[df_combined["code"] == code].label.values[0], "value": code}
            for code in codes["code_first_question"]
        ]
    else:
        options = [{"label": row["label"], "value": row["code"]} for _, row in df_combined.iterrows()]

    # Determine if the slider should be shown
    slider_style = {"display": "block"} if selected_survey == "global_question" else {"display": "none"}

    # Prepare the map figure
    if selected_variable is None:
        return options, slider_style, create_empty_map_figure()  # Provide a function to create an empty figure

    if selected_variable not in df_commune_responses.columns:
        raise ValueError(f"The variable '{selected_variable}' does not exist in the commune responses.")

    filtered_responses = df_commune_responses[["GSB23_Q100", selected_variable]].dropna()
    communes = filtered_responses["GSB23_Q100"].astype(int).tolist()
    responses = filtered_responses[selected_variable].tolist()
    response_dict = dict(zip(communes, responses))
    aggregated_responses = [
        response_dict.get(feature["properties"]["id"], -99) for feature in municipalities_data["features"]
    ]

    return (
        options,
        slider_style,
        create_figure(
            aggregated_responses, [feature["properties"]["id"] for feature in municipalities_data["features"]]
        ),
    )


def create_empty_map_figure():
    fig = go.Figure()

    # Add the country layer (Switzerland)
    fig.add_trace(
        go.Choroplethmapbox(
            geojson=country_data,
            locations=[feature["properties"]["id"] for feature in country_data["features"]],
            z=[1] * len(country_data["features"]),
            colorscale=[[0, "white"], [1, "white"]],
            featureidkey="properties.id",
            name="Country",
        )
    )

    # Layout settings for the empty map
    fig.update_layout(
        mapbox_zoom=7,
        mapbox_center={"lat": 46.4, "lon": 8.8},
        margin={"r": 0, "t": 0, "l": 0, "b": 0},
        height=800,
        width=1200,
        dragmode=False,
        uirevision=True,
        mapbox=dict(
            layers=[], accesstoken="your-access-token", zoom=7, center={"lat": 46.4, "lon": 8.1}, style="white-bg"
        ),
        showlegend=False,
    )
    return fig


def create_figure(variable_values, communes):
    unique_values = [v for v in variable_values if v != -99 and not np.isnan(v)]
    num_unique_values = len(set(unique_values))

    if num_unique_values == 99:  # modify when fixed the issue with the discrete color scale
        custom_colorscale = {
            -99: "darkgray",  # Voluntary no response
            np.nan: "lightgray",  # Exited survey
            0: "rgb(255,247,251)",
            1: "rgb(236,231,242)",
            2: "rgb(208,209,230)",
            3: "rgb(166,189,219)",
            4: "rgb(116,169,207)",
            5: "rgb(54,144,192)",
            6: "rgb(5,112,176)",
            7: "rgb(4,90,141)",
            8: "rgb(2,56,88)",
        }
    else:
        custom_colorscale = "Viridis"

    fig = go.Figure()

    # Add the country layer (Switzerland)
    fig.add_trace(
        go.Choroplethmapbox(
            geojson=country_data,
            locations=[feature["properties"]["id"] for feature in country_data["features"]],
            z=[1] * len(country_data["features"]),
            colorscale=[[0, "white"], [1, "white"]],
            featureidkey="properties.id",
            name="Country",
        )
    )

    # Add the municipalities layer with dynamic values and color scale
    fig.add_trace(
        go.Choroplethmapbox(
            geojson=municipalities_data,
            locations=communes,
            z=variable_values,
            colorscale=custom_colorscale,
            featureidkey="properties.id",
            name="Municipalities",
            hoverinfo="text",
            text=[
                f"{feature['properties']['name']}: "
                f"{'Exited Survey' if np.isnan(value) else ('Voluntary no response' if value == -99 else ('No opinion' if value == 99 else value))}"
                for value, feature in zip(variable_values, municipalities_data["features"])
            ],
            colorbar=dict(
                title="Values",
                thickness=25,
                x=1.05,
                y=0.5,
                tickvals=[-99, float("nan")] + list(range(0, 8)),
                ticktext=["Voluntary No Response", "Exited Survey"] + [str(i) for i in range(0, 8)],
            ),
            showscale=True,
        )
    )

    # Add the lakes layer
    fig.add_trace(
        go.Choroplethmapbox(
            geojson=lakes_data,
            locations=[feature["properties"]["id"] for feature in lakes_data["features"]],
            z=[1] * len(lakes_data["features"]),
            colorscale="Blues",
            featureidkey="properties.id",
            name="Lakes",
            hoverinfo="text",
            text=[feature["properties"]["name"] for feature in lakes_data["features"]],
            showscale=False,
        )
    )

    # Layout settings for the map
    fig.update_layout(
        mapbox_zoom=7,
        mapbox_center={"lat": 46.4, "lon": 8.8},
        margin={"r": 0, "t": 0, "l": 0, "b": 0},
        height=800,
        width=1200,
        dragmode=False,
        uirevision=True,
        mapbox=dict(
            layers=[], accesstoken="your-access-token", zoom=7, center={"lat": 46.4, "lon": 8.1}, style="white-bg"
        ),
        showlegend=False,
    )
    return fig


if __name__ == "__main__":
    app.run_server(debug=True)
