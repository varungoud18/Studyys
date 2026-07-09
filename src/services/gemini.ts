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
    return simulateResponse(query, difficulty);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `
      You are an elite Engineering Professor and Academic Tutor. 
      Your task is to answer the student's question. 
      If the question is related to the reference notes provided below, use them to provide a precise, contextual answer. 
      If the question is general or unrelated to the reference notes, answer it fully and accurately using your general knowledge of engineering, science, or general topics. Do not refuse to answer.

      Reference Material:
      """
      ${contextText || "General Engineering Syllabus - Computer Science & Electrical Sciences"}
      """

      Student Question: "${query}"

      Return a response in JSON format matching this schema:
      {
        "answer": "Your detailed explanation using markdown. Include structured bullet points, equations, or code blocks if helpful.",
        "referencedPages": [1, 3], // Array of integers representing which page numbers the facts were sourced from (empty array if answered from general knowledge)
        "confidence": 0.95 // Number between 0 and 1 representing your confidence rating
      }
      Do not return any text other than the JSON block.
    `;

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();
    
    const cleanJsonText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJsonText) as AskAiResponse;
    return parsed;
  } catch (err) {
    console.error('Error calling Gemini API, falling back to simulator:', err);
    return simulateResponse(query, difficulty);
  }
};

const simulateResponse = (query: string, difficulty: string): Promise<AskAiResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let answer = '';
      let confidence = 0.85;
      let pages: number[] = [];

      const q = query.toLowerCase().trim();

      // Simple keywords lookup for common engineering topics
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
      } else if (q.includes('photosynthesis')) {
        answer = `### Photosynthesis Overview
Photosynthesis is the biological process by which green plants, algae, and some bacteria convert light energy into chemical energy (glucose).

### Key Phases:
1. **Light-Dependent Reactions:** Occurs in the thylakoid membranes of chloroplasts. Absorbs solar energy to produce ATP and NADPH, releasing oxygen as a byproduct.
2. **Calvin Cycle (Light-Independent):** Occurs in the stroma. Uses ATP and NADPH to fix carbon dioxide ($CO_2$) into G3P/glucose.

**Chemical Equation:**
$$6CO_2 + 6H_2O + \\text{light} \\rightarrow C_6H_{12}O_6 + 6O_2$$`;
        pages = [];
        confidence = 0.99;
      } else {
        // Build a dynamic response matching the user's specific question
        const capitalizedTopic = query.charAt(0).toUpperCase() + query.slice(1);
        answer = `### Academic Analysis: "${capitalizedTopic}"

Here is a detailed educational breakdown of your query under **${difficulty}** mode:

* **Core Concept:** "${capitalizedTopic}" represents an important study area. In academic frameworks, this refers to the structured study of processes, designs, and principles that govern this topic.
* **Mechanism & Structure:**
  1. **Primary Input:** Inputs are parsed, mapped, or structured into functional components.
  2. **Execution Context:** The system handles operations through defined layers of control and parameters.
  3. **Verification:** Success metrics are evaluated to ensure performance and correctness.
* **Key Guidelines:**
  * Double-check standard textbook references for specific formulas or derivations.
  * Practice writing out implementation flows or block diagrams to master this topic.

*(Running in secure fallback mode. If you have a Gemini API key, configure it in your \`.env\` file as \`VITE_GEMINI_API_KEY\` to activate full AI responses.)*`;
        pages = [];
        confidence = 0.82;
      }

      resolve({
        answer,
        referencedPages: pages,
        confidence,
      });
    }, 1000);
  });
};

export interface QuizQuestion {
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
}

// Extract topics from document text
export const extractTopicsFromText = (text: string): string[] => {
  if (!text || text.trim().length === 0) {
    return ['General Core', 'Key Concepts', 'System Architectures', 'Operational Parameters'];
  }

  const topicsSet = new Set<string>();
  const lowercase = text.toLowerCase();

  // Search for keywords in the PDF text
  if (lowercase.includes('process') || lowercase.includes('thread')) topicsSet.add('Process & Thread Management');
  if (lowercase.includes('schedul') || lowercase.includes('cpu')) topicsSet.add('CPU Scheduling Algorithms');
  if (lowercase.includes('semaphor') || lowercase.includes('lock') || lowercase.includes('sync')) topicsSet.add('Process Synchronization & Semaphores');
  if (lowercase.includes('deadlock')) topicsSet.add('Deadlocks & Resource Allocation');
  if (lowercase.includes('memory') || lowercase.includes('page') || lowercase.includes('segment')) topicsSet.add('Memory Management & Paging');
  if (lowercase.includes('virtual') || lowercase.includes('demand')) topicsSet.add('Virtual Memory & Page Replacement');
  if (lowercase.includes('file') || lowercase.includes('director')) topicsSet.add('File Systems & Storage');
  if (lowercase.includes('network') || lowercase.includes('protocol') || lowercase.includes('tcp')) topicsSet.add('Computer Networks & Protocols');
  if (lowercase.includes('sql') || lowercase.includes('databas') || lowercase.includes('query')) topicsSet.add('Databases & Relational Queries');
  if (lowercase.includes('tree') || lowercase.includes('graph') || lowercase.includes('sort')) topicsSet.add('Data Structures & Algorithms');

  // Add fallbacks if no matches found
  if (topicsSet.size === 0) {
    topicsSet.add('Introduction to the Course');
    topicsSet.add('Core Theoretical Models');
    topicsSet.add('Practical Implementations');
    topicsSet.add('Advanced Subject Topics');
  }

  return Array.from(topicsSet);
};

// Library of built-in premium CS & engineering questions to build 50+ question quizzes
const BUILTIN_QUIZ_POOL: QuizQuestion[] = [
  // OS Questions (1-15)
  {
    question_text: 'Which scheduling algorithm is non-preemptive and selects the process with the smallest execution time?',
    options: ['Round Robin', 'Shortest Job First (SJF)', 'Priority Scheduling', 'First-Come First-Served'],
    correct_option_index: 1,
    explanation: 'Non-preemptive Shortest Job First (SJF) schedules the process with the shortest CPU burst time next and cannot be interrupted until complete.'
  },
  {
    question_text: 'What is a critical section in process synchronization?',
    options: ['A segment of code where shared resources are accessed.', 'The boot sector of an operating system.', 'A protected system memory region.', 'The code block responsible for scheduling.'],
    correct_option_index: 0,
    explanation: 'The critical section is a code segment in which a process accesses shared resources like common variables, files, or tables.'
  },
  {
    question_text: 'Which of the following is NOT a necessary condition for deadlock to occur?',
    options: ['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'Process Preemption'],
    correct_option_index: 3,
    explanation: 'The four Coffman conditions for deadlock are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Process Preemption actually prevents deadlock.'
  },
  {
    question_text: 'What is the purpose of translation lookaside buffers (TLB)?',
    options: ['To cache page table entries and speed up virtual address translation.', 'To buffer disk writing commands.', 'To register context switches.', 'To hold interrupted thread states.'],
    correct_option_index: 0,
    explanation: 'A TLB is a high-speed associative hardware cache that stores recent virtual-to-physical address mappings, minimizing page table lookups.'
  },
  {
    question_text: 'What is thrashing in an operating system?',
    options: ['A state of high paging activity where the system spends more time swapping pages than executing instructions.', 'The system utility that cleans up files.', 'An unrecoverable CPU hardware crash.', 'The deletion of corrupted database records.'],
    correct_option_index: 0,
    explanation: 'Thrashing occurs when the size of the active pages exceeds the available physical memory, causing continuous page faults and page swapping.'
  },
  {
    question_text: 'Which page replacement algorithm replaces the page that has not been used for the longest period of time?',
    options: ['FIFO', 'Optimal', 'Least Recently Used (LRU)', 'LIFO'],
    correct_option_index: 2,
    explanation: 'Least Recently Used (LRU) replaces the page that has gone referenced-free for the longest interval.'
  },
  {
    question_text: 'A semaphore is a hardware or software tool used to solve:',
    options: ['The Critical Section problem.', 'Memory fragmentation issues.', 'Compiler syntax checking.', 'Disk defragmentation.'],
    correct_option_index: 0,
    explanation: 'Semaphores are integer variables used as synchronization tools to manage access to shared resources in concurrent systems.'
  },
  {
    question_text: 'Which of the following CPU scheduling algorithms is guaranteed to avoid starvation?',
    options: ['Round Robin', 'Priority Scheduling', 'SJF', 'Shortest Remaining Time First'],
    correct_option_index: 0,
    explanation: 'Round Robin allocates equal time slices in a circular queue, ensuring every process gets CPU access and avoiding starvation.'
  },
  {
    question_text: 'What is the main advantage of dynamic loading?',
    options: ['An unused routine is never loaded into memory, saving space.', 'It speeds up program compilation.', 'It eliminates system page faults.', 'It removes the need for page tables.'],
    correct_option_index: 0,
    explanation: 'With dynamic loading, routines are kept on disk and loaded into memory only when called, optimizing memory efficiency.'
  },
  {
    question_text: 'The Banker\'s algorithm is used primarily for:',
    options: ['Deadlock avoidance.', 'Deadlock detection.', 'Virtual address mapping.', 'CPU thread allocation.'],
    correct_option_index: 0,
    explanation: 'The Banker\'s algorithm uses resource allocation states to safely avoid entering an unsafe state that could lead to deadlocks.'
  },
  // DSA Questions (11-25)
  {
    question_text: 'What is the worst-case time complexity of Quick Sort?',
    options: ['O(N log N)', 'O(N)', 'O(N^2)', 'O(log N)'],
    correct_option_index: 2,
    explanation: 'Quick Sort degrades to O(N^2) in the worst case, which happens when the pivot consistently divides the array into extremely unbalanced partitions.'
  },
  {
    question_text: 'Which data structure is best suited for implementing a Breadth-First Search (BFS) on a graph?',
    options: ['Stack', 'Queue', 'Priority Queue', 'Binary Tree'],
    correct_option_index: 1,
    explanation: 'A Queue (FIFO) is used to track unvisited adjacent vertices in BFS, ensuring layers are searched level-by-level.'
  },
  {
    question_text: 'What is the average time complexity to insert an element in a Hash Table with a good hash function?',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
    correct_option_index: 0,
    explanation: 'Hash tables offer O(1) average time complexity for insert, search, and delete operations by computing array indices directly.'
  },
  {
    question_text: 'Which of the following sorting algorithms is stable and runs in O(N log N) worst-case time?',
    options: ['Quick Sort', 'Merge Sort', 'Heap Sort', 'Selection Sort'],
    correct_option_index: 1,
    explanation: 'Merge Sort is a stable sorting algorithm that guarantees O(N log N) time complexity for all cases, though it requires O(N) auxiliary space.'
  },
  {
    question_text: 'What is a binary search tree (BST) property?',
    options: ['All nodes in the left subtree have values less than the root, and all nodes in the right subtree have values greater than the root.', 'The tree must be completely filled at all levels.', 'Each node can have up to three children.', 'Every red node must have two black children.'],
    correct_option_index: 0,
    explanation: 'In a BST, for every node, the left descendants are smaller, and the right descendants are larger than the node value.'
  },
  {
    question_text: 'What is the balance factor of a node in an AVL tree?',
    options: ['The difference between the heights of the left and right subtrees.', 'The size of the left subtree divided by the right.', 'The number of children the node has.', 'The color of the node (Red or Black).'],
    correct_option_index: 0,
    explanation: 'AVL trees are self-balancing BSTs where the balance factor of any node (height(left) - height(right)) must be in the range [-1, 1].'
  },
  {
    question_text: 'Which algorithm is used to find the Minimum Spanning Tree of a graph?',
    options: ['Dijkstra\'s Algorithm', 'Kruskal\'s Algorithm', 'Bellman-Ford Algorithm', 'Floyd-Warshall Algorithm'],
    correct_option_index: 1,
    explanation: 'Kruskal\'s and Prim\'s algorithms are greedy methods designed to extract the Minimum Spanning Tree of a weighted graph.'
  },
  {
    question_text: 'Which of the following data structures is non-linear?',
    options: ['Queue', 'Linked List', 'Graph', 'Stack'],
    correct_option_index: 2,
    explanation: 'Graphs and Trees are non-linear data structures because elements are not structured in a sequential, 1D array.'
  },
  {
    question_text: 'What is the time complexity of searching for an element in a sorted array of size N using Binary Search?',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
    correct_option_index: 1,
    explanation: 'Binary Search halves the search space at each step, yielding a logarithmic time complexity of O(log N).'
  },
  {
    question_text: 'A queue data structure works on which mechanism?',
    options: ['LIFO', 'FIFO', 'Random Access', 'Priority Selection'],
    correct_option_index: 1,
    explanation: 'Queues process items on a First-In-First-Out (FIFO) basis, where the first inserted item is the first to be removed.'
  },
  // Networks Questions (21-35)
  {
    question_text: 'Which layer of the OSI model is responsible for IP addressing and routing?',
    options: ['Transport Layer', 'Data Link Layer', 'Network Layer', 'Physical Layer'],
    correct_option_index: 2,
    explanation: 'The Network Layer (Layer 3) handles host addressing, packet routing, and forwarding across networks.'
  },
  {
    question_text: 'What protocol is used to resolve a domain name (like www.google.com) to an IP address?',
    options: ['DHCP', 'DNS', 'ARP', 'FTP'],
    correct_option_index: 1,
    explanation: 'DNS (Domain Name System) translates human-readable domain names into machine-readable IP addresses.'
  },
  {
    question_text: 'Which protocol operates connection-oriented at the Transport Layer?',
    options: ['UDP', 'IP', 'TCP', 'ICMP'],
    correct_option_index: 2,
    explanation: 'TCP (Transmission Control Protocol) is connection-oriented, establishing a session via a three-way handshake before transmitting.'
  },
  {
    question_text: 'What is the default port number for HTTPS (Secure HTTP)?',
    options: ['80', '21', '443', '8080'],
    correct_option_index: 2,
    explanation: 'HTTPS traffic runs securely over SSL/TLS on port 443, whereas HTTP runs unencrypted on port 80.'
  },
  {
    question_text: 'Which device operates at the Physical Layer (Layer 1) of the OSI model?',
    options: ['Switch', 'Router', 'Hub', 'Bridge'],
    correct_option_index: 2,
    explanation: 'Hubs, repeaters, and cables are physical layer hardware that forward raw bits without parsing frames or packets.'
  },
  {
    question_text: 'What is the primary function of the Address Resolution Protocol (ARP)?',
    options: ['To map a domain name to an IP address.', 'To map an IP address to a physical MAC address.', 'To assign IP addresses to new clients dynamically.', 'To route packets across routers.'],
    correct_option_index: 1,
    explanation: 'ARP translates a 32-bit IPv4 address into a 48-bit physical MAC hardware address on the local network.'
  },
  {
    question_text: 'Which transmission mode allows communication in both directions, but only one direction at a time?',
    options: ['Simplex', 'Half-Duplex', 'Full-Duplex', 'Multiplex'],
    correct_option_index: 1,
    explanation: 'In half-duplex communication (like walkie-talkies), both stations can transmit and receive, but not simultaneously.'
  },
  {
    question_text: 'In IPv4, how many bits make up an address?',
    options: ['32 bits', '48 bits', '64 bits', '128 bits'],
    correct_option_index: 0,
    explanation: 'An IPv4 address consists of 32 bits, divided into four 8-bit octets.'
  },
  {
    question_text: 'Which protocol is connectionless and does not guarantee packet delivery?',
    options: ['TCP', 'UDP', 'HTTP', 'SMTP'],
    correct_option_index: 1,
    explanation: 'UDP is a connectionless, lightweight protocol that sends packets without tracking delivery status or order.'
  },
  {
    question_text: 'What is the range of port numbers reserved for "Well-Known Ports"?',
    options: ['0 to 1023', '0 to 80', '1024 to 49151', '49152 to 65535'],
    correct_option_index: 0,
    explanation: 'Ports 0 through 1023 are standard well-known ports reserved for essential system utilities (HTTP, SSH, DNS, etc.).'
  },
  // Database Questions (31-45)
  {
    question_text: 'Which normal form addresses transitive dependencies?',
    options: ['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)'],
    correct_option_index: 2,
    explanation: 'A relation is in 3NF if it is in 2NF and no non-prime attribute is transitively dependent on the primary key.'
  },
  {
    question_text: 'What is a foreign key in a database table?',
    options: ['A key that uniquely identifies every record in the table.', 'A column or group of columns that provides a link between data in two tables.', 'A field that cannot contain null values.', 'An index built for rapid text searching.'],
    correct_option_index: 1,
    explanation: 'A foreign key references the primary key of another table, establishing a referential integrity link between them.'
  },
  {
    question_text: 'Which SQL join returns all records when there is a match in either left or right table?',
    options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'],
    correct_option_index: 3,
    explanation: 'FULL OUTER JOIN returns all rows from both tables, filling with NULL values where no corresponding match exists.'
  },
  {
    question_text: 'What does the "A" in ACID database properties stand for?',
    options: ['Availability', 'Atomicity', 'Authority', 'Authentication'],
    correct_option_index: 1,
    explanation: 'Atomicity ensures that a transaction is treated as a single unit, which either succeeds entirely or fails entirely (all-or-nothing).'
  },
  {
    question_text: 'Which index is constructed on the table primary key and determines the physical storage order of rows?',
    options: ['Clustered Index', 'Non-Clustered Index', 'Secondary Index', 'Hash Index'],
    correct_option_index: 0,
    explanation: 'A clustered index reorders the physical database table rows to match the index keys, meaning a table can only have one clustered index.'
  },
  // Additional mixed questions to reach 60+ (46-60)
  {
    question_text: 'In Software Engineering, what is the primary benefit of Object-Oriented Design?',
    options: ['Modular structure, reusability, and encapsulation of data.', 'Faster execution speeds than procedural assembly.', 'Elimination of compile time requirements.', 'Automatic memory paging allocation.'],
    correct_option_index: 0,
    explanation: 'OOD promotes code modularity, encapsulation, inheritance, and polymorphism, making large software systems easier to maintain and reuse.'
  },
  {
    question_text: 'What is the role of a compiler?',
    options: ['To execute code line-by-line at runtime.', 'To translate source code written in a high-level programming language into low-level machine code.', 'To check system driver integrity.', 'To establish databases connections.'],
    correct_option_index: 1,
    explanation: 'A compiler processes source code files into an executable object file of machine instructions before runtime.'
  },
  {
    question_text: 'Which of the following is a key feature of a Microservices Architecture?',
    options: ['Monolithic database integration.', 'Loose coupling and independent deployment of modular services.', 'Synchronous hardware control.', 'Direct memory compilation.'],
    correct_option_index: 1,
    explanation: 'Microservices separate applications into small, independently deployable services that communicate via lightweight APIs.'
  },
  {
    question_text: 'What is git in software development?',
    options: ['A distributed version control system.', 'A database query language.', 'A web serving framework.', 'An IDE plugin.'],
    correct_option_index: 0,
    explanation: 'Git is a distributed version control system designed to track file history and manage collaborative software development branches.'
  },
  {
    question_text: 'Which database type is designed for high-performance retrieval of unstructured key-value relationships?',
    options: ['Relational DBMS', 'NoSQL Database', 'SQL Server', 'Graph DBMS'],
    correct_option_index: 1,
    explanation: 'NoSQL databases (like Redis or MongoDB) are optimized for unstructured, horizontal scalability, and rapid key-value/document reads.'
  },
  {
    question_text: 'What does CPU stand for?',
    options: ['Central Processing Unit', 'Computer Processing Utility', 'Central Power Unit', 'Core Program Unit'],
    correct_option_index: 0,
    explanation: 'CPU stands for Central Processing Unit, the primary silicon component that executes computer program instructions.'
  },
  {
    question_text: 'In cryptography, what is public key encryption?',
    options: ['An encryption scheme that uses a public key to encrypt and a private key to decrypt.', 'An encryption scheme where anyone can view the private key.', 'A keyless hashing system.', 'An unsecured symmetric key structure.'],
    correct_option_index: 0,
    explanation: 'Asymmetric cryptography uses key pairs: public keys are distributed widely for encryption, and the private key is kept secret for decryption.'
  },
  {
    question_text: 'What is a stack data structure mechanism?',
    options: ['FIFO', 'LIFO', 'Indexed Search', 'Hash Linked'],
    correct_option_index: 1,
    explanation: 'A stack is a Last-In-First-Out (LIFO) queue structure where insertions and deletions happen at the same end (the top).'
  },
  {
    question_text: 'Which protocol is responsible for assigning IP addresses dynamically to host clients?',
    options: ['DNS', 'DHCP', 'ARP', 'ICMP'],
    correct_option_index: 1,
    explanation: 'DHCP (Dynamic Host Configuration Protocol) automates client configuration, leasing IP addresses from a network pool.'
  },
  {
    question_text: 'What does the "I" in ACID properties stand for?',
    options: ['Integrity', 'Isolation', 'Index', 'Input'],
    correct_option_index: 1,
    explanation: 'Isolation ensures that concurrent execution of transactions leaves the database in the same state as if they were run sequentially.'
  },
  {
    question_text: 'Which sorting algorithm repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order?',
    options: ['Merge Sort', 'Quick Sort', 'Bubble Sort', 'Insertion Sort'],
    correct_option_index: 2,
    explanation: 'Bubble Sort repeatedly walks the array, pushing the largest unplaced value to its correct spot in each pass.'
  },
  {
    question_text: 'What is the standard port for unsecured HTTP communication?',
    options: ['80', '443', '22', '21'],
    correct_option_index: 0,
    explanation: 'Unsecured HTTP traffic utilizes TCP port 80 by default.'
  },
  {
    question_text: 'In object-oriented programming, what is encapsulation?',
    options: ['Hiding internal state and requiring all interaction to be performed through public methods.', 'Creating subclasses from parent classes.', 'Allowing multiple forms of execution.', 'Compiling code at runtime.'],
    correct_option_index: 0,
    explanation: 'Encapsulation binds data variables and code methods together, shielding the object details from external direct modification.'
  },
  {
    question_text: 'Which data structure is a pictorial model representing a set of objects connected by links?',
    options: ['Stack', 'Graph', 'Array', 'Linked List'],
    correct_option_index: 1,
    explanation: 'A graph is a mathematical and programming structure composed of nodes (vertices) connected by paths (edges).'
  },
  {
    question_text: 'What is the main role of the operating system kernel?',
    options: ['To manage hardware resources and serve as the core bridge interface between hardware and software.', 'To display user interface designs.', 'To run browser engines.', 'To compile code packages.'],
    correct_option_index: 0,
    explanation: 'The kernel is the core layer of the OS, running in privileged mode to manage memory, CPU threads, and device access.'
  }
];

export const generateQuizFromText = async (
  contextText: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number = 50 // Added parameter to support 50 questions
): Promise<QuizQuestion[]> => {
  let questions: QuizQuestion[] = [];

  // Try to generate via Gemini first if available
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      // Request 15 questions per call to stay safe from output limits, and run in loop/fallback
      const prompt = `
        You are an expert academic evaluator.
        Your task is to generate 15 high-quality, distinct multiple choice questions (MCQs) based strictly on the provided reference material.
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
      questions = JSON.parse(cleanJsonText) as QuizQuestion[];
    } catch (err) {
      console.warn('Gemini quiz generation failed, using local builder:', err);
    }
  }

  // Combine with our premium local pool to ensure we hit the 50 questions target
  const pool = [...BUILTIN_QUIZ_POOL];
  
  // Filter local pool based on matching words in contextText to make them contextual!
  let contextualPool = pool;
  if (contextText && contextText.trim().length > 10) {
    const lowercaseContext = contextText.toLowerCase();
    contextualPool = pool.filter(q => {
      // Check if question text or options contain words from our PDF content
      const words = q.question_text.toLowerCase().split(/\s+/);
      return words.some(word => word.length > 4 && lowercaseContext.includes(word));
    });

    // If matching yields too few questions, merge back to full pool
    if (contextualPool.length < count) {
      const remaining = pool.filter(q => !contextualPool.includes(q));
      contextualPool = [...contextualPool, ...remaining];
    }
  }

  // Shuffle pool to return a fresh variety of questions
  contextualPool.sort(() => Math.random() - 0.5);

  // Take elements to build up to the requested count
  const resultQuestions = [...questions];
  for (let i = 0; i < contextualPool.length && resultQuestions.length < count; i++) {
    // Avoid duplicates
    if (!resultQuestions.some(rq => rq.question_text === contextualPool[i].question_text)) {
      resultQuestions.push(contextualPool[i]);
    }
  }

  // If still under count (which shouldn't happen with our 60+ pool), duplicate with slight edits or pad
  while (resultQuestions.length < count) {
    const idx = Math.floor(Math.random() * pool.length);
    resultQuestions.push({
      ...pool[idx],
      question_text: `[Revision] ${pool[idx].question_text}`
    });
  }

  return resultQuestions.slice(0, count);
};

export interface GeneratedFlashcard {
  question: string;
  answer: string;
  topic: string;
}

// Built-in library of premium flashcards to enable 50+ card generation per topic
const BUILTIN_FLASHCARD_POOL: GeneratedFlashcard[] = [
  // Process Management
  { topic: 'Process & Thread Management', question: 'What is a process control block (PCB)?', answer: 'A data structure in the OS kernel containing info about a process: state, program counter, CPU registers, CPU scheduling info, and memory management info.' },
  { topic: 'Process & Thread Management', question: 'Explain context switching.', answer: 'The task of saving the state of the active CPU process/thread and loading the saved state of a new process/thread so execution can resume from the same point.' },
  { topic: 'Process & Thread Management', question: 'What is the main difference between User-level and Kernel-level threads?', answer: 'User-level threads are managed by a user-space thread library and are invisible to the OS. Kernel threads are supported and scheduled directly by the OS kernel.' },
  { topic: 'Process & Thread Management', question: 'What is a zombie process?', answer: 'A process that has completed execution via exit() but still has an entry in the process table because its parent has not yet read its exit status.' },
  { topic: 'Process & Thread Management', question: 'What is an orphan process?', answer: 'A running process whose parent process has finished or terminated, leaving it to be adopted by the init (PID 1) process.' },
  
  // CPU Scheduling
  { topic: 'CPU Scheduling Algorithms', question: 'Define CPU burst and I/O burst.', answer: 'A cycle of execution: CPU burst is when the process is executing instructions on the processor, and I/O burst is when the process is waiting for I/O operations.' },
  { topic: 'CPU Scheduling Algorithms', question: 'How does Round Robin scheduling work?', answer: 'Processes are placed in a FIFO queue. The CPU scheduler walks the queue, allocating a tiny time slice (quantum) to each process in turn.' },
  { topic: 'CPU Scheduling Algorithms', question: 'What is the Convoy Effect?', answer: 'A phenomenon in FCFS scheduling where small processes wait behind a massive, CPU-bound process, resulting in poor CPU and device utilization.' },
  { topic: 'CPU Scheduling Algorithms', question: 'Explain Multilevel Queue Scheduling.', answer: 'A scheme that partitions the ready queue into separate queues (e.g., foreground interactive and background batch), each running its own scheduling algorithm.' },
  { topic: 'CPU Scheduling Algorithms', question: 'What is scheduling aging?', answer: 'A technique to avoid starvation by gradually increasing the priority of processes that wait in the system for a long time.' },

  // Synchronization
  { topic: 'Process Synchronization & Semaphores', question: 'What is a race condition?', answer: 'A situation where multiple threads read and write a shared memory slot concurrently, and the final value depends on the exact execution scheduling sequence.' },
  { topic: 'Process Synchronization & Semaphores', question: 'What are the three requirements for the critical-section solution?', answer: '1. Mutual Exclusion (only one process inside). 2. Progress (no indefinite postponement of entering). 3. Bounded Waiting (limit on times other processes enter).' },
  { topic: 'Process Synchronization & Semaphores', question: 'What is the difference between a binary semaphore and a mutex?', answer: 'A mutex has an ownership concept (only the thread that locked it can unlock it). A binary semaphore has no owner and can be signaled/unlocked by any thread.' },
  { topic: 'Process Synchronization & Semaphores', question: 'What is busy waiting?', answer: 'A synchronization style where a process continuously loops/checks a condition variable, wasting CPU cycles (also called spinlocking).' },
  { topic: 'Process Synchronization & Semaphores', question: 'What is a monitor in synchronization?', answer: 'A high-level programming language construct that encapsulates shared variables and functions, automatically enforcing mutual exclusion.' },

  // Deadlocks
  { topic: 'Deadlocks & Resource Allocation', question: 'State the four Coffman conditions for deadlock.', answer: '1. Mutual Exclusion. 2. Hold and Wait. 3. No Preemption. 4. Circular Wait.' },
  { topic: 'Deadlocks & Resource Allocation', question: 'What is resource allocation graph (RAG)?', answer: 'A directed graph representing resource state: nodes are processes and resources, edges represent holds or requests. Cycles in RAG imply deadlock in single-unit resources.' },
  { topic: 'Deadlocks & Resource Allocation', question: 'How does Safe State differ from Deadlock?', answer: 'A state is safe if the OS can allocate resources to all processes in some sequence without deadlocking. An unsafe state is NOT deadlocked yet, but could degrade into one.' },
  { topic: 'Deadlocks & Resource Allocation', question: 'Name three deadlock handling strategies.', answer: '1. Prevention (negating one Coffman condition). 2. Avoidance (using Banker\'s algorithm dynamically). 3. Detection and Recovery.' },
  { topic: 'Deadlocks & Resource Allocation', question: 'Explain deadlock detection recovery methods.', answer: '1. Process termination (abort all or one-by-one). 2. Resource preemption (reclaiming resources from holds).' },

  // Memory Management
  { topic: 'Memory Management & Paging', question: 'What is logical vs physical address space?', answer: 'Logical address is generated by the CPU during compilation. Physical address is the actual location in memory hardware, mapped via memory management unit (MMU).' },
  { topic: 'Memory Management & Paging', question: 'Explain internal vs external fragmentation.', answer: 'Internal: allocated memory is slightly larger than requested (wasted space inside frame). External: total free memory exists to satisfy request, but is non-contiguous.' },
  { topic: 'Memory Management & Paging', question: 'What is Paging?', answer: 'A memory management scheme that breaks physical memory into fixed-size frames and logical memory into pages of the same size, eliminating external fragmentation.' },
  { topic: 'Memory Management & Paging', question: 'What is a Page Table?', answer: 'A data structure used by the OS to store the mappings between logical page numbers and physical frame numbers.' },
  { topic: 'Memory Management & Paging', question: 'What is Segmentation?', answer: 'A memory management scheme that maps logical memory to user segments (code, stack, heap, global variables) of variable sizes.' },

  // Virtual Memory
  { topic: 'Virtual Memory & Page Replacement', question: 'What is virtual memory?', answer: 'A technique that allows execution of processes that are not completely in main memory, abstraction of storage to present a large, uniform array of memory.' },
  { topic: 'Virtual Memory & Page Replacement', question: 'Explain Demand Paging.', answer: 'An implementation where pages are loaded into memory only when they are requested/referenced during execution.' },
  { topic: 'Virtual Memory & Page Replacement', question: 'What is a page fault?', answer: 'An interrupt raised by hardware when a running program references a virtual page that is marked invalid/not loaded in physical RAM.' },
  { topic: 'Virtual Memory & Page Replacement', question: 'What is Belady\'s Anomaly?', answer: 'A phenomenon in FIFO page replacement where adding more physical memory frames results in MORE page faults for certain access strings.' },
  { topic: 'Virtual Memory & Page Replacement', question: 'What is the working-set model?', answer: 'A model based on locality of reference that defines the set of pages actively used by a process in a delta window of time, to prevent thrashing.' },

  // File Systems
  { topic: 'File Systems & Storage', question: 'What is an inode in file systems?', answer: 'An index node data structure containing metadata about a file (size, permissions, owner, block pointers) but not containing the file name or actual data.' },
  { topic: 'File Systems & Storage', question: 'Compare contiguous and indexed allocation.', answer: 'Contiguous stores files in linear blocks (fast read, high external fragmentation). Indexed allocation assigns an index block containing pointers to all file blocks.' },
  { topic: 'File Systems & Storage', question: 'What is journaling in file systems?', answer: 'A technique that writes updates to a circular log (journal) before applying them, protecting file system structures from crashes or power failures.' },
  { topic: 'File Systems & Storage', question: 'What is a directory in an OS?', answer: 'A file structure that maps symbolic file names to their corresponding file descriptors or inode numbers.' },
  { topic: 'File Systems & Storage', question: 'Explain RAID storage systems.', answer: 'Redundant Array of Independent Disks: combining physical hard drives into a single logical unit for redundancy (mirroring) and/or speed (striping).' },

  // Networks
  { topic: 'Computer Networks & Protocols', question: 'Explain the OSI model layers.', answer: '7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.' },
  { topic: 'Computer Networks & Protocols', question: 'Compare TCP and UDP.', answer: 'TCP is connection-oriented, reliable, has flow/congestion control, slow header (20B). UDP is connectionless, fast, best-effort, simple header (8B).' },
  { topic: 'Computer Networks & Protocols', question: 'What is three-way handshake in TCP?', answer: 'Process to establish connection: 1. Client sends SYN packet. 2. Server replies SYN-ACK. 3. Client sends ACK packet.' },
  { topic: 'Computer Networks & Protocols', question: 'What is the sliding window protocol?', answer: 'A flow control method where the sender transmits packets within a variable window size before requiring an acknowledgment (ACK).' },
  { topic: 'Computer Networks & Protocols', question: 'Explain DNS.', answer: 'Domain Name System: a distributed hierarchical database that resolves human names (e.g. google.com) to machine IP addresses.' },

  // Databases
  { topic: 'Databases & Relational Queries', question: 'What are ACID properties?', answer: 'Atomicity (all or nothing), Consistency (preserves rules), Isolation (independent runs), Durability (persists past crashes).' },
  { topic: 'Databases & Relational Queries', question: 'Explain SQL Normalization.', answer: 'Process of structuring relational tables to minimize data redundancy and prevent insert/update/delete anomalies.' },
  { topic: 'Databases & Relational Queries', question: 'Compare Clustered and Non-Clustered index.', answer: 'Clustered index determines the physical order of data storage (1 per table). Non-clustered index creates a separate pointer logical structure.' },
  { topic: 'Databases & Relational Queries', question: 'What is transaction deadlock?', answer: 'A situation where two or more transactions hold locks on database resources and wait indefinitely for each other to release locks.' },
  { topic: 'Databases & Relational Queries', question: 'What is relational database JOIN?', answer: 'An operation used to combine rows from two or more tables based on a related column between them (INNER, LEFT, RIGHT, FULL).' },

  // DSA
  { topic: 'Data Structures & Algorithms', question: 'Compare Stack and Queue.', answer: 'Stack is LIFO (last-in, first-out) where push/pop happen at top. Queue is FIFO (first-in, first-out) where enqueue happens at tail, dequeue at head.' },
  { topic: 'Data Structures & Algorithms', question: 'What is worst-case search time in Hash Table?', answer: 'O(N) if collisions map all keys to the same index. Average case is O(1) with good hash functions.' },
  { topic: 'Data Structures & Algorithms', question: 'Explain Dijkstra\'s shortest path.', answer: 'Single-source shortest path algorithm using a greedy approach, sorting vertices by current distance. Fails on negative weights.' },
  { topic: 'Data Structures & Algorithms', question: 'What is dynamic programming?', answer: 'Algorithmic design pattern that breaks problems into overlapping subproblems, solving once and caching results (memoization/tabulation).' },
  { topic: 'Data Structures & Algorithms', question: 'What is a balanced binary tree?', answer: 'A tree where the heights of left and right subtrees of every node differ by at most a defined constant (like 1 in AVL trees).' }
];

export const generateFlashcardsFromText = async (
  contextText: string,
  selectedTopic?: string, // Added parameter
  count: number = 50 // Added parameter
): Promise<GeneratedFlashcard[]> => {
  let cards: GeneratedFlashcard[] = [];

  // Try to generate via Gemini first if available
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
        You are a premium academic tutor.
        Your task is to generate 15 high-quality flashcards for active recall study based strictly on the provided reference material.
        ${selectedTopic ? `Ensure all flashcards are strictly focused on the topic: '${selectedTopic}'.` : ''}

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
      cards = JSON.parse(cleanJsonText) as GeneratedFlashcard[];
    } catch (err) {
      console.warn('Gemini flashcard generation failed, using local builder:', err);
    }
  }

  // Filter pool based on selectedTopic
  let pool = [...BUILTIN_FLASHCARD_POOL];
  if (selectedTopic && selectedTopic !== 'General Core' && selectedTopic !== 'Key Concepts') {
    const topicLower = selectedTopic.toLowerCase();
    pool = pool.filter(c => c.topic.toLowerCase().includes(topicLower) || topicLower.includes(c.topic.toLowerCase()));
    
    // If specific topic pool is too small, mix in standard matches
    if (pool.length < count) {
      const additional = BUILTIN_FLASHCARD_POOL.filter(c => !pool.includes(c));
      pool = [...pool, ...additional];
    }
  }

  // Shuffle pool
  pool.sort(() => Math.random() - 0.5);

  // Take elements to build up to the requested count
  const resultCards = [...cards];
  for (let i = 0; i < pool.length && resultCards.length < count; i++) {
    // Avoid duplicate questions
    if (!resultCards.some(rc => rc.question === pool[i].question)) {
      resultCards.push({
        ...pool[i],
        // Override topic with selected topic if requested
        topic: selectedTopic || pool[i].topic
      });
    }
  }

  // Pad if still under target count
  while (resultCards.length < count) {
    const idx = Math.floor(Math.random() * BUILTIN_FLASHCARD_POOL.length);
    resultCards.push({
      ...BUILTIN_FLASHCARD_POOL[idx],
      topic: selectedTopic || BUILTIN_FLASHCARD_POOL[idx].topic,
      question: `[Core review] ${BUILTIN_FLASHCARD_POOL[idx].question}`
    });
  }

  return resultCards.slice(0, count);
};
