/**
 * Dependency Management for Task-Marshal 1.1.0
 * BuildWorks.AI - Cycle detection and chronological validation
 */

import { DependencyContract } from '../types/enhanced.js';

export class DependencyManager {
  private contracts: Map<string, DependencyContract[]> = new Map();

  loadContracts(contracts: DependencyContract[]): void {
    this.contracts.clear();
    for (const contract of contracts) {
      const key = `${contract.from}-${contract.to}`;
      this.contracts.set(key, [...(this.contracts.get(key) || []), contract]);
    }
  }

  detectCycles(taskIds: string[]): string[][] {
    const graph = new Map<string, string[]>();
    
    // Build adjacency list
    for (const contract of this.contracts.values()) {
      for (const c of contract) {
        if (!graph.has(c.from)) graph.set(c.from, []);
        graph.get(c.from)!.push(c.to);
      }
    }

    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        cycles.push(path.slice(cycleStart));
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      for (const neighbor of graph.get(node) || []) {
        dfs(neighbor, [...path]);
      }

      recursionStack.delete(node);
    };

    for (const taskId of taskIds) {
      if (!visited.has(taskId)) {
        dfs(taskId, []);
      }
    }

    return cycles;
  }

  validateChronologicalOrder(tasks: Array<{ id: string; dueDate?: Date; createdAt: Date }>): string[] {
    const violations: string[] = [];
    
    for (const contract of this.contracts.values()) {
      for (const c of contract) {
        const fromTask = tasks.find(t => t.id === c.from);
        const toTask = tasks.find(t => t.id === c.to);
        
        if (!fromTask || !toTask) continue;
        
        const fromDate = fromTask.dueDate || fromTask.createdAt;
        const toDate = toTask.dueDate || toTask.createdAt;
        
        if (toDate < fromDate) {
          violations.push(`Task ${c.to} has due date before dependency ${c.from}`);
        }
      }
    }
    
    return violations;
  }

  getBlockedTasks(taskId: string): string[] {
    const blocked: string[] = [];
    for (const contract of this.contracts.values()) {
      for (const c of contract) {
        if (c.from === taskId) {
          blocked.push(c.to);
        }
      }
    }
    return blocked;
  }

  getDependencies(taskId: string): string[] {
    const dependencies: string[] = [];
    for (const contract of this.contracts.values()) {
      for (const c of contract) {
        if (c.to === taskId) {
          dependencies.push(c.from);
        }
      }
    }
    return dependencies;
  }
}
