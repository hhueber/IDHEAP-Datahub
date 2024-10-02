# Import packages
import json


from dash import Dash, dash_table, dcc, html
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go


# Load the geojson file founded at "https://cartographyvectors.com/map/1043-switzerland-detailed-boundary"
# with utf-8 encoding
with open("switzerland-detailed-boundary_1043.geojson", encoding="utf-8") as f:
    geojson_data = json.load(f)  # Charger le GeoJSON en JSON


# create the figure with the geojson data
fig = go.Figure(
    go.Choroplethmapbox(
        geojson=geojson_data,
        featureidkey="properties.NAME",  # key to make the link between the data and the geojson
        locations=["Switzerland"],  # centered on Switzerland
        z=[1],  # Value to colorize (we give 1 to colorize the whole country)
        colorscale=[[0, "white"], [1, "white"]],  # Color scale (from white to white --> no color)
        marker_line_color="black",  # color of the borders
        marker_line_width=1,  # width of the borders
    )
)

# layout manager
fig.update_layout(
    mapbox_style="white-bg",  # background color
    mapbox_zoom=7,  # zoom level, more the value is high, more the map is zoomed
    mapbox_center={"lat": 46.8182, "lon": 8.2275},  # approximate center of switzerland
    margin={"r": 0, "t": 0, "l": 0, "b": 0},  # margin suppression
    title_text="  Carte test",  # title
    title_x=0,  # x position of the title
    title_y=0.95,  # y position of the title
    title_font=dict(size=40, color="black"),  # font of the title
)

# plot the map
fig.show()
