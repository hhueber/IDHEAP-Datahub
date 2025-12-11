from typing import Optional


from pydantic import BaseModel


class ThemeConfig(BaseModel):
    instance_name: Optional[str] = None
    logo_url: Optional[str] = None

    # LIGHT MODE
    colour_light_primary: Optional[str] = None
    colour_light_secondary: Optional[str] = None
    colour_light_card: Optional[str] = None
    colour_light_text: Optional[str] = None

    # DARK MODE (tu pourras les remplir plus tard)
    colour_dark_primary: Optional[str] = None
    colour_dark_secondary: Optional[str] = None
    colour_dark_card: Optional[str] = None
    colour_dark_text: Optional[str] = None
