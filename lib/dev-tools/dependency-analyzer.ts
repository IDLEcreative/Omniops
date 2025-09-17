/**
 * Dependency Analyzer - Advanced dependency analysis and visualization
 * Zero dependencies, enterprise-grade dependency tracking and analysis
 */

import { readdir, readFile, stat, access } from 'fs/promises';
import { join, resolve, relative, extname, dirname, basename, sep } from 'path';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';

import type {
  DependencyAnalyzerOptions,
  DependencyReport,
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  ModuleImport,
  ModuleExport,
  ImportType,
  ExportType,
  ModuleType,
  DependencyCycle,
  ImpactAnalysis,
  UnusedDependency,
  BoundaryViolation,
  DependencyStats,
  VisualizationData,
  VisualizationNode,
  VisualizationLink,
  VisualizationCluster,
  BoundaryRule,
  LayerDefinition,
  ExportFormat,
  DependencyType,
  CycleSeverity,
  UnusedReason,
  ViolationType
} from './types';

const DEFAULT_OPTIONS: Required<DependencyAnalyzerOptions> = {
  rootPath: process.cwd(),
  includeGlobs: ['**/*.{ts,tsx,js,jsx,json}'],
  excludeGlobs: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
  followSymlinks: false,
  maxDepth: 50,
  includeNodeModules: false,
  includeTests: true,
  packageJsonPath: 'package.json',
  tsconfigPath: 'tsconfig.json',
  detectCircularDependencies: true,
  analyzeImpact: true,
  findUnusedDependencies: true,
  checkBoundaryViolations: false,
  calculateBundleSize: false,
  enableCaching: true,
  cacheDir: '.dependency-cache',
  boundaryRules: [],
  layers: [],
  maxFiles: 10000,
  enableWorkers: false,
  maxWorkers: 4,
  memoryLimit: 2048,
  generateVisualization: false,
  exportFormats: ['json'],
  verbose: false
};

interface FileInfo {
  path: string;
  relativePath: string;
  content: string;
  size: number;
  lastModified: number;
  type: ModuleType;
}

interface ParsedFile {
  info: FileInfo;
  imports: ModuleImport[];
  exports: ModuleExport[];
  ast?: any;
}

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export class DependencyAnalyzer extends EventEmitter {
  private options: Required<DependencyAnalyzerOptions>;
  private cache = new Map<string, any>();
  private filesProcessed = 0;
  private startTime = 0;
  private packageJson: PackageJson | null = null;
  private tsconfig: any = null;

  constructor(options: DependencyAnalyzerOptions = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.options.rootPath = resolve(this.options.rootPath);
  }

  /**
   * Analyze dependencies in the project
   */
  async analyze(): Promise<DependencyReport> {
    this.startTime = Date.now();
    this.filesProcessed = 0;
    
    this.emit('start', { 
      timestamp: this.startTime, 
      rootPath: this.options.rootPath 
    });

    try {
      // Load project configuration
      await this.loadProjectConfig();

      // Discover files
      const files = await this.discoverFiles();
      this.emit('filesDiscovered', { count: files.length });

      // Parse files
      const parsedFiles = await this.parseFiles(files);
      this.emit('filesParsed', { count: parsedFiles.length });

      // Build dependency graph
      const graph = this.buildDependencyGraph(parsedFiles);
      this.emit('graphBuilt', { nodes: graph.nodes.size, edges: graph.edges.length });

      // Perform analysis
      const cycles = this.options.detectCircularDependencies 
        ? this.detectCircularDependencies(graph) 
        : [];
      
      const impactAnalysis = this.options.analyzeImpact 
        ? this.performImpactAnalysis(graph) 
        : [];

      const unusedDependencies = this.options.findUnusedDependencies 
        ? this.findUnusedDependencies(graph) 
        : [];

      const boundaryViolations = this.options.checkBoundaryViolations 
        ? this.checkBoundaryViolations(graph) 
        : [];

      // Generate statistics
      const stats = this.generateStatistics(graph);

      // Generate visualization data
      const visualization = this.options.generateVisualization 
        ? this.generateVisualizationData(graph) 
        : undefined;

      // Create report
      const report: DependencyReport = {
        summary: {
          totalFiles: graph.nodes.size,
          totalDependencies: graph.edges.length,
          externalPackages: graph.externalPackages.size,
          circularDependencies: cycles.length,
          unusedDependencies: unusedDependencies.length,
          boundaryViolations: boundaryViolations.length,
          riskScore: this.calculateRiskScore(cycles, unusedDependencies, boundaryViolations),
          healthGrade: this.calculateHealthGrade(cycles, unusedDependencies, boundaryViolations),
          analysisTime: Date.now() - this.startTime
        },
        stats,
        graph,
        cycles,
        unusedDependencies,
        boundaryViolations,
        impactAnalysis,
        recommendations: this.generateRecommendations(cycles, unusedDependencies, boundaryViolations, stats),
        visualization,
        generatedAt: Date.now(),
        options: this.options,
        metadata: {
          projectPath: this.options.rootPath,
          packageJsonPath: this.packageJson ? join(this.options.rootPath, this.options.packageJsonPath) : undefined,
          tsconfigPath: this.tsconfig ? join(this.options.rootPath, this.options.tsconfigPath) : undefined,
          nodeVersion: process.version,
          analyzerVersion: '1.0.0'
        }
      };

      // Export in requested formats
      if (this.options.exportFormats.length > 0) {
        report.exportData = await this.exportReport(report);
      }

      this.emit('complete', { 
        report: {
          ...report.summary,
          generatedAt: report.generatedAt
        }
      });

      return report;

    } catch (error) {
      this.emit('error', { error, timestamp: Date.now() });
      throw error;
    }
  }

  /**
   * Load project configuration files
   */
  private async loadProjectConfig(): Promise<void> {
    try {
      // Load package.json
      const packageJsonPath = join(this.options.rootPath, this.options.packageJsonPath);
      try {
        await access(packageJsonPath);
        const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
        this.packageJson = JSON.parse(packageJsonContent);
      } catch {
        if (this.options.verbose) {
          console.warn(`package.json not found at ${packageJsonPath}`);
        }
      }

      // Load tsconfig.json
      const tsconfigPath = join(this.options.rootPath, this.options.tsconfigPath);
      try {
        await access(tsconfigPath);
        const tsconfigContent = await readFile(tsconfigPath, 'utf-8');
        this.tsconfig = JSON.parse(tsconfigContent);
      } catch {
        if (this.options.verbose) {
          console.warn(`tsconfig.json not found at ${tsconfigPath}`);
        }
      }
    } catch (error) {
      this.emit('configError', { error });
    }
  }

  /**
   * Discover files to analyze
   */
  private async discoverFiles(): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    const visited = new Set<string>();

    const processDirectory = async (dirPath: string, depth = 0): Promise<void> => {
      if (depth > this.options.maxDepth) return;

      try {
        const entries = await readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dirPath, entry.name);
          const relativePath = relative(this.options.rootPath, fullPath);

          // Skip if excluded
          if (this.isExcluded(relativePath)) continue;

          if (entry.isDirectory()) {
            if (!visited.has(fullPath)) {
              visited.add(fullPath);
              await processDirectory(fullPath, depth + 1);
            }
          } else if (entry.isFile()) {
            const shouldInclude = this.shouldIncludeFile(relativePath);
            const isExcluded = this.isExcluded(relativePath);
            
            if (this.options.verbose) {
              console.log(`  File: ${relativePath}, Include: ${shouldInclude}, Exclude: ${isExcluded}`);
            }
            
            if (shouldInclude && !isExcluded && files.length < this.options.maxFiles) {
              try {
                const fileStats = await stat(fullPath);
                const content = await readFile(fullPath, 'utf-8');
                
                files.push({
                  path: fullPath,
                  relativePath,
                  content,
                  size: fileStats.size,
                  lastModified: fileStats.mtime.getTime(),
                  type: this.getModuleType(fullPath)
                });
                
                if (this.options.verbose) {
                  console.log(`    ✅ Added file: ${relativePath}`);
                }
              } catch (error) {
                this.emit('fileError', { path: fullPath, error });
              }
            }
          } else if (entry.isSymbolicLink() && this.options.followSymlinks) {
            // Handle symbolic links
            try {
              const realPath = await readFile(fullPath, 'utf-8');
              const resolvedPath = resolve(dirname(fullPath), realPath);
              if (!visited.has(resolvedPath)) {
                const linkStats = await stat(resolvedPath);
                if (linkStats.isDirectory()) {
                  await processDirectory(resolvedPath, depth + 1);
                }
              }
            } catch {
              // Ignore broken symlinks
            }
          }
        }
      } catch (error) {
        this.emit('directoryError', { path: dirPath, error });
      }
    };

    await processDirectory(this.options.rootPath);
    return files;
  }

  /**
   * Parse files to extract imports and exports
   */
  private async parseFiles(files: FileInfo[]): Promise<ParsedFile[]> {
    const parsed: ParsedFile[] = [];

    for (const file of files) {
      try {
        const cacheKey = this.getCacheKey(file);
        
        let parsedFile: ParsedFile;
        
        if (this.options.enableCaching && this.cache.has(cacheKey)) {
          parsedFile = this.cache.get(cacheKey);
        } else {
          parsedFile = {
            info: file,
            imports: this.extractImports(file),
            exports: this.extractExports(file)
          };

          if (this.options.enableCaching) {
            this.cache.set(cacheKey, parsedFile);
          }
        }

        parsed.push(parsedFile);
        this.filesProcessed++;

        if (this.filesProcessed % 100 === 0) {
          this.emit('progress', {
            processed: this.filesProcessed,
            total: files.length,
            currentFile: file.relativePath
          });
        }

      } catch (error) {
        this.emit('parseError', { file: file.path, error });
      }
    }

    return parsed;
  }

  /**
   * Extract import statements from file content
   */
  private extractImports(file: FileInfo): ModuleImport[] {
    const imports: ModuleImport[] = [];
    const content = file.content;
    const lines = content.split('\n');

    // ES6 imports
    const es6ImportRegex = /^import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"];?/gm;
    
    // CommonJS requires
    const requireRegex = /(?:const|let|var)\s+(?:\{[^}]*\}|\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    
    // Dynamic imports
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    let match;
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      
      // Check ES6 imports
      es6ImportRegex.lastIndex = 0;
      match = es6ImportRegex.exec(line);
      if (match) {
        const specifier = match[1];
        imports.push({
          specifier,
          source: match[0],
          type: 'es6' as ImportType,
          line: lineNumber,
          column: match.index || 0,
          isExternal: this.isExternalModule(specifier),
          isRelative: this.isRelativeImport(specifier),
          resolvedPath: this.resolveImport(specifier, file.path),
          ...this.parseImportDetails(match[0])
        });
      }

      // Check CommonJS requires
      requireRegex.lastIndex = 0;
      match = requireRegex.exec(line);
      if (match) {
        const specifier = match[1];
        imports.push({
          specifier,
          source: match[0],
          type: 'commonjs' as ImportType,
          line: lineNumber,
          column: match.index || 0,
          isExternal: this.isExternalModule(specifier),
          isRelative: this.isRelativeImport(specifier),
          resolvedPath: this.resolveImport(specifier, file.path)
        });
      }

      // Check dynamic imports
      dynamicImportRegex.lastIndex = 0;
      match = dynamicImportRegex.exec(line);
      if (match) {
        const specifier = match[1];
        imports.push({
          specifier,
          source: match[0],
          type: 'dynamic' as ImportType,
          line: lineNumber,
          column: match.index || 0,
          isExternal: this.isExternalModule(specifier),
          isRelative: this.isRelativeImport(specifier),
          resolvedPath: this.resolveImport(specifier, file.path),
          dynamic: true
        });
      }
    }

    return imports;
  }

  /**
   * Extract export statements from file content
   */
  private extractExports(file: FileInfo): ModuleExport[] {
    const exports: ModuleExport[] = [];
    const content = file.content;
    const lines = content.split('\n');

    // Export patterns
    const exportRegexes = [
      // Named exports: export { name }
      /export\s*\{\s*([^}]+)\s*\}/g,
      // Default export: export default
      /export\s+default\s+/g,
      // Export declaration: export const/let/var/function/class
      /export\s+(?:const|let|var|function|class|interface|type)\s+(\w+)/g,
      // Re-export: export { name } from 'module'
      /export\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g
    ];

    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;

      for (const regex of exportRegexes) {
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(line)) !== null) {
          const exportInfo = this.parseExportMatch(match, line, lineNumber);
          if (exportInfo) {
            exports.push(exportInfo);
          }
        }
      }
    }

    return exports;
  }

  /**
   * Build the dependency graph from parsed files
   */
  private buildDependencyGraph(parsedFiles: ParsedFile[]): DependencyGraph {
    const nodes = new Map<string, DependencyNode>();
    const edges: DependencyEdge[] = [];
    const externalPackages = new Set<string>();

    // Create nodes
    for (const parsed of parsedFiles) {
      const { info, imports, exports } = parsed;
      
      const node: DependencyNode = {
        id: info.path,
        path: info.path,
        relativePath: info.relativePath,
        name: basename(info.path),
        type: info.type,
        size: info.size,
        lines: info.content.split('\n').length,
        imports,
        exports,
        dependencies: [],
        dependents: [],
        isEntryPoint: this.isEntryPoint(info.path),
        isExternal: false,
        lastModified: info.lastModified
      };

      nodes.set(info.path, node);
    }

    // Create edges and populate dependencies
    for (const parsed of parsedFiles) {
      const sourceNode = nodes.get(parsed.info.path)!;
      
      for (const importInfo of parsed.imports) {
        if (importInfo.isExternal) {
          externalPackages.add(importInfo.specifier.split('/')[0]);
          continue;
        }

        const resolvedPath = importInfo.resolvedPath;
        if (resolvedPath && nodes.has(resolvedPath)) {
          const targetNode = nodes.get(resolvedPath)!;
          
          // Add to dependencies/dependents
          if (!sourceNode.dependencies.includes(resolvedPath)) {
            sourceNode.dependencies.push(resolvedPath);
          }
          if (!targetNode.dependents.includes(parsed.info.path)) {
            targetNode.dependents.push(parsed.info.path);
          }

          // Create edge
          const existingEdge = edges.find(e => e.from === parsed.info.path && e.to === resolvedPath);
          if (existingEdge) {
            existingEdge.weight++;
            existingEdge.imports.push(importInfo);
          } else {
            edges.push({
              from: parsed.info.path,
              to: resolvedPath,
              type: this.getDependencyType(importInfo),
              weight: 1,
              imports: [importInfo],
              conditional: importInfo.conditional || false,
              dynamic: importInfo.dynamic || false
            });
          }
        }
      }
    }

    return {
      nodes,
      edges,
      entryPoints: Array.from(nodes.values())
        .filter(n => n.isEntryPoint)
        .map(n => n.id),
      externalPackages,
      cycles: [],
      stats: this.calculateInitialStats(nodes, edges)
    };
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(graph: DependencyGraph): DependencyCycle[] {
    const cycles: DependencyCycle[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const pathStack: string[] = [];

    const dfs = (nodeId: string): void => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStart = pathStack.indexOf(nodeId);
        const cycleNodes = pathStack.slice(cycleStart);
        cycleNodes.push(nodeId); // Complete the cycle
        
        const cycleId = createHash('md5')
          .update(cycleNodes.sort().join('->'))
          .digest('hex');
        
        if (!cycles.find(c => c.id === cycleId)) {
          cycles.push({
            id: cycleId,
            nodes: cycleNodes.slice(0, -1), // Remove duplicate end node
            edges: cycleNodes.slice(0, -1).map((node, i) => 
              `${relative(this.options.rootPath, node)} -> ${relative(this.options.rootPath, cycleNodes[i + 1])}`
            ),
            length: cycleNodes.length - 1,
            severity: this.calculateCycleSeverity(cycleNodes.length - 1),
            impact: this.calculateCycleImpact(cycleNodes.slice(0, -1), graph),
            suggestions: this.generateCycleSuggestions(cycleNodes.slice(0, -1))
          });
        }
        return;
      }

      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);
      pathStack.push(nodeId);

      const node = graph.nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (graph.nodes.has(depId)) {
            dfs(depId);
          }
        }
      }

      recursionStack.delete(nodeId);
      pathStack.pop();
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }

    return cycles;
  }

  /**
   * Perform impact analysis
   */
  private performImpactAnalysis(graph: DependencyGraph): ImpactAnalysis[] {
    const analyses: ImpactAnalysis[] = [];

    for (const node of graph.nodes.values()) {
      const directImpact = [...node.dependents];
      const indirectImpact = this.findIndirectDependents(node.id, graph);
      
      const analysis: ImpactAnalysis = {
        file: node.relativePath,
        directImpact: directImpact.map(path => relative(this.options.rootPath, path)),
        indirectImpact: indirectImpact.map(path => relative(this.options.rootPath, path)),
        totalImpact: directImpact.length + indirectImpact.length,
        riskScore: this.calculateFileRiskScore(node, directImpact, indirectImpact),
        criticalPaths: this.findCriticalPaths(node.id, graph),
        suggestions: this.generateImpactSuggestions(node, directImpact, indirectImpact)
      };

      if (analysis.totalImpact > 0) {
        analyses.push(analysis);
      }
    }

    return analyses.sort((a, b) => b.totalImpact - a.totalImpact);
  }

  /**
   * Find unused dependencies
   */
  private findUnusedDependencies(graph: DependencyGraph): UnusedDependency[] {
    if (!this.packageJson) return [];

    const unused: UnusedDependency[] = [];
    const allImports = new Set<string>();

    // Collect all imported packages
    for (const node of graph.nodes.values()) {
      for (const imp of node.imports) {
        if (imp.isExternal) {
          const packageName = imp.specifier.startsWith('@') 
            ? imp.specifier.split('/').slice(0, 2).join('/')
            : imp.specifier.split('/')[0];
          allImports.add(packageName);
        }
      }
    }

    // Check each declared dependency
    const checkDependencies = (
      deps: Record<string, string> | undefined,
      type: 'dependency' | 'devDependency' | 'peerDependency'
    ) => {
      if (!deps) return;

      for (const packageName of Object.keys(deps)) {
        if (!allImports.has(packageName)) {
          unused.push({
            package: packageName,
            type,
            declaredIn: join(this.options.rootPath, this.options.packageJsonPath),
            reason: 'never_imported' as UnusedReason,
            confidence: 0.9,
            potentialUsage: [],
            suggestions: [`Consider removing ${packageName} from ${type}`]
          });
        }
      }
    };

    checkDependencies(this.packageJson.dependencies, 'dependency');
    checkDependencies(this.packageJson.devDependencies, 'devDependency');
    checkDependencies(this.packageJson.peerDependencies, 'peerDependency');

    return unused;
  }

  /**
   * Check boundary violations
   */
  private checkBoundaryViolations(graph: DependencyGraph): BoundaryViolation[] {
    const violations: BoundaryViolation[] = [];

    for (const edge of graph.edges) {
      const sourceNode = graph.nodes.get(edge.from)!;
      const targetNode = graph.nodes.get(edge.to)!;

      // Check each boundary rule
      for (const rule of this.options.boundaryRules) {
        if (this.matchesPattern(sourceNode.relativePath, rule.from) &&
            this.matchesPattern(targetNode.relativePath, rule.to)) {
          
          if (!rule.allowed) {
            violations.push({
              id: `${edge.from}->${edge.to}`,
              type: 'layer_violation' as ViolationType,
              severity: rule.severity,
              from: sourceNode.relativePath,
              to: targetNode.relativePath,
              rule: rule.name,
              description: rule.message || `${rule.name} violation`,
              suggestion: `Refactor to avoid dependency from ${rule.from} to ${rule.to}`,
              import: edge.imports[0]
            });
          }
        }
      }

      // Check layer violations
      for (const layer of this.options.layers) {
        if (this.matchesPattern(sourceNode.relativePath, layer.pattern)) {
          const allowedDeps = layer.dependencies || [];
          let isViolation = true;

          for (const allowedLayer of allowedDeps) {
            const allowedLayerDef = this.options.layers.find(l => l.name === allowedLayer);
            if (allowedLayerDef && this.matchesPattern(targetNode.relativePath, allowedLayerDef.pattern)) {
              isViolation = false;
              break;
            }
          }

          if (isViolation) {
            violations.push({
              id: `layer-${edge.from}->${edge.to}`,
              type: 'layer_violation' as ViolationType,
              severity: 'high',
              from: sourceNode.relativePath,
              to: targetNode.relativePath,
              rule: `${layer.name} layer dependency rule`,
              description: `${layer.name} layer should not depend on components outside allowed layers`,
              suggestion: `Move ${targetNode.name} to an allowed layer or refactor dependency`,
              import: edge.imports[0]
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Generate comprehensive statistics
   */
  private generateStatistics(graph: DependencyGraph): DependencyStats {
    const nodes = Array.from(graph.nodes.values());
    const dependencyCounts = nodes.map(n => n.dependencies.length);
    const dependentCounts = nodes.map(n => n.dependents.length);

    const depthMap = this.calculateDependencyDepths(graph);
    const depthValues = Array.from(depthMap.values());
    const depthDistribution: Record<number, number> = {};
    
    for (const depth of depthValues) {
      depthDistribution[depth] = (depthDistribution[depth] || 0) + 1;
    }

    return {
      totalFiles: graph.nodes.size,
      totalDependencies: graph.edges.length,
      totalExternalPackages: graph.externalPackages.size,
      averageDependencies: dependencyCounts.reduce((a, b) => a + b, 0) / dependencyCounts.length,
      maxDependencies: Math.max(...dependencyCounts),
      circularDependencies: graph.cycles.length,
      fanIn: {
        max: Math.max(...dependentCounts),
        avg: dependentCounts.reduce((a, b) => a + b, 0) / dependentCounts.length,
        files: nodes
          .sort((a, b) => b.dependents.length - a.dependents.length)
          .slice(0, 10)
          .map(n => ({ file: n.relativePath, count: n.dependents.length }))
      },
      fanOut: {
        max: Math.max(...dependencyCounts),
        avg: dependencyCounts.reduce((a, b) => a + b, 0) / dependencyCounts.length,
        files: nodes
          .sort((a, b) => b.dependencies.length - a.dependencies.length)
          .slice(0, 10)
          .map(n => ({ file: n.relativePath, count: n.dependencies.length }))
      },
      depth: {
        max: Math.max(...depthValues),
        avg: depthValues.reduce((a, b) => a + b, 0) / depthValues.length,
        distribution: depthDistribution
      },
      bundleSize: {
        total: nodes.reduce((sum, n) => sum + n.size, 0),
        byFile: new Map(nodes.map(n => [n.relativePath, n.size])),
        byPackage: new Map() // Would need more sophisticated analysis
      }
    };
  }

  /**
   * Generate visualization data
   */
  private generateVisualizationData(graph: DependencyGraph): VisualizationData {
    const nodes: VisualizationNode[] = [];
    const links: VisualizationLink[] = [];
    const clusters: VisualizationCluster[] = [];

    // Create visualization nodes
    for (const node of graph.nodes.values()) {
      const depthMap = this.calculateDependencyDepths(graph);
      
      nodes.push({
        id: node.id,
        name: node.name,
        group: dirname(node.relativePath).split(sep)[0] || 'root',
        size: Math.max(5, Math.log(node.size + 1) * 2),
        level: depthMap.get(node.id) || 0,
        type: node.type,
        isEntryPoint: node.isEntryPoint,
        inCycle: graph.cycles.some(c => c.nodes.includes(node.id)),
        fanIn: node.dependents.length,
        fanOut: node.dependencies.length
      });
    }

    // Create visualization links
    for (const edge of graph.edges) {
      links.push({
        source: edge.from,
        target: edge.to,
        weight: edge.weight,
        type: edge.type,
        dynamic: edge.dynamic,
        conditional: edge.conditional,
        style: edge.dynamic ? 'dashed' : edge.conditional ? 'dotted' : 'solid'
      });
    }

    // Create clusters (by directory)
    const directoryClusters = new Map<string, Set<string>>();
    
    for (const node of graph.nodes.values()) {
      const dir = dirname(node.relativePath);
      if (!directoryClusters.has(dir)) {
        directoryClusters.set(dir, new Set());
      }
      directoryClusters.get(dir)!.add(node.id);
    }

    for (const [dir, nodeIds] of directoryClusters) {
      if (nodeIds.size > 1) {
        clusters.push({
          id: dir,
          name: basename(dir) || 'root',
          nodes: Array.from(nodeIds),
          type: 'directory'
        });
      }
    }

    // Add cycle clusters
    for (const cycle of graph.cycles) {
      clusters.push({
        id: cycle.id,
        name: `Cycle ${cycle.length}`,
        nodes: cycle.nodes,
        type: 'cycle',
        color: '#ff6b6b'
      });
    }

    return {
      nodes,
      links,
      clusters,
      metadata: {
        totalNodes: nodes.length,
        totalLinks: links.length,
        maxDepth: Math.max(...nodes.map(n => n.level)),
        entryPoints: graph.entryPoints,
        cycles: graph.cycles.length
      }
    };
  }

  /**
   * Generate recommendations based on analysis results
   */
  private generateRecommendations(
    cycles: DependencyCycle[],
    unusedDeps: UnusedDependency[],
    violations: BoundaryViolation[],
    stats: DependencyStats
  ) {
    const immediate: string[] = [];
    const refactoring: string[] = [];
    const architecture: string[] = [];
    const performance: string[] = [];
    const maintenance: string[] = [];

    // Critical issues
    if (cycles.length > 0) {
      immediate.push(`Fix ${cycles.length} circular dependencies to improve maintainability`);
      cycles.filter(c => c.severity === 'critical').forEach(c => {
        immediate.push(`Critical cycle detected: ${c.nodes.map(n => basename(n)).join(' -> ')}`);
      });
    }

    // Boundary violations
    if (violations.length > 0) {
      const criticalViolations = violations.filter(v => v.severity === 'critical');
      if (criticalViolations.length > 0) {
        immediate.push(`Fix ${criticalViolations.length} critical architectural boundary violations`);
      }
      architecture.push(`Review and fix ${violations.length} boundary violations`);
    }

    // High fan-out files
    if (stats.fanOut.max > 20) {
      refactoring.push(`Files with >20 dependencies may need refactoring`);
      stats.fanOut.files.slice(0, 3).forEach(f => {
        refactoring.push(`Consider breaking down ${f.file} (${f.count} dependencies)`);
      });
    }

    // High fan-in files
    if (stats.fanIn.max > 50) {
      architecture.push(`Highly depended-upon files should be stable and well-tested`);
      stats.fanIn.files.slice(0, 3).forEach(f => {
        maintenance.push(`Monitor changes to ${f.file} (${f.count} dependents)`);
      });
    }

    // Unused dependencies
    if (unusedDeps.length > 0) {
      performance.push(`Remove ${unusedDeps.length} unused dependencies to reduce bundle size`);
      unusedDeps.forEach(dep => {
        performance.push(`Remove unused ${dep.type}: ${dep.package}`);
      });
    }

    // Deep dependency chains
    if (stats.depth.max > 10) {
      architecture.push(`Consider flattening deep dependency chains (max depth: ${stats.depth.max})`);
    }

    // Large files
    const largeFiles = Array.from(stats.bundleSize.byFile.entries())
      .filter(([, size]) => size > 50000)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    if (largeFiles.length > 0) {
      maintenance.push(`Consider splitting large files: ${largeFiles.map(([file]) => basename(file)).join(', ')}`);
    }

    // Performance recommendations
    if (stats.totalFiles > 1000) {
      performance.push('Consider implementing dynamic imports for large applications');
    }

    return { immediate, refactoring, architecture, performance, maintenance };
  }

  /**
   * Export report in various formats
   */
  private async exportReport(report: DependencyReport): Promise<Record<string, string>> {
    const exports: Record<string, string> = {};

    for (const format of this.options.exportFormats) {
      switch (format) {
        case 'json':
          exports.json = JSON.stringify(report, (key, value) => {
            // Convert Maps and Sets to objects/arrays for JSON
            if (value instanceof Map) {
              return Object.fromEntries(value);
            }
            if (value instanceof Set) {
              return Array.from(value);
            }
            return value;
          }, 2);
          break;

        case 'csv':
          exports.csv = this.generateCSVReport(report);
          break;

        case 'dot':
          exports.dot = this.generateDOTGraph(report.graph);
          break;

        case 'mermaid':
          exports.mermaid = this.generateMermaidDiagram(report.graph);
          break;

        case 'html':
          exports.html = this.generateHTMLReport(report);
          break;
      }
    }

    return exports;
  }

  /**
   * Helper methods
   */
  
  private isExcluded(relativePath: string): boolean {
    return this.options.excludeGlobs.some(glob => 
      this.matchGlob(relativePath, glob)
    );
  }

  private shouldIncludeFile(relativePath: string): boolean {
    return this.options.includeGlobs.some(glob => 
      this.matchGlob(relativePath, glob)
    );
  }

  private matchGlob(path: string, pattern: string): boolean {
    // Simple glob matching - convert glob pattern to regex
    // Escape special regex characters except * and ?
    let regex = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\*\*/g, '___DOUBLESTAR___')  // Temp placeholder
      .replace(/\*/g, '[^/]*')              // Single * matches anything except /
      .replace(/___DOUBLESTAR___/g, '.*')   // ** matches anything including /
      .replace(/\?/g, '[^/]');              // ? matches single character except /
    
    // Make the pattern match the full path
    regex = `^${regex}$`;
    
    try {
      return new RegExp(regex).test(path);
    } catch (e) {
      // If regex is invalid, fall back to simple string matching
      return path.includes(pattern.replace(/\*/g, ''));
    }
  }

  private getModuleType(filePath: string): ModuleType {
    const ext = extname(filePath).toLowerCase();
    switch (ext) {
      case '.ts': case '.tsx': return 'typescript';
      case '.js': case '.jsx': return 'javascript';
      case '.json': return 'json';
      case '.css': return 'css';
      case '.scss': case '.sass': return 'sass';
      case '.less': return 'less';
      case '.png': case '.jpg': case '.jpeg': case '.gif': case '.svg': case '.webp': return 'image';
      default: return 'other';
    }
  }

  private getCacheKey(file: FileInfo): string {
    return createHash('md5')
      .update(`${file.path}-${file.lastModified}-${file.size}`)
      .digest('hex');
  }

  private parseImportDetails(importStatement: string): Partial<ModuleImport> {
    const details: Partial<ModuleImport> = {};
    
    // Extract named imports
    const namedMatch = importStatement.match(/\{\s*([^}]+)\s*\}/);
    if (namedMatch) {
      details.named = namedMatch[1].split(',').map(s => s.trim());
    }

    // Extract default import
    const defaultMatch = importStatement.match(/import\s+(\w+)/);
    if (defaultMatch && !namedMatch) {
      details.default = defaultMatch[1];
    }

    // Extract namespace import
    const namespaceMatch = importStatement.match(/import\s+\*\s+as\s+(\w+)/);
    if (namespaceMatch) {
      details.namespace = namespaceMatch[1];
    }

    return details;
  }

  private parseExportMatch(match: RegExpExecArray, line: string, lineNumber: number): ModuleExport | null {
    if (match[0].includes('default')) {
      return {
        name: 'default',
        type: 'default' as ExportType,
        line: lineNumber,
        column: match.index || 0,
        source: line.trim(),
        isDefault: true
      };
    }

    // Handle named exports
    if (match[1]) {
      const names = match[1].split(',').map(s => s.trim());
      if (names.length > 0) {
        return {
          name: names[0], // Return first for simplicity
          type: 'named' as ExportType,
          line: lineNumber,
          column: match.index || 0,
          source: line.trim(),
          isReexport: match[0].includes('from'),
          from: match[2] // Re-export source if present
        };
      }
    }

    return null;
  }

  private isExternalModule(specifier: string): boolean {
    return !specifier.startsWith('.') && !specifier.startsWith('/');
  }

  private isRelativeImport(specifier: string): boolean {
    return specifier.startsWith('./') || specifier.startsWith('../');
  }

  private resolveImport(specifier: string, fromFile: string): string | undefined {
    if (this.isExternalModule(specifier)) {
      return undefined;
    }

    try {
      const fromDir = dirname(fromFile);
      let resolved = resolve(fromDir, specifier);

      // Try with extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
      for (const ext of extensions) {
        const withExt = resolved + ext;
        // For now, return the first possibility - in a real implementation
        // we would check if the file exists using fs.access
        return withExt;
      }

      // Try index files
      for (const ext of extensions) {
        const indexFile = join(resolved, 'index' + ext);
        return indexFile;
      }

      return resolved;
    } catch {
      return undefined;
    }
  }

  private getDependencyType(importInfo: ModuleImport): DependencyType {
    if (importInfo.dynamic) return 'dynamic';
    if (importInfo.conditional) return 'conditional';
    if (importInfo.type === 'es6' && importInfo.source.includes('type ')) return 'type_only';
    return 'static';
  }

  private isEntryPoint(filePath: string): boolean {
    const name = basename(filePath, extname(filePath));
    return ['index', 'main', 'app', 'entry'].includes(name.toLowerCase());
  }

  private calculateInitialStats(nodes: Map<string, DependencyNode>, edges: DependencyEdge[]): DependencyStats {
    // Initial basic stats - will be enhanced in generateStatistics
    return {
      totalFiles: nodes.size,
      totalDependencies: edges.length,
      totalExternalPackages: 0,
      averageDependencies: 0,
      maxDependencies: 0,
      circularDependencies: 0,
      fanIn: { max: 0, avg: 0, files: [] },
      fanOut: { max: 0, avg: 0, files: [] },
      depth: { max: 0, avg: 0, distribution: {} },
      bundleSize: { total: 0, byFile: new Map(), byPackage: new Map() }
    };
  }

  private calculateCycleSeverity(length: number): CycleSeverity {
    if (length <= 2) return 'low';
    if (length <= 4) return 'medium';
    if (length <= 8) return 'high';
    return 'critical';
  }

  private calculateCycleImpact(nodes: string[], graph: DependencyGraph): number {
    let impact = 0;
    for (const nodeId of nodes) {
      const node = graph.nodes.get(nodeId);
      if (node) {
        impact += node.dependents.length + node.dependencies.length;
      }
    }
    return Math.min(100, Math.floor(impact / nodes.length));
  }

  private generateCycleSuggestions(nodes: string[]): string[] {
    const suggestions: string[] = [];
    
    if (nodes.length === 2) {
      suggestions.push('Consider extracting common functionality to a shared module');
      suggestions.push('Move one dependency direction to break the cycle');
    } else {
      suggestions.push('Identify the weakest link in the cycle and refactor');
      suggestions.push('Extract shared interfaces to break dependency');
      suggestions.push('Consider using dependency inversion principle');
    }

    return suggestions;
  }

  private findIndirectDependents(nodeId: string, graph: DependencyGraph): string[] {
    const indirect = new Set<string>();
    const visited = new Set<string>();
    const queue: string[] = [];

    // Start with direct dependents
    const node = graph.nodes.get(nodeId);
    if (node) {
      queue.push(...node.dependents);
    }

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      
      visited.add(currentId);
      indirect.add(currentId);

      const currentNode = graph.nodes.get(currentId);
      if (currentNode) {
        queue.push(...currentNode.dependents);
      }
    }

    // Remove direct dependents from indirect
    if (node) {
      for (const directDep of node.dependents) {
        indirect.delete(directDep);
      }
    }

    return Array.from(indirect);
  }

  private calculateFileRiskScore(
    node: DependencyNode, 
    directImpact: string[], 
    indirectImpact: string[]
  ): number {
    let score = 0;
    
    // Base score from impact size
    score += Math.min(50, (directImpact.length + indirectImpact.length) * 2);
    
    // Additional score factors
    score += Math.min(20, node.dependencies.length); // High fan-out increases risk
    score += Math.min(20, node.size / 1000); // Large files are riskier
    score += node.isEntryPoint ? 10 : 0; // Entry points are critical
    
    return Math.min(100, Math.floor(score));
  }

  private findCriticalPaths(nodeId: string, graph: DependencyGraph): string[][] {
    const paths: string[][] = [];
    const visited = new Set<string>();

    const findPaths = (currentId: string, path: string[]): void => {
      if (visited.has(currentId) || path.length > 10) return;
      
      const newPath = [...path, currentId];
      const node = graph.nodes.get(currentId);
      
      if (node && node.isEntryPoint && path.length > 0) {
        paths.push(newPath.map(id => relative(this.options.rootPath, id)));
        return;
      }

      if (node) {
        visited.add(currentId);
        for (const dependentId of node.dependents) {
          findPaths(dependentId, newPath);
        }
        visited.delete(currentId);
      }
    };

    findPaths(nodeId, []);
    return paths.slice(0, 5); // Limit to top 5 critical paths
  }

  private generateImpactSuggestions(
    node: DependencyNode, 
    directImpact: string[], 
    indirectImpact: string[]
  ): string[] {
    const suggestions: string[] = [];
    const totalImpact = directImpact.length + indirectImpact.length;

    if (totalImpact > 50) {
      suggestions.push('Consider breaking this file into smaller, more focused modules');
      suggestions.push('Extract interfaces to reduce coupling');
    }

    if (node.dependencies.length > 20) {
      suggestions.push('This file has high fan-out - consider dependency injection');
    }

    if (node.size > 10000) {
      suggestions.push('Large file size increases change risk - consider splitting');
    }

    if (node.isEntryPoint) {
      suggestions.push('Entry point - ensure comprehensive testing and careful change management');
    }

    return suggestions;
  }

  private calculateDependencyDepths(graph: DependencyGraph): Map<string, number> {
    const depths = new Map<string, number>();
    const visited = new Set<string>();

    const calculateDepth = (nodeId: string): number => {
      if (depths.has(nodeId)) {
        return depths.get(nodeId)!;
      }

      if (visited.has(nodeId)) {
        // Circular dependency - assign max depth to break infinite loop
        depths.set(nodeId, 99);
        return 99;
      }

      visited.add(nodeId);
      
      const node = graph.nodes.get(nodeId);
      if (!node || node.dependencies.length === 0) {
        depths.set(nodeId, 0);
        visited.delete(nodeId);
        return 0;
      }

      let maxDepth = 0;
      for (const depId of node.dependencies) {
        if (graph.nodes.has(depId)) {
          const depDepth = calculateDepth(depId);
          maxDepth = Math.max(maxDepth, depDepth + 1);
        }
      }

      depths.set(nodeId, maxDepth);
      visited.delete(nodeId);
      return maxDepth;
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!depths.has(nodeId)) {
        calculateDepth(nodeId);
      }
    }

    return depths;
  }

  private matchesPattern(path: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return this.matchGlob(path, pattern);
    }
    return pattern.test(path);
  }

  private calculateRiskScore(
    cycles: DependencyCycle[], 
    unusedDeps: UnusedDependency[], 
    violations: BoundaryViolation[]
  ): number {
    let score = 0;
    
    // Circular dependencies (high impact)
    score += cycles.length * 15;
    score += cycles.filter(c => c.severity === 'critical').length * 10;
    
    // Boundary violations (medium impact)
    score += violations.length * 8;
    score += violations.filter(v => v.severity === 'critical').length * 7;
    
    // Unused dependencies (low impact)
    score += unusedDeps.length * 2;
    
    return Math.min(100, score);
  }

  private calculateHealthGrade(
    cycles: DependencyCycle[], 
    unusedDeps: UnusedDependency[], 
    violations: BoundaryViolation[]
  ): 'A' | 'B' | 'C' | 'D' | 'F' {
    const riskScore = this.calculateRiskScore(cycles, unusedDeps, violations);
    
    if (riskScore <= 10) return 'A';
    if (riskScore <= 25) return 'B';
    if (riskScore <= 50) return 'C';
    if (riskScore <= 75) return 'D';
    return 'F';
  }

  private generateCSVReport(report: DependencyReport): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Type,File,Dependencies,Dependents,Size,Risk Score,Issues');
    
    // Data rows
    for (const node of report.graph.nodes.values()) {
      const issues: string[] = [];
      
      // Check for cycles
      if (report.cycles.some(c => c.nodes.includes(node.id))) {
        issues.push('Circular');
      }
      
      // Check for violations
      const nodeViolations = report.boundaryViolations.filter(
        v => v.from === node.relativePath || v.to === node.relativePath
      );
      if (nodeViolations.length > 0) {
        issues.push(`Violations(${nodeViolations.length})`);
      }
      
      lines.push([
        node.type,
        node.relativePath,
        node.dependencies.length.toString(),
        node.dependents.length.toString(),
        node.size.toString(),
        '0', // Would calculate individual file risk score
        issues.join(';')
      ].map(field => `"${field}"`).join(','));
    }
    
    return lines.join('\n');
  }

  private generateDOTGraph(graph: DependencyGraph): string {
    const lines: string[] = [];
    lines.push('digraph Dependencies {');
    lines.push('  rankdir=LR;');
    lines.push('  node [shape=box];');
    
    // Add nodes
    for (const node of graph.nodes.values()) {
      const label = node.name;
      const color = node.isEntryPoint ? 'lightblue' : 'lightgray';
      lines.push(`  "${node.id}" [label="${label}", fillcolor="${color}", style="filled"];`);
    }
    
    // Add edges
    for (const edge of graph.edges) {
      const style = edge.dynamic ? 'dashed' : 'solid';
      const weight = edge.weight > 1 ? ` [weight=${edge.weight}]` : '';
      lines.push(`  "${edge.from}" -> "${edge.to}" [style=${style}${weight}];`);
    }
    
    lines.push('}');
    return lines.join('\n');
  }

  private generateMermaidDiagram(graph: DependencyGraph): string {
    const lines: string[] = [];
    lines.push('graph TD');
    
    const nodeIds = new Map<string, string>();
    let nodeCounter = 0;
    
    // Create short node IDs
    for (const node of graph.nodes.values()) {
      const shortId = `N${nodeCounter++}`;
      nodeIds.set(node.id, shortId);
      const label = node.name.replace(/[^a-zA-Z0-9]/g, '_');
      lines.push(`  ${shortId}[${label}]`);
    }
    
    // Add edges
    for (const edge of graph.edges) {
      const fromId = nodeIds.get(edge.from);
      const toId = nodeIds.get(edge.to);
      if (fromId && toId) {
        const style = edge.dynamic ? '-.->|dynamic|' : '-->';
        lines.push(`  ${fromId} ${style} ${toId}`);
      }
    }
    
    return lines.join('\n');
  }

  private generateHTMLReport(report: DependencyReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dependency Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 3px; }
        .grade-A { color: green; } .grade-B { color: blue; } .grade-C { color: orange; }
        .grade-D { color: red; } .grade-F { color: darkred; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Dependency Analysis Report</h1>
    
    <div class="summary">
        <h2>Summary</h2>
        <div class="metric">Files: <strong>${report.summary.totalFiles}</strong></div>
        <div class="metric">Dependencies: <strong>${report.summary.totalDependencies}</strong></div>
        <div class="metric">External Packages: <strong>${report.summary.externalPackages}</strong></div>
        <div class="metric">Circular Dependencies: <strong>${report.summary.circularDependencies}</strong></div>
        <div class="metric">Health Grade: <strong class="grade-${report.summary.healthGrade}">${report.summary.healthGrade}</strong></div>
        <div class="metric">Risk Score: <strong>${report.summary.riskScore}/100</strong></div>
    </div>

    <h2>Top Dependencies (Fan-Out)</h2>
    <table>
        <tr><th>File</th><th>Dependencies</th></tr>
        ${report.stats.fanOut.files.slice(0, 10).map(f => 
          `<tr><td>${f.file}</td><td>${f.count}</td></tr>`
        ).join('')}
    </table>

    <h2>Most Depended Upon (Fan-In)</h2>
    <table>
        <tr><th>File</th><th>Dependents</th></tr>
        ${report.stats.fanIn.files.slice(0, 10).map(f => 
          `<tr><td>${f.file}</td><td>${f.count}</td></tr>`
        ).join('')}
    </table>

    ${report.cycles.length > 0 ? `
    <h2>Circular Dependencies</h2>
    <table>
        <tr><th>Files in Cycle</th><th>Length</th><th>Severity</th></tr>
        ${report.cycles.map(c => 
          `<tr><td>${c.nodes.map(n => basename(n)).join(' → ')}</td><td>${c.length}</td><td>${c.severity}</td></tr>`
        ).join('')}
    </table>` : ''}

    <h2>Recommendations</h2>
    ${Object.entries(report.recommendations).map(([category, recs]) => 
      recs.length > 0 ? `
      <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
      <ul>${recs.map(r => `<li>${r}</li>`).join('')}</ul>
      ` : ''
    ).join('')}

    <footer>
        <p>Generated on ${new Date(report.generatedAt).toLocaleString()}</p>
        <p>Analysis took ${report.summary.analysisTime}ms</p>
    </footer>
</body>
</html>`;
  }
}

// Export convenience functions
export function createDependencyAnalyzer(options?: DependencyAnalyzerOptions): DependencyAnalyzer {
  return new DependencyAnalyzer(options);
}

export async function analyzeDependencies(
  rootPath?: string,
  options?: DependencyAnalyzerOptions
): Promise<DependencyReport> {
  const analyzer = new DependencyAnalyzer({
    ...options,
    rootPath: rootPath || options?.rootPath || process.cwd()
  });
  return analyzer.analyze();
}

export async function quickDependencyAnalysis(rootPath?: string): Promise<DependencyReport> {
  return analyzeDependencies(rootPath || process.cwd(), {
    detectCircularDependencies: true,
    analyzeImpact: false,
    findUnusedDependencies: true,
    checkBoundaryViolations: false,
    generateVisualization: false,
    exportFormats: ['json'],
    verbose: false
  });
}

// Global instance
let globalAnalyzer: DependencyAnalyzer | null = null;

export function dependencyAnalyzer(options?: DependencyAnalyzerOptions): DependencyAnalyzer {
  if (!globalAnalyzer) {
    globalAnalyzer = new DependencyAnalyzer(options);
  }
  return globalAnalyzer;
}