class InvalidInputError(Exception):
    """Raised when user input fails domain validation (maps to 400)."""

    pass


class NoResultsFound(Exception):
    """Raised when a lookup yields no results (maps to 404)."""

    pass
