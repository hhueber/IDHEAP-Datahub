import os
import random


from dash import ALL, ctx, Dash, dcc, html, Input, Output, State
from flask import Flask, render_template_string
from sqlalchemy.orm import Session
import dash_bootstrap_components as dbc
import pandas as pd
import plotly.graph_objects as go


from webapp.config import BASEDIR
from webapp.database import QuestionPerSurvey, Survey
from webapp.map_helpers import (
    COLOR_SCALE_10,
    COLOR_SCALE_SPECIAL,
    DB_QUESTIONS_GLOBAL,
    DB_YEARS,
    ENGINE,
    fig_switzerland_empty,
    MUNICIPALITIES,
    MUNICIPALITIES_DATA,
    MUNICIPALITIES_IDS,
    SPECIAL_ANSWERS,
)


# Create fake data
FAKE_QUESTIONS = ["q1", "q2", "q3"]
Q1_ANSWERS = {
    "0": "no",
    "1": "yes",
}
Q2_ANSWERS = {
    "0": "kit",
    "1": "satellite",
    "2": "avenue",
    "3": "security",
    "4": "tactic",
    "5": "practical",
}
Q3_ANSWERS = None  # It'll be a range instead!

# Generate some garbage dataframe for the questions
DF_QUESTIONS_ANSWERS = pd.DataFrame(
    {
        "id": MUNICIPALITIES_IDS,
        "name": list(MUNICIPALITIES.values()),
        "q1": list(random.choice([*Q1_ANSWERS.keys(), *SPECIAL_ANSWERS.keys()]) for i in MUNICIPALITIES_IDS),
        "q2": list(random.choice([*Q2_ANSWERS.keys(), *SPECIAL_ANSWERS.keys()]) for i in MUNICIPALITIES_IDS),
        "q3": list(
            int(1000 * random.random()) if random.randint(0, 5) != 3 else random.choice([*SPECIAL_ANSWERS.keys()])
            for i in MUNICIPALITIES_IDS
        ),
    }
)
# Generate some garbage dict for the answers
QUESTIONS_ANSWERS = {
    "q1": Q1_ANSWERS,
    "q2": Q2_ANSWERS,
    "q3": Q2_ANSWERS,
}


LOCALE = "de"


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
                                                                for year in DB_YEARS
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
        if switch_value:  # Global questions
            questions_list = [
                dbc.ListGroupItem(
                    getattr(
                        question,
                        f"text_{LOCALE}",
                    ),
                    id={"type": "list-group-item", "index": question.uid},
                    n_clicks=0,
                    action=True,
                )
                for question in DB_QUESTIONS_GLOBAL
            ]
            return "invisible", None, questions_list
        else:  # Per survey questions
            questions_list = []
            if year:
                with Session(ENGINE) as session:
                    db_survey = session.execute(session.query(Survey).where(Survey.year == int(year))).one_or_none()
                    if db_survey:
                        db_questions = [question for question in db_survey[0].questions]
                        questions_list = [
                            dbc.ListGroupItem(
                                getattr(
                                    question,
                                    f"text_{LOCALE}",
                                ),
                                id={"type": "list-group-item", "index": question.uid},
                                n_clicks=0,
                                action=True,
                            )
                            for question in db_questions
                        ]
                    else:
                        print("ERROR")
            else:
                print("ERROR")
            return "visible", year, questions_list

    @dash_app.callback(
        Output({"type": "list-group-item", "index": ALL}, "active"),
        Output({"type": "list-group-item", "index": ALL}, "n_clicks"),
        Output("map-graph", "figure"),
        State("global-question-switch", "value"),
        Input({"type": "list-group-item", "index": ALL}, "n_clicks"),
    )
    def question_update(switch_value, list_group_items):
        """
        Update the map when a question is selected.
        """
        # Generate empty basic map
        fig = fig_switzerland_empty()  # In a future version, we can refactor so that we generate that one only once

        if any(list_group_items):
            print(f"Clicked on Item {ctx.triggered_id.index}")
            chosen_question = ctx.triggered_id.index

        return list_group_items, [0] * len(list_group_items), fig

    with flask_server.app_context(), flask_server.test_request_context():
        with open(os.path.join(BASEDIR, "templates", "public", "map.html"), "r") as f:
            html_body = render_template_string(f.read())

            for comment in ["app_entry", "config", "scripts", "renderer"]:
                html_body = html_body.replace(f"<!-- {comment} -->", "{%" + comment + "%}")

            dash_app.index_string = html_body

    return dash_app.server
