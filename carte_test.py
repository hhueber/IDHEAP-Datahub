import json
import topojson
from dash import Dash, dcc, html, Input, Output
import plotly.express as px
import plotly.graph_objects as go
import dash
import random

# Load the GeoJSON files with utf-8 encoding
with open('lakes.json', encoding="utf-8") as f:
    lakes_data = json.load(f)

with open('municipalities.json', encoding="utf-8") as f:
    municipalities_data = json.load(f)

with open('country.json', encoding="utf-8") as f:
    country_data = json.load(f)

# Generate random values for municipalities -> to be replaced by the real data
commune_values_rdm = {
    feature["properties"]["id"]: random.randint(1, 20)  # random integer value attribution 
    for feature in municipalities_data["features"]
}

# Function to create the figure with the updated color scale
def create_figure(variable_values):
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
        locations=[feature["properties"]["id"] for feature in municipalities_data["features"]],
        z=variable_values,  # variable values (dynamically updated)
        colorscale="Viridis",  # color scale (can be dynamic)
        featureidkey="properties.id",  # key to link the data and geojson
        name="Municipalities", 
        hoverinfo="text",  # display hover information
        text=[f"{feature['properties']['name']}: {variable_values[idx]}"
              for idx, feature in enumerate(municipalities_data["features"])],
        colorbar=dict(
            title='Values',  # Title of the color scale
            thickness=15,  # Width of the color scale
            x=1.05,  # Place the color scale to the right of the map
            y=0.5,  # Center the color scale vertically
            tickvals=list(range(1, 21)),  # Values of the color scale (int from 1 to 20)
            ticktext=list(map(str, range(1, 21)))  # Text of the color scale (str from 1 to 20)
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
                options=[
                    {'label': 'Test Question 1', 'value': 'quest1'},
                    {'label': 'Test Question 2', 'value': 'quest2'},
                ],
                value='quest1',
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

# Callback to update the map and color scale dynamically based on variable selection
@app.callback(
    Output('map-graph', 'figure'),
    Input('variable-dropdown', 'value')
)
def update_map(selected_variable):
    if selected_variable == 'quest1':
        return create_figure(list(commune_values_rdm.values()))  # use random values for quest1
    else:
        # You can add logic here to update the color scale dynamically
        new_values = [random.randint(10, 30) for _ in commune_values_rdm.keys()]
        return create_figure(new_values)  # Example with different random values for quest2

# Callback to update the slider
@app.callback(
    Output('slider-container', 'children'),
    Input('survey-dropdown', 'children')
)
def update_slider(selected_survey):
    if selected_survey == 'global_question':
        return html.Div([
            dcc.Slider(
                id='year-slider',
                min=2000,  # years from 2000 to 2024
                max=2024,
                step=1,
                value=2020,  # default value -->  the one displayed when the app is loaded
                marks={i: str(i) for i in range(2000, 2025)}  # years on the slider
            )
        ], style={'padding-top': '10px'})
    
    return html.Div()  # Empty div if 'survey' is selected

if __name__ == '__main__':
    app.run_server(debug=True)
