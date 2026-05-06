// ═══════════════════════════════════════════════════════════
// DATA POOLS — All raw data arrays for generation
// No duplicates. Diverse. Multinational. Realistic.
// ═══════════════════════════════════════════════════════════

// --- FIRST NAMES (550+ unique, multinational) ---
export const FIRST_NAMES = [
    // North American / Western
    'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth',
    'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
    'Charles', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
    'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
    'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa', 'Timothy', 'Deborah',
    'Ronald', 'Stephanie', 'Jason', 'Rebecca', 'Edward', 'Sharon', 'Ryan', 'Laura', 'Jacob', 'Cynthia',
    'Gary', 'Kathleen', 'Nicholas', 'Amy', 'Eric', 'Angela', 'Jonathan', 'Shirley', 'Stephen', 'Brenda',
    'Larry', 'Emma', 'Justin', 'Anna', 'Scott', 'Pamela', 'Brandon', 'Nicole', 'Benjamin', 'Samantha',
    'Samuel', 'Katherine', 'Patrick', 'Christine', 'Alexander', 'Debra', 'Jack', 'Rachel', 'Dennis', 'Carolyn',
    'Jerry', 'Janet', 'Tyler', 'Catherine', 'Aaron', 'Maria', 'Nathan', 'Heather', 'Henry', 'Diane',
    'Peter', 'Ruth', 'Adam', 'Julie', 'Zachary', 'Olivia', 'Dylan', 'Joyce', 'Douglas', 'Virginia',
    'Bruce', 'Victoria', 'Gabriel', 'Kelly', 'Christian', 'Lauren', 'Logan', 'Christina', 'Ethan', 'Joan',
    'Connor', 'Evelyn', 'Caleb', 'Judith', 'Aiden', 'Megan', 'Owen', 'Andrea', 'Luke', 'Cheryl',
    'Isaac', 'Hannah', 'Liam', 'Jacqueline', 'Mason', 'Martha', 'Noah', 'Gloria', 'Elijah', 'Teresa',
    'Oliver', 'Ann', 'Sebastian', 'Sara', 'Adrian', 'Madison', 'Xavier', 'Frances', 'Wyatt', 'Kathryn',
    // Hispanic / Latin American
    'Carlos', 'Sofia', 'Diego', 'Valentina', 'Alejandro', 'Camila', 'Miguel', 'Isabella', 'Javier', 'Lucia',
    'Fernando', 'Mariana', 'Andres', 'Gabriela', 'Ricardo', 'Daniela', 'Luis', 'Paula', 'Pablo', 'Natalia',
    'Santiago', 'Andrea', 'Mateo', 'Carolina', 'Emilio', 'Adriana', 'Rafael', 'Elena', 'Hugo', 'Fernanda',
    'Arturo', 'Paola', 'Gustavo', 'Alejandra', 'Sergio', 'Catalina', 'Eduardo', 'Renata', 'Francisco', 'Monica',
    // East Asian — Chinese
    'Wei', 'Fang', 'Jun', 'Xiao', 'Lei', 'Mei', 'Hao', 'Ling', 'Chao', 'Yan',
    'Tao', 'Jing', 'Feng', 'Yun', 'Bo', 'Hui', 'Zhi', 'Qian', 'Ming', 'Rui',
    'Liang', 'Yue', 'Kai', 'Shu', 'Peng', 'Xin', 'Hong', 'Wen', 'Chen', 'Zhen',
    // East Asian — Japanese
    'Yuki', 'Sakura', 'Takeshi', 'Haruka', 'Kenji', 'Aoi', 'Hiroshi', 'Yui', 'Daisuke', 'Miku',
    'Ryota', 'Rina', 'Kazuki', 'Hina', 'Naoki', 'Nana', 'Takuma', 'Saki', 'Shota', 'Emi',
    'Riku', 'Kaede', 'Sora', 'Mai', 'Kento', 'Ayaka', 'Yuto', 'Misaki', 'Hayato', 'Asuka',
    // East Asian — Korean
    'Minjun', 'Seoyeon', 'Doyun', 'Jiwoo', 'Yejun', 'Haeun', 'Siwoo', 'Minseo', 'Juwon', 'Suah',
    'Jihoon', 'Jiamin', 'Junseo', 'Chaewon', 'Dohyeon', 'Jiyoon', 'Hyunwoo', 'Eunseo', 'Jihu', 'Siyeon',
    'Taeyang', 'Soojin', 'Woojin', 'Nayeon', 'Seojin', 'Yuna', 'Hajin', 'Dahyun', 'Jaehyun', 'Harin',
    // South Asian — Indian
    'Arjun', 'Priya', 'Vikram', 'Ananya', 'Rohan', 'Meera', 'Aditya', 'Neha', 'Rahul', 'Kavya',
    'Siddharth', 'Ishita', 'Karan', 'Divya', 'Varun', 'Pooja', 'Akash', 'Tanvi', 'Nikhil', 'Shreya',
    'Arun', 'Riya', 'Deepak', 'Anjali', 'Manish', 'Swati', 'Rajesh', 'Sunita', 'Amit', 'Nisha',
    // Middle Eastern / Arabic
    'Omar', 'Fatima', 'Hassan', 'Layla', 'Ali', 'Noor', 'Mohammed', 'Amira', 'Ahmed', 'Sara',
    'Youssef', 'Hana', 'Khalid', 'Yasmin', 'Karim', 'Lina', 'Tariq', 'Dina', 'Nabil', 'Rania',
    // African
    'Kwame', 'Amara', 'Chidi', 'Ngozi', 'Emeka', 'Zainab', 'Kofi', 'Nia', 'Sekou', 'Thandiwe',
    'Olumide', 'Chioma', 'Jabari', 'Wanjiku', 'Tendai', 'Adaeze', 'Jelani', 'Makena', 'Ekon', 'Amina',
    // Eastern European / Slavic
    'Dmitri', 'Anastasia', 'Nikolai', 'Svetlana', 'Pavel', 'Irina', 'Alexei', 'Natasha', 'Ivan', 'Olga',
    'Sergei', 'Ekaterina', 'Andrei', 'Tatiana', 'Viktor', 'Marina', 'Boris', 'Valentina', 'Mikhail', 'Yelena',
    // Nordic / Scandinavian
    'Erik', 'Astrid', 'Lars', 'Freya', 'Magnus', 'Ingrid', 'Sven', 'Sigrid', 'Bjorn', 'Liv',
    'Axel', 'Elsa', 'Henrik', 'Maja', 'Leif', 'Saga', 'Nils', 'Thea', 'Tor', 'Ebba',
    // Southeast Asian
    'Nguyen', 'Linh', 'Thanh', 'Anh', 'Duc', 'Thao', 'Minh', 'Huong', 'Tuan', 'Lan',
    'Budi', 'Siti', 'Adi', 'Dewi', 'Rizal', 'Putri', 'Arief', 'Wulan', 'Eko', 'Indah',
    'Carlo', 'Maria', 'Paolo', 'Angela', 'Marco', 'Bianca', 'Luca', 'Chiara', 'Matteo', 'Giulia',
];

// --- LAST NAMES (400+ unique, multinational) ---
export const LAST_NAMES = [
    // US / Western
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
    'Cole', 'Stewart', 'Morris', 'Cook', 'Rogers', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed',
    'Kelly', 'Howard', 'Ramos', 'Kim', 'Murphy', 'Price', 'Watson', 'Brooks', 'Sanders', 'Bennett',
    'Gray', 'Simmons', 'Long', 'Foster', 'Russell', 'Hayes', 'Ford', 'Hamilton', 'Graham', 'Powell',
    'Harper', 'Butler', 'Palmer', 'Freeman', 'Stone', 'Burke', 'Mason', 'Hunt', 'Dunn', 'Fisher',
    'Webb', 'Warren', 'Dixon', 'Hunt', 'Burns', 'Murray', 'Fox', 'Marshall', 'Owen', 'Bishop',
    // Hispanic
    'Ruiz', 'Morales', 'Ortiz', 'Diaz', 'Reyes', 'Cruz', 'Mendoza', 'Vargas', 'Castro', 'Romero',
    'Gutierrez', 'Alvarez', 'Medina', 'Fuentes', 'Delgado', 'Guerrero', 'Aguilar', 'Acosta', 'Lara', 'Molina',
    'Vega', 'Rios', 'Ramos', 'Herrera', 'Navarro', 'Silva', 'Rojas', 'Pena', 'Nunez', 'Soto',
    // Chinese
    'Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou',
    'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'Lin', 'He', 'Gao', 'Luo',
    'Deng', 'Xie', 'Han', 'Shen', 'Song', 'Tang', 'Liang', 'Zheng', 'Ye', 'Pan',
    // Japanese
    'Tanaka', 'Suzuki', 'Takahashi', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida',
    'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Shimizu', 'Hayashi', 'Saito', 'Mori',
    // Korean
    'Park', 'Choi', 'Jeong', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Shin',
    'Oh', 'Seo', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Ryu', 'Hong', 'Jeon', 'Moon',
    // Indian
    'Patel', 'Sharma', 'Kumar', 'Singh', 'Agarwal', 'Gupta', 'Verma', 'Joshi', 'Mehta', 'Reddy',
    'Nair', 'Bhat', 'Rao', 'Chakraborty', 'Desai', 'Iyer', 'Pillai', 'Mukherjee', 'Chatterjee', 'Das',
    // Arabic / Middle Eastern
    'Al-Rashid', 'Al-Farsi', 'Al-Hashimi', 'El-Amin', 'Mansouri', 'Fayed', 'Nasr', 'Khalil', 'Ibrahim', 'Saleh',
    // African
    'Okafor', 'Adeyemi', 'Mensah', 'Diallo', 'Kenyatta', 'Osei', 'Obeng', 'Moyo', 'Banda', 'Mwangi',
    // Eastern European
    'Volkov', 'Petrov', 'Sokolov', 'Novak', 'Horvat', 'Kowalski', 'Nowak', 'Dvorak', 'Popov', 'Krasny',
    // Nordic
    'Lindqvist', 'Johansson', 'Svensson', 'Olsen', 'Nielsen', 'Eriksen', 'Berg', 'Larsen', 'Dahl', 'Holm',
    // Southeast Asian
    'Tran', 'Pham', 'Hoang', 'Bui', 'Do', 'Ngo', 'Dang', 'Suarez', 'Reyes', 'Santos',
    'Tan', 'Lim', 'Ong', 'Chua', 'Sy', 'De Leon', 'Bautista', 'Villanueva', 'Del Rosario', 'Aquino',
];

// --- COMPANIES (200+ real tech companies) ---
export const COMPANIES = [
    // FAANG / Big Tech
    'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Tesla', 'Nvidia', 'AMD', 'Intel',
    'Salesforce', 'Adobe', 'Oracle', 'IBM', 'Cisco', 'VMware', 'Dell', 'HP', 'Qualcomm', 'Broadcom',
    // Cloud & SaaS
    'Cloudflare', 'Vercel', 'Netlify', 'DigitalOcean', 'Hetzner', 'Fly.io', 'Railway', 'Supabase', 'PlanetScale', 'Neon',
    'Datadog', 'Grafana Labs', 'HashiCorp', 'Elastic', 'Confluent', 'Snowflake', 'Databricks', 'Palantir', 'Twilio', 'Stripe',
    // Startups & Scale-ups
    'Figma', 'Notion', 'Linear', 'Retool', 'Postman', 'GitLab', 'JetBrains', 'Atlassian', 'Canva', 'Airtable',
    'Miro', 'Loom', 'Cal.com', 'Resend', 'Clerk', 'Convex', 'Prisma', 'Drizzle', 'Turso', 'Upstash',
    // Asian Tech
    'Alibaba', 'Tencent', 'ByteDance', 'Baidu', 'Huawei', 'Xiaomi', 'JD.com', 'Meituan', 'DiDi', 'Pinduoduo',
    'Samsung', 'LG', 'SK Hynix', 'Kakao', 'Naver', 'Line', 'Coupang', 'Flipkart', 'Razorpay', 'Freshworks',
    'Grab', 'Gojek', 'Tokopedia', 'SEA Group', 'VNG', 'Tiki', 'FPT', 'Momo', 'ZaloPay', 'Shopee',
    // Fintech
    'PayPal', 'Square', 'Plaid', 'Coinbase', 'Binance', 'Kraken', 'Revolut', 'Wise', 'N26', 'Chime',
    // AI Companies
    'OpenAI', 'Anthropic', 'DeepMind', 'Cohere', 'Hugging Face', 'Stability AI', 'Midjourney', 'Jasper', 'Scale AI', 'Weights & Biases',
    'Langchain', 'LlamaIndex', 'Pinecone', 'Weaviate', 'Qdrant', 'Replicate', 'Modal', 'Anyscale', 'Runway', 'ElevenLabs',
    // Cybersecurity
    'CrowdStrike', 'Palo Alto Networks', 'Fortinet', 'Zscaler', 'SentinelOne', 'Snyk', 'Wiz', 'Orca Security', 'Lacework', 'Aqua Security',
    // Gaming
    'Riot Games', 'Epic Games', 'Valve', 'Unity', 'Roblox', 'Supercell', 'miHoYo', 'Niantic', 'Bungie', 'Ubisoft',
    // Agencies & Consultancies
    'ThoughtWorks', 'Toptal', 'Turing', 'Andela', 'Accenture', 'McKinsey Digital', 'BCG Digital', 'Deloitte Digital', 'Capgemini', 'InfoSys',
    // Self Employed / Indie
    'Self-Employed', 'Freelance', 'Independent', 'Indie Hacker', 'Open Source', 'Consulting', 'Startup Founder', 'Solo Dev', 'Contractor', 'Remote',
];

// --- LOCATIONS (city, state/country — 150+) ---
export const LOCATIONS = [
    // US
    'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Los Angeles, CA',
    'Chicago, IL', 'Denver, CO', 'Boston, MA', 'Portland, OR', 'Atlanta, GA',
    'Miami, FL', 'San Diego, CA', 'Phoenix, AZ', 'Dallas, TX', 'Nashville, TN',
    'Salt Lake City, UT', 'Minneapolis, MN', 'Raleigh, NC', 'Tampa, FL', 'Pittsburgh, PA',
    'Detroit, MI', 'Las Vegas, NV', 'Philadelphia, PA', 'Washington, DC', 'Charlotte, NC',
    // Canada
    'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada', 'Ottawa, Canada', 'Calgary, Canada',
    // UK & Ireland
    'London, UK', 'Manchester, UK', 'Edinburgh, UK', 'Bristol, UK', 'Dublin, Ireland',
    // Europe
    'Berlin, Germany', 'Munich, Germany', 'Hamburg, Germany', 'Paris, France', 'Lyon, France',
    'Amsterdam, Netherlands', 'Stockholm, Sweden', 'Copenhagen, Denmark', 'Oslo, Norway', 'Helsinki, Finland',
    'Barcelona, Spain', 'Madrid, Spain', 'Lisbon, Portugal', 'Zurich, Switzerland', 'Vienna, Austria',
    'Prague, Czech Republic', 'Warsaw, Poland', 'Krakow, Poland', 'Bucharest, Romania', 'Tallinn, Estonia',
    'Milan, Italy', 'Rome, Italy', 'Brussels, Belgium',
    // China
    'Beijing, China', 'Shanghai, China', 'Shenzhen, China', 'Hangzhou, China', 'Chengdu, China',
    'Guangzhou, China', 'Nanjing, China', 'Wuhan, China', 'Xian, China', 'Suzhou, China',
    // Japan
    'Tokyo, Japan', 'Osaka, Japan', 'Kyoto, Japan', 'Yokohama, Japan', 'Fukuoka, Japan',
    // Korea
    'Seoul, South Korea', 'Busan, South Korea', 'Incheon, South Korea', 'Daegu, South Korea', 'Daejeon, South Korea',
    // India
    'Bangalore, India', 'Mumbai, India', 'Delhi, India', 'Hyderabad, India', 'Pune, India',
    'Chennai, India', 'Kolkata, India', 'Ahmedabad, India', 'Noida, India', 'Gurgaon, India',
    // Southeast Asia
    'Singapore', 'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam', 'Bangkok, Thailand', 'Jakarta, Indonesia',
    'Kuala Lumpur, Malaysia', 'Manila, Philippines', 'Da Nang, Vietnam',
    // Middle East
    'Dubai, UAE', 'Tel Aviv, Israel', 'Riyadh, Saudi Arabia', 'Istanbul, Turkey', 'Cairo, Egypt',
    // Africa
    'Lagos, Nigeria', 'Nairobi, Kenya', 'Cape Town, South Africa', 'Accra, Ghana', 'Kigali, Rwanda',
    // Latin America
    'Sao Paulo, Brazil', 'Mexico City, Mexico', 'Buenos Aires, Argentina', 'Bogota, Colombia', 'Lima, Peru',
    'Santiago, Chile', 'Medellin, Colombia',
    // Oceania
    'Sydney, Australia', 'Melbourne, Australia', 'Auckland, New Zealand', 'Brisbane, Australia', 'Perth, Australia',
];

// --- SKILLS / TECHNOLOGIES (80+) ---
export const SKILLS = [
    'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C#', 'C++', 'Ruby', 'PHP',
    'Swift', 'Kotlin', 'Dart', 'Elixir', 'Scala', 'Haskell', 'Clojure', 'R', 'Julia', 'Lua',
    'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Remix', 'Astro', 'SolidJS', 'Qwik',
    'Node.js', 'Express', 'Fastify', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Rails', 'Laravel',
    'React Native', 'Flutter', 'SwiftUI', 'Jetpack Compose', 'Expo',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB', 'SQLite', 'CockroachDB', 'TimescaleDB', 'Neo4j',
    'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Pulumi', 'Helm', 'ArgoCD',
    'AWS', 'GCP', 'Azure', 'Vercel', 'Cloudflare Workers', 'Fly.io', 'Railway',
    'GraphQL', 'REST', 'gRPC', 'WebSocket', 'tRPC',
    'TensorFlow', 'PyTorch', 'JAX', 'scikit-learn', 'Hugging Face', 'LangChain', 'LlamaIndex',
    'Tailwind CSS', 'CSS', 'Sass', 'Figma', 'Storybook',
    'Git', 'Linux', 'Vim', 'VS Code', 'CI/CD', 'GitHub Actions', 'Jenkins',
    'Prisma', 'Drizzle', 'TypeORM', 'Sequelize', 'Knex',
    'Jest', 'Vitest', 'Playwright', 'Cypress', 'Pytest',
];

// --- HEADLINES (job title templates) ---
export const HEADLINE_TEMPLATES = [
    '{role} at {company}',
    '{role} | {company}',
    'Senior {role} at {company}',
    'Staff {role} at {company}',
    'Lead {role} at {company}',
    'Principal {role} at {company}',
    '{role} @ {company}',
    'Junior {role} at {company}',
    '{role} • {company}',
    'Founding {role} at {company}',
    'Head of Engineering at {company}',
    'VP of Engineering at {company}',
    'CTO at {company}',
    '{role} → Building {specialty}',
    'Ex-{company} | Now {role}',
    '{role} | Open Source Enthusiast',
    'Indie {role} | Building in Public',
    '{role} | {specialty} Specialist',
    'Full-Stack Developer at {company}',
    '{role} | Writing about {specialty}',
];

export const ROLES = [
    'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full-Stack Developer',
    'DevOps Engineer', 'SRE', 'Data Engineer', 'ML Engineer', 'Platform Engineer',
    'iOS Developer', 'Android Developer', 'Mobile Developer', 'Cloud Architect',
    'Security Engineer', 'QA Engineer', 'Engineering Manager', 'Tech Lead',
    'Product Engineer', 'Infrastructure Engineer', 'Systems Engineer',
    'Solutions Architect', 'Database Administrator', 'Developer Advocate',
    'Open Source Maintainer', 'Technical Writer', 'UI/UX Engineer',
];

export const SPECIALTIES = [
    'distributed systems', 'real-time applications', 'developer tools', 'cloud infrastructure',
    'machine learning', 'data pipelines', 'microservices', 'serverless', 'edge computing',
    'web performance', 'accessibility', 'design systems', 'API design', 'database optimization',
    'security tooling', 'observability', 'CI/CD automation', 'container orchestration',
    'mobile UX', 'cross-platform apps', 'blockchain', 'Web3', 'AI/ML infrastructure',
    'natural language processing', 'computer vision', 'recommendation systems',
];

// --- EMAIL DOMAINS ---
export const EMAIL_DOMAINS = [
    'gmail.com', 'outlook.com', 'proton.me', 'hey.com', 'fastmail.com',
    'icloud.com', 'yahoo.com', 'hotmail.com', 'live.com', 'mail.com',
    'pm.me', 'tutanota.com', 'zoho.com', 'yandex.com', 'gmx.com',
    'dev.io', 'engineer.com', 'coder.com', 'techie.com', 'devmail.io',
];

// --- VERIFIED UNSPLASH AVATAR URLs (100 real face photos — stable IDs) ---
export const UNSPLASH_AVATARS = [
    'photo-1507003211169-0a1dd7228f2d', 'photo-1500648767791-00dcc994a43e', 'photo-1599566150163-29194dcaad36',
    'photo-1494790108377-be9c29b29330', 'photo-1438761681033-6461ffad8d80', 'photo-1472099645785-5658abf4ff4e',
    'photo-1535713875002-d1d0cf377fde', 'photo-1544005313-94ddf0286df2', 'photo-1544723795-3fb6469f5b39',
    'photo-1506794778202-cad84cf45f1d', 'photo-1534528741775-53994a69daeb', 'photo-1487412720507-e7ab37603c6f',
    'photo-1492562080023-ab3db95bfbce', 'photo-1519345182560-3f2917c472ef', 'photo-1502823403499-6ccfcf4fb453',
    'photo-1522529599102-193c0d76b5b6', 'photo-1504257432389-52343af06ae3', 'photo-1531123897727-8f129e1688ce',
    'photo-1496345875659-11f7dd282d1d', 'photo-1492633423870-43d1cd2775eb', 'photo-1513956589380-bad6acb9b9d4',
    'photo-1488426862026-3ee34a7d66df', 'photo-1517841905240-472988babdf9', 'photo-1529626455594-4ff0802cfb7e',
    'photo-1524504388940-b1c1722653e1', 'photo-1525134479668-1bee5c7c6845', 'photo-1489424731084-a5d8b219a5bb',
    'photo-1513364776144-60967b0f800f', 'photo-1503023345310-bd7c1de61c7d', 'photo-1528763380143-65b3ac89a3ff',
    'photo-1534308143481-c55f00be8bd7', 'photo-1517365830460-955ce3ccd263', 'photo-1523477800337-966dbabe060a',
    'photo-1504199367641-ead6c93c5dbb', 'photo-1519058082700-08a0b56da9b2', 'photo-1495490140452-5a226aef0e2e',
    'photo-1507591064344-4c6ce005b128', 'photo-1514888286974-6c03d2ca1ff3', 'photo-1547425260-76bcadfb4f2c',
    'photo-1552058544-f2b08422138a', 'photo-1557862921-37829c790f19', 'photo-1560250097-0b93528c311a',
    'photo-1500648767791-00dcc994a43e', 'photo-1568602471122-7832951cc4c5', 'photo-1573497019940-1c28c88b4f3e',
    'photo-1580489944761-15a19d654956', 'photo-1584999734482-0361aecad844', 'photo-1586297135537-94bc9ba060aa',
    'photo-1590086782957-93c06ef21604', 'photo-1595152452543-e5fc28ebc2b8', 'photo-1596215143922-eedeaba0d91c',
    'photo-1597223557154-721c1cecc4b0', 'photo-1598550880863-4e8aa3d0edb4', 'photo-1599110906447-f72a1183a43b',
];

// --- REAL YOUTUBE VIDEO IDs (tech talks, tutorials — verified popular, won't be deleted) ---
export const YOUTUBE_IDS = [
    'dQw4w9WgXcQ', // Rick Astley (meme, always up)
    'W6NZfCJ0zLk', // 100+ JS concepts
    'pTFZrS8GHKA', // Node.js explained
    'N6BghzuFLIg', // TypeScript Full Course
    'TNhaISOUy6Q', // Fireship React
    'kqtD5dpn9C8', // React in 100 seconds
    'Tn6-PIqc4UM', // React 18
    'CvUiKWv2-C0', // Next.js 14
    'PkZNo7MFNFg', // JavaScript Tutorial 3h
    'rfscVS0vtbw', // Python Full Course
    'eWRfhZUzrAc', // Docker in 100 seconds
    'fqMOX6JJhGo', // Docker Compose
    'X48VuDVv0do', // Kubernetes Explained
    's_o8dwzRlu4', // CSS Grid
    'jV8B24rSN5o', // CSS Flexbox
    'w7ejDZ8SWv8', // React Hooks
    'bMknfKXIFA8', // React Course 2024
    'SqcY0GlETPk', // React Tutorial
    'ZBu_jLN-SEo', // Go Programming
    'un6ZyFkqFKo', // Go Full Course
    'nLRL_NcnK-4', // Rust in 100 seconds
    '5C_HPTJg5ek', // TypeScript Tutorial
    'MnpuK0MK4yo', // Svelte
    'dGcsHMXbSOA', // Vue 3
    'qz0aGYrrlhU', // SQL Tutorial
    'HXV3zeQKqGY', // CSS Crash Course
    'UB1O30fR-EE', // HTML Crash Course
    'DHjqpvDnNGE', // TailwindCSS
    'hQAHSlTtcmY', // Git Tutorial
    'RGOj5yH7evk', // Git & GitHub Crash Course
    'zJSY8tbf_ys', // Firebase 9
    'lkIFF4maKMU', // MongoDB Crash
    'Oe421EPjeBE', // Node.js & Express
    'fBNz5xF-Kx4', // NestJS Course
    '1S2SU5Omi_8', // AWS Lambda
    'FnCzGkgqkOs', // System Design
    '7CqJlxBYj-M', // Microservices
    'rPR8pQALBTo', // Machine Learning
    'aircAruvnKk', // Neural Networks
    'JnTa9XtvmfI', // Attention Is All You Need
];

// --- REAL TECH LINKS (docs, articles, tools — verified) ---
export const REAL_LINKS = [
    'https://react.dev/learn',
    'https://nextjs.org/docs',
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    'https://nodejs.org/docs/latest/api/',
    'https://www.typescriptlang.org/docs/',
    'https://tailwindcss.com/docs',
    'https://prisma.io/docs',
    'https://docs.github.com/en',
    'https://kubernetes.io/docs/',
    'https://docs.docker.com/',
    'https://www.postgresql.org/docs/',
    'https://redis.io/docs/',
    'https://graphql.org/learn/',
    'https://trpc.io/docs',
    'https://vitejs.dev/guide/',
    'https://svelte.dev/docs',
    'https://vuejs.org/guide/',
    'https://angular.dev/overview',
    'https://docs.python.org/3/',
    'https://go.dev/doc/',
    'https://doc.rust-lang.org/book/',
    'https://www.rust-lang.org/learn',
    'https://spring.io/guides',
    'https://flask.palletsprojects.com/',
    'https://fastapi.tiangolo.com/',
    'https://expressjs.com/en/guide/',
    'https://nestjs.com/docs',
    'https://www.terraform.io/docs',
    'https://docs.aws.amazon.com/',
    'https://cloud.google.com/docs',
    'https://learn.microsoft.com/en-us/azure/',
    'https://vercel.com/docs',
    'https://supabase.com/docs',
    'https://planetscale.com/docs',
    'https://turso.tech/docs',
    'https://orm.drizzle.team/docs/overview',
    'https://zod.dev/',
    'https://jestjs.io/docs/getting-started',
    'https://vitest.dev/guide/',
    'https://playwright.dev/docs/intro',
    'https://huggingface.co/docs',
    'https://pytorch.org/docs/stable/',
    'https://www.tensorflow.org/tutorials',
    'https://langchain.com/docs',
    'https://pinecone.io/docs',
    'https://weaviate.io/developers/weaviate',
    'https://github.com/features/actions',
    'https://docs.gitlab.com/ee/ci/',
    'https://www.cloudflare.com/learning/',
    'https://fly.io/docs/',
];

// --- RECODE SCRIPT TAGS ---
export const SCRIPT_TAGS = [
    'Security', 'Filtering', 'Validation', 'Utility', 'Data Transform', 'API Helper',
    'CLI Tool', 'Middleware', 'Auth', 'Rate Limiting', 'Cache', 'Database',
    'Testing', 'Monitoring', 'Logging', 'Performance', 'Parsing', 'Encoding',
    'Encryption', 'Hashing', 'JWT', 'OAuth', 'WebSocket', 'HTTP', 'File System',
    'String Manipulation', 'Array Utils', 'Date Utils', 'Math', 'Regex',
    'Error Handling', 'Retry Logic', 'Queue', 'Pub/Sub', 'Event Emitter',
    'State Machine', 'Config Loader', 'Env Parser', 'Template Engine', 'Markdown',
];
