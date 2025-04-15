import os


import pandas as pd


from webapp.config import BASEDIR


BASE_PATH = os.path.join(BASEDIR, "data", "private_data")

# Load combined responses from both current and old years
df_commune_responses_combined = pd.read_csv(os.path.join(BASE_PATH, "commune_responses_combined.csv")).set_index(
    "gemid"
)

# Load additional data files for the app
df_combined = pd.read_csv(os.path.join(BASE_PATH, "combined_df.csv"))
top_10_question_globales = pd.read_csv(os.path.join(BASE_PATH, "top_10_QuestionGlobales_NLP.csv"))

# Load labels
df_labels = pd.read_csv(os.path.join(BASE_PATH, "answ_details_2023.csv"), delimiter=";").set_index("qid")
labels = {
    qid: {val: lab for val, lab in zip(cols["values"].split(";"), cols["labels"].split(";"))}
    for qid, cols in df_labels.to_dict(orient="index").items()
}
