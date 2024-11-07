import json
import os


import pandas as pd


# from webapp.config import BASEDIR

with open("../webapp/data/geojson/municipalities.json", encoding="utf-8") as f:
    MUNICIPALITIES_DATA = json.load(f)

# Data en plus sur les communes
MUNICIPALITIES = {
    feature["properties"]["id"]: feature["properties"]["name"] for feature in MUNICIPALITIES_DATA["features"]
}
MUNICIPALITIES_IDS = list(MUNICIPALITIES.keys())

df = pd.DataFrame.from_dict(MUNICIPALITIES, orient="index", columns=["name"])

base_questions = [
    "gemid",
    "GSB88_pop",
    "GSB88_pop_8",
    "GSB88_pop_10",
    "GSB94_pop",
    "GSB94_pop_8",
    "GSB94_pop_10",
    "GSB98_pop",
    "GSB98_pop_8",
    "GSB98_pop_10",
    "GSB05_pop",
    "GSB05_pop_8",
    "GSB05_pop_10",
    "GSB09_pop",
    "GSB09_pop_8",
    "GSB09_pop_10",
    "GSB17_pop",
    "GSB17_pop_8",
    "GSB17_pop_10",
    "GSB88_kant",
    "GSB94_kant",
    "GSB98_kant",
    "GSB05_kant",
    "GSB09_kant",
    "GSB17_kant",
    "GSB88_spr",
    "GSB94_spr",
    "GSB98_spr",
    "GSB05_spr",
    "GSB09_spr",
    "GSB17_spr",
    "GSB23_bez",
    "GSB23_kant",
    "GSB23_pop",
    "GSB23_spr",
    "GSB23_bezname",
]
global_questions = ["GSB23_Q52", "GSB17_Q58", "GSB23_Q9", "GSB17_Q7", "GSB23_Q7", "GSB17_Q6"]
questions = base_questions + global_questions
print(questions)

df_answers = pd.read_excel("../data/demo_answers.xlsx")
df_answers = df_answers[questions]
df_answers.set_index("gemid", inplace=True)

df = df.join(df_answers)

df_answers.to_csv("df_answers_demo.csv")

print(df)
