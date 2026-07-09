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

export interface QuizQuestion {
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
}

export const generateQuizFromText = async (
  contextText: string,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<QuizQuestion[]> => {
  if (!genAI) {
    return [
      {
        question_text: 'What is the primary role of the CPU scheduler in an operating system?',
        options: [
          'To allocate physical memory to process threads.',
          'To select which process in the ready queue is allocated CPU time next.',
          'To manage secondary storage operations.',
          'To initialize bios boot sequences.'
        ],
        correct_option_index: 1,
        explanation: 'The CPU scheduler selects from among the processes in memory that are ready to execute and allocates the CPU to one of them.'
      },
      {
        question_text: 'Which data structure follows a First-In-First-Out (FIFO) pattern?',
        options: ['Stack', 'Queue', 'Heap', 'Hash Table'],
        correct_option_index: 1,
        explanation: 'A queue is a linear structure that follows the FIFO principle where elements are inserted at the back and removed from the front.'
      }
    ];
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an expert academic evaluator.
      Your task is to generate 5 high-quality multiple choice questions (MCQs) based strictly on the provided reference material.
      Adhere to the requested academic difficulty: '${difficulty}'.

      Reference Material:
      """
      ${contextText}
      """

      Return a response in JSON format matching this schema:
      [
        {
          "question_text": "A clear, challenging question.",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_option_index": 0,
          "explanation": "Provide a detailed explanation of why the correct option is right."
        }
      ]
      Do not return any other text than the JSON block.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJsonText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJsonText) as QuizQuestion[];
    return parsed;
  } catch (err) {
    console.error('Error generating quiz from Gemini:', err);
    throw err;
  }
};

export interface GeneratedFlashcard {
  question: string;
  answer: string;
  topic: string;
}

export const generateFlashcardsFromText = async (
  contextText: string
): Promise<GeneratedFlashcard[]> => {
  if (!genAI) {
    return [
      {
        question: 'Explain Virtual Memory',
        answer: 'Virtual memory is a storage allocation scheme in which secondary memory can be addressed as though it were part of main memory.',
        topic: 'Operating Systems'
      },
      {
        question: 'What is a Red-Black Tree?',
        answer: 'A Red-Black Tree is a self-balancing binary search tree where each node has a color attribute (red or black) to ensure logarithmic height.',
        topic: 'Data Structures'
      }
    ];
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are a premium academic tutor.
      Your task is to generate 5 high-quality flashcards for active recall study based strictly on the provided reference material.

      Reference Material:
      """
      ${contextText}
      """

      Return a response in JSON format matching this schema:
      [
        {
          "question": "A concise active recall question.",
          "answer": "A clear, detailed explanation or answer.",
          "topic": "The specific topic or concept heading."
        }
      ]
      Do not return any other text than the JSON block.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJsonText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJsonText) as GeneratedFlashcard[];
    return parsed;
  } catch (err) {
    console.error('Error generating flashcards from Gemini:', err);
    throw err;
  }
};

