import re
from pathlib import Path
from setuptools import setup, find_packages

version_match = re.search(
    r"^__version__\s*=\s*['\"]([^'\"]*)['\"]",
    Path("scraper/__init__.py").read_text(),
    re.MULTILINE,
)
version = version_match.group(1) if version_match else "0.0.0"

setup(
    name="scraper",
    version=version,
    packages=find_packages(exclude=["tests*", "samples*"]),
    python_requires=">=3.8",
    install_requires=[
        "playwright>=1.40",
        "pydantic>=2.0",
        "python-dotenv>=1.0",
        "aiofiles>=23.0",
    ],
)
