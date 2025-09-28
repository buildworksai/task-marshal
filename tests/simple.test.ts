import { describe, it, expect } from '@jest/globals';
import { TaskMarshalConfig } from '../src/types/index';

describe('Simple Test', () => {
  it('should import types correctly', () => {
    const config: TaskMarshalConfig = {
      server: {
        port: 3000,
        host: 'localhost'
      },
      logging: {
        level: 'info'
      },
      security: {
        signingKey: 'test-key'
      }
    };
    expect(config.server.port).toBe(3000);
  });
});
