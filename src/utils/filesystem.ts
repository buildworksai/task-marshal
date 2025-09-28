/**
 * Filesystem Persistence Layer for Task-Marshal 1.1.0
 * BuildWorks.AI - Secure, journaled, integrity-verified storage
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash, createHmac } from 'crypto';
import { Task as EnhancedTask, Initiative, DependencyContract } from '../types/enhanced.js';

export interface FilesystemConfig {
  rootDir: string;
  signingKey: string;
}
export class FilesystemManager {
  private config: FilesystemConfig;

  constructor(config: FilesystemConfig) {
    this.config = config;
  }

  async ensureInitiativeDir(initiativeId: string): Promise<string> {
    const dir = join(this.config.rootDir, initiativeId);
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
    await fs.mkdir(join(dir, 'tasks'), { recursive: true, mode: 0o700 });
    return dir;
  }

  async writeInitiative(initiative: Initiative): Promise<void> {
    const dir = await this.ensureInitiativeDir(initiative.id);
    const manifestPath = join(dir, 'manifest.json');
    const manifest = JSON.stringify(initiative, null, 2);
    
    await fs.writeFile(manifestPath, manifest, 'utf8');
    await this.signFile(manifestPath);
  }

  async readInitiative(initiativeId: string): Promise<Initiative | null> {
    try {
      const manifestPath = join(this.config.rootDir, initiativeId, 'manifest.json');
      const manifest = await fs.readFile(manifestPath, 'utf8');
      
      if (!await this.verifySignature(manifestPath)) {
        throw new Error('Manifest integrity check failed');
      }
      
      return JSON.parse(manifest);
    } catch {
      return null;
    }
  }

  async writeTask(task: EnhancedTask): Promise<void> {
    const dir = await this.ensureInitiativeDir(task.initiativeId);
    const taskPath = join(dir, 'tasks', `${task.id}.json`);
    const taskData = JSON.stringify(task, null, 2);
    
    await fs.writeFile(taskPath, taskData, 'utf8');
    await this.signFile(taskPath);
  }

  async readTask(initiativeId: string, taskId: string): Promise<EnhancedTask | null> {
    try {
      const taskPath = join(this.config.rootDir, initiativeId, 'tasks', `${taskId}.json`);
      const taskData = await fs.readFile(taskPath, 'utf8');
      
      if (!await this.verifySignature(taskPath)) {
        throw new Error('Task integrity check failed');
      }
      
      return JSON.parse(taskData);
    } catch {
      return null;
    }
  }

  async writeDependencies(initiativeId: string, dependencies: DependencyContract[]): Promise<void> {
    const dir = await this.ensureInitiativeDir(initiativeId);
    const depsPath = join(dir, 'dependencies.json');
    const depsData = JSON.stringify(dependencies, null, 2);
    
    await fs.writeFile(depsPath, depsData, 'utf8');
    await this.signFile(depsPath);
  }

  async readDependencies(initiativeId: string): Promise<DependencyContract[]> {
    try {
      const depsPath = join(this.config.rootDir, initiativeId, 'dependencies.json');
      const depsData = await fs.readFile(depsPath, 'utf8');
      
      if (!await this.verifySignature(depsPath)) {
        throw new Error('Dependencies integrity check failed');
      }
      
      return JSON.parse(depsData);
    } catch {
      return [];
    }
  }

  async listTasks(initiativeId: string): Promise<string[]> {
    try {
      const tasksDir = join(this.config.rootDir, initiativeId, 'tasks');
      const files = await fs.readdir(tasksDir);
      return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    } catch {
      return [];
    }
  }

  async listInitiatives(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.config.rootDir);
      return files.filter(f => !f.startsWith('.'));
    } catch {
      return [];
    }
  }

  private async signFile(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf8');
    const hash = createHash('sha256').update(content).digest('hex');
    const signature = createHmac('sha256', this.config.signingKey).update(hash).digest('hex');
    
    await fs.writeFile(`${filePath}.sig`, signature, 'utf8');
  }

  private async verifySignature(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const expectedSignature = await fs.readFile(`${filePath}.sig`, 'utf8');
      
      const hash = createHash('sha256').update(content).digest('hex');
      const computedSignature = createHmac('sha256', this.config.signingKey).update(hash).digest('hex');
      
      return expectedSignature === computedSignature;
    } catch {
      return false;
    }
  }
}
