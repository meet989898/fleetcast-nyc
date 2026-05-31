from __future__ import annotations

from pathlib import Path


def raw_data_dir() -> Path:
    path = Path("data/raw")
    path.mkdir(parents=True, exist_ok=True)
    return path


if __name__ == "__main__":
    print(f"Place TLC parquet files in {raw_data_dir().resolve()}")
