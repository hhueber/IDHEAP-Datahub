import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from tqdm import tqdm

# Load the files 
question_globales_path = 'data/QuestionGlobales.xlsx'
extraction_codebook_path = 'data/Extraction CodeBook - 3. Cleaned.xlsx'

# Read the global questions file
df_globales = pd.read_excel(question_globales_path)

# Read all sheets from the codebook file
sheets_codebook = pd.read_excel(extraction_codebook_path, sheet_name=None)

# Function to compute similarity between questions and group similar ones
def compute_similarity_grouping(df1, df2, threshold=0.8):
    vectorizer = TfidfVectorizer()
    
    # Convert the labels to strings to avoid any issues
    questions1 = df1['label'].astype(str)
    questions2 = df2['label'].astype(str)
    
    # Vectorize the questions (TF-IDF)
    vectors1 = vectorizer.fit_transform(questions1)
    vectors2 = vectorizer.transform(questions2)
    
    # Calculate cosine similarity between the vectors
    similarity_matrix = cosine_similarity(vectors1, vectors2)
    
    # Dictionary to group questions by global label
    similar_groups = {}
    
    # Progress bar for the outer loop (questions in global file)
    for i in tqdm(range(similarity_matrix.shape[0]), desc="Processing Global Questions"):
        global_label = df1.iloc[i]['label']  # Existing global question label
        
        # Find all questions in df2 that are similar to the current global question
        for j in range(similarity_matrix.shape[1]):
            if similarity_matrix[i, j] >= threshold:
                original_label = df2.iloc[j]['label']  # Original question label from another year
                year = df2.iloc[j]['year']  # The year of the original question
                
                # If the global question has already been encountered, append the new similar question
                if global_label in similar_groups:
                    similar_groups[global_label].append({
                        "original_label": original_label,
                        "year": year
                    })
                else:
                    # If the global question is new, create a new entry
                    similar_groups[global_label] = [{
                        "original_label": original_label,
                        "year": year
                    }]
    
    return similar_groups

# List to store global question groups (including original labels per year)
global_question_groups = {}

# Loop over all sheets (years) in the codebook
for year, df_codebook in tqdm(sheets_codebook.items(), desc="Processing Codebook Sheets"):
    # Add a 'year' column to the codebook dataframe to track the year for each question
    df_codebook['year'] = year
    
    # Compute similarity between the global questions and the codebook questions for the current year
    similar_questions_grouped = compute_similarity_grouping(df_globales, df_codebook)
    
    # Combine the results of this year with previous years
    for global_label, similar_list in similar_questions_grouped.items():
        if global_label in global_question_groups:
            global_question_groups[global_label].extend(similar_list)
        else:
            global_question_groups[global_label] = similar_list

# Convert the global question groups into a DataFrame for easier viewing
df_global_question_groups = []

for global_label, similar_list in global_question_groups.items():
    for similar_question in similar_list:
        df_global_question_groups.append({
            "global_label": global_label,
            "original_label": similar_question["original_label"],
            "year": similar_question["year"]
        })

df_global_question_groups = pd.DataFrame(df_global_question_groups)

print(df_global_question_groups.head())