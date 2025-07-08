from dash import dcc, html
from flask_babel import _
import dash_bootstrap_components as dbc


# Card containing the main map visualization
layout_card = dbc.Card(
    dbc.CardBody(
        dcc.Graph(
            id="map-graph",
            style={
                "height": "75vh", # Occupy most of the vertical space for clarity
            },
        )
    ),
    className="mb-4",
)

# Card with user instructions and a note about data completeness
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

# Card for survey selection dropdown and optional year slider
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
                        value="survey", # Default to the 2023 survey
                        clearable=False, # Prevent clearing the selection
                    ),
                ],
            ),
            # Slider appears only when a global question is selected
            html.Div(
                id="slider-container",
                style={"display": "none"}, # Hidden until needed
                children=[
                    html.Label(
                        _("Select a question to see the years"), # Translatable label
                        id="slider-label",
                    ),
                    html.Div(
                        dcc.Slider(
                            id="slider",
                            min=1988, # Earliest survey year
                            max=2023, # Latest survey year
                            value=None,  # Initial value depends on selected global question
                            marks={},  # Marks updated based on available years for the question
                            step=None,  # No intermediate values
                            disabled=True, # Enabled when a question is clicked
                        ),
                    ),
                ],
            ),
        ]
    ),
    className="mb-4",
)

# Card for listing available survey or global questions
layout_questions = dbc.Card(
    dbc.CardBody(
        [
            html.Div(
                [
                    html.Label(
                        _("Question"), # Translatable label for question list
                        id="variable-selection-label",
                    ),
                    dbc.ListGroup(
                        [], # Populated with ListGroupItem entries in callback
                        id="questions-list",
                        style={"overflow-y": "auto", "max-height": "300px"},
                    ),
                ],
            ),
        ]
    ),
    className="mb-4",
)

# Assemble the full app layout: map on the left, controls on the right
layout_full = html.Div(
    dbc.Row(
        [
            # Left column: main map visualization
            dbc.Col(layout_card, width=8),
            # Right column: instructions, options, and question list
            dbc.Col([layout_infos, layout_options, layout_questions], width=4),
        ]
    )
)
