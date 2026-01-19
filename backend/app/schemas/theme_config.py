from typing import Literal, Optional


from pydantic import BaseModel, ConfigDict


class ThemeConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")  # interdit les clés inconnues

    instance_name: Optional[str] = None
    logo_url: Optional[str] = None

    # LIGHT
    colour_light_primary: Optional[str] = None
    colour_light_secondary: Optional[str] = None
    colour_light_background: Optional[str] = None
    colour_light_text: Optional[str] = None
    navbar_overlay_light_bg: Optional[str] = None
    logoBackground_light: Optional[str] = None

    communes_light: Optional[str] = None
    district_light: Optional[str] = None
    canton_light: Optional[str] = None
    country_light: Optional[str] = None
    lakes_light: Optional[str] = None

    # DARK
    colour_dark_primary: Optional[str] = None
    colour_dark_secondary: Optional[str] = None
    colour_dark_background: Optional[str] = None
    colour_dark_text: Optional[str] = None
    navbar_overlay_dark_bg: Optional[str] = None
    logoBackground_dark: Optional[str] = None

    communes_dark: Optional[str] = None
    district_dark: Optional[str] = None
    canton_dark: Optional[str] = None
    country_dark: Optional[str] = None
    lakes_dark: Optional[str] = None

    theme_default_mode: Literal["light", "dark"] = "light"


class LogoUploadPayload(BaseModel):
    # on envoie un data URL complet: "data:image/png;base64,...."
    image_data: str
