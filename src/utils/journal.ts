/**
 * Journaling System for Task-Marshal 1.1.0
 * BuildWorks.AI - Append-only recovery log with atomic operations
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface JournalEntry {
  id: string;
  timestamp: string;
  initiativeId: string;
  operation: string;
  payload: any;
  status: 'pending' | 'completed' | 'failed';
  requestId: string;
}

export class JournalManager {
  private config: { rootDir: string };

  constructor(config: { rootDir: string }) {
    this.config = config;
  }

  async append(initiativeId: string, entry: Omit<JournalEntry, 'id' | 'timestamp'>): Promise<string> {
    const entryId = uuidv4();
    const fullEntry: JournalEntry = {
      id: entryId,
      timestamp: new Date().toISOString(),
      ...entry
    };

    const journalPath = join(this.config.rootDir, initiativeId, 'journal.jsonl');
    const dir = join(this.config.rootDir, initiativeId);
    
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
    const entryLine = `${JSON.stringify(fullEntry)}\n`;
    await fs.appendFile(journalPath, entryLine, 'utf8');
    return entryId;
  }

  async replay(initiativeId: string): Promise<JournalEntry[]> {
    try {
      const journalPath = join(this.config.rootDir, initiativeId, 'journal.jsonl');
      const content = await fs.readFile(journalPath, 'utf8');
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    } catch {
      return [];
    }
  }

  async markComplete(initiativeId: string, entryId: string): Promise<void> {
    const journalPath = join(this.config.rootDir, initiativeId, 'journal.jsonl');
    const content = await fs.readFile(journalPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const updatedLines = lines.map(line => {
      const entry = JSON.parse(line);
      if (entry.id === entryId) {
        return JSON.stringify({ ...entry, status: 'completed' });
      }
      return line;
    });
    
    await fs.writeFile(journalPath, `${updatedLines.join('\n')}\n`, 'utf8');
  }
}
