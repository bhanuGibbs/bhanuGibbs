import unittest


class StartupConfigTests(unittest.TestCase):
    def test_alembic_url_percent_escaping(self) -> None:
        value = "postgresql+asyncpg://postgres:Kbprakash%4078935@localhost:5432/quotation_db"
        expected = "postgresql+asyncpg://postgres:Kbprakash%%4078935@localhost:5432/quotation_db"

        self.assertEqual(value.replace("%", "%%"), expected)


if __name__ == "__main__":
    unittest.main()
