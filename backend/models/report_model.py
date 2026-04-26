from dataclasses import dataclass
from datetime import datetime

@dataclass
class Report:
    illness: str
    zip_code: str
    submitted_at: str = None
    id: int = None

    def __post_init__(self):
        if self.submitted_at is None:
            self.submitted_at = datetime.utcnow().strftime("%Y-%m-%d")

    def to_dict(self):
        return {
            "id": self.id,
            "illness": self.illness,
            "zip_code": self.zip_code,
            "submitted_at": self.submitted_at
        }
