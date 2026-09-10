/**
 * C++17/20 Code Generator for ALP specifications.
 * Emits header + implementation files from ALP objects.
 */

import { BaseGenerator, type GeneratedFile, type CodegenOptions } from './base-generator';

export interface CppGeneratorOptions extends CodegenOptions {
  target: 'cpp';
  headerExt?: string;
  implExt?: string;
}

export class CppGenerator extends BaseGenerator {
  private headerExt: string;
  private implExt: string;

  constructor(options: CppGeneratorOptions) {
    super(options);
    this.headerExt = options.headerExt || '.hpp';
    this.implExt = options.implExt || '.cpp';
  }

  protected generateNamespace(): string {
    const ns = this.options.namespace;
    return `namespace ${ns} {\n`;
  }

  protected generateNamespaceFooter(): string {
    return `} // namespace ${this.options.namespace}\n`;
  }

  protected generateImports(imports: string[]): string {
    if (imports.length === 0) return '#include <string>\n#include <vector>\n#include <memory>\n';
    const unique = [...new Set(imports)];
    const stdIncludes = ['<string>', '<vector>', '<memory>'];
    const all = [...new Set([...stdIncludes, ...unique])];
    return all.map((imp) => `#include ${imp}\n`).join('');
  }

  protected generateClassDeclaration(className: string, interfaces: string[]): string {
    const ifacePart = interfaces.length > 0 ? ` : public ${interfaces.join(', ')}` : '';
    return `class ${className}${ifacePart} {\npublic:\n`;
  }

  protected generateClassFooter(): string {
    return 'private:\n};\n';
  }

  protected generateProperty(name: string, type: string, value?: string): string {
    const cppType = this.mapCppType(type);
    const valPart = value !== undefined ? ` = ${value}` : '';
    return `${this.options.indent}${cppType} ${name}${valPart};\n`;
  }

  protected generateMethod(name: string, params: string[], body: string): string {
    const paramStr = params.join(', ');
    const indentedBody = this.indentBlock(body, 2);
    return `${this.options.indent}void ${name}(${paramStr}) {\n${indentedBody}\n${this.options.indent}}\n\n`;
  }

  protected generateConstant(name: string, value: string): string {
    return `${this.options.indent}static constexpr const char* ${name} = "${value}";\n`;
  }

  private mapCppType(type: string): string {
    const map: Record<string, string> = {
      string: 'std::string',
      int: 'int',
      float: 'float',
      bool: 'bool',
      array: 'std::vector<std::string>',
      mixed: 'std::any',
    };
    return map[type] || 'std::string';
  }

  private generatePragmaOnce(): string {
    return '#pragma once\n\n';
  }

  private generateHeaderFile(className: string, body: string, includes: string[] = []): GeneratedFile {
    
    const header = this.generateHeader(className);
    const pragma = this.generatePragmaOnce();
    const imports = this.generateImports(includes);
    const namespace = this.generateNamespace();
    const nsFooter = this.generateNamespaceFooter();
    const content = `${header}${pragma}${imports}${namespace}\n${body}${nsFooter}`;
    return {
      path: `${this.options.outputDir}/${className}${this.headerExt}`,
      content,
    };
  }

  private generateImplFile(className: string, body: string): GeneratedFile {
    const implHeader = `#include "${className}${this.headerExt}"\n\n`;
    const content = `${implHeader}${body}`;
    return {
      path: `${this.options.outputDir}/${className}${this.implExt}`,
      content,
    };
  }

  public generate(objects: Record<string, any>[]): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const classIncludes: Record<string, string[]> = {};
    const interfaceNames: string[] = [];
    const constants: Record<string, string[]> = {};
    const properties: Record<string, string[]> = {};
    const methods: Record<string, string[]> = {};

    // Build id -> className map and detect duplicates per type
    const idToClassName: Record<string, string> = {};
    const typeCounts: Record<string, number> = {};

    for (const obj of objects) {
      const type = obj._type || 'Object';
      const rawId = obj.id || 'Unnamed';
      const sanitizedId = this.sanitizeId(rawId);
      const baseClassName = this.mapType(type);
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      const useQualified = typeCounts[type] > 1 || type === 'contract';
      const capitalizedId = sanitizedId.charAt(0).toUpperCase() + sanitizedId.slice(1);
      const className = useQualified ? `${capitalizedId}${baseClassName}` : baseClassName;
      idToClassName[rawId] = className;
    }

    // First pass: collect types and build class bodies
    for (const obj of objects) {
      const type = obj._type || 'Object';
      const rawId = obj.id || 'Unnamed';
      const sanitizedId = this.sanitizeId(rawId);
      const baseClassName = this.mapType(type);
      const useQualified = typeCounts[type] > 1 || type === 'contract';
      const capitalizedId = sanitizedId.charAt(0).toUpperCase() + sanitizedId.slice(1);
      const className = useQualified ? `${capitalizedId}${baseClassName}` : baseClassName;

      // Track interfaces for contracts — always qualify with ID for C++
      if (type === 'contract') {
        const contractCapitalizedId = sanitizedId.charAt(0).toUpperCase() + sanitizedId.slice(1);
        interfaceNames.push(`I${contractCapitalizedId}${baseClassName}`);
      }

      // Dependencies from depends_on — resolve via id map
      const deps: string[] = [];
      const depIds: string[] = [];
      if (obj.depends_on && Array.isArray(obj.depends_on)) {
        if (!classIncludes[className]) classIncludes[className] = [];
        for (const dep of obj.depends_on) {
          const depId = dep.replace(/^->\s*/, '');
          const depClassName = idToClassName[depId] || this.sanitizeId(depId);
          deps.push(depClassName);
          depIds.push(depId);
          if (depClassName !== className) classIncludes[className].push(`"${depClassName}${this.headerExt}"`);
        }
      }

      // Constants
      if (obj.status) {
        if (!constants[className]) constants[className] = [];
        constants[className].push(this.generateConstant(`STATUS_${this.mapStatus(obj.status)}`, obj.status.replace(/[\[\]]/g, '').trim() || 'pending'));
      }

      // Properties
      if (!properties[className]) properties[className] = [];
      if (obj.id) {
        properties[className].push(this.generateProperty('id_', 'string', `"${this.escapeString(obj.id)}"`));
      }
      if (obj.prompt) {
        properties[className].push(this.generateProperty('prompt_', 'string', `"${this.escapeString(obj.prompt)}"`));
      }
      if (obj.description) {
        properties[className].push(this.generateProperty('description_', 'string', `"${this.escapeString(obj.description)}"`));
      }
      if (obj.role) {
        properties[className].push(this.generateProperty('role_', 'string', `"${this.escapeString(obj.role)}"`));
      }
      if (obj.backbone) {
        properties[className].push(this.generateProperty('backbone_', 'string', `"${this.escapeString(obj.backbone)}"`));
      }
      if (obj.resolution) {
        properties[className].push(this.generateProperty('resolution_', 'string', `"${this.escapeString(obj.resolution)}"`));
      }
      if (obj.fps) {
        properties[className].push(this.generateProperty('fps_', 'int', String(obj.fps)));
      }
      if (obj.context_tokens) {
        properties[className].push(this.generateProperty('context_tokens_', 'int', String(obj.context_tokens)));
      }
      if (obj.embedding_dim) {
        properties[className].push(this.generateProperty('embedding_dim_', 'int', String(obj.embedding_dim)));
      }
      if (obj.latency_p95_ms) {
        properties[className].push(this.generateProperty('latency_p95_ms_', 'int', String(obj.latency_p95_ms)));
      }
      if (obj.max_resolution) {
        properties[className].push(this.generateProperty('max_resolution_', 'string', `"${this.escapeString(obj.max_resolution)}"`));
      }
      if (obj.modalities && Array.isArray(obj.modalities)) {
        properties[className].push(this.generateProperty('modalities_', 'array', `{"${obj.modalities.map((x: string) => this.escapeString(x)).join('", "')}"}`));
      }
      if (obj.domain) {
        properties[className].push(this.generateProperty('domain_', 'string', `"${this.escapeString(obj.domain)}"`));
      }
      if (obj.max_concurrency) {
        properties[className].push(this.generateProperty('max_concurrency_', 'int', String(obj.max_concurrency)));
      }
      if (obj.safety_guards && Array.isArray(obj.safety_guards)) {
        properties[className].push(this.generateProperty('safety_guards_', 'array', `{"${obj.safety_guards.map((x: string) => this.escapeString(x)).join('", "')}"}`));
      }
      if (obj.inputs && Array.isArray(obj.inputs)) {
        properties[className].push(this.generateProperty('inputs_', 'array', `{"${obj.inputs.map((x: string) => this.escapeString(x)).join('", "')}"}`));
      }
      if (obj.outputs && Array.isArray(obj.outputs)) {
        properties[className].push(this.generateProperty('outputs_', 'array', `{"${obj.outputs.map((x: string) => this.escapeString(x)).join('", "')}"}`));
      }
      if (obj.actions && Array.isArray(obj.actions)) {
        properties[className].push(this.generateProperty('actions_', 'array', '{}'));
      }
      if (obj.assets && Array.isArray(obj.assets)) {
        properties[className].push(this.generateProperty('assets_', 'array', '{}'));
      }
      if (obj.tools && Array.isArray(obj.tools)) {
        properties[className].push(this.generateProperty('tools_', 'array', `{"${obj.tools.join('", "')}"}`));
      }
      if (obj.weight) {
        properties[className].push(this.generateProperty('weight_', 'int', String(obj.weight)));
      }
      if (obj.deadline) {
        properties[className].push(this.generateProperty('deadline_', 'string', `"${this.escapeString(obj.deadline)}"`));
      }
      if (obj.tokens) {
        properties[className].push(this.generateProperty('tokens_', 'int', String(obj.tokens)));
      }
      if (obj.temperature) {
        properties[className].push(this.generateProperty('temperature_', 'float', String(obj.temperature)));
      }
      if (obj.model) {
        properties[className].push(this.generateProperty('model_', 'string', `"${this.escapeString(obj.model)}"`));
      }

      // Constructor with dependencies
      if (deps.length > 0) {
        const depParams = deps.map((d, i) => {
          const depId = depIds[i];
          const paramName = depId.charAt(0).toLowerCase() + depId.slice(1) + 'Type';
          return `${d} ${paramName}`;
        }).join(', ');
        const depInit = deps.map((d, i) => {
          const depId = depIds[i];
          const memberName = depId.charAt(0).toLowerCase() + depId.slice(1) + 'Type_';
          return `${memberName}(std::move(${depId.charAt(0).toLowerCase() + depId.slice(1)}Type))`;
        }).join(', ');
        const depMembers = deps.map((d, i) => {
          const depId = depIds[i];
          const memberName = depId.charAt(0).toLowerCase() + depId.slice(1) + 'Type_';
          return `${this.options.indent}${d} ${memberName};\n`;
        }).join('');
        if (!methods[className]) methods[className] = [];
        methods[className].push(`${className}(${depParams}) : ${depInit} {}\n`);
        // Add member properties for dependencies
        if (!properties[className]) properties[className] = [];
        properties[className].push(depMembers);
      }
    }

    // Generate interfaces for contracts
    for (const ifaceName of interfaceNames) {
      const ifaceBody = `class ${ifaceName} {\npublic:\n${this.options.indent}virtual ~${ifaceName}() = default;\n};\n`;
      const ifaceFile = this.generateHeaderFile(ifaceName, ifaceBody);
      files.push(ifaceFile);
    }

    // Generate class header/impl files
    for (const className of Object.keys(properties)) {
      let headerBody = '';
      let implBody = '';

      // Constants in header
      if (constants[className]) {
        for (const c of constants[className]) {
          headerBody += `${this.options.indent}${c}\n`;
        }
        headerBody += '\n';
      }

      // Properties in header
      if (properties[className]) {
        for (const prop of properties[className]) {
          headerBody += `${this.options.indent}${prop}\n`;
        }
        headerBody += '\n';
      }

      // Methods in header + impl
      if (methods[className]) {
        for (const method of methods[className]) {
          const signature = method.replace(/\(([^)]*)\) \{[\s\S]*\}/, '($1);');
          headerBody += `${this.options.indent}${signature}\n`;
          implBody += `${className}::${method}\n`;
        }
      }

      const ifaces = className.endsWith('Contract') ? [`I${className}`] : [];
      const classDecl = this.generateClassDeclaration(className, ifaces);
      const classFooter = this.generateClassFooter();
      const fullHeader = classDecl + headerBody + classFooter;
      const headerFile = this.generateHeaderFile(className, fullHeader, classIncludes[className] || []);
      files.push(headerFile);
      const implFile = this.generateImplFile(className, implBody);
      files.push(implFile);
    }

    return files;
  }
}
