from pathlib import Path
from shutil import rmtree


class DirectoryManager:
    """Handles directory structure and ensures required folders exist."""

    def __init__(self) -> None:
        """Initialize directory paths and ensure required folders exist."""
        self.base_dir = Path(__file__).resolve().parent.parent

        # Log folder
        self.log_dir = self.base_dir / "log"

        self._initialize_base_folders()

    def _initialize_base_folders(self) -> None:
        """Initialize base required directory paths."""
        folders = [self.log_dir]
        for folder in folders:
            self.create_directory(folder)

    def create_directory(self, folder_path: Path, to_remove: bool = False) -> None:
        """Helper method to ensure the destination directory exists, and remove it if necessary.

        Args:
            folder_path: The path to the directory.
            to_remove: If True, remove the directory before creating it.
        """
        if to_remove and folder_path.exists():
            try:
                rmtree(folder_path)
            except Exception as e:
                raise OSError(
                    f"Failed to remove existing directory: {folder_path}"
                ) from e

        try:
            folder_path.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            raise OSError(f"Failed to create directory: {folder_path}") from e

    def create_subdirectories(
        self, directory: Path, folder_list: list[str], to_remove: bool = False
    ) -> None:
        """Creates multiple subdirectories under a specified base directory.

        Args:
            directory: The parent directory where the subdirectories will be created.
            folder_list: A list of subdirectory names to create and count.

        Raises:
            TypeError: If non str type is found in folder_list
        """
        for folder in folder_list:
            if not isinstance(folder, str):
                raise TypeError(
                    f"List of folders provided consist non str type: {folder}"
                )
            folder_path = directory / folder
            self.create_directory(folder_path, to_remove)

    def list_png_paths(self, folder_path: Path) -> list[Path]:
        """Returns a list of all .png files in the given directory.

        Args:
            folder_path: The path to the directory.

        Returns:
            A list of Path objects for .png files.

        Raises:
            FileNotFoundError: If the directory does not exist.
            ValueError: If the path is not a directory.
        """
        if not folder_path.exists():
            raise FileNotFoundError(f"Directory not found: {folder_path}")

        if not folder_path.is_dir():
            raise ValueError(f"Path is not a directory: {folder_path}")

        return list(folder_path.glob("*.png"))

    def get_file_count(self, folder_path: Path) -> int:
        """Count the number of files in a directory.

        Args:
            folder_path: The path to the directory for which to count files.

        Returns:
            The total number of files found under given directory.

        Raises:
            ValueError: If the path is not a directory.
        """
        if not folder_path.is_dir():
            raise ValueError(f"Path is not a directory: {folder_path}")
        return sum(1 for item in folder_path.iterdir() if item.is_file())

    def get_folder_count(self, directory: Path) -> int:
        """Count the number of folders in a directory.

        Args:
            directory: The path to the directory for which to count subdirectories.

        Returns:
            The total number of subdirectories under given directory.

        Raises:
            ValueError: If the path is not a directory.
        """
        if not directory.is_dir():
            raise ValueError(f"Path is not a directory: {directory}")
        return sum(1 for item in directory.iterdir() if item.is_dir())

    def count_files_in_subdirectories(
        self, directory: Path, folder_list: list[str]
    ) -> dict[str, int]:
        """Counts the number of files within each specified subdirectory.

        Args:
            directory: The parent directory where the subdirectories will be created.
            folder_list: A list of subdirectory names to create and count.

        Returns:
            A dictionary of file counts based on the subdirectories name.
        """
        return {
            folder: self.get_file_count(directory / folder) for folder in folder_list
        }


directory_manager = DirectoryManager()
