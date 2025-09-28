/**
 * Integrity Utilities for Task-Marshal 1.1.0
 * BuildWorks.AI - HMAC signing and verification
 */

import { createHash, createHmac } from 'crypto';
import { promises as fs } from 'fs';

export class IntegrityManager {
  private signingKey: string;

  constructor(signingKey: string) {
    this.signingKey = signingKey;
  }

  async signData(data: string): Promise<string> {
    const hash = createHash('sha256').update(data).digest('hex');
    return createHmac('sha256', this.signingKey).update(hash).digest('hex');
  }

  async verifySignature(data: string, signature: string): Promise<boolean> {
    const expected = await this.signData(data);
    return expected === signature;
  }

  async computeChecksum(data: string): Promise<string> {
    return createHash('sha256').update(data).digest('hex');
  }

  async verifyFileIntegrity(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const expectedSignature = await fs.readFile(`${filePath}.sig`, 'utf8');
      return await this.verifySignature(content, expectedSignature);
    } catch {
      return false;
    }
  }
}
