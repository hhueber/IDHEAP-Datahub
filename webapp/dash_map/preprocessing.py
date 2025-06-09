import os
import pandas as pd
from webapp.config import BASEDIR

# Define the directory where our processed survey CSV files live
BASE_PATH = os.path.join(BASEDIR, "data", "private_data")

# Load merged commune-level responses (current + historical surveys)
# Reads 'commune_responses_combined.csv' and indexes by municipality ID ('gemid')
df_commune_responses_combined = pd.read_csv(os.path.join(BASE_PATH, "commune_responses_combined.csv")).set_index(
    "gemid"
)

# Load the full combined survey DataFrame for individual questions
df_combined = pd.read_csv(os.path.join(BASE_PATH, "combined_df.csv"))

# Load the top-10 global questions derived from our NLP pipeline
top_10_question_globales = pd.read_csv(os.path.join(BASE_PATH, "top_10_QuestionGlobales_NLP.csv"))

# Load detailed answer labels for 2023 questions
# and build a nested dict: { question_id: { code: label, ... }, ... }
df_labels = pd.read_csv(os.path.join(BASE_PATH, "answ_details_2023.csv"), delimiter=";").set_index("qid")
labels = {
    qid: {val: lab for val, lab in zip(cols["values"].split(";"), cols["labels"].split(";"))}
    for qid, cols in df_labels.to_dict(orient="index").items()
}
