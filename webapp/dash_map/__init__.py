# Not a blueprint!
import os


from dash import ALL, ctx, Dash, Input, Output
from flask import Flask, render_template_string
import dash_bootstrap_components as dbc
import pandas as pd


from webapp.config import BASEDIR
from webapp.dash_map.helpers import create_figure, fig_switzerland_empty, MUNICIPALITIES_DATA, SPECIAL_ANSWERS
from webapp.dash_map.layout import layout_full
from webapp.dash_map.preprocessing import df_combined, df_commune_responses_combined, labels, top_10_question_globales


def create_dash_map(flask_server: Flask, url_path="/map/"):
    # Create a Dash app instance with Bootstrap styling
    dash_app = Dash(
        __name__,
        external_stylesheets=[dbc.themes.BOOTSTRAP],
        server=flask_server,
        url_base_pathname=url_path,
    )

    # Set layout
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
    )
    def update_dropdown_and_map(selected_survey, list_group_items, selected_year):
        if any(list_group_items):
            selected_variable = ctx.triggered_id.index
        else:
            selected_variable = None

        selected_language = "en"  # get_locale()

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

                # assign a default value (99) to communes without data
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
                    aggregated_responses,
                    [feature["properties"]["id"] for feature in MUNICIPALITIES_DATA["features"]],
                    labels[selected_variable] if selected_variable in labels else None,
                ),
                slider_marks,
                slider_value,
            )

        # Default fallback: return empty map and no options if conditions aren't met
        return options, slider_style, fig_switzerland_empty(), slider_marks, slider_value

    # Integrate dash app into Flask app
    with flask_server.app_context(), flask_server.test_request_context():
        with open(os.path.join(BASEDIR, "templates", "public", "map.html"), "r") as f:
            html_body = render_template_string(f.read())

        for comment in ["app_entry", "config", "scripts", "renderer"]:
            html_body = html_body.replace(f"<!-- {comment} -->", "{%" + comment + "%}")

        dash_app.index_string = html_body

    return dash_app.server
