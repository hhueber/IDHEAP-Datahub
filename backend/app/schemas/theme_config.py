from typing import Literal


from pydantic import BaseModel, ConfigDict


class ThemeConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")  # interdit les clés inconnues

    instance_name: str | None = None
    logo_url: str | None = None

    # LIGHT
    colour_light_primary: str | None = None
    colour_light_secondary: str | None = None
    colour_light_background: str | None = None
    colour_light_text: str | None = None
    navbar_overlay_light_bg: str | None = None
    logoBackground_light: str | None = None
    selection_light: str | None = None

    communes_light: str | None = None
    district_light: str | None = None
    canton_light: str | None = None
    country_light: str | None = None
    lakes_light: str | None = None

    # DARK
    colour_dark_primary: str | None = None
    colour_dark_secondary: str | None = None
    colour_dark_background: str | None = None
    colour_dark_text: str | None = None
    navbar_overlay_dark_bg: str | None = None
    logoBackground_dark: str | None = None
    selection_dark: str | None = None

    communes_dark: str | None = None
    district_dark: str | None = None
    canton_dark: str | None = None
    country_dark: str | None = None
    lakes_dark: str | None = None

    theme_default_mode: Literal["light", "dark"] = "light"


class LogoUploadPayload(BaseModel):
    # on envoie un data URL complet: "data:image/png;base64,...."
    image_data: str
