import os


from dash import ALL, ctx, Dash, dcc, html, Input, Output, State
from flask import Flask, render_template_string
from flask_babel import _
import dash_bootstrap_components as dbc
import pandas as pd
import plotly.graph_objects as go
import numpy as np 
import matplotlib.pyplot as plt


from webapp.config import BASEDIR
from webapp.map_helpers import (
    COLOR_SCALE_10,
    COLOR_SCALE_SPECIAL,
    fig_switzerland_empty,
    MUNICIPALITIES,
    MUNICIPALITIES_DATA,
    SPECIAL_ANSWERS,
)


def create_dash_app(flask_server: Flask, url_path="/map/"):
    # Load combined responses from both current and old years
    df_commune_responses_combined = pd.read_csv("data/commune_responses_combined_with_pop.csv").set_index("gemid", drop=False)
    

    # modif du commit 879c7a5 mais ça fait bugger quand on change de question pour survey
    df_commune_responses_combined.replace({-99: None, -99.0: None}, inplace=True)
    df_commune_responses_combined = df_commune_responses_combined.applymap(
        lambda x: -99 if pd.notna(x) and isinstance(x, (int, float)) and x < 0 else x
    )
    #df_commune_responses_combined = df_commune_responses_combined.apply(pd.to_numeric, errors="coerce")



    critical_columns = ["gemid"]
    metadata_rows = df_commune_responses_combined.loc[df_commune_responses_combined["gemid"].isna()]
    df_commune_responses_combined_cleaned = df_commune_responses_combined[df_commune_responses_combined["gemid"].notna()]
    numeric_columns = df_commune_responses_combined_cleaned.select_dtypes(include=["number"]).columns
    df_commune_responses_combined_cleaned.loc[:, numeric_columns] = df_commune_responses_combined_cleaned[numeric_columns].apply(pd.to_numeric, errors="coerce")
    df_commune_responses_combined = pd.concat([df_commune_responses_combined_cleaned, metadata_rows])
    df_commune_responses_combined.set_index("gemid", inplace=True)
    




    # Load additional data files for the app
    df_combined = pd.read_csv("data/combined_df.csv")
    top_10_question_globales = pd.read_csv("data/top_10_QuestionGlobales_NLP.csv")



    # commit des labels 198befd   
    # # Load labels
    df_labels = pd.read_csv("data/answ_details_2023.csv", delimiter=";").set_index("qid")
    labels = {
        qid: {val: lab for val, lab in zip(cols["values"].split(";"), cols["labels"].split(";"))}
        for qid, cols in df_labels.to_dict(orient="index").items()
    }




    # Create a Dash app instance with Bootstrap styling
    dash_app = Dash(
        __name__,
        external_stylesheets=[dbc.themes.BOOTSTRAP],
        server=flask_server,
        url_base_pathname=url_path,
    )
    dash_app.config.suppress_callback_exceptions = True  # Suppress callback exceptions for better error handling

    # Define the layout of the app, including dropdowns, map, and slider
    layout_card = dbc.Card(
        dbc.CardBody(
            dcc.Graph(
                id="map-graph",
                style={
                    "height": "75vh",
                },
            )
        ),
        className="mb-4",
    )
    layout_infos = dbc.Card(
        dbc.CardBody(
            [
                html.H4("Instructions", id="info-title", className="card-title"),
                html.P(
                    "Select a question in the list bellow, then select a municipality on the map.",
                    id="info-text",
                    className="card-text",
                ),
                html.Em(
                    "Please note that some of the data is incomplete/still being worked on. Bugs and inconsistency are to be expected!"
                ),
            ]
        ),
        className="mb-4",
    )
    layout_options = dbc.Card(
        dbc.CardBody(
            [
                html.Div(
                    [
                        html.Label(
                            _("Survey selection"),
                            id="survey-selection-label",
                        ),
                        dcc.Dropdown(
                            id="survey-dropdown",
                            options=[
                                {"value": "survey", "label": "2023"},
                                {"value": "global_question", "label": _("All surveys")},
                            ],
                            value="survey",
                            clearable=False,
                        ),
                    ],
                ),
                 html.Div(
                    [
                        html.Label(
                            _("3rd dimension selection"),
                            id="data-selection-label",
                        ),
                        dcc.Dropdown(
                            id="data-dropdown",
                            options=[
                                {"value": "2D", "label": _("Keep the visualization in 2D")},
                                {"value": "Density", "label": _("Density")},
                                {"value": "Option2", "label": _("Topography")},
                            ],
                            value="2D",  
                            clearable=False,
                        ),
                    ],
                    style={"marginTop": "20px"},
                ),
                html.Div(
                    id="slider-container",
                    style={"display": "none"},
                    children=[
                        html.Label(
                            _("Select a question to see the years"),
                            id="slider-label",
                        ),
                        html.Div(
                            dcc.Slider(
                                id="slider",
                                min=1988,
                                max=2023,
                                value=None,  # Initial value depends on selected global question
                                marks={},  # Marks updated based on available years for the question
                                step=None,  # No intermediate values
                                disabled=False, 
                            ),
                        ),
                    ],
                ),
            ]
        ),
        className="mb-4",
    )
    layout_questions = dbc.Card(
        dbc.CardBody(
            [
                html.Div(
                    [
                        html.Label(
                            _("Question"),
                            id="variable-selection-label",
                        ),
                        dbc.ListGroup(
                            [],
                            id="questions-list",
                            style={"overflow-y": "auto", "max-height": "300px"},
                        ),
                    ],
                ),
            ]
        ),
        className="mb-4",
    )

    layout_full = html.Div(
        dbc.Row(
            [
                dbc.Col(layout_card, width=8),
                dbc.Col([layout_infos, layout_options, layout_questions], width=4),
            ]
        )
    )

    dash_app.layout = layout_full

    # Callback to update options, map figure, and slider properties based on survey selection and year
    @dash_app.callback(
        Output("questions-list", "children"),
        Output("slider-container", "style"),
        Output("map-graph", "figure"),
        Output("slider", "marks"),
        Output("slider", "value"),
        Input("survey-dropdown", "value"),
        Input({"type": "list-group-item", "index": ALL}, "n_clicks"),
        Input("slider", "value"),
        Input("data-dropdown", "value"),
    )
    def update_dropdown_and_map(selected_survey, list_group_items, selected_year, selected_data):
        if any(list_group_items):
            selected_variable = ctx.triggered_id.index
        else:
            selected_variable = None

        selected_language = "en"  # get_locale()

        if selected_data == "Density":
            fig = create_3d_map_with_boundaries(df_commune_responses_combined, MUNICIPALITIES_DATA)
            return [], {"display": "none"}, fig, {}, None

        # Reindex to ensure 'year' and 'quest_glob' are accessible as rows
        if "year" not in df_commune_responses_combined.index:
            df_commune_responses_combined.set_index(df_commune_responses_combined.columns[0], inplace=True)

        # Handle global questions selection
        if selected_survey == "global_question":
            codes = top_10_question_globales[
                top_10_question_globales["code_first_question"].isin(df_commune_responses_combined.columns)
            ]
            options = [
                dbc.ListGroupItem(
                    row[f"text_{selected_language}"],
                    id={"type": "list-group-item", "index": row["code_first_question"]},
                    n_clicks=0,
                    action=True,
                )
                for _, row in codes.iterrows()
            ]

            if selected_variable:
                # Find associated survey questions and years for the selected global question
                if "quest_glob" in df_commune_responses_combined.index:
                    survey_columns = df_commune_responses_combined.columns[
                        df_commune_responses_combined.loc["quest_glob"] == selected_variable
                    ]
                    year_row = df_commune_responses_combined.loc["year", survey_columns]
                    associated_years = [
                        int(year) for year in year_row.unique() if pd.notna(year) and str(year).isdigit()
                    ]
                    year_to_survey = dict(zip(associated_years, survey_columns))

                    slider_marks = {year: str(year) for year in sorted(associated_years)}

                    # Use the last selected slider value if valid; otherwise, reset to the first available year
                    slider_value = (
                        selected_year
                        if selected_year in associated_years
                        else associated_years[0] if associated_years else None
                    )
                else:
                    print("Error: 'quest_glob' row not found in df_commune_responses_combined.")
                    slider_marks, slider_value = {}, None
            else:
                slider_marks, slider_value = {}, None

            slider_style = {"display": "block"}

        # Handle individual survey question selection
        else:  # selected_survey == "survey"
            options = [
                dbc.ListGroupItem(
                    row[f"text_{selected_language}"],
                    id={"type": "list-group-item", "index": row["code"]},
                    n_clicks=0,
                    action=True,
                )
                for _, row in [(i, r) for i, r in df_combined.iterrows()][3:]
            ]

            # Hide the slider and reset map for "survey" selection
            slider_style, slider_marks, slider_value = {"display": "none"}, {}, None

            # Display the map based on selected survey question
            if selected_variable and selected_variable in df_commune_responses_combined.columns:
                # Filter data for the selected survey question
                filtered_responses = df_commune_responses_combined[["GSB23_Q100", selected_variable]].fillna(99)
                communes = filtered_responses["GSB23_Q100"].astype(int).tolist()
                responses = filtered_responses[selected_variable].tolist()
                response_dict = dict(zip(communes, responses))

                # assign a default value (-99) to communes without data
                aggregated_responses = [
                    response_dict.get(feature["properties"]["id"], -99) for feature in MUNICIPALITIES_DATA["features"]
                ]

                # Return the options and updated map figure
                return (
                    options,
                    slider_style,
                    create_figure(
                        aggregated_responses,
                        [feature["properties"]["id"] for feature in MUNICIPALITIES_DATA["features"]],

                    # commit des labels 198befd
                        labels[selected_variable] if selected_variable in labels else None,


                    ),
                    slider_marks,
                    slider_value,
                )
            else:
                # If no survey question selected, return an empty map
                return options, slider_style, fig_switzerland_empty(), slider_marks, slider_value

        # Prepare the map figure for global question selection with slider control
        if selected_variable and selected_survey == "global_question":
            selected_survey_column = year_to_survey.get(slider_value)
            if selected_survey_column:
                filtered_responses = df_commune_responses_combined[["GSB23_Q100", selected_survey_column]].fillna(99)
                communes = filtered_responses["GSB23_Q100"].astype(int).tolist()
                responses = filtered_responses[selected_survey_column].tolist()
                response_dict = dict(zip(communes, responses))
            else:
                # No data for the selected year; return an empty map
                return options, slider_style, fig_switzerland_empty(), slider_marks, slider_value

            # assign a default value (99) to communes without data
            aggregated_responses = [
                response_dict.get(feature["properties"]["id"], -99) for feature in MUNICIPALITIES_DATA["features"]
            ]


            return (
                options,
                slider_style,
                create_figure(
                    #aggregated_responses, [feature["properties"]["id"] for feature in MUNICIPALITIES_DATA["features"]]
                    # commit des labels 198befd
                    aggregated_responses,
                    [feature["properties"]["id"] for feature in MUNICIPALITIES_DATA["features"]],
                    labels[selected_variable] if selected_variable in labels else None,


                ),
                slider_marks,
                slider_value,
            )

        # Default fallback: return empty map and no options if conditions aren't met
        return options, slider_style, fig_switzerland_empty(), slider_marks, slider_value

    # Function to create the map figure based on survey responses
    def create_figure(variable_values, communes, labels=None):
        # Count unique non-NaN values
        unique_values = set([v for v in variable_values if isinstance(v, (int, float)) and not pd.isna(v)])
        num_unique_values = len(unique_values)

        # We remove the special values
        keep_special_values = set()
        for value in SPECIAL_ANSWERS.keys():
            try:
                unique_values.remove(value)
                keep_special_values.add(value)
            except KeyError:
                pass

        fig = fig_switzerland_empty()

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
                        #f"{'No Data' if value == -1 else ('Voluntary no response' if value == -99 else ('No opinion' if value == 99 else value))}"
                        f"{('No data' if value == -99 else ('No opinion' if value == 99 else value))}"
                        for value, feature in zip(variable_values, MUNICIPALITIES_DATA["features"])
                    ],
                    showscale=True,
                )
            )
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
                        #name=value,
                        name=labels[str(int(value))] if labels else value,
                        colorscale=COLOR_SCALE_10[i],
                        hoverinfo="text",
                        text=[
                            f"{MUNICIPALITIES[temp_name]}: {labels[str(int(temp_value))]}" 
                            if labels and str(int(temp_value)) in labels else f"{MUNICIPALITIES[temp_name]}: {temp_value}" 
                            for (temp_name, temp_value) in temp_answers
                        ],
                        showscale=False,  # Hidding the scale
                    )
                )

        # Add special values back
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


    # Function to create the 3D density plot
    def create_3d_map_with_boundaries(df, geojson_data):
        from shapely.geometry import shape, Polygon, MultiPolygon

        geojson_ids = set([feature['properties']['id'] for feature in geojson_data['features']])
        dataframe_ids = set(df['Region-ID'])
        df_cleaned = df.dropna(subset=['Region-ID'])
        missing_ids = geojson_ids - set(df_cleaned['Region-ID'])
        missing_data = pd.DataFrame({'Region-ID': list(missing_ids), 'Density': 0})
        df_complete = pd.concat([df_cleaned, missing_data], ignore_index=True)

        df = df_complete.set_index('Region-ID')
        #df['log_density'] = np.log10(df['Density']+1)

        df['Normalized_Population'] = (df['Population'] - df['Population'].min()) / (df['Population'].max() - df['Population'].min())


        line_x, line_y, line_z = [], [], []
        base_x, base_y = [], []
        color_list = []
        

        for feature in geojson_data["features"]:
            gemid = feature["properties"]["id"]
            
            density = df.loc[gemid, "Density"] if gemid in df.index else 0
            population_normalized = df.loc[gemid, "Normalized_Population"]



            polygon = shape(feature["geometry"])
            if polygon.is_empty:
                continue

            # Si c'est un MultiPolygon, parcourez tous les polygones qu'il contient
            polygons = []
            if isinstance(polygon, Polygon):
                polygons = [polygon]
            elif isinstance(polygon, MultiPolygon):
                polygons = list(polygon.geoms)

  
            for poly in polygons:
                coords = list(poly.exterior.coords)
                for i in range(len(coords) - 1):
                    x_start, y_start = coords[i]
                    x_end, y_end = coords[i + 1]
                    base_x.extend([x_start, x_end, None])
                    base_y.extend([y_start, y_end, None])


            centroid = polygon.centroid
            rect_size = 0.01
            rect_coords = [
                (centroid.x - rect_size, centroid.y - rect_size),
                (centroid.x - rect_size, centroid.y + rect_size),
                (centroid.x + rect_size, centroid.y + rect_size),
                (centroid.x + rect_size, centroid.y - rect_size),
                (centroid.x - rect_size, centroid.y - rect_size),
            ]

            color = plt.cm.Reds(population_normalized)


            for i in range(len(rect_coords) - 1):
                x_start, y_start = rect_coords[i]
                x_end, y_end = rect_coords[i + 1]

                line_x.extend([x_start, x_end, None])
                line_y.extend([y_start, y_end, None])
                line_z.extend([0, 0, None])

                line_x.extend([x_start, x_end, None])
                line_y.extend([y_start, y_end, None])
                line_z.extend([density, density, None])

                line_x.extend([x_start, x_start, None])
                line_y.extend([y_start, y_start, None])
                line_z.extend([0, density, None])

                color_list.append(f"rgba({int(color[0] * 255)}, {int(color[1] * 255)}, {int(color[2] * 255)}, {color[3]})")


        fig = go.Figure()

        fig.add_trace(go.Scatter3d(
            x=base_x,
            y=base_y,
            z=[0] * len(base_x),
            mode="lines",
            line=dict(color="gray", width=1),
            hoverinfo="skip",
            showlegend=False,
        ))

        fig.add_trace(go.Scatter3d(
            x=line_x,
            y=line_y,
            z=line_z,
            mode="lines",
            line=dict(color="black", width=2),
            # un jour modifier la couleur si on veut rajouter la population 
            hoverinfo="skip",
            showlegend=False,
        ))

        fig.update_layout(
            scene=dict(
                xaxis=dict(title="Longitude", visible=False),
                yaxis=dict(showgrid=False, showticklabels=False, zeroline=False, visible=False),
                zaxis=dict(showgrid=False, showticklabels=False, zeroline=False, visible=False),
                camera=dict(
                    eye=dict(x=0.3, y=-0.8, z=1.2),
                    up=dict(x=0, y=0, z=1)
                ),
                bgcolor="white"
            ),
            title="3D Map with Uniform Columns",
            paper_bgcolor="white",
            plot_bgcolor="white",
        )

        return fig
       


    # Integrate dash app into flask app
    with flask_server.app_context(), flask_server.test_request_context():
        with open(os.path.join(BASEDIR, "templates", "public", "map.html"), "r") as f:
            html_body = render_template_string(f.read())

        for comment in ["app_entry", "config", "scripts", "renderer"]:
            html_body = html_body.replace(f"<!-- {comment} -->", "{%" + comment + "%}")

        dash_app.index_string = html_body

    return dash_app.server
