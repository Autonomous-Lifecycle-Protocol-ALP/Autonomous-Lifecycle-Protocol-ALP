/**
 * PHP 8.x Code Generator for ALP specifications.
 * Emits PSR-4 compatible PHP classes from ALP objects.
 */

import { BaseGenerator, type GeneratedFile, type CodegenOptions } from './base-generator';

export interface PhpGeneratorOptions extends CodegenOptions {
  target: 'php';
}

export class PhpGenerator extends BaseGenerator {
  constructor(options: PhpGeneratorOptions) {
    super(options);
  }

  protected generateNamespace(): string {
    return `namespace ${this.options.namespace};\n`;
  }

  protected generateImports(imports: string[]): string {
    if (imports.length === 0) return '';
    const unique = [...new Set(imports)];
    return unique.map((imp) => `use ${imp};\n`).join('');
  }

  protected generateClassDeclaration(className: string, interfaces: string[]): string {
    const ifacePart = interfaces.length > 0 ? ` implements ${interfaces.join(', ')}` : '';
    return `class ${className}${ifacePart} {\n`;
  }

  protected generateInterfaceDeclaration(interfaceName: string): string {
    return `interface ${interfaceName} {\n`;
  }

  protected generateClassFooter(): string {
    return '}\n';
  }

  protected generateProperty(name: string, type: string, value?: string): string {
    const sanitizedType = type || 'mixed';
    const valPart = value !== undefined ? ` = ${value}` : ' = null';
    return `${this.options.indent}private ${sanitizedType} $${name}${valPart};\n`;
  }

  protected generateMethod(name: string, params: string[], body: string): string {
    const paramStr = params.join(', ');
    const indentedBody = this.indentBlock(body, 2);
    return `${this.options.indent}public function ${name}(${paramStr}): void {\n${indentedBody}\n${this.options.indent}}\n\n`;
  }

  protected generateConstant(name: string, value: string): string {
    return `${this.options.indent}private const ${name} = '${value}';\n`;
  }

  /** Generate a single PHP class file content */
  private generateClassFile(className: string, body: string, imports: string[] = []): GeneratedFile {
    const header = this.generateHeader(className);
    const namespace = this.generateNamespace();
    const importsBlock = this.generateImports(imports);
    const file = `<?php\n\n${header}${namespace}${importsBlock}${body}`;
    return {
      path: `${this.options.outputDir}/${className}.php`,
      content: file,
    };
  }

  /** Convert ALP objects to PHP class files */
  public generate(objects: Record<string, any>[]): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const classImports: Record<string, string[]> = {};
    const interfaceNames: string[] = [];
    const constants: Record<string, string[]> = {};
    const properties: Record<string, string[]> = {};
    const methods: Record<string, string[]> = {};

    // Count objects per type to detect duplicates
    const typeCounts: Record<string, number> = {};
    for (const obj of objects) {
      const type = obj._type || 'Object';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }

    // Build a map of sanitized id -> class name for dependency resolution
    const idToClassNameMap: Record<string, string> = {};
    for (const obj of objects) {
      if (obj.id) {
        const type = obj._type || 'Object';
        const hasDuplicateType = typeCounts[type] > 1;
        const sanitizedId = this.sanitizeId(obj.id);
        const capitalizedId = sanitizedId.charAt(0).toUpperCase() + sanitizedId.slice(1);
        const className = hasDuplicateType
          ? `${capitalizedId}${this.mapType(type)}`
          : this.mapType(type);
        idToClassNameMap[sanitizedId] = className;
      }
    }

    // First pass: collect all types and build class bodies
    for (const obj of objects) {
      const type = obj._type || 'Object';
      const hasDuplicateType = typeCounts[type] > 1;
      const sanitizedId = this.sanitizeId(obj.id || 'Unnamed');
      const capitalizedId = sanitizedId.charAt(0).toUpperCase() + sanitizedId.slice(1);
      const className = hasDuplicateType ? `${capitalizedId}${this.mapType(type)}` : this.mapType(type);

      // Track interfaces for contracts
      if (type === 'contract') {
        interfaceNames.push(`${className}Interface`);
      }

      // Track dependencies from depends_on
      const deps: { id: string; type: string }[] = [];
      if (obj.depends_on && Array.isArray(obj.depends_on)) {
        if (!classImports[className]) classImports[className] = [];
        for (const dep of obj.depends_on) {
          const depId = this.sanitizeId(dep.replace(/^->\s*/, ''));
          const depClassName = idToClassNameMap[depId] || this.sanitizeId(depId);
          deps.push({ id: depId, type: depClassName });
          if (depClassName !== className) classImports[className].push(`${this.options.namespace}\\${depClassName}`);
        }
      }

      // Track owner references
      if (obj.owner) {
        if (!classImports[className]) classImports[className] = [];
        const ownerId = this.sanitizeId(obj.owner.replace(/^->\s*/, ''));
        const ownerClassName = idToClassNameMap[ownerId] || this.sanitizeId(ownerId);
        classImports[className].push(`${this.options.namespace}\\${ownerClassName}`);
      }

      // Constants (status)
      if (obj.status) {
        if (!constants[className]) constants[className] = [];
        constants[className].push(this.generateConstant(`STATUS_${this.mapStatus(obj.status)}`, obj.status.replace(/[\[\]]/g, '').trim() || 'pending'));
      }

      // Properties
      if (!properties[className]) properties[className] = [];
      if (obj.id) {
        properties[className].push(this.generateProperty('id', 'string', `'${this.escapeString(obj.id)}'`));
      }
      if (obj.prompt) {
        properties[className].push(this.generateProperty('prompt', 'string', `'${this.escapeString(obj.prompt)}'`));
      }
      if (obj.description) {
        properties[className].push(this.generateProperty('description', 'string', `'${this.escapeString(obj.description)}'`));
      }
      if (obj.role) {
        properties[className].push(this.generateProperty('role', 'string', `'${this.escapeString(obj.role)}'`));
      }
      if (obj.backbone) {
        properties[className].push(this.generateProperty('backbone', 'string', `'${this.escapeString(obj.backbone)}'`));
      }
      if (obj.resolution) {
        properties[className].push(this.generateProperty('resolution', 'string', `'${this.escapeString(obj.resolution)}'`));
      }
      if (obj.fps) {
        properties[className].push(this.generateProperty('fps', 'int', String(obj.fps)));
      }
      if (obj.context_tokens) {
        properties[className].push(this.generateProperty('contextTokens', 'int', String(obj.context_tokens)));
      }
      if (obj.embedding_dim) {
        properties[className].push(this.generateProperty('embeddingDim', 'int', String(obj.embedding_dim)));
      }
      if (obj.latency_p95_ms) {
        properties[className].push(this.generateProperty('latencyP95Ms', 'int', String(obj.latency_p95_ms)));
      }
      if (obj.max_resolution) {
        properties[className].push(this.generateProperty('maxResolution', 'string', `'${this.escapeString(obj.max_resolution)}'`));
      }
      if (obj.modalities && Array.isArray(obj.modalities)) {
        properties[className].push(this.generateProperty('modalities', 'array', `[${obj.modalities.map((m: string) => `'${this.escapeString(m)}'`).join(', ')}]`));
      }
      if (obj.domain) {
        properties[className].push(this.generateProperty('domain', 'string', `'${this.escapeString(obj.domain)}'`));
      }
      if (obj.max_concurrency) {
        properties[className].push(this.generateProperty('maxConcurrency', 'int', String(obj.max_concurrency)));
      }
      if (obj.safety_guards && Array.isArray(obj.safety_guards)) {
        properties[className].push(this.generateProperty('safetyGuards', 'array', `[${obj.safety_guards.map((g: string) => `'${this.escapeString(g)}'`).join(', ')}]`));
      }
      if (obj.inputs && Array.isArray(obj.inputs)) {
        properties[className].push(this.generateProperty('inputs', 'array', `[${obj.inputs.map((i: string) => `'${this.escapeString(i)}'`).join(', ')}]`));
      }
      if (obj.outputs && Array.isArray(obj.outputs)) {
        properties[className].push(this.generateProperty('outputs', 'array', `[${obj.outputs.map((o: string) => `'${this.escapeString(o)}'`).join(', ')}]`));
      }
      if (obj.actions && Array.isArray(obj.actions)) {
        properties[className].push(this.generateProperty('actions', 'array', '[]'));
      }
      if (obj.assets && Array.isArray(obj.assets)) {
        properties[className].push(this.generateProperty('assets', 'array', '[]'));
      }
      if (obj.weight) {
        properties[className].push(this.generateProperty('weight', 'int', String(obj.weight)));
      }
      if (obj.deadline) {
        properties[className].push(this.generateProperty('deadline', 'string', `'${this.escapeString(obj.deadline)}'`));
      }
      if (obj.tokens) {
        properties[className].push(this.generateProperty('tokens', 'int', String(obj.tokens)));
      }
      if (obj.temperature) {
        properties[className].push(this.generateProperty('temperature', 'float', String(obj.temperature)));
      }
      if (obj.model) {
        properties[className].push(this.generateProperty('model', 'string', `'${this.escapeString(obj.model)}'`));
      }
      if (obj.tools && Array.isArray(obj.tools)) {
        properties[className].push(this.generateProperty('tools', 'array', `[${obj.tools.map((t: string) => `'${this.escapeString(t)}'`).join(', ')}]`));
      }

      // Dependencies constructor param
      if (deps.length > 0) {
        const depParams = deps.map((d) => `${d.type} $${d.id}`).join(', ');
        const depAssignments = deps.map((d) => `$this->${d.id}Type = $${d.id};`).join('\n        ');
        if (!properties[className]) properties[className] = [];
        for (const d of deps) {
          properties[className].push(`${this.options.indent}private ?${d.type} $${d.id}Type = null;\n`);
        }
        if (!methods[className]) methods[className] = [];
        methods[className].push(this.generateMethod('__construct', [depParams], depAssignments));
      }
    }

    // Generate interface for contracts
    for (const ifaceName of interfaceNames) {
      const ifaceBody = this.generateInterfaceDeclaration(ifaceName) + '}\n';
      const ifaceFile = this.generateClassFile(ifaceName, ifaceBody);
      files.push(ifaceFile);
    }

    // Generate class files
    for (const className of Object.keys(properties)) {
      let body = '';

      // Constants
      if (constants[className]) {
        for (const c of constants[className]) {
          body += this.indentBlock(c, 1) + '\n';
        }
        body += '\n';
      }

      // Properties
      if (properties[className]) {
        for (const prop of properties[className]) {
          body += this.indentBlock(prop, 1);
        }
        body += '\n';
      }

      // Methods
      if (methods[className]) {
        for (const method of methods[className]) {
          body += this.indentBlock(method, 1);
        }
      }

      const classDecl = this.generateClassDeclaration(className, className.endsWith('Contract') ? [`${className}Interface`] : []);
      const fullBody = classDecl + body + this.generateClassFooter();
      files.push(this.generateClassFile(className, fullBody, classImports[className] || []));
    }

    return files;
  }
}
