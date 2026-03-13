import json
import logging
import logging.config
import logging.handlers
from pathlib import Path
from datetime import datetime as dt

from core.config import common_settings
from core.directory_manager import directory_manager as dm


class MyTimedRotatingFileHandler(logging.handlers.TimedRotatingFileHandler):
    """Custom log handler that rotates log files daily and organizes them by month."""

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self.namer = self.change_name

    def change_name(self, default_name: str) -> str:
        """Change the log filename to include the current month and year."""
        file_path = Path(default_name)
        tail = file_path.name

        # Ensure log directory and subdirectories exist
        mth_fol = dm.log_dir / dt.now().strftime("%b%Y")
        dm.create_directory(mth_fol)

        # Construct new filename with the month-year prefix
        arr = tail.split(".")
        ext = arr.pop()
        fname = "_".join(arr) + f".{ext}"

        return str(mth_fol / fname)


# Register the custom handler
logging.handlers.MyTimedRotatingFileHandler = MyTimedRotatingFileHandler


def setup_logging() -> None:
    """Set up logging configuration from a JSON file or default settings."""
    logging_config_path = Path(__file__).parent / "json" / "logging.json"
    if not logging_config_path.exists():
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            handlers=[logging.StreamHandler()],
        )
        return

    with logging_config_path.open("rt", encoding="utf-8") as f:
        config = json.load(f)

    # Get handlers that are actually used by loggers
    handlers = config.get("handlers", {})
    loggers = config.get("loggers", {})

    env = common_settings.ENVIRONMENT
    logger_config = loggers.get(env, loggers.get("dev", {}))
    log_handlers = logger_config.get("handlers", [])

    # Only update file paths for handlers that are actually used
    for handler_name, handler_config in handlers.items():
        if "filename" in handler_config and handler_name in log_handlers:
            # Convert relative paths to absolute paths using log directory
            original_filename = handler_config["filename"]
            dm.create_directory(dm.log_dir)
            absolute_path = dm.log_dir / original_filename

            # Update the handler configuration
            handler_config["filename"] = str(absolute_path)

    # Apply the logging configuration
    logging.config.dictConfig(config)


# Setup logging and create logger instance
setup_logging()
logger = logging.getLogger(common_settings.ENVIRONMENT)
