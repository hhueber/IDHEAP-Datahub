import os


from dash import ALL, ctx, Dash, dcc, html, Input, Output, State
from flask import Flask, render_template_string
import dash_bootstrap_components as dbc


from webapp.config import BASEDIR
from webapp.map_helpers import fig_switzerland_empty


def create_dash_app(flask_server: Flask, url_path="/map"):
    # Create a Dash app instance with Bootstrap styling
    dash_app = Dash(
        __name__,
        external_stylesheets=[dbc.themes.BOOTSTRAP],
        server=flask_server,
        url_base_pathname=url_path,
    )
    dash_app.config.suppress_callback_exceptions = True  # Suppress callback exceptions for better error handling

    # Define the layout of the app, including dropdowns, map, and slider
    dash_app.layout = html.Div(
        [
            dbc.Row(
                [
                    dbc.Col(
                        [
                            # Map display component
                            dbc.Card(
                                dbc.CardBody(
                                    dcc.Graph(
                                        id="map-graph",
                                        figure=fig_switzerland_empty(),
                                        style={
                                            "height": "75vh",
                                        },
                                    ),
                                )
                            )
                        ],
                        width=8,
                    ),
                    dbc.Col(
                        [
                            dbc.Card(
                                dbc.CardBody(
                                    [
                                        html.H4("Instructions", id="info-title", className="card-title"),
                                        html.P(
                                            "Select a question in the list bellow, then select a municipality on the map.",
                                            id="info-text",
                                            className="card-text",
                                        ),
                                    ]
                                ),
                                className="mb-4",
                            ),
                            dbc.Card(
                                dbc.CardBody(
                                    [
                                        dbc.Row(
                                            [
                                                dbc.Col(
                                                    [
                                                        dbc.Checklist(
                                                            id="global-question-switch",
                                                            options=[{"label": "Global questions", "value": 1}],
                                                            value=[1],
                                                            switch=True,
                                                            className="text-start",
                                                        ),
                                                    ]
                                                ),
                                                dbc.Col(
                                                    [
                                                        dcc.Dropdown(
                                                            id="years-dropdown",
                                                            options=[
                                                                {"label": str(year), "value": str(year)}
                                                                for year in YEARS
                                                            ],
                                                            value=None,
                                                            clearable=True,
                                                            className="invisible",
                                                        ),
                                                    ]
                                                ),
                                            ],
                                            className="card-text mb-3",
                                        ),
                                        html.Div(
                                            [
                                                dbc.ListGroup(
                                                    id="questions", style={"overflow-y": "auto", "max-height": "300px"}
                                                ),
                                            ],
                                            className="card-text",
                                        ),
                                    ]
                                )
                            ),
                        ],
                        width=4,
                    ),
                ]
            ),
        ],
        style={
            # "min-height": "100vh",
        },
    )

    @dash_app.callback(
        Output("years-dropdown", "className"),
        Output("years-dropdown", "value"),
        Output("questions", "children"),
        Input("global-question-switch", "value"),
        Input("years-dropdown", "value"),
    )
    def update_question_list(switch_value, year):
        """
        Update the list of questions and the dropbox when the question global switch is used and/or a year selected.
        """
        questions_list = list()

        if switch_value:  # Global questions
            return "invisible", None, questions_list
        else:  # Per survey questions
            return "visible", year, questions_list

    @dash_app.callback(
        Output({"type": "list-group-item", "index": ALL}, "active"),
        Output({"type": "list-group-item", "index": ALL}, "n_clicks"),
        Input({"type": "list-group-item", "index": ALL}, "n_clicks"),
    )
    def question_update(list_group_items):
        """
        Update the map when a question is selected.
        """
        if any(list_group_items):
            print(f"Clicked on Item {ctx.triggered_id.index}")
        return list_group_items, [0] * len(list_group_items)

    with flask_server.app_context(), flask_server.test_request_context():
        with open(os.path.join(BASEDIR, "templates", "public", "map.html"), "r") as f:
            html_body = render_template_string(f.read())

            for comment in ["app_entry", "config", "scripts", "renderer"]:
                html_body = html_body.replace(f"<!-- {comment} -->", "{%" + comment + "%}")

            dash_app.index_string = html_body

    return dash_app.server
