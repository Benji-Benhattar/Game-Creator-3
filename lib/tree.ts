export type Subject = {
  id: string;
  name: string;
  blurb: string;
  parent: string | null;
  children: string[];
  related: string[];
};

const subjects: Subject[] = [
  {
    id: "science",
    name: "Science",
    blurb: "The systematic study of the natural world through observation and experiment.",
    parent: null,
    children: ["physics", "chemistry", "biology", "mathematics", "earth-science", "astronomy", "computer-science"],
    related: [],
  },

  // Physics
  {
    id: "physics",
    name: "Physics",
    blurb: "The science of matter, energy, and the fundamental forces that govern them.",
    parent: "science",
    children: ["classical-mechanics", "thermodynamics", "electromagnetism", "quantum-mechanics", "relativity", "particle-physics"],
    related: ["mathematics", "astronomy", "chemistry"],
  },
  {
    id: "classical-mechanics",
    name: "Classical Mechanics",
    blurb: "Newton's laws, motion, forces, energy, and momentum at human scales.",
    parent: "physics",
    children: [],
    related: ["calculus", "thermodynamics", "engineering-mechanics"],
  },
  {
    id: "thermodynamics",
    name: "Thermodynamics",
    blurb: "Heat, work, entropy, and the laws governing energy transformations.",
    parent: "physics",
    children: [],
    related: ["statistical-mechanics", "physical-chemistry", "classical-mechanics"],
  },
  {
    id: "electromagnetism",
    name: "Electromagnetism",
    blurb: "Electric and magnetic fields, light, and Maxwell's equations.",
    parent: "physics",
    children: [],
    related: ["quantum-mechanics", "relativity", "calculus"],
  },
  {
    id: "quantum-mechanics",
    name: "Quantum Mechanics",
    blurb: "The probabilistic physics of atoms, particles, and waves.",
    parent: "physics",
    children: [],
    related: ["particle-physics", "physical-chemistry", "linear-algebra"],
  },
  {
    id: "relativity",
    name: "Relativity",
    blurb: "Einstein's theory of space, time, gravity, and the speed of light.",
    parent: "physics",
    children: [],
    related: ["cosmology", "electromagnetism", "geometry"],
  },
  {
    id: "particle-physics",
    name: "Particle Physics",
    blurb: "Quarks, leptons, bosons, and the Standard Model of fundamental particles.",
    parent: "physics",
    children: [],
    related: ["quantum-mechanics", "cosmology"],
  },
  {
    id: "statistical-mechanics",
    name: "Statistical Mechanics",
    blurb: "Bridges microscopic physics to macroscopic thermodynamic behavior.",
    parent: "physics",
    children: [],
    related: ["thermodynamics", "probability", "quantum-mechanics"],
  },

  // Chemistry
  {
    id: "chemistry",
    name: "Chemistry",
    blurb: "The science of substances, their properties, and how they react.",
    parent: "science",
    children: ["organic-chemistry", "inorganic-chemistry", "physical-chemistry", "biochemistry", "analytical-chemistry"],
    related: ["physics", "biology", "materials-science"],
  },
  {
    id: "organic-chemistry",
    name: "Organic Chemistry",
    blurb: "Carbon-based molecules and the reactions of life and industry.",
    parent: "chemistry",
    children: [],
    related: ["biochemistry", "pharmacology"],
  },
  {
    id: "inorganic-chemistry",
    name: "Inorganic Chemistry",
    blurb: "Non-carbon compounds: metals, minerals, and coordination complexes.",
    parent: "chemistry",
    children: [],
    related: ["materials-science", "geology"],
  },
  {
    id: "physical-chemistry",
    name: "Physical Chemistry",
    blurb: "Applying physics to chemistry: rates, energy, and quantum behavior.",
    parent: "chemistry",
    children: [],
    related: ["thermodynamics", "quantum-mechanics", "statistical-mechanics"],
  },
  {
    id: "biochemistry",
    name: "Biochemistry",
    blurb: "The chemistry of living systems — proteins, enzymes, metabolism.",
    parent: "chemistry",
    children: [],
    related: ["organic-chemistry", "cell-biology", "molecular-biology"],
  },
  {
    id: "analytical-chemistry",
    name: "Analytical Chemistry",
    blurb: "Identifying and quantifying substances using instruments and methods.",
    parent: "chemistry",
    children: [],
    related: ["physical-chemistry", "statistics"],
  },

  // Biology
  {
    id: "biology",
    name: "Biology",
    blurb: "The study of living organisms and the processes of life.",
    parent: "science",
    children: ["cell-biology", "genetics", "evolution", "ecology", "microbiology", "molecular-biology", "neuroscience"],
    related: ["chemistry", "earth-science"],
  },
  {
    id: "cell-biology",
    name: "Cell Biology",
    blurb: "The structure and function of the cell, life's basic unit.",
    parent: "biology",
    children: [],
    related: ["biochemistry", "molecular-biology", "genetics"],
  },
  {
    id: "genetics",
    name: "Genetics",
    blurb: "Heredity, DNA, genes, and how traits pass between generations.",
    parent: "biology",
    children: [],
    related: ["molecular-biology", "evolution", "statistics"],
  },
  {
    id: "evolution",
    name: "Evolution",
    blurb: "How species change over time through selection, drift, and mutation.",
    parent: "biology",
    children: [],
    related: ["genetics", "ecology", "geology"],
  },
  {
    id: "ecology",
    name: "Ecology",
    blurb: "How organisms interact with each other and their environment.",
    parent: "biology",
    children: [],
    related: ["evolution", "earth-science", "statistics"],
  },
  {
    id: "microbiology",
    name: "Microbiology",
    blurb: "Bacteria, viruses, fungi, and other microscopic life.",
    parent: "biology",
    children: [],
    related: ["cell-biology", "biochemistry", "genetics"],
  },
  {
    id: "molecular-biology",
    name: "Molecular Biology",
    blurb: "DNA, RNA, proteins, and the molecular machinery of life.",
    parent: "biology",
    children: [],
    related: ["genetics", "cell-biology", "biochemistry"],
  },
  {
    id: "neuroscience",
    name: "Neuroscience",
    blurb: "The structure and function of nervous systems and brains.",
    parent: "biology",
    children: [],
    related: ["cell-biology", "psychology-cognition", "ai"],
  },

  // Mathematics
  {
    id: "mathematics",
    name: "Mathematics",
    blurb: "The science of structure, quantity, and abstract patterns.",
    parent: "science",
    children: ["algebra", "calculus", "geometry", "linear-algebra", "probability", "statistics", "number-theory", "topology"],
    related: ["physics", "computer-science"],
  },
  {
    id: "algebra",
    name: "Algebra",
    blurb: "Symbols, equations, and the study of mathematical structures.",
    parent: "mathematics",
    children: [],
    related: ["number-theory", "linear-algebra"],
  },
  {
    id: "calculus",
    name: "Calculus",
    blurb: "The mathematics of change — derivatives, integrals, and limits.",
    parent: "mathematics",
    children: [],
    related: ["classical-mechanics", "electromagnetism"],
  },
  {
    id: "geometry",
    name: "Geometry",
    blurb: "Shape, size, position, and the properties of space.",
    parent: "mathematics",
    children: [],
    related: ["topology", "relativity"],
  },
  {
    id: "linear-algebra",
    name: "Linear Algebra",
    blurb: "Vectors, matrices, and linear transformations — the language of ML and quantum.",
    parent: "mathematics",
    children: [],
    related: ["quantum-mechanics", "ai", "algebra"],
  },
  {
    id: "probability",
    name: "Probability",
    blurb: "The mathematical study of uncertainty and random processes.",
    parent: "mathematics",
    children: [],
    related: ["statistics", "statistical-mechanics"],
  },
  {
    id: "statistics",
    name: "Statistics",
    blurb: "Collecting, analyzing, and interpreting data under uncertainty.",
    parent: "mathematics",
    children: [],
    related: ["probability", "ecology", "ai"],
  },
  {
    id: "number-theory",
    name: "Number Theory",
    blurb: "Properties of integers, primes, and modular arithmetic.",
    parent: "mathematics",
    children: [],
    related: ["cryptography", "algebra"],
  },
  {
    id: "topology",
    name: "Topology",
    blurb: "Properties preserved through continuous deformation of space.",
    parent: "mathematics",
    children: [],
    related: ["geometry", "relativity"],
  },

  // Earth Science
  {
    id: "earth-science",
    name: "Earth Science",
    blurb: "The Earth — its rocks, oceans, atmosphere, and history.",
    parent: "science",
    children: ["geology", "meteorology", "oceanography", "climate-science"],
    related: ["biology", "chemistry"],
  },
  {
    id: "geology",
    name: "Geology",
    blurb: "Rocks, minerals, plate tectonics, and Earth's deep history.",
    parent: "earth-science",
    children: [],
    related: ["evolution", "inorganic-chemistry"],
  },
  {
    id: "meteorology",
    name: "Meteorology",
    blurb: "The atmosphere, weather, and the physics of climate systems.",
    parent: "earth-science",
    children: [],
    related: ["climate-science", "thermodynamics"],
  },
  {
    id: "oceanography",
    name: "Oceanography",
    blurb: "The chemistry, physics, biology, and geology of the oceans.",
    parent: "earth-science",
    children: [],
    related: ["climate-science", "ecology"],
  },
  {
    id: "climate-science",
    name: "Climate Science",
    blurb: "Long-term atmospheric and oceanic patterns and how they change.",
    parent: "earth-science",
    children: [],
    related: ["meteorology", "oceanography", "ecology"],
  },

  // Astronomy
  {
    id: "astronomy",
    name: "Astronomy",
    blurb: "The study of the universe beyond Earth — stars, galaxies, and cosmos.",
    parent: "science",
    children: ["cosmology", "planetary-science", "stellar-astronomy", "astrobiology"],
    related: ["physics", "earth-science"],
  },
  {
    id: "cosmology",
    name: "Cosmology",
    blurb: "The origin, evolution, and large-scale structure of the universe.",
    parent: "astronomy",
    children: [],
    related: ["relativity", "particle-physics"],
  },
  {
    id: "planetary-science",
    name: "Planetary Science",
    blurb: "Planets, moons, asteroids, and the formation of solar systems.",
    parent: "astronomy",
    children: [],
    related: ["geology", "astrobiology"],
  },
  {
    id: "stellar-astronomy",
    name: "Stellar Astronomy",
    blurb: "The life cycles, classes, and properties of stars.",
    parent: "astronomy",
    children: [],
    related: ["particle-physics", "cosmology"],
  },
  {
    id: "astrobiology",
    name: "Astrobiology",
    blurb: "The study of life's origin, distribution, and future in the universe.",
    parent: "astronomy",
    children: [],
    related: ["microbiology", "planetary-science"],
  },

  // Computer Science
  {
    id: "computer-science",
    name: "Computer Science",
    blurb: "The science of computation, information, and algorithms.",
    parent: "science",
    children: ["algorithms", "ai", "cryptography", "systems"],
    related: ["mathematics", "neuroscience"],
  },
  {
    id: "algorithms",
    name: "Algorithms",
    blurb: "Step-by-step procedures for computation and problem solving.",
    parent: "computer-science",
    children: [],
    related: ["mathematics", "ai"],
  },
  {
    id: "ai",
    name: "Artificial Intelligence",
    blurb: "Building systems that learn, reason, and perceive.",
    parent: "computer-science",
    children: [],
    related: ["linear-algebra", "statistics", "neuroscience"],
  },
  {
    id: "cryptography",
    name: "Cryptography",
    blurb: "Securing information through mathematical techniques.",
    parent: "computer-science",
    children: [],
    related: ["number-theory", "algorithms"],
  },
  {
    id: "systems",
    name: "Computer Systems",
    blurb: "Hardware, operating systems, networks, and distributed computing.",
    parent: "computer-science",
    children: [],
    related: ["algorithms", "cryptography"],
  },
];

const byId = new Map(subjects.map((s) => [s.id, s]));

export function getSubject(id: string): Subject | undefined {
  return byId.get(id);
}

export function getRoot(): Subject {
  return byId.get("science")!;
}

export function getAllSubjects(): Subject[] {
  return subjects;
}

export function getChildren(id: string): Subject[] {
  const subject = byId.get(id);
  if (!subject) return [];
  return subject.children.map((cid) => byId.get(cid)!).filter(Boolean);
}

export function getRelated(id: string): Subject[] {
  const subject = byId.get(id);
  if (!subject) return [];
  return subject.related.map((rid) => byId.get(rid)!).filter(Boolean);
}

export function getPath(id: string): Subject[] {
  const path: Subject[] = [];
  let current: Subject | undefined = byId.get(id);
  while (current) {
    path.unshift(current);
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return path;
}

export function isLeaf(id: string): boolean {
  const subject = byId.get(id);
  return !!subject && subject.children.length === 0;
}
