"""
HeatSentinel AI - Error & Exception Classes
"""

from typing import Dict, Any, Optional


class HeatSentinelError(Exception):
    """Base exception for all HeatSentinel-specific errors."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ExternalAPIError(HeatSentinelError):
    """Raised when an upstream external API call (FortyGuard, Census, etc.) fails."""
    def __init__(self, message: str, service: str = "upstream", status_code: int = 502):
        super().__init__(
            message=message,
            code=f"{service.upper()}_API_ERROR",
            status_code=status_code,
            details={"service": service}
        )


class FortyGuardAPIError(ExternalAPIError):
    """Specialized exception for FortyGuard API communication errors."""
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message=message, service="fortyguard", status_code=status_code)


class DataUnavailableError(HeatSentinelError):
    """Raised when requested heat, demographic, or resource data is missing or incomplete."""
    def __init__(self, message: str):
        super().__init__(message=message, code="DATA_UNAVAILABLE", status_code=404)


class ConfigurationError(HeatSentinelError):
    """Raised when critical configuration or API keys are missing."""
    def __init__(self, message: str):
        super().__init__(message=message, code="CONFIGURATION_ERROR", status_code=500)


def redact_sensitive_headers(headers: Dict[str, str]) -> Dict[str, str]:
    """Redacts secret keys from request/response headers for safe logging."""
    sensitive_keys = {"api-key", "authorization", "x-api-key", "x-goog-api-key", "gemini-api-key", "anthropic-api-key"}
    redacted = {}
    for k, v in headers.items():
        if k.lower() in sensitive_keys:
            redacted[k] = "[REDACTED]"
        else:
            redacted[k] = v
    return redacted
