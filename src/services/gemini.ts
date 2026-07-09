import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const hasApiKey = apiKey && !apiKey.includes('Placeholder') && apiKey.length > 10;

// Initialize Gemini if key is provided
let genAI: GoogleGenerativeAI | null = null;
if (hasApiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export interface AskAiResponse {
  answer: string;
  referencedPages: number[];
  confidence: number;
}

export const askGemini = async (
  query: string,
  contextText: string,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<AskAiResponse> => {
  if (!genAI) {
    // Return mock intelligence response based on keywords
    return simulateResponse(query, difficulty);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `
      You are an elite Engineering Professor and Academic Tutor. 
      Your task is to answer the student's question based strictly on the provided textbook/lecture reference notes.
      Adhere to the requested academic difficulty:
      - 'easy': Explain concepts using simple terms, analogies, and clear steps.
      - 'medium': Provide formal definitions, standard technical equations, and conceptual structures.
      - 'hard': Provide rigorous mathematical proofs, code examples (if applicable), deep architectural trade-offs, and critical academic analysis.

      Reference Material:
      """
      ${contextText || "General Engineering Syllabus - Computer Science & Electrical Sciences"}
      """

      Student Question: "${query}"

      Return a response in JSON format matching this schema:
      {
        "answer": "Your detailed explanation using markdown. Include structured bullet points, equations, or code blocks if helpful.",
        "referencedPages": [1, 3], // Array of integers representing which page numbers the facts were sourced from
        "confidence": 0.95 // Number between 0 and 1 representing your confidence rating based on document coverage
      }
      Do not return any text other than the JSON block.
    `;

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();
    
    // Clean potential markdown wrap of JSON
    const cleanJsonText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJsonText) as AskAiResponse;
    return parsed;
  } catch (err) {
    console.error('Error calling Gemini API:', err);
    return simulateResponse(query, difficulty);
  }
};

const simulateResponse = (query: string, difficulty: string): Promise<AskAiResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let answer = '';
      let confidence = 0.85;
      let pages = [1, 2];

      const q = query.toLowerCase();
      if (q.includes('dijkstra')) {
        answer = `**Dijkstra's Algorithm** is a single-source shortest path algorithm for graphs with non-negative edge weights.
        
### Key Characteristics (Difficulty: ${difficulty}):
1. **Greedy Strategy:** It selects the vertex with the minimum distance at each step.
2. **Time Complexity:** $O(V^2)$ with adjacency matrix, or $O(E \\log V)$ using a min-priority queue (binary heap).
3. **Constraint:** Does not work for graphs with **negative edge weights** (Bellman-Ford is used instead).

### Algorithm Steps:
* Set distance to source vertex to $0$ and all other vertices to $\\infty$.
* Maintain a set of visited vertices.
* While there are unvisited vertices:
  * Select the vertex $u$ with the minimum distance.
  * For each neighbor $v$ of $u$, update the distance if $dist(u) + weight(u, v) < dist(v)$.`;
        pages = [12, 13];
        confidence = 0.98;
      } else if (q.includes('tcp') || q.includes('udp')) {
        answer = `### Comparison of TCP and UDP protocols:
        
| Feature | Transmission Control Protocol (TCP) | User Datagram Protocol (UDP) |
|:---|:---|:---|
| **Connection** | Connection-oriented (three-way handshake) | Connectionless |
| **Reliability** | Guaranteed delivery (retransmits lost packets) | Best-effort (no delivery guarantee) |
| **Flow Control** | Yes (sliding window algorithm) | No |
| **Header Size** | 20-60 bytes | 8 bytes |

### Use Cases:
* **TCP:** HTTP/HTTPS, FTP, SMTP, SSH (where accuracy is vital).
* **UDP:** DNS, Video Streaming, VoIP, Online Gaming (where latency is critical).`;
        pages = [45, 47];
        confidence = 0.94;
      } else {
        answer = `### Explanation for: "${query}"

Here is the academic breakdown of your question under **${difficulty}** mode:
* **Definition:** This is a fundamental concept in engineering sciences.
* **Mechanism:** The system operates by processing inputs through a state-transition framework to generate stable outputs.
* **Important Considerations:**
  1. High efficiency is achieved by minimizing computational overhead.
  2. Redundancy configurations are recommended for fault tolerance.
  
*Note: This is running in Sandbox Simulation mode. Configure your \`VITE_GEMINI_API_KEY\` in the \`.env\` file to enable real Gemini responses.*`;
        pages = [2, 5];
        confidence = 0.88;
      }

      resolve({
        answer,
        referencedPages: pages,
        confidence,
      });
    }, 1500);
  });
};
