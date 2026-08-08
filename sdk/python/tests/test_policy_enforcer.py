"""Tests for PolicyEnforcer and DocumentValidator."""
import pytest
from alp_sdk.governance import PolicyEnforcer
from alp_sdk.validator import DocumentValidator


class TestPolicyEnforcer:
    def test_enforce_passes_valid_document(self):
        enforcer = PolicyEnforcer(rules={"required_fields": ["id", "type"]})
        doc = {"id": "agent-1", "type": "agent", "description": "Test agent"}
        assert enforcer.enforce(doc) is True

    def test_enforce_fails_missing_required_field(self):
        enforcer = PolicyEnforcer(rules={"required_fields": ["id", "type"]})
        doc = {"id": "agent-1"}
        assert enforcer.enforce(doc) is False

    def test_enforce_denies_blocked_types(self):
        enforcer = PolicyEnforcer(rules={"deny_types": ["raw_sql"]})
        doc = {"id": "q-1", "_type": "raw_sql"}
        assert enforcer.enforce(doc) is False

    def test_enforce_allows_non_denied_type(self):
        enforcer = PolicyEnforcer(rules={"deny_types": ["raw_sql"]})
        doc = {"id": "t-1", "_type": "task"}
        assert enforcer.enforce(doc) is True

    def test_enforce_rejects_non_dict(self):
        enforcer = PolicyEnforcer()
        assert enforcer.enforce("not a dict") is False

    def test_enforce_no_rules_passes(self):
        enforcer = PolicyEnforcer()
        doc = {"id": "x", "type": "agent"}
        assert enforcer.enforce(doc) is True

    def test_govern_missing_workspace(self, tmp_path):
        enforcer = PolicyEnforcer()
        result = enforcer.govern(str(tmp_path / "nonexistent"))
        assert result["compliant"] is False
        assert result["status"] == "error"


class TestDocumentValidator:
    def test_validate_valid_document(self):
        validator = DocumentValidator()
        doc = {"_type": "agent", "id": "agent-1"}
        assert validator.validate(doc) is True

    def test_validate_missing_type(self):
        validator = DocumentValidator()
        with pytest.raises(ValueError, match="must have a '_type' or 'type' field"):
            validator.validate({"id": "x"})

    def test_validate_missing_id(self):
        validator = DocumentValidator()
        with pytest.raises(ValueError, match="must have an 'id' field"):
            validator.validate({"_type": "agent"})

    def test_validate_non_dict(self):
        validator = DocumentValidator()
        with pytest.raises(ValueError, match="must be a dictionary"):
            validator.validate("not a dict")

    def test_strict_rejects_unknown_type(self):
        validator = DocumentValidator(strict=True)
        with pytest.raises(ValueError, match="Unknown block type"):
            validator.validate({"_type": "exotic_block", "id": "x"})

    def test_strict_allows_known_type(self):
        validator = DocumentValidator(strict=True)
        assert validator.validate({"_type": "agent", "id": "a-1"}) is True

    def test_validate_with_properties_id(self):
        validator = DocumentValidator()
        doc = {"_type": "task", "properties": {"id": "task-1"}}
        assert validator.validate(doc) is True
