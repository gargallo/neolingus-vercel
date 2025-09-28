/**
 * Vercel AI Agent Client SDK
 * 
 * Client SDK for interacting with Vercel AI Agents following official patterns
 * Based on: https://vercel.com/docs/agents#creating-an-agent
 */

export interface AgentResponse {
  success: boolean;
  agentId: string;
  sessionId?: string;
  response: string;
  analysis: {
    steps: number;
    toolsUsed: string[];
    processingTimeMs: number;
    tokensUsed: number;
    estimatedCost: string;
  };
  metadata: {
    agent: {
      name: string;
      type: string;
      language: string;
      level: string;
    };
    model: string;
    timestamp: string;
    version: number;
  };
}

export interface AgentTestResponse {
  success: boolean;
  agentId: string;
  agentName: string;
  input: string;
  output: string;
  processingTime: number;
  tokensUsed: number;
  confidenceScore: number;
  steps: number;
  toolResults: Array<{
    toolName?: string;
    result?: any;
  }>;
  metadata: {
    model: string;
    language: string;
    level: string;
    type: string;
    timestamp: string;
  };
}

export interface AgentInvokeOptions {
  input: string;
  context?: {
    region?: string;
    situation?: 'formal' | 'informal' | 'academic' | 'business' | 'social';
    audience?: string;
  };
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
  sessionId?: string;
}

export interface AgentTestOptions {
  inputText: string;
  testType?: string;
  expectedOutput?: string;
  sessionId?: string;
  context?: {
    language: string;
    level: string;
    type: string;
  };
}

/**
 * Vercel AI Agent Client
 * 
 * Official SDK for interacting with Vercel AI Agents
 */
export class VercelAgentClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(baseUrl = '/api/admin/agents', headers: HeadersInit = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
  }

  /**
   * Invoke an AI agent for production use
   * 
   * @param agentId - The ID of the agent to invoke
   * @param options - Invocation options including input text and context
   * @returns Promise<AgentResponse>
   */
  async invoke(agentId: string, options: AgentInvokeOptions): Promise<AgentResponse> {
    const response = await fetch(`${this.baseUrl}/${agentId}/invoke`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error(`Agent invocation failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Test an AI agent during development
   * 
   * @param agentId - The ID of the agent to test
   * @param options - Test options including input text and expected output
   * @returns Promise<AgentTestResponse>
   */
  async test(agentId: string, options: AgentTestOptions): Promise<AgentTestResponse> {
    const response = await fetch(`${this.baseUrl}/${agentId}/test`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error(`Agent test failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get agent information
   * 
   * @param agentId - The ID of the agent
   * @returns Promise with agent details
   */
  async getAgent(agentId: string) {
    const response = await fetch(`${this.baseUrl}/${agentId}`, {
      method: 'GET',
      headers: this.defaultHeaders
    });

    if (!response.ok) {
      throw new Error(`Failed to get agent: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List all available agents
   * 
   * @returns Promise with array of agents
   */
  async listAgents() {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: this.defaultHeaders
    });

    if (!response.ok) {
      throw new Error(`Failed to list agents: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * React hook for using Vercel AI Agents
 */
export function useAgent(agentId?: string) {
  const client = new VercelAgentClient();

  const invoke = async (input: string, context?: AgentInvokeOptions['context']) => {
    if (!agentId) throw new Error('Agent ID is required');
    return client.invoke(agentId, { input, context });
  };

  const test = async (inputText: string, options?: Omit<AgentTestOptions, 'inputText'>) => {
    if (!agentId) throw new Error('Agent ID is required');
    return client.test(agentId, { inputText, ...options });
  };

  const getAgent = async () => {
    if (!agentId) throw new Error('Agent ID is required');
    return client.getAgent(agentId);
  };

  return {
    invoke,
    test,
    getAgent,
    client
  };
}

/**
 * Example Usage:
 * 
 * // Basic invocation
 * const client = new VercelAgentClient();
 * const response = await client.invoke('agent-id', {
 *   input: 'Hello, can you help me improve this text?',
 *   context: {
 *     situation: 'formal',
 *     audience: 'academic'
 *   }
 * });
 * 
 * // Using React hook
 * const { invoke, test } = useAgent('agent-id');
 * const result = await invoke('Your text here');
 * 
 * // Testing during development
 * const testResult = await test('Sample text', {
 *   testType: 'writing',
 *   expectedOutput: 'Expected correction'
 * });
 */

// Default export for convenience
export default VercelAgentClient;