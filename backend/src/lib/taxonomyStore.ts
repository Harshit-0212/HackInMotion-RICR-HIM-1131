import { getDb } from './db.js';

export interface TopicItem {
  id: string;
  name: string;
  slug: string;
  questionCount?: number;
}

export interface SubjectItem {
  id: string;
  name: string;
  slug: string;
  topics: TopicItem[];
}

export interface TaxonomyFieldDoc {
  _id?: string;
  id: string;
  name: string;
  slug: string;
  category: 'Normal' | 'Special' | 'Interview Practice';
  subjects: SubjectItem[];
  createdAt: string;
  updatedAt: string;
}

const COLLECTION = 'question_taxonomy';

export const taxonomyStore = {
  async ensureSeeded(): Promise<void> {
    const db = await getDb();
    const col = db.collection<TaxonomyFieldDoc>(COLLECTION);
    const count = await col.countDocuments();
    if (count > 0) return;

    const now = new Date().toISOString();

    const seedData: Omit<TaxonomyFieldDoc, '_id'>[] = [
      {
        id: 'cs',
        name: 'Computer Science',
        slug: 'computer-science',
        category: 'Normal',
        createdAt: now,
        updatedAt: now,
        subjects: [
          {
            id: 'dsa',
            name: 'Data Structures & Algorithms',
            slug: 'dsa',
            topics: [
              { id: 'arrays', name: 'Arrays & Strings', slug: 'arrays' },
              { id: 'linked_lists', name: 'Linked Lists', slug: 'linked-lists' },
              { id: 'trees', name: 'Trees & Binary Search Trees', slug: 'trees' },
              { id: 'graphs', name: 'Graph Algorithms & Traversal', slug: 'graphs' },
              { id: 'dp', name: 'Dynamic Programming & Memoization', slug: 'dp' },
              { id: 'sorting_searching', name: 'Sorting & Searching', slug: 'sorting-searching' },
            ],
          },
          {
            id: 'java',
            name: 'Java',
            slug: 'java',
            topics: [
              { id: 'java_core', name: 'Core Syntax & JVM Architecture', slug: 'core-jvm' },
              { id: 'java_collections', name: 'Collections Framework', slug: 'collections' },
              { id: 'java_multithreading', name: 'Multithreading & Concurrency', slug: 'multithreading' },
              { id: 'java_streams', name: 'Lambdas & Stream API', slug: 'streams' },
            ],
          },
          {
            id: 'python',
            name: 'Python',
            slug: 'python',
            topics: [
              { id: 'py_basics', name: 'Language Constructs & Data Models', slug: 'basics' },
              { id: 'py_generators', name: 'Iterators, Generators & Decorators', slug: 'generators' },
              { id: 'py_memory', name: 'Memory Management & GIL', slug: 'memory-gil' },
            ],
          },
          {
            id: 'cpp',
            name: 'C / C++',
            slug: 'cpp',
            topics: [
              { id: 'cpp_pointers', name: 'Pointers & Dynamic Memory', slug: 'pointers' },
              { id: 'cpp_stl', name: 'STL Containers & Iterators', slug: 'stl' },
              { id: 'cpp_templates', name: 'Templates & RAII', slug: 'templates-raii' },
            ],
          },
          {
            id: 'oop',
            name: 'Object-Oriented Programming',
            slug: 'oop',
            topics: [
              { id: 'oop_pillars', name: 'Encapsulation, Polymorphism & Abstraction', slug: 'pillars' },
              { id: 'solid', name: 'SOLID Principles & Design Patterns', slug: 'solid' },
            ],
          },
          {
            id: 'dbms',
            name: 'DBMS & SQL',
            slug: 'dbms',
            topics: [
              { id: 'sql_queries', name: 'SQL Joins, Aggregations & Subqueries', slug: 'sql' },
              { id: 'indexing', name: 'Indexing (B-Tree, Hash) & Query Plans', slug: 'indexing' },
              { id: 'transactions', name: 'ACID, Isolation Levels & Deadlocks', slug: 'transactions' },
              { id: 'normalization', name: 'Database Normalization (1NF to BCNF)', slug: 'normalization' },
            ],
          },
          {
            id: 'os',
            name: 'Operating Systems',
            slug: 'os',
            topics: [
              { id: 'processes_threads', name: 'Processes, Threads & Context Switching', slug: 'processes' },
              { id: 'synchronization', name: 'Semaphores, Mutex & Critical Section', slug: 'synchronization' },
              { id: 'virtual_memory', name: 'Paging, TLB & Page Replacement', slug: 'virtual-memory' },
              { id: 'scheduling', name: 'CPU Scheduling Algorithms', slug: 'scheduling' },
            ],
          },
          {
            id: 'networks',
            name: 'Computer Networks',
            slug: 'networks',
            topics: [
              { id: 'osi_tcp', name: 'OSI & TCP/IP Layer Protocol Stack', slug: 'osi-tcp' },
              { id: 'tcp_handshake', name: 'TCP 3-Way Handshake, Flow & Congestion Control', slug: 'tcp' },
              { id: 'dns_http', name: 'DNS, HTTP/1.1, HTTP/2, HTTP/3 & TLS', slug: 'http-tls' },
            ],
          },
          {
            id: 'webdev',
            name: 'Web Development',
            slug: 'webdev',
            topics: [
              { id: 'react_core', name: 'React Hooks, Virtual DOM & Lifecycle', slug: 'react' },
              { id: 'nodejs_eventloop', name: 'Node.js Event Loop, Libuv & Streams', slug: 'node' },
              { id: 'security', name: 'CORS, XSS, CSRF & Web Security', slug: 'security' },
            ],
          },
          {
            id: 'swe',
            name: 'Software Engineering',
            slug: 'swe',
            topics: [
              { id: 'agile_sdlc', name: 'Agile, Scrum & SDLC Methodologies', slug: 'agile' },
              { id: 'testing', name: 'Unit, Integration & E2E Testing Strategies', slug: 'testing' },
            ],
          },
          {
            id: 'system_design',
            name: 'System Design',
            slug: 'system-design',
            topics: [
              { id: 'scalability', name: 'Load Balancing, Horizontal Scaling & CDN', slug: 'scalability' },
              { id: 'caching', name: 'Distributed Caching (Redis/Memcached)', slug: 'caching' },
              { id: 'rate_limiting', name: 'Rate Limiting Algorithms (Token Bucket, Leaky Bucket)', slug: 'rate-limiting' },
              { id: 'sharding', name: 'Database Sharding & Replication', slug: 'sharding' },
            ],
          },
          {
            id: 'aiml',
            name: 'AI / ML Basics',
            slug: 'aiml',
            topics: [
              { id: 'ml_algos', name: 'Supervised vs Unsupervised Algorithms', slug: 'algos' },
              { id: 'deep_learning', name: 'Neural Networks & Gradient Descent', slug: 'deep-learning' },
            ],
          },
          {
            id: 'cloud_devops',
            name: 'Cloud, Linux & DevOps',
            slug: 'cloud-devops',
            topics: [
              { id: 'linux_commands', name: 'Linux Shell, File Permissions & Signals', slug: 'linux' },
              { id: 'docker_k8s', name: 'Docker Containers & Kubernetes Pods', slug: 'docker-k8s' },
              { id: 'cicd', name: 'CI/CD Pipelines & Infrastructure as Code', slug: 'cicd' },
            ],
          },
        ],
      },
      {
        id: 'aptitude',
        name: 'Aptitude & Reasoning',
        slug: 'aptitude',
        category: 'Normal',
        createdAt: now,
        updatedAt: now,
        subjects: [
          {
            id: 'quant',
            name: 'Quantitative Aptitude',
            slug: 'quant',
            topics: [
              { id: 'speed_time', name: 'Time, Speed & Distance', slug: 'speed-time' },
              { id: 'profit_loss', name: 'Profit, Loss & Percentages', slug: 'profit-loss' },
              { id: 'pnc_prob', name: 'Permutations, Combinations & Probability', slug: 'probability' },
            ],
          },
          {
            id: 'reasoning',
            name: 'Logical Reasoning',
            slug: 'reasoning',
            topics: [
              { id: 'seating', name: 'Linear & Circular Seating Arrangements', slug: 'seating' },
              { id: 'syllogisms', name: 'Syllogisms & Deductive Logic', slug: 'syllogisms' },
              { id: 'blood_relations', name: 'Blood Relations & Direction Sense', slug: 'relations' },
            ],
          },
          {
            id: 'data_interp',
            name: 'Data Interpretation',
            slug: 'data-interpretation',
            topics: [
              { id: 'tables_charts', name: 'Bar Charts, Pie Charts & Tabular Analysis', slug: 'charts' },
            ],
          },
        ],
      },
      {
        id: 'verbal',
        name: 'Verbal Ability',
        slug: 'verbal',
        category: 'Normal',
        createdAt: now,
        updatedAt: now,
        subjects: [
          {
            id: 'english',
            name: 'English Grammar & Vocabulary',
            slug: 'english',
            topics: [
              { id: 'grammar_rules', name: 'Sentence Correction & Tenses', slug: 'grammar' },
              { id: 'vocab', name: 'Synonyms, Antonyms & Idioms', slug: 'vocabulary' },
              { id: 'rc', name: 'Reading Comprehension', slug: 'reading-comprehension' },
            ],
          },
        ],
      },
      {
        id: 'engineering',
        name: 'Other Engineering Branches',
        slug: 'engineering',
        category: 'Normal',
        createdAt: now,
        updatedAt: now,
        subjects: [
          {
            id: 'electronics',
            name: 'Electronics Engineering',
            slug: 'electronics',
            topics: [
              { id: 'digital_circuits', name: 'Logic Gates & Flip-Flops', slug: 'digital' },
              { id: 'signals', name: 'Signals & Systems Basics', slug: 'signals' },
            ],
          },
          {
            id: 'electrical',
            name: 'Electrical Engineering',
            slug: 'electrical',
            topics: [
              { id: 'circuits', name: 'KCL, KVL & AC Circuits', slug: 'circuits' },
              { id: 'machines', name: 'Transformers & Motors', slug: 'machines' },
            ],
          },
          {
            id: 'mechanical',
            name: 'Mechanical Engineering',
            slug: 'mechanical',
            topics: [
              { id: 'thermo', name: 'Thermodynamics Laws & Cycles', slug: 'thermodynamics' },
              { id: 'mechanics', name: 'Fluid Mechanics & Strength of Materials', slug: 'fluid-mechanics' },
            ],
          },
          {
            id: 'civil',
            name: 'Civil Engineering',
            slug: 'civil',
            topics: [
              { id: 'structural', name: 'Structural Analysis & Concrete', slug: 'structural' },
              { id: 'surveying', name: 'Surveying & Soil Mechanics', slug: 'surveying' },
            ],
          },
        ],
      },
      {
        id: 'interview_prep',
        name: 'Interview Practice',
        slug: 'interview-practice',
        category: 'Interview Practice',
        createdAt: now,
        updatedAt: now,
        subjects: [
          {
            id: 'hr_behavioral',
            name: 'HR & Behavioral',
            slug: 'hr-behavioral',
            topics: [
              { id: 'star_method', name: 'STAR Method (Conflict, Leadership, Failure)', slug: 'star' },
              { id: 'values', name: 'Team Collaboration & Communication', slug: 'teamwork' },
            ],
          },
          {
            id: 'role_tech',
            name: 'Role-Based Technical',
            slug: 'role-technical',
            topics: [
              { id: 'role_frontend', name: 'Frontend Engineer (React/TypeScript/CSS)', slug: 'frontend-role' },
              { id: 'role_backend', name: 'Backend Engineer (APIs, Databases, Caching)', slug: 'backend-role' },
              { id: 'role_java', name: 'Java Developer (Spring Boot & Microservices)', slug: 'java-role' },
              { id: 'role_devops', name: 'DevOps / SRE (Kubernetes, Linux, Monitoring)', slug: 'devops-role' },
              { id: 'role_data', name: 'Data Analyst (SQL, Analytics & Warehousing)', slug: 'data-role' },
            ],
          },
        ],
      },
      {
        id: 'special_eval',
        name: 'Special Assessments',
        slug: 'special-eval',
        category: 'Special',
        createdAt: now,
        updatedAt: now,
        subjects: [
          {
            id: 'gate',
            name: 'GATE-Style Assessment',
            slug: 'gate',
            topics: [
              { id: 'gate_cs', name: 'GATE Computer Science Core Questions', slug: 'gate-cs' },
            ],
          },
          {
            id: 'placement',
            name: 'Campus Placement Mock',
            slug: 'placement',
            topics: [
              { id: 'placement_tier1', name: 'Tier-1 Tech Placement Assessment', slug: 'tier1' },
            ],
          },
          {
            id: 'debugging_challenges',
            name: 'Debugging Challenges',
            slug: 'debugging',
            topics: [
              { id: 'debug_syntax_logic', name: 'Spot The Bug & Memory Leaks', slug: 'spot-bug' },
            ],
          },
        ],
      },
    ];

    await col.insertMany(seedData);
  },

  async getAll(): Promise<TaxonomyFieldDoc[]> {
    await this.ensureSeeded();
    const db = await getDb();
    return db.collection<TaxonomyFieldDoc>(COLLECTION).find({}).toArray();
  },

  async addField(field: Omit<TaxonomyFieldDoc, '_id' | 'createdAt' | 'updatedAt'>): Promise<TaxonomyFieldDoc> {
    const db = await getDb();
    const now = new Date().toISOString();
    const doc: TaxonomyFieldDoc = {
      ...field,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection<TaxonomyFieldDoc>(COLLECTION).insertOne(doc);
    return doc;
  },

  async addSubject(fieldId: string, subject: SubjectItem): Promise<boolean> {
    const db = await getDb();
    const res = await db.collection<TaxonomyFieldDoc>(COLLECTION).updateOne(
      { id: fieldId },
      {
        $push: { subjects: subject },
        $set: { updatedAt: new Date().toISOString() },
      }
    );
    return res.modifiedCount > 0;
  },

  async addTopic(fieldId: string, subjectId: string, topic: TopicItem): Promise<boolean> {
    const db = await getDb();
    const res = await db.collection<TaxonomyFieldDoc>(COLLECTION).updateOne(
      { id: fieldId, 'subjects.id': subjectId },
      {
        $push: { 'subjects.$.topics': topic },
        $set: { updatedAt: new Date().toISOString() },
      }
    );
    return res.modifiedCount > 0;
  },
};

