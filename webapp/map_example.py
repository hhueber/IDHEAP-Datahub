import random


from dash import callback, Dash, dcc, Input, Output


if __name__ == "__main__":
    from map_helpers import (
        COLOR_SCALE_10,
        COLOR_SCALE_SPECIAL,
        fig_switzerland_empty,
        MUNICIPALITIES,
        MUNICIPALITIES_DATA,
        MUNICIPALITIES_IDS,
        SPECIAL_ANSWERS,
    )
else:
    from .map_helpers import (
        COLOR_SCALE_10,
        COLOR_SCALE_SPECIAL,
        fig_switzerland_empty,
        MUNICIPALITIES,
        MUNICIPALITIES_DATA,
        MUNICIPALITIES_IDS,
        SPECIAL_ANSWERS,
    )

import pandas as pd


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

# Create dash app
app = Dash()

# Simple layout
app.layout = [
    dcc.Dropdown(
        id="survey-dropdown",
        options=FAKE_QUESTIONS,
        value=FAKE_QUESTIONS[0],  # Take the first question or whatever
    ),
    dcc.Graph(id="map-graph"),
]


@callback(Output("map-graph", "figure"), Input("survey-dropdown", "value"))
def update_graph(chosen_question):
    # Generate empty basic map
    fig = fig_switzerland_empty()  # In a future version, we can refactor so that we generate that one only once

    # Now for the fun partS!

    # We take the chose questions, and extract their unique answers
    answers_unique = list(DF_QUESTIONS_ANSWERS[chosen_question].unique())
    # We remove the special values
    for value in SPECIAL_ANSWERS.keys():
        answers_unique.remove(value)

    # Continuous or too many differents answers
    if len(answers_unique) > len(COLOR_SCALE_10):
        # We take only the answers which are not special answers
        dfp = DF_QUESTIONS_ANSWERS[~DF_QUESTIONS_ANSWERS[chosen_question].isin(SPECIAL_ANSWERS.keys())]

        # And we add the layer
        fig.add_choroplethmapbox(
            geojson=MUNICIPALITIES_DATA,
            locations=dfp["id"],
            z=dfp[chosen_question],
            featureidkey="properties.id",
            hoverinfo="text",
            text=[f"{name}: {value}" for name, value in zip(dfp["name"], dfp[chosen_question])],
        )
    # Discrete or few answers
    else:
        # For each unique answer, we create a layer for the map, and assign it a value
        for i, value in enumerate(answers_unique):
            # We extract the rows that have that value
            dfp = DF_QUESTIONS_ANSWERS[DF_QUESTIONS_ANSWERS[chosen_question] == value]

            # We create the text
            text_answer = QUESTIONS_ANSWERS[chosen_question][value]

            # And we add the layer
            fig.add_choroplethmapbox(
                geojson=MUNICIPALITIES_DATA,
                locations=dfp["id"],
                z=[i] * len(dfp),
                featureidkey="properties.id",
                showlegend=True,
                name=text_answer,
                colorscale=COLOR_SCALE_10[i],
                showscale=False,  # Hidding the scale lol
                hoverinfo="text",
                text=[f"{name}: {text_answer}" for name in dfp["name"].tolist()],
            )

    # And FINALLY, we add the special values!
    for i, value in enumerate(SPECIAL_ANSWERS):
        # We extract the rows that have that value
        dfp = DF_QUESTIONS_ANSWERS[DF_QUESTIONS_ANSWERS[chosen_question] == value]

        # We create the text
        text_answer = SPECIAL_ANSWERS[value]

        # And we add the layer
        fig.add_choroplethmapbox(
            geojson=MUNICIPALITIES_DATA,
            locations=dfp["id"],
            z=[i] * len(dfp),
            featureidkey="properties.id",
            showlegend=True,
            name=text_answer,
            colorscale=COLOR_SCALE_SPECIAL[i],
            showscale=False,  # Hidding the scale lol
            hoverinfo="text",
            text=[f"{name}: {text_answer}" for name in dfp["name"].tolist()],
        )

    return fig


if __name__ == "__main__":
    app.run(debug=True)
