/**
 * AI Agent Client SDK
 * 
 * A client library for interacting with deployed AI agents
 */

export interface AgentInvokeOptions {
  streaming?: boolean;
  temperature?: number;
  maxTokens?: number;
  tools?: boolean;
  userId?: string;
  sessionId?: string;
}

export interface AgentResponse {
  success: boolean;
  output?: string;
  toolCalls?: any[];
  toolResults?: any[];
  usage?: {
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
  };
  metadata?: {
    agentId: string;
    agentName: string;
    model: string;
    provider: string;
    timestamp: string;
  };
  error?: string;
}

export class AIAgentClient {
  private baseUrl: string;
  private defaultOptions: AgentInvokeOptions;

  constructor(baseUrl?: string, defaultOptions?: AgentInvokeOptions) {
    this.baseUrl = baseUrl || '/api/admin/agents';
    this.defaultOptions = defaultOptions || {};
  }

  /**
   * Invoke an AI agent with a text input
   */
  async invoke(
    agentId: string, 
    input: string, 
    options?: AgentInvokeOptions
  ): Promise<AgentResponse | ReadableStream> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const { streaming = false } = mergedOptions;

    try {
      const response = await fetch(`${this.baseUrl}/${agentId}/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          ...mergedOptions
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
      }

      if (streaming && response.body) {
        return response.body;
      } else {
        return await response.json();
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Stream agent response with callback
   */
  async streamInvoke(
    agentId: string,
    input: string,
    onChunk: (chunk: string) => void,
    options?: AgentInvokeOptions
  ): Promise<void> {
    const mergedOptions = { ...this.defaultOptions, ...options, streaming: true };

    try {
      const response = await fetch(`${this.baseUrl}/${agentId}/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          ...mergedOptions
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch {
              // Handle non-JSON data
              if (data) onChunk(data);
            }
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Test an agent with sample input
   */
  async test(
    agentId: string,
    testType: string,
    inputText: string,
    options?: {
      streaming?: boolean;
      expectedOutput?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          testType,
          inputText,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (options?.streaming && response.body) {
        return response.body;
      } else {
        return await response.json();
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Deploy an agent
   */
  async deploy(agentId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${agentId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get agent configuration
   */
  async getAgent(agentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${agentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * List all available agents
   */
  async listAgents(): Promise<any[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing agents:', error);
      return [];
    }
  }
}

// Export a default client instance
export const agentClient = new AIAgentClient();

// React Hook for using agents
export function useAgent(agentId: string, options?: AgentInvokeOptions) {
  const client = new AIAgentClient(undefined, options);

  return {
    invoke: (input: string, overrideOptions?: AgentInvokeOptions) => 
      client.invoke(agentId, input, overrideOptions),
    
    streamInvoke: (input: string, onChunk: (chunk: string) => void, overrideOptions?: AgentInvokeOptions) =>
      client.streamInvoke(agentId, input, onChunk, overrideOptions),
    
    test: (testType: string, inputText: string, testOptions?: any) =>
      client.test(agentId, testType, inputText, testOptions),
    
    deploy: () => client.deploy(agentId),
    
    getConfig: () => client.getAgent(agentId)
  };
}