# All Things Made

## Notebooks

### What We've Done and Why

Across multiple notebooks, we have built a complete pipeline to take raw survey responses through to analysis-ready, geospatially enriched, and semantically grouped datasets with multilingual labels. 
Steps: 

1. **Data Preparation (`data_treatment.ipynb`)**  
   - **What:** Loaded raw 2023 survey responses and the cleaned CodeBook; merged them into a single pandas DataFrame.  
   - **Why:** Establishes a unified dataset as the foundation for all subsequent processing and ensures consistent handling of question codes and translations.

2. **Geospatial & Multilingual Enrichment (`data_treatment_bis.ipynb`)**  
   - **What:** Matched each respondent’s commune ID to GeoJSON boundaries; cleaned and translated question labels (German → English → French → Italian), marking Romanian as unavailable.  
   - **Why:** Enables the creation of interactive maps and supports reporting in multiple languages, increasing the accessibility and visual impact of our survey results.

3. **Longitudinal Linking (`global_question_longitudinality.ipynb`)**  
   - **What:** Mapped each question code back to its overarching “global” theme and recorded the first survey year it appeared.  
   - **Why:** Allows us to track how core questions have evolved over time, providing historical context and supporting trend analysis across survey waves.

4. **NLP-Driven Question Grouping (`nlp_notebook.ipynb`)**  
   - **What:** Cleaned and tokenized question text, computed TF-IDF similarities (and optional BERT embeddings), and clustered items into semantically coherent global themes.  
   - **Why:** Automates the discovery of related survey items, reducing manual tagging effort and ensuring consistency in how questions are categorized year-to-year.

5. **Enhanced NLP Pipeline (`nlp_notebook_bis.ipynb`)**  
   - **What:** Refined our clustering by comparing TF-IDF vs. transformer embeddings, applied DBSCAN to tune group granularity, and implemented fallback BERT translations when API access was unavailable.  
   - **Why:** Improves the quality of global themes and label translations, making the final dataset more reliable for multilingual reporting and longitudinal comparisons.

---

### What Worked (and What Didn’t)

- **Successes:**  
  - Seamless merging of disparate Excel sources into unified DataFrames.  
  - Accurate geospatial joins, enabling clean exports for mapping tools.  
  - Automated question clustering that aligned well with manually defined themes.  
  - A robust translation cascade delivering high-quality English, French, and Italian labels.

- **Challenges:**  
  - Romanian translations remain missing (no reliable model/API locally).  
  - API-based translation (LibreTranslate) was inaccessible, requiring fallback to offline models.  
  - Tuning DBSCAN parameters for NLP clustering took several iterations to balance over- and under-clustering.  
  - Extracting exact first-appearance years from code strings required custom parsing logic.

---

### Next Steps

1. **Finalize Romanian Translations**  
   Identify or train a reliable translation model for Romanian, or source human-validated labels.

2. **Automate Pipeline Execution**  
   Wrap notebooks into scheduled scripts or Airflow jobs to regenerate datasets after each new survey wave.

3. **Extend NLP Themes**  
   Incorporate additional transformer models (e.g., multilingual BERT) to improve clustering across languages.

4. **Quality Assurance & Documentation**  
   Write tests for key transformation steps and draft user guides for dataset consumers.  


## `webapp/dash_map/__init__.py`

**What we’ve done**  
- Initialized the Dash app on our Flask server under `/map/`, applying Bootstrap styling.  
- Set up the full-page layout (`layout_full`) and a unified callback to drive the question list, slider visibility, and map updates.  
- Integrated a custom Jinja-based HTML template via `dash_app.index_string` so our Dash view inherits the main site’s look and feel.

**Next steps**  
- Refactor the single, large callback into smaller helper functions for clarity and testability.  
- Replace the hard-coded `"en"` locale with a dynamic `get_locale()` call from Flask-Babel.  
- Surface errors and missing-data warnings in the UI rather than just printing to console.  
- Write unit tests covering global vs. survey modes, slider logic, and map-rendering edge cases.

**What worked (and what didn’t)**  
- Dash and Flask integrate seamlessly, and the map responds smoothly to user input.  
- The monolithic callback is hard to maintain, locale handling is static, and error feedback is lacking.

---

## `webapp/dash_map/helpers.py`

**What we’ve done**  
- Loaded Switzerland’s country, lakes, and municipality GeoJSON at import time and built a fast `MUNICIPALITIES` lookup.  
- Defined `SPECIAL_ANSWERS` codes and consistent color scales for up to 10 discrete categories plus special cases.  
- Created `fig_switzerland_empty()` to render a blank basemap with country outline, lakes, and major-city markers.  
- Built `fig_map_with_data()` and `create_figure()` to overlay survey responses—choosing between continuous and discrete choropleths and handling missing data.

**Next steps**  
- Extract shared logic from `fig_map_with_data()` and `create_figure()` to remove duplication.  
- Implement lazy-loading or caching of GeoJSON assets to speed up app startup.  
- Parameterize color scales, city lists, and special-answer mappings for easier customization.  
- Add automated tests to verify layer ordering, legend generation, and hover-text formatting across various data scenarios.

**What worked (and what didn’t)**  
- Helpers produce clean, interactive maps with correct layering and styling out of the box.  
- Import-time data loading can slow initialization, and duplicated overlay code increases maintenance risk.  


## Overall difficulties 
We ran into several issues while building this pipeline. First, the same question frequently gets a new code or label in each survey wave, which made merging and callback logic a constant headache. Managing data through CSV files proved challenging: large files loaded slowly, and small formatting changes often broke the processing steps. The year slider never worked reliably, despite debugging we couldn’t get it to update the map correctly. And the question list box (where you select the question of a certain survey year) simply appends new items on each year change instead of resetting, leaving leftover entries from previous surveys with no clear way to clear them out.



## Next step
**What we’ve done**  
- Kicked off the transition from CSV to a relational database by writing the populating scripts to seed cantons, districts, communes, surveys, questions, global themes, options, answers, and a default admin user.  

**What we need to do next**  
1. **Finish and validate the CSV→DB migration**  
   - Load all remaining input CSVs into their respective tables, verify the schema, and check referential integrity.  
2. **Refactor data‐loading functions**  
   - Replace existing `pd.read_csv` calls in preprocessing and helper modules with SQLAlchemy queries against our new database.  
3. **Benchmark and test**  
   - Measure load times, add indexes as needed, and write automated tests to ensure the database pipelines produce the same outputs (and fix any discrepancies).  

**What worked (and what didn’t)**  
- The initial seeding script reliably populates core tables when CSVs are well‐formed.  
- Some CSV quirks still trigger errors during population, and bulk inserts via pandas.
- We haven’t yet hooked the UI slider and question dropdown up to the database layer, so the expected gains in load speed, data sanitation, and component reliability (slider, dropdown reset) remain to be verified.  

Good luck for the next step, it was a pleasure to work on this project. 
Matthieu



