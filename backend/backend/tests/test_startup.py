import unittest

from app.core.startup import escape_alembic_option


class StartupConfigTests(unittest.TestCase):
    def test_escape_alembic_option_handles_percent_signs(self) -> None:
        value = "postgresql+asyncpg://postgres:Kbprakash%4078935@localhost:5432/quotation_db"

        self.assertEqual(
            escape_alembic_option(value),
            "postgresql+asyncpg://postgres:Kbprakash%%4078935@localhost:5432/quotation_db",
        )


if __name__ == "__main__":
    unittest.main()
