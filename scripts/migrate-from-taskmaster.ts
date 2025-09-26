#!/usr/bin/env tsx

/**
 * Migration Script from task-master-ai to Task-Marshal
 * BuildWorks.AI - Seamless migration utility
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

interface TaskMasterTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface TaskMasterProject {
  id: string;
  name: string;
  description?: string;
  status: string;
  tasks: string[];
  createdAt: string;
  updatedAt: string;
}

interface TaskMasterData {
  tasks: TaskMasterTask[];
  projects: TaskMasterProject[];
  users: any[];
  settings: any;
}

/**
 * Migration utility class
 */
class TaskMasterMigrator {
  private inputFile: string;
  private outputDir: string;

  constructor(inputFile: string, outputDir: string = './data') {
    this.inputFile = inputFile;
    this.outputDir = outputDir;
  }

  /**
   * Run the migration
   */
  async migrate(): Promise<void> {
    console.log('🚀 Starting migration from task-master-ai to Task-Marshal...');

    try {
      // Check if input file exists
      if (!existsSync(this.inputFile)) {
        throw new Error(`Input file not found: ${this.inputFile}`);
      }

      // Read task-master-ai data
      const taskMasterData = this.readTaskMasterData();
      console.log(`📊 Found ${taskMasterData.tasks.length} tasks and ${taskMasterData.projects.length} projects`);

      // Migrate tasks
      const migratedTasks = this.migrateTasks(taskMasterData.tasks);
      console.log(`✅ Migrated ${migratedTasks.length} tasks`);

      // Migrate projects
      const migratedProjects = this.migrateProjects(taskMasterData.projects);
      console.log(`✅ Migrated ${migratedProjects.length} projects`);

      // Create migration report
      const migrationReport = this.createMigrationReport(taskMasterData, migratedTasks, migratedProjects);

      // Write migrated data
      this.writeMigratedData(migratedTasks, migratedProjects, migrationReport);

      console.log('🎉 Migration completed successfully!');
      console.log(`📁 Migrated data saved to: ${this.outputDir}`);
      console.log(`📋 Migration report: ${join(this.outputDir, 'migration-report.json')}`);

    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }

  /**
   * Read task-master-ai data
   */
  private readTaskMasterData(): TaskMasterData {
    const data = readFileSync(this.inputFile, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Migrate tasks from task-master-ai format to Task-Marshal format
   */
  private migrateTasks(tasks: TaskMasterTask[]): any[] {
    return tasks.map(task => ({
      id: task.id || uuidv4(),
      title: task.title,
      description: task.description,
      priority: this.mapPriority(task.priority),
      status: this.mapStatus(task.status),
      assignee: task.assignee,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      tags: task.tags || [],
      projectId: undefined, // Will be set during project migration
      dependencies: [],
      metadata: {
        migratedFrom: 'task-master-ai',
        originalId: task.id,
        migrationDate: new Date().toISOString(),
      },
    }));
  }

  /**
   * Migrate projects from task-master-ai format to Task-Marshal format
   */
  private migrateProjects(projects: TaskMasterProject[]): any[] {
    return projects.map(project => ({
      id: project.id || uuidv4(),
      name: project.name,
      description: project.description,
      status: this.mapProjectStatus(project.status),
      timeline: undefined,
      team: [],
      milestones: [],
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
      metadata: {
        migratedFrom: 'task-master-ai',
        originalId: project.id,
        migrationDate: new Date().toISOString(),
        originalTasks: project.tasks,
      },
    }));
  }

  /**
   * Map task-master-ai priority to Task-Marshal priority
   */
  private mapPriority(priority: string): 'low' | 'medium' | 'high' | 'critical' {
    const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      '1': 'low',
      '2': 'medium',
      '3': 'high',
      '4': 'critical',
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical',
    };

    return priorityMap[priority.toLowerCase()] || 'medium';
  }

  /**
   * Map task-master-ai status to Task-Marshal status
   */
  private mapStatus(status: string): 'pending' | 'in-progress' | 'completed' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'in-progress' | 'completed' | 'cancelled'> = {
      'todo': 'pending',
      'pending': 'pending',
      'in-progress': 'in-progress',
      'in_progress': 'in-progress',
      'done': 'completed',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
    };

    return statusMap[status.toLowerCase()] || 'pending';
  }

  /**
   * Map task-master-ai project status to Task-Marshal project status
   */
  private mapProjectStatus(status: string): 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled' {
    const statusMap: Record<string, 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled'> = {
      'planning': 'planning',
      'active': 'active',
      'on-hold': 'on-hold',
      'on_hold': 'on-hold',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
    };

    return statusMap[status.toLowerCase()] || 'planning';
  }

  /**
   * Create migration report
   */
  private createMigrationReport(
    originalData: TaskMasterData,
    migratedTasks: any[],
    migratedProjects: any[]
  ): any {
    return {
      migrationInfo: {
        timestamp: new Date().toISOString(),
        source: 'task-master-ai',
        target: 'task-marshal',
        version: '1.0.0',
      },
      statistics: {
        originalTasks: originalData.tasks.length,
        migratedTasks: migratedTasks.length,
        originalProjects: originalData.projects.length,
        migratedProjects: migratedProjects.length,
        originalUsers: originalData.users?.length || 0,
      },
      mapping: {
        priorityMapping: {
          '1': 'low',
          '2': 'medium',
          '3': 'high',
          '4': 'critical',
        },
        statusMapping: {
          'todo': 'pending',
          'in-progress': 'in-progress',
          'done': 'completed',
          'cancelled': 'cancelled',
        },
      },
      warnings: this.generateWarnings(originalData, migratedTasks, migratedProjects),
    };
  }

  /**
   * Generate migration warnings
   */
  private generateWarnings(
    originalData: TaskMasterData,
    migratedTasks: any[],
    migratedProjects: any[]
  ): string[] {
    const warnings: string[] = [];

    if (migratedTasks.length !== originalData.tasks.length) {
      warnings.push(`Task count mismatch: ${originalData.tasks.length} original vs ${migratedTasks.length} migrated`);
    }

    if (migratedProjects.length !== originalData.projects.length) {
      warnings.push(`Project count mismatch: ${originalData.projects.length} original vs ${migratedProjects.length} migrated`);
    }

    const tasksWithoutAssignees = migratedTasks.filter(task => !task.assignee).length;
    if (tasksWithoutAssignees > 0) {
      warnings.push(`${tasksWithoutAssignees} tasks have no assignee`);
    }

    const tasksWithoutDueDates = migratedTasks.filter(task => !task.dueDate).length;
    if (tasksWithoutDueDates > 0) {
      warnings.push(`${tasksWithoutDueDates} tasks have no due date`);
    }

    return warnings;
  }

  /**
   * Write migrated data to files
   */
  private writeMigratedData(tasks: any[], projects: any[], report: any): void {
    // Ensure output directory exists
    const fs = require('fs');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Write tasks
    writeFileSync(
      join(this.outputDir, 'migrated-tasks.json'),
      JSON.stringify(tasks, null, 2)
    );

    // Write projects
    writeFileSync(
      join(this.outputDir, 'migrated-projects.json'),
      JSON.stringify(projects, null, 2)
    );

    // Write migration report
    writeFileSync(
      join(this.outputDir, 'migration-report.json'),
      JSON.stringify(report, null, 2)
    );
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npm run migrate:from-taskmaster <input-file> [output-directory]');
    console.log('');
    console.log('Examples:');
    console.log('  npm run migrate:from-taskmaster ./taskmaster-data.json');
    console.log('  npm run migrate:from-taskmaster ./taskmaster-data.json ./migrated-data');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputDir = args[1] || './data';

  const migrator = new TaskMasterMigrator(inputFile, outputDir);
  await migrator.migrate();
}

// Run migration if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { TaskMasterMigrator };
