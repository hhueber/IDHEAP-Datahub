# Import packages
import json
import topojson
from dash import Dash, dash_table, dcc, html, Input, Output
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import dash
import random


# Load the geojson file founded at "https://swiss-maps.vercel.app/"
# with utf-8 encoding
# Load the TopoJSON file containing Switzerland's borders and communes

with open('lakes.json', encoding="utf-8") as f:
    lakes_data = json.load(f)

with open('municipalities.json', encoding="utf-8") as f:
    municipalities_data = json.load(f)

with open('country.json', encoding="utf-8") as f:
    country_data = json.load(f)

# Generate random values for municipalities -> to be replaced by the real data
commune_values_rdm = {
    feature["properties"]["id"]: random.randint(1,20)  # random integer value attribution 
    for feature in municipalities_data["features"]
}

# create the figure with the json data
fig = go.Figure()


# add the country data to the figure
fig.add_trace(go.Choroplethmapbox(
    geojson=country_data,
    locations=[feature["properties"]["id"] for feature in country_data["features"]],
    z=[1] * len(country_data["features"]),
    colorscale=[[0, "white"], [1, "white"]],
    featureidkey="properties.id",
    name="Country"
))

# define a discrete color scale
discrete_color_scale = px.colors.qualitative.Plotly[:20] # Get the first 20 colors

# add the municipalities data to the figure
fig.add_trace(go.Choroplethmapbox(
    geojson=municipalities_data,
    locations=[feature["properties"]["id"] for feature in municipalities_data["features"]],
    z=list(commune_values_rdm.values()),  # random variable attribution -> to be replaced by the real data
    colorscale="Viridis",  # color scale
    featureidkey="properties.id", # key to make the link between the data and the geojson
    name="Municipalities", 
    hoverinfo="text",  # display hover information
    text=[f"{feature['properties']['name']}: {commune_values_rdm[feature['properties']['id']]}"
          for feature in municipalities_data["features"]],
    colorbar=dict(
        title='Valeurs',  # Title of the scale bar
        tickvals=list(range(1, 21)),  # Values of the scale bar (int from 1 to 20)
        ticktext=list(map(str, range(1, 21)))  # Text of the scale bar (str from 1 to 20)
    ),
    showscale=True  # Ensure that the scale is shown
))

# add the lakes data to the figure
fig.add_trace(go.Choroplethmapbox(
    geojson=lakes_data,
    locations=[feature["properties"]["id"] for feature in lakes_data["features"]],
    z=[1] * len(lakes_data["features"]),
    colorscale="Blues",
    featureidkey="properties.id",
    name="Lakes",
    hoverinfo="text",  # display hover information
    text=[feature["properties"]["name"] for feature in lakes_data["features"]] # text to display
))




# layout manager
fig.update_layout(
    mapbox_style="open-street-map",  # background definition --> OSM
    mapbox_zoom=7,  # zoom level, more the value is high, more the map is zoomed
    mapbox_center={"lat": 46.4, "lon": 8.8},  # approximate center of switzerland
    margin={"r": 0, "t": 0, "l": 0, "b": 0},  # margin suppression
    height=800,  # height of the map
    width=2000,  # width of the map
    title_x=0,  # x position of the title
    title_y=0.95,  # y position of the title  
)

app = dash.Dash(__name__)


app.layout = html.Div([
    html.H1("Carte", style={'text-align': 'left', 'margin-bottom': '40px'}),
    
    # Dropdowns
    html.Div([
        html.Div([
            html.Label("Sélection de l'enquête"),
            dcc.Dropdown(
                id='survey-dropdown',
                options=[
                    {'label': 'Survey', 'value': 'survey'},
                    {'label': 'Question Globale', 'value': 'global_question'}
                ],
                value='survey',
                clearable=False
            )
        ], style={'width': '48%', 'display': 'inline-block'}),
        
        html.Div([
            html.Label("Choix de la variable"),
            dcc.Dropdown(
                id='variable-dropdown',
                options=[
                    {'label': 'question test 1', 'value': 'quest1'},
                    {'label': 'question test 2', 'value': 'quest2'},
                ],
                value='quest1',
                clearable=False
            )
        ], style={'width': '48%', 'display': 'inline-block'})
    ], style={'display': 'flex', 'justify-content': 'space-between'}),
    dcc.Graph(figure=fig),
    html.Div(id='slider-container', style={'border': '1px solid black', 'padding': '10px'}) # Container for the slider
], style={
    "height": "100vh",
    "width": "100vw",
    "overflow": "hidden",
    "padding": "20px",
    "margin": "0",
    "font-family": "Arial, sans-serif"  # Font that supports ä ö ü
})

@app.callback(
    Output('slider-container', 'children'),
    Input('survey-dropdown', 'value')
)
def update_slider(selected_survey):
    print(f"Selected survey: {selected_survey}")
    if selected_survey == 'global_question':
        return dcc.Slider(
            id='year-slider',
            min=2000,  # Change these values according to your data
            max=2024,
            step=1,
            value=2020,  # Default value
            marks={i: str(i) for i in range(2000, 2025)}  # range 
        )
    return html.Div()  # Return an empty Div if 'survey' is selected


if __name__ == '__main__':
    app.run_server(debug=True)