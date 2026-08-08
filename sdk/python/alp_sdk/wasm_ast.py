"""ALP Wasm-Compiled Local AST Evaluation Engine (v66.0.0)."""
from __future__ import annotations

import time
from typing import Any, Dict, List, Literal, Optional


ASTKind = Literal['POLICY', 'TASK', 'AGENT', 'CONTRACT', 'VAULT', 'MACRO']
Severity = Literal['ERROR', 'WARNING', 'INFO']


class ASTNode:
    def __init__(
        self,
        node_id: str,
        kind: ASTKind,
        name: str,
        line: int,
        column: int = 1,
        attributes: Optional[Dict[str, Any]] = None,
        children: Optional[List[ASTNode]] = None,
    ):
        self.id = node_id
        self.kind = kind
        self.name = name
        self.line = line
        self.column = column
        self.attributes = attributes or {}
        self.children = children or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "kind": self.kind,
            "name": self.name,
            "line": self.line,
            "column": self.column,
            "attributes": self.attributes,
            "children": [c.to_dict() for c in self.children],
        }


class ASTDiagnostic:
    def __init__(self, rule_id: str, severity: Severity, message: str, line: int):
        self.rule_id = rule_id
        self.severity = severity
        self.message = message
        self.line = line

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "severity": self.severity,
            "message": self.message,
            "line": self.line,
        }


class ASTEvaluationResult:
    def __init__(
        self,
        ast: List[ASTNode],
        diagnostics: List[ASTDiagnostic],
        parse_latency_ms: float,
        offline_valid: bool,
    ):
        self.ast = ast
        self.diagnostics = diagnostics
        self.parse_latency_ms = parse_latency_ms
        self.offline_valid = offline_valid

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ast": [n.to_dict() for n in self.ast],
            "diagnostics": [d.to_dict() for d in self.diagnostics],
            "parseLatencyMs": self.parse_latency_ms,
            "offlineValid": self.offline_valid,
        }


class WasmAstEvaluator:
    """Fast offline AST parse and evaluation of ALP content."""

    def parseAST(self, content: str) -> ASTEvaluationResult:
        start = time.perf_counter()
        nodes: List[ASTNode] = []
        diagnostics: List[ASTDiagnostic] = []

        lines = content.split('\n')
        for idx, line_text in enumerate(lines):
            line_num = idx + 1
            trimmed = line_text.strip()

            if trimmed.startswith('@policy'):
                name = self._extract_name(trimmed) or 'default-policy'
                nodes.append(ASTNode(
                    node_id=f"ast-policy-{line_num}",
                    kind='POLICY',
                    name=name,
                    line=line_num,
                    column=1,
                    attributes={"raw": trimmed},
                ))
            elif trimmed.startswith('@task'):
                name = self._extract_name(trimmed)
                if not name:
                    diagnostics.append(ASTDiagnostic(
                        rule_id='wasm-syntax-task-id',
                        severity='ERROR',
                        message='Missing task name/identifier in @task block',
                        line=line_num,
                    ))
                nodes.append(ASTNode(
                    node_id=f"ast-task-{line_num}",
                    kind='TASK',
                    name=name or 'unnamed-task',
                    line=line_num,
                    column=1,
                    attributes={"raw": trimmed},
                ))
            elif trimmed.startswith('@agent'):
                name = self._extract_name(trimmed) or 'agent-default'
                nodes.append(ASTNode(
                    node_id=f"ast-agent-{line_num}",
                    kind='AGENT',
                    name=name,
                    line=line_num,
                    column=1,
                    attributes={"raw": trimmed},
                ))

        parse_latency_ms = round((time.perf_counter() - start) * 1000, 2)
        parse_latency_ms = max(0.1, parse_latency_ms)
        offline_valid = not any(d.severity == 'ERROR' for d in diagnostics)

        return ASTEvaluationResult(
            ast=nodes,
            diagnostics=diagnostics,
            parse_latency_ms=parse_latency_ms,
            offline_valid=offline_valid,
        )

    def queryASTNodes(self, ast: List[ASTNode], kind: ASTKind) -> List[ASTNode]:
        return [n for n in ast if n.kind == kind]

    @staticmethod
    def _extract_name(line: str) -> str:
        import re
        match = re.search(r"name:\s*[\"']?([^\"',}\s]+)[\"']?", line, re.IGNORECASE)
        if not match:
            match = re.search(r"id:\s*[\"']?([^\"',}\s]+)[\"']?", line, re.IGNORECASE)
        return match.group(1) if match else ''
