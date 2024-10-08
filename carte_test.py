import json
import topojson
from dash import Dash, dcc, html, Input, Output
import plotly.express as px
import plotly.graph_objects as go
import dash
import random
import pandas as pd
import numpy as np 

# Load the GeoJSON files with utf-8 encoding
with open('lakes.json', encoding="utf-8") as f:
    lakes_data = json.load(f)

with open('municipalities.json', encoding="utf-8") as f:
    municipalities_data = json.load(f)

with open('country.json', encoding="utf-8") as f:
    country_data = json.load(f)

df_commune_responses = pd.read_csv('data/commune_responses.csv')
df_combined = pd.read_csv('data/combined_df.csv')
#print(df_commune_responses.head())

question_values = df_commune_responses.columns[df_commune_responses.columns.str.contains('GSB23_Q')]
question_labels = df_combined['label'].tolist()  # List of question labels

options = [{'label': label, 'value': value} for label, value in zip(question_labels, question_values)]



# Function to create the figure with the updated color scale
def create_figure(variable_values, communes):
    
    custom_colorscale = [
        [-99, "darkgray"], # Voluntary no response
        [np.nan, "lightgray"], # Exited survey
        #[0, "blue"],
        #[1, "green"],
        #[2, "magenta"],
        #[3, "peach"],
        #[4, "orange"],
        #[5, "red"],
        #[6, "purple"],
        #[7, "darkviolet"]
    ]

    fig = go.Figure()

    # Add the country layer (Switzerland)
    fig.add_trace(go.Choroplethmapbox(
        geojson=country_data,
        locations=[feature["properties"]["id"] for feature in country_data["features"]],
        z=[1] * len(country_data["features"]),
        colorscale=[[0, "white"], [1, "white"]],
        featureidkey="properties.id",
        name="Country"
    ))

    # Add the municipalities layer with dynamic values and color scale
    fig.add_trace(go.Choroplethmapbox(
        geojson=municipalities_data,
        #locations=[feature["properties"]["id"] for feature in municipalities_data["features"]],
        locations=communes,
        z=variable_values,  # variable values (dynamically updated)
        #colorscale = custom_colorscale,  # color scale (can be dynamic)
        colorscale='viridis', 
        featureidkey="properties.id",  # key to link the data and geojson
        name="Municipalities", 
        hoverinfo="text",  # display hover information
        text=[f"{feature['properties']['name']}: {value if value != -99 else 'No response'}"
              for value, feature in zip(variable_values, municipalities_data["features"])],
        colorbar=dict(
            title='Values',  # Title of the color scale
            thickness=25,  # Width of the color scale
            x=1.05,  # Place the color scale to the right of the map
            y=0.5,  # Center the color scale vertically
            tickvals=[-99, float('nan')] + list(range(0, 8)),  # Set ticks for color scale
            ticktext=["Voluntary No Response", "Exited Survey"] + [str(i) for i in range(0, 8)],  # Ticks labels
        ),
        showscale=True  # Ensure the color scale is shown
    ))

    # Add the lakes layer
    fig.add_trace(go.Choroplethmapbox(
        geojson=lakes_data,
        locations=[feature["properties"]["id"] for feature in lakes_data["features"]],
        z=[1] * len(lakes_data["features"]),
        colorscale="Blues",
        featureidkey="properties.id",
        name="Lakes",
        hoverinfo="text",
        text=[feature["properties"]["name"] for feature in lakes_data["features"]],
        showscale=False  # Hide the color scale for lakes
    ))

    # Layout settings for the map
    fig.update_layout(
        mapbox_style="open-street-map",
        mapbox_zoom=7,
        mapbox_center={"lat": 46.4, "lon": 8.8},
        margin={"r": 0, "t": 0, "l": 0, "b": 0},
        height=800,
        width=1200,
        dragmode=False,  # Disable map dragging
        uirevision=True,  # Ensure UI elements (like the color scale) do not reset on interaction
        mapbox=dict(
            layers=[],
            accesstoken="your-access-token",  # Remove if you are using open-street-map
            zoom=7,
            center={"lat": 46.4, "lon": 8.8},
            style="open-street-map"
        ),
        showlegend=False  # If you don't want legends to show
    )
    return fig

# Dash app
app = dash.Dash(__name__)

app.layout = html.Div([
    html.H1("Map with Dynamic Color Scale", style={'text-align': 'left', 'margin-bottom': '40px'}),
    
    # Dropdowns for survey and variable selection
    html.Div([
        html.Div([
            html.Label("Survey Selection"),
            dcc.Dropdown(
                id='survey-dropdown',
                options=[
                    {'label': 'Global Question', 'value': 'global_question'},
                    {'label': 'Survey', 'value': 'survey'}
                ],
                value='survey',
                clearable=False
            )
        ], style={'width': '48%', 'display': 'inline-block'}),
        
        html.Div([
            html.Label("Variable Selection"),
            dcc.Dropdown(
                id='variable-dropdown',
                options=[{'label': label, 'value': value} for label, value in zip(question_labels, question_values)],
                value=question_values[0],  # Default value
                clearable=False
            )
        ], style={'width': '48%', 'display': 'inline-block'})
    ], style={'display': 'flex', 'justify-content': 'space-between'}),

    # Graph for the map with dynamic color scale
    dcc.Graph(id='map-graph'),

    # Slider container (shown based on survey selection)
    html.Div(children=[],id='slider-container', style={'border': '1px solid black', 'padding': '10px'})
], style={
    "height": "100vh",
    "width": "100vw",
    "overflow": "hidden",
    "padding": "20px",
    "margin": "0",
    "font-family": "Arial, sans-serif"  # Font that supports ä ö ü
})


@app.callback(
    Output('map-graph', 'figure'),
    Input('variable-dropdown', 'value')
)
def update_map(selected_variable):
    # Print the selected variable for debugging
    print(f"Selected variable: {selected_variable}")
    
    # Check if the selected variable exists in the columns of df_commune_responses
    if selected_variable not in df_commune_responses.columns:
        raise ValueError(f"The variable '{selected_variable}' does not exist in the commune responses.")

    # Filter df_commune_responses to get the responses for the selected question
    filtered_responses = df_commune_responses[['GSB23_Q100', selected_variable]].dropna()  # Ensure no NaN values

    # Print unique responses for the selected variable
    unique_responses = filtered_responses[selected_variable].unique()
    print(f"Unique responses for {selected_variable}: {unique_responses}")

    # Extract the commune IDs and their corresponding responses
    communes = filtered_responses['GSB23_Q100'].astype(int).tolist()  # List of commune IDs
    responses = filtered_responses[selected_variable].tolist()  # List of responses


    # Group the responses by commune in case a commune has multiple responses
    response_dict = dict(zip(communes, responses))
    aggregated_responses = [response_dict.get(feature["properties"]["id"], -99) for feature in municipalities_data["features"]]

    # Create the figure with the aggregated responses and communes
    return create_figure(aggregated_responses, [feature["properties"]["id"] for feature in municipalities_data["features"]])


# Callback to update the slider
@app.callback(
    Output('slider-container', 'children'),
    Input('survey-dropdown', 'value')
)

def update_slider(selected_survey):
    if selected_survey == 'global_question':
        return html.Div([
            dcc.Slider(
                id='year-slider',
                min=2000,  
                max=2024,
                step=1,
                value=2020,  
                marks={i: str(i) for i in range(2000, 2025)}
            )
        ], style={'padding-top': '10px'})
    
    return html.Div()  # Empty div if 'survey' is selected

#print("questions values",question_values)
#print("communes  respons col",df_commune_responses.columns.tolist())

if __name__ == '__main__':
    app.run_server(debug=True)
