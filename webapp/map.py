import os


from dash import ALL, ctx, Dash, dcc, html, Input, Output
from flask import Flask, render_template_string
import dash_bootstrap_components as dbc


from webapp.config import BASEDIR


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
                                    [
                                        dcc.Graph(id="map-graph"),
                                    ]
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
                                        html.H4("Title", id="info-title", className="card-title"),
                                        html.P("Text", id="info-text", className="card-text"),
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
                                                            id="questions-dropdown",
                                                            options=[
                                                                {"label": "9999", "value": 9999},
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
        ]
    )

    @dash_app.callback(
        Output("questions-dropdown", "className"),
        Output("questions", "children"),
        Input("global-question-switch", "value"),
    )
    def global_question_switch(switch_value):
        """
        Update the list of questions and the dropbox
        """
        toggle_global_question = len(switch_value) == 1

        test1 = [dbc.ListGroupItem("q1", id={"type": "list-group-item", "index": 1}, action=True, active=False)]
        test2 = [dbc.ListGroupItem("q2", id={"type": "list-group-item", "index": 2}, action=True, active=False)]

        if toggle_global_question:
            return "invisible", test1
        else:
            return "visible", test2

    @dash_app.callback(Input({"type": "list-group-item", "index": ALL}, "n_clicks"))
    def question_update(_):
        print(f"Clicked on Item {ctx.triggered_id.index}")
        return

    with flask_server.app_context(), flask_server.test_request_context():
        with open(os.path.join(BASEDIR, "templates", "public", "map.html"), "r") as f:
            html_body = render_template_string(f.read())

            for comment in ["app_entry", "config", "scripts", "renderer"]:
                html_body = html_body.replace(f"<!-- {comment} -->", "{%" + comment + "%}")

            dash_app.index_string = html_body

    return dash_app.server
