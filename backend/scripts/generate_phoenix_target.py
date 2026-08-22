import sys
import os
import json
from pathlib import Path

# Add the backend root to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.utils.spatial_engine import create_phoenix_target_area

# Define a realistic bounding polygon for Downtown & South Phoenix
# Following roughly I-10 (North), I-17 (West), 24th St (East), Baseline Rd (South)
# Points must be in [longitude, latitude] and must close the loop (first == last)

# Approximate coordinates:
# NW: I-17 and I-10 intersection (-112.095, 33.465)
# NE: I-10 and 24th St (-112.030, 33.465)
# SE: 24th St and Baseline Rd (-112.030, 33.375)
# SW: 19th Ave and Baseline Rd (-112.095, 33.375)

polygon_coords = [
    [-112.095, 33.465], # NW
    [-112.030, 33.465], # NE
    [-112.030, 33.375], # SE
    [-112.095, 33.375], # SW
    [-112.095, 33.465]  # Close loop
]

feature = create_phoenix_target_area(polygon_coords)

area = feature["properties"]["area_mi2"]
print(f"Generated Polygon Area: {area} sq miles")

if 20.0 <= area <= 40.0:
    print("Area is within the required 20-40 sq mi range!")
    
    # Save the file
    data_dir = Path(__file__).resolve().parent.parent / "app" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    
    out_path = data_dir / "phoenix_target_area.geojson"
    
    feature_collection = {
        "type": "FeatureCollection",
        "features": [feature]
    }
    
    with open(out_path, "w") as f:
        json.dump(feature_collection, f, indent=2)
        
    print(f"Successfully saved to {out_path}")
else:
    print("ERROR: Area is outside the 20-40 sq mi range. Adjust coordinates!")
    sys.exit(1)
