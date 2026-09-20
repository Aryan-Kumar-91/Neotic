"""
Unit tests for Gemini service response parsing helpers.
"""

import unittest
from src.services.geminiservice import _parse_response


class TestGeminiParser(unittest.TestCase):
    """Tests for _parse_response."""

    def test_direct_valid_json(self):
        """Test parsing clean direct JSON response."""
        text = (
            '{"thoughts": [{"step": "Analysis", "content": "Analyzing"}], '
            '"final_answer": "42"}'
        )
        result = _parse_response(text)
        self.assertEqual(result["final_answer"], "42")
        self.assertEqual(len(result["thoughts"]), 1)
        self.assertEqual(result["citations"], [])

    def test_fenced_markdown_json(self):
        """Test parsing JSON enclosed in markdown code fences."""
        text = """```json
        {
            "thoughts": [{"step": "Step 1", "content": "Checking"}],
            "final_answer": "Done",
            "citations": ["doc1.pdf"]
        }
        ```"""
        result = _parse_response(text)
        self.assertEqual(result["final_answer"], "Done")
        self.assertEqual(result["citations"], ["doc1.pdf"])

    def test_latex_escape_sequences(self):
        """Test parsing response containing unescaped LaTeX math formulas."""
        raw_latex = (
            r'{"thoughts": [{"step": "Math", "content": "Formula"}], '
            r'"final_answer": "Formula is \alpha + \pi"}'
        )
        result = _parse_response(raw_latex)
        self.assertIn(r"\alpha", result["final_answer"])

    def test_regex_extraction_fallback(self):
        """Test fallback to regex extraction when JSON syntax is invalid."""
        broken_json = (
            '{"thoughts": [invalid...], '
            '"final_answer": "Extracted answer here"}'
        )
        result = _parse_response(broken_json)
        self.assertEqual(result["final_answer"], "Extracted answer here")

    def test_plain_text_fallback(self):
        """Test fallback when response is purely plain text."""
        text = "Just a raw string response without any JSON markers."
        result = _parse_response(text)
        self.assertEqual(result["final_answer"], text)
        self.assertEqual(len(result["thoughts"]), 1)
        self.assertEqual(result["thoughts"][0]["step"], "Synthesis")


if __name__ == "__main__":
    unittest.main()
