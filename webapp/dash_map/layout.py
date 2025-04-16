from dash import dcc, html
from flask_babel import _
import dash_bootstrap_components as dbc


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
                            disabled=True,
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
