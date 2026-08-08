import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { AlpParser, Linter, AlpFormatter } from '@autonomous-lifecycle-protocol-alp/parser';
import { DocumentValidator, PolicyEnforcer } from '@autonomous-lifecycle-protocol-alp/sdk';

export function registerAdditionalCommands(context: vscode.ExtensionContext) {
  // ─── Register alp.validateWorkspace Command ────────────────────────
  const validateWorkspaceCmd = vscode.commands.registerCommand('alp.validateWorkspace', async () => {
    const wsFolder = vscode.workspace.workspaceFolders?.[0];
    if (!wsFolder) {
      vscode.window.showWarningMessage('Open a workspace folder first.');
      return;
    }
    const outputChannel = vscode.window.createOutputChannel('ALP Workspace Validation');
    outputChannel.clear();
    outputChannel.show(true);
    outputChannel.appendLine('⚡ Scanning ALP Workspace Governance & Document Validity...\n');

    const parser = new AlpParser();
    const validator = new DocumentValidator();
    const alpFiles: string[] = [];

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
          walk(fullPath);
        } else if (entry.name.endsWith('.alp')) {
          alpFiles.push(fullPath);
        }
      }
    };
    walk(wsFolder.uri.fsPath);

    let totalObjects = 0;
    let errors = 0;
    const allObjects: any[] = [];

    for (const file of alpFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const objs = parser.parseAndValidate(content);
        allObjects.push(...objs);
        totalObjects += objs.length;
        for (const o of objs) {
          try {
            validator.validate({ _type: o._type, id: o.id || 'unnamed', properties: o });
          } catch (valErr: any) {
            errors++;
            outputChannel.appendLine(`⚠️ ${path.relative(wsFolder.uri.fsPath, file)} [${o.id}]: ${valErr.message}`);
          }
        }
      } catch (fileErr: any) {
        errors++;
        outputChannel.appendLine(`❌ ${path.relative(wsFolder.uri.fsPath, file)}: ${fileErr.message}`);
      }
    }

    const enforcer = new PolicyEnforcer({ requiredFields: ['id', '_type'] });
    const govResult = enforcer.govern({ objects: allObjects } as any);

    outputChannel.appendLine(`\nSummary: ${alpFiles.length} files scanned, ${totalObjects} objects found.`);
    outputChannel.appendLine(`Governance Status: ${govResult.compliant ? 'Compliant ✅' : 'Non-compliant ❌'}`);
    if (govResult.violations.length) {
      outputChannel.appendLine(`Violating Objects: ${govResult.violations.join(', ')}`);
    }

    if (errors === 0 && govResult.compliant) {
      vscode.window.showInformationMessage(`ALP Workspace: ${totalObjects} objects scanned. Fully compliant!`);
    } else {
      vscode.window.showWarningMessage(`ALP Workspace validation completed with ${errors} warning(s) / violation(s).`);
    }
  });

  // ─── Register alp.runLinter Command ─────────────────────────────────
  const linterCmd = vscode.commands.registerCommand('alp.runLinter', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Open an ALP file first.');
      return;
    }
    try {
      const linter = new Linter();
      const diagnostics = linter.lint(editor.document.getText());
      if (diagnostics.length === 0) {
        vscode.window.showInformationMessage('ALP Linter: No issues found!');
      } else {
        const outputChannel = vscode.window.createOutputChannel('ALP Linter');
        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine(`ALP Linter Diagnostics for ${path.basename(editor.document.fileName)}:\n`);
        for (const d of diagnostics) {
          outputChannel.appendLine(`[${d.severity.toUpperCase()}] line ${d.line}: ${d.message} (${d.ruleId})`);
        }
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`Linter error: ${err.message}`);
    }
  });

  // ─── Register alp.formatDocument Command ────────────────────────────
  const formatCmd = vscode.commands.registerCommand('alp.formatDocument', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Open an ALP file first.');
      return;
    }
    try {
      const formatter = new AlpFormatter();
      const formatted = formatter.format(editor.document.getText());
      const fullRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(editor.document.getText().length)
      );
      await editor.edit((builder) => builder.replace(fullRange, formatted));
      vscode.window.showInformationMessage('ALP document formatted.');
    } catch (err: any) {
      vscode.window.showErrorMessage(`Format error: ${err.message}`);
    }
  });

  context.subscriptions.push(validateWorkspaceCmd, linterCmd, formatCmd);
}
