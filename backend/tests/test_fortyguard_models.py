import json
import pytest
from pathlib import Path
from pydantic import ValidationError
from app.models.fortyguard import HeatmapRequest, StatusResponse, HeatmapSubmitResponse

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"
HEATMAP_FIXTURE_PATH = FIXTURES_DIR / "fortyguard_heatmap_sample.json"

def test_parse_status_response_fixture():
    # Load the real fixture
    with open(HEATMAP_FIXTURE_PATH, "r") as f:
        data = json.load(f)
        
    # The fixture is a terminal "Completed" response
    status_resp = StatusResponse(**data)
    
    assert status_resp.error is False
    assert status_resp.status_code == 200
    assert status_resp.data.activity_id is not None
    assert status_resp.data.status == "Completed"
    assert status_resp.data.result is not None
    assert status_resp.data.result.stats_data.n_cells == 0


def test_heatmap_request_valid():
    payload = {
        "polygon_aoi": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-112.075, 33.450],
                    [-112.070, 33.450],
                    [-112.070, 33.445],
                    [-112.075, 33.445],
                    [-112.075, 33.450]
                ]
            ]
        },
        "date_time": {
            "start_date": "2026-08-22",
            "start_time": "14:00",
            "filter_type": 1
        },
        "analytic_type": "tcm",
        "granularity": 60
    }
    
    req = HeatmapRequest(**payload)
    assert req.analytic_type == "tcm"
    assert req.granularity == 60


def test_heatmap_request_invalid_coordinates_swapped():
    # Intentionally swapped [latitude, longitude]
    payload = {
        "polygon_aoi": {
            "type": "Polygon",
            "coordinates": [
                [
                    [33.450, -112.075],
                    [33.450, -112.070],
                    [33.445, -112.070],
                    [33.445, -112.075],
                    [33.450, -112.075]
                ]
            ]
        },
        "date_time": {
            "start_date": "2026-08-22",
            "start_time": "14:00"
        },
        "analytic_type": "tcm",
        "granularity": 60
    }
    
    with pytest.raises(ValidationError) as exc:
        HeatmapRequest(**payload)
        
    assert "strict US bounds" in str(exc.value)


def test_heatmap_request_missing_threshold():
    payload = {
        "polygon_aoi": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-112.075, 33.450],
                    [-112.070, 33.450],
                    [-112.070, 33.445],
                    [-112.075, 33.445],
                    [-112.075, 33.450]
                ]
            ]
        },
        "date_time": {
            "start_date": "2026-08-22",
            "start_time": "14:00"
        },
        "analytic_type": "exceedance",
        "granularity": 60
    }
    
    with pytest.raises(ValidationError) as exc:
        HeatmapRequest(**payload)
        
    assert "Both 'threshold' and 'direction' are required" in str(exc.value)
