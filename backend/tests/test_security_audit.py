import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.fortyguard import HeatmapRequest, GeoJSONPolygon, DateTimeFilter


@pytest.mark.asyncio
async def test_security_headers_present_on_all_responses():
    """Verify production security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.headers.get("X-Content-Type-Options") == "nosniff"
        assert res.headers.get("X-Frame-Options") == "DENY"
        assert res.headers.get("X-XSS-Protection") == "1; mode=block"
        assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
        assert "Strict-Transport-Security" in res.headers
        assert "Content-Security-Policy" in res.headers


def test_polygon_validation_rejects_out_of_bounds_coords():
    """Ensure coordinate validation strictly rejects out-of-bounds or swapped coordinates."""
    # 1. European/Asian coordinates outside US bounds
    with pytest.raises(ValueError, match="outside strict US bounds"):
        HeatmapRequest(
            polygon_aoi=GeoJSONPolygon(
                type="Polygon",
                coordinates=[[[10.0, 50.0], [10.1, 50.0], [10.1, 50.1], [10.0, 50.0]]]
            ),
            date_time=DateTimeFilter(start_date="2026-08-25", start_time="14:00"),
            analytic_type="tcm",
            granularity=60
        )


def test_polygon_validation_rejects_swapped_lat_lon():
    """Ensure coordinates with swapped latitude/longitude (e.g. Phoenix lat as lon) are rejected."""
    with pytest.raises(ValueError, match="outside strict US bounds"):
        HeatmapRequest(
            polygon_aoi=GeoJSONPolygon(
                type="Polygon",
                coordinates=[[[33.45, -112.07], [33.46, -112.07], [33.46, -112.06], [33.45, -112.07]]]
            ),
            date_time=DateTimeFilter(start_date="2026-08-25", start_time="14:00"),
            analytic_type="tcm",
            granularity=60
        )