/** Company-profile copy, drawn from the VIEM company profile and Konekta proposal. */

export const CONTACT = {
  whatsappDisplay: "+670 7588 5354",
  whatsappLink: "https://wa.me/67075885354",
  email: "info@viem.com",
  website: "viemproject.com",
  websiteUrl: "https://viemproject.com",
};

export const DOWNLOADS = {
  proposal: {
    href: "/downloads/VIEM-Konekta-Farms-Proposal.pdf",
    title: "VIEM Konekta Farms — Challenge proposal",
    description: "Our Vorakai Konekta Challenge 2026 idea proposal: problem, circular design, connectivity, Tetum-first AI, business model, rollout, risks and team.",
    meta: "PDF · 11 pages · 0.5 MB",
  },
  profile: {
    href: "/downloads/VIEM-Company-Profile.pdf",
    title: "VIEM Company Profile",
    description: "Who we are, our vision, what we do and how we approach smart, regenerative and circular agriculture in Timor-Leste.",
    meta: "PDF · 8 pages · 11 MB",
  },
};

export const TAGLINE = "Grow · Innovate · Sustain";
export const QUOTE = "We cultivate today, regenerate along the way, restore what matters, and sustain tomorrow.";

export const HEADLINE_STATS = [
  { value: "90%", label: "less water than soil farming" },
  { value: "150 m²", label: "footprint for each Suku Unit" },
  { value: "3–5", label: "paid local jobs per unit" },
  { value: "12–18", label: "months to pay back set-up" },
];

export const APPROACH = [
  {
    title: "Grow",
    body: "We build productive, efficient farming systems designed to deliver consistent, high-quality output all year — including the dry season.",
  },
  {
    title: "Innovate",
    body: "We integrate sensors, data and a Tetum-first farm assistant so small teams can run many farms well, even on shared satellite links.",
  },
  {
    title: "Sustain",
    body: "We apply regenerative, circular practices: organic waste becomes fish feed and compost, and every output feeds the next stage.",
  },
];

export const PROBLEMS = [
  {
    title: "Nutrition",
    stat: "≈ 1 in 2",
    statLabel: "children under five are stunted",
    body: "Diets are rich in rice but poor in vegetables and affordable protein (Timor-Leste Food and Nutrition Survey, 2020).",
  },
  {
    title: "Import dependence",
    stat: "Seasonal",
    statLabel: "local supply",
    body: "Supermarkets and hotels in Dili rely heavily on vegetables and fish imported from Indonesia and Australia.",
  },
  {
    title: "Water & climate",
    stat: "Long",
    statLabel: "dry season",
    body: "Erratic rainfall and degraded soils limit what can be grown in the open field for much of the year.",
  },
  {
    title: "Waste & work",
    stat: "Few",
    statLabel: "paid rural jobs",
    body: "Market and household organic waste is dumped or burned, while rural youth and women have few paid jobs close to home.",
  },
];

export const LOOP_STAGES = [
  {
    id: "waste",
    input: "Market & kitchen waste",
    process: "Black soldier fly larvae composting",
    output: "Protein larvae and frass",
    goesTo: "Fish feed and compost",
  },
  {
    id: "fish",
    input: "Fish waste (ammonia)",
    process: "Biofilter bacteria",
    output: "Nitrate nutrient",
    goesTo: "Grow beds and NFT channels",
  },
  {
    id: "plants",
    input: "Plant trimmings and roots",
    process: "Compost and liquid brew",
    output: "Organic fertiliser",
    goesTo: "Hydroponics and local farmers",
  },
  {
    id: "energy",
    input: "Rain and sun",
    process: "Roof capture and solar PV",
    output: "Water and power",
    goesTo: "Tanks, pumps and sensors",
  },
  {
    id: "harvest",
    input: "Harvest",
    process: "Grading and VIEM buy-back",
    output: "Vegetables and fish",
    goesTo: "Schools, hotels and markets",
  },
] as const;

export const SYSTEMS = [
  {
    title: "Aquaponics",
    subtitle: "Fish and plants share one water",
    body: "A 2,000-litre tank holds tilapia. Their water flows through a biofilter where bacteria turn ammonia into nitrate, then through grow beds of leafy greens, herbs and fruiting crops. Clean water returns to the fish — no chemical fertiliser needed.",
  },
  {
    title: "Hydroponics",
    subtitle: "Fast, high-value greens",
    body: "NFT (nutrient film) channels under a shade-net house grow lettuce, pak choi, kangkung and basil in 4–6 weeks, fed partly by aquaponic water and partly by organic liquid fertiliser brewed from compost.",
  },
  {
    title: "Circular inputs",
    subtitle: "Waste becomes feed and fertiliser",
    body: "Organic waste feeds black soldier fly larvae — high-protein fish and poultry feed. Their frass and plant trimmings become compost. Rain is harvested from the roof and a small solar array with battery runs the pumps and sensors.",
  },
];

export const SENSING_STEPS = [
  {
    title: "Sensor kit",
    body: "An ESP32 controller on every tank measures water temperature, pH, dissolved oxygen, EC/TDS, tank level, air climate and pump current.",
  },
  {
    title: "LoRa radio",
    body: "Readings hop by long-range, low-power radio to a small gateway at the suco office — no Wi-Fi needed at the farm.",
  },
  {
    title: "Vorakai link",
    body: "The gateway shares the suco's satellite connection and uploads compressed batches — just a few kilobytes an hour.",
  },
  {
    title: "Hub & Tulun VIEM",
    body: "The VIEM Hub dashboard watches every unit, while Tulun VIEM sends plain-Tetum alerts and advice on WhatsApp or SMS.",
  },
];

export const TULUN_MAY = [
  "Explain sensor alerts and first-response steps",
  "Answer from the vetted VIEM manual, with sources",
  "Log harvest weights and send buy-back orders",
  "Escalate to a named VIEM agronomist",
];

export const TULUN_MAY_NOT = [
  "Recommend chemicals, medicines or pesticides",
  "Invent answers outside the manual",
  "Change prices or payments",
  "Close an alert without human confirmation",
];

export const DEGRADATION = [
  { title: "WhatsApp assistant", body: "Tetum-first answers from the vetted manual." },
  { title: "Numbered SMS menu", body: "Works on any phone when data is down." },
  { title: "Laminated guide on site", body: "Printed first-response steps at every tank." },
  { title: "Phone call to the Hub", body: "A VIEM agronomist is always accountable." },
];

export const IMPACT = [
  {
    title: "Jobs close to home",
    body: "Each Suku Unit employs 3–5 cooperative members, prioritising women and young people. Operators earn a share of sales, not a stipend.",
  },
  {
    title: "School nutrition",
    body: "Units at schools supply fresh greens and fish to school meals (Merenda Eskolar) and double as a living classroom.",
  },
  {
    title: "Skills that transfer",
    body: "The VIEM Academy trains operators in fish care, water chemistry, basic electronics, record-keeping and digital tools.",
  },
  {
    title: "Cleaner sucos",
    body: "Each unit diverts an estimated 50–100 kg of organic waste a week from burning or dumping.",
  },
  {
    title: "Climate resilience",
    body: "Year-round production that does not depend on rainfall or soil fertility — using a fraction of the water.",
  },
];

export const REVENUE_STREAMS = [
  { stream: "Fresh greens & herbs", customer: "Supermarkets, hotels, restaurants", earns: "Margin between buy-back and wholesale price" },
  { stream: "Fresh fish", customer: "Markets, restaurants, households", earns: "Margin on cooperative fish, plus Hub production" },
  { stream: "School supply", customer: "Schools, municipal meal programmes", earns: "Contracted weekly supply" },
  { stream: "BSF feed & compost", customer: "Fish, poultry and pig farmers", earns: "Direct product sales from the Hub" },
  { stream: "Unit kits & setup", customer: "Cooperatives, NGOs, government, donors", earns: "Kit sale or financed lease, installation fee" },
  { stream: "Training & support", customer: "Operators, schools, development partners", earns: "Academy courses; monthly support subscription" },
];

export const UNIT_ECONOMICS = [
  { item: "Set-up: tanks, NFT, shade house, solar & battery, sensors, gateway share", value: "3,500 – 4,500" },
  { item: "Monthly sales: greens, herbs, fish", value: "350 – 500" },
  { item: "Monthly costs: fingerlings, seed, top-up nutrients, maintenance", value: "90 – 130" },
  { item: "Monthly VIEM support fee (monitoring, assistant, visits)", value: "25" },
  { item: "Monthly net to cooperative", value: "235 – 345", highlight: true },
  { item: "Payback on set-up", value: "12 – 18 months", highlight: true },
];

export const ROLLOUT = [
  {
    phase: "Pilot",
    when: "3 months",
    what: "VIEM Hub demo system plus 2 Suku Units at Vorakai-connected sites — one school, one suco office — with sensors and Tulun VIEM live.",
    measure: "Fish survival > 90% · alerts answered < 2 hours · first buyer contract",
  },
  {
    phase: "Year 1",
    when: "10 units",
    what: "10 Suku Units in 3 municipalities, a black soldier fly feed plant at the Hub, and school supply agreements.",
    measure: "50 operators trained · 40% of feed from BSF",
  },
  {
    phase: "Years 2–3",
    when: "30+ units",
    what: "30+ units, a second hub outside Dili, and kit sales to partners.",
    measure: "Hub break-even · operators earning above minimum wage",
  },
];

export const ASSUMPTIONS = [
  { assumption: "Buyers in Dili will pay near-import prices for reliable local greens", status: "Guessed — riskiest", test: "Sign letters of intent with 3 buyers before building; sell Hub produce for 4 weeks" },
  { assumption: "BSF larvae can replace much of imported fish feed", status: "Known elsewhere in the region", test: "One BSF bin at the Hub; measure feed conversion over one fish cycle" },
  { assumption: "Cooperatives will keep daily routines without VIEM on site", status: "Guessed", test: "Pilot with weekly remote check-ins only; log missed tasks" },
  { assumption: "Tetum operators will trust and use WhatsApp alerts", status: "Partly known", test: "Paper prototype of 10 alert messages tested with 5 operators" },
  { assumption: "Solar sizing survives the wet season", status: "Calculated", test: "Run the Hub unit on solar only through one rainy month" },
];

export const FAILURES = [
  { type: "Technical", failure: "Pump or power failure kills fish", response: "Battery-backed aerator; local rule triggers without internet; loud on-site buzzer" },
  { type: "Technical", failure: "Satellite link down for days", response: "Controller stores 30 days of data; SMS fallback; printed response guide" },
  { type: "Technical", failure: "Sensor drift gives false readings", response: "Monthly calibration kit; weekly manual test strip logged in the app" },
  { type: "Financial", failure: "Buyer drops out or prices fall", response: "Spread across 5+ buyer types; school contracts as base demand" },
  { type: "Financial", failure: "Cooperative cannot repay the lease", response: "Repayment as a share of sales, not a fixed amount; wet-season grace period" },
  { type: "Social", failure: "Disputes over income or control", response: "Written cooperative rules agreed with the xefe suku; transparent sales records on the dashboard" },
  { type: "Social", failure: "Operators leave for other work", response: "Train 2 back-up operators per unit; certificates that reward staying" },
];

export const ALTERNATIVES = [
  { title: "Soil greenhouses only", verdict: "Rejected as the core", body: "Cheaper to build, but still depend on soil fertility and far more water, and produce no protein. Kept for Hub nursery crops." },
  { title: "Hydroponics with imported mineral nutrients only", verdict: "Rejected", body: "Simpler to run, but ties every farm to imported inputs and breaks the circular model." },
  { title: "Full cloud IoT platform with live streaming", verdict: "Replaced", body: "Rich data, but fails on shared satellite links and outages. Replaced by offline-first local rules and small batch uploads." },
  { title: "Donated units to communities", verdict: "Replaced", body: "Fast to launch, but past donor units were abandoned once support ended. Replaced by cooperative ownership, lease repayment and guaranteed buy-back." },
];

export const CONSTRAINTS = [
  { title: "Budget halved", body: "Drop fish from the first units and run hydroponics with compost-brewed nutrients; share one sensor kit across two neighbouring units." },
  { title: "No grid or weak solar", body: "Switch to a gravity-fed, low-pump design with timer-based flow and a manual aerator; fewer fish per litre." },
  { title: "Severe drought", body: "The closed loop already recycles water; add a covered storage tank and prioritise high-value, low-volume crops." },
  { title: "Remote suco, hours from Dili", body: "Sell locally first (school, market, clinic), aggregate only surplus fish, and let the dashboard schedule fewer, fuller collection runs." },
];

export const JUDGING = [
  { criterion: "Technical correctness & deployability", weight: 30, answer: "Off-the-shelf parts, offline-first sensing and a pilot-ready plan." },
  { criterion: "Critical thinking", weight: 20, answer: "Assumptions, alternatives, failure modes and live adaptation to changed constraints." },
  { criterion: "Timor constraints", weight: 20, answer: "Solar power, the dry season, shared satellite links, Tetum-first and suco governance." },
  { criterion: "Clarity & supportability", weight: 15, answer: "Small data footprint on Vorakai links; VIEM runs support, not Vorakai." },
  { criterion: "Impact on connected sites", weight: 10, answer: "Every connected school or suco office can host a unit." },
  { criterion: "Communication", weight: 5, answer: "Plain-language Tetum alerts and cooperative training." },
];

export const WHY_VIEM = [
  { title: "Smart & efficient farming", body: "Modern methods, technology and data-driven practice improve productivity, efficiency and consistency across our operations." },
  { title: "Regenerative agriculture", body: "Practices that restore resources, improve long-term productivity and build a healthier, more resilient agricultural ecosystem." },
  { title: "Circular agriculture", body: "Organic waste and by-products become valuable resources, including animal feed — reducing waste and maximising efficiency." },
  { title: "Local impact, sustainable growth", body: "Rooted in Timor-Leste, we pair local understanding with modern practice to create scalable value for communities." },
];

export const SERVICES = [
  {
    title: "Smart farming & agriculture",
    body: "Modern farming systems that combine technology, efficient cultivation and responsible resource management for consistent, sustainable production.",
    points: [
      "Smart farming and monitoring systems",
      "Modern cultivation and irrigation methods",
      "Crop and livestock productivity management",
      "Data-driven farm management",
    ],
  },
  {
    title: "Regenerative & circular farming",
    body: "Circular systems that turn organic waste and agricultural by-products back into valuable resources.",
    points: [
      "Organic waste processing and utilisation",
      "By-products converted into animal feed",
      "Integrated crop and livestock systems",
      "Soil health and resource regeneration",
    ],
  },
  {
    title: "Products & distribution",
    body: "Quality-focused production and efficient distribution that bring VIEM and local produce from farm to market.",
    points: [
      "Fresh agricultural produce",
      "Livestock and farm-derived products",
      "Quality control and standardisation",
      "Market access and distribution",
    ],
  },
];

export const GOALS = [
  "Strengthen agricultural production in Timor-Leste",
  "Maximise productivity through smarter farming",
  "Turn organic waste into valuable resources",
  "Generate lasting economic and environmental value",
];

export type TeamMember = {
  name: string;
  role: string;
  focus: string;
  bio: string;
  photo: "deviana" | "yuma" | "escolastico" | null;
};

export const TEAM: TeamMember[] = [
  {
    name: "Deviana Sarmento",
    role: "Director",
    focus: "Finance and operations; business model, cooperative finance and buyer contracts.",
    bio: "Finance professional with strong operational management experience in the service industry and a deep understanding of the Timor-Leste business environment.",
    photo: "deviana",
  },
  {
    name: "Escolastico Sarmento",
    role: "General Manager",
    focus: "Marketing and distribution; offtake with supermarkets, hotels and schools.",
    bio: "Extensive experience in institutional service marketing in Indonesia and product marketing in Timor-Leste.",
    photo: "escolastico",
  },
  {
    name: "Yuma Rafi",
    role: "Commissioner",
    focus: "Operational systems across Indonesia and Timor-Leste; Hub set-up and scaling.",
    bio: "Strong expertise in operational management and building efficient business systems in Indonesia and Timor-Leste.",
    photo: "yuma",
  },
  {
    name: "Luis Ferdinand",
    role: "Developer & IoT Implementation",
    focus: "Sensor kits, LoRa gateway, the Tulun VIEM assistant and the VIEM dashboard; on-site installation and technical support.",
    bio: "Builds the connected layer of VIEM — from the ESP32 sensor kit on each tank to the Hub dashboard and the Tetum-first assistant.",
    photo: null,
  },
];

export const KONEKTA = {
  url: "https://vorakai.com/konekta/",
  name: "Vorakai Konekta Challenge 2026",
  track: "AI & Data",
  grandChallenge: "Statement E — Tetum-first AI for public services: agricultural advice for farmers",
  dates: [
    { when: "12 Sep – 6 Oct", what: "Stage 1 — Open qualifier" },
    { when: "7 Oct – 12 Nov", what: "Stage 2 — Build sprint" },
    { when: "5–6 Dec", what: "Stage 3 — Finals weekend, Dili" },
  ],
};

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/solution", label: "Solution" },
  { href: "/impact", label: "Impact" },
  { href: "/proposal", label: "Proposal" },
];
