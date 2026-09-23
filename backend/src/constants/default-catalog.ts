export const DEFAULT_CATALOG = {
  Peito: [
    "Supino reto", "Supino reto articulado", "Supino inclinado articulado",
    "Supino declinado articulado", "Mergulho / paralela", "Cross-over baixo",
    "Voador", "Supino inclinado com halteres", "Supino inclinado na barra",
    "Supino reto com halteres", "Supino reto com barra", "Crucifixo inclinado",
    "Crucifixo reto", "Supino máquina", "Cross-over alto", "Supino inclinado no smith",
    "Supino reto no smith"
  ],
  Costas: [
    "Barra fixa", "Remada curvada", "Pulldown", "Remada articulada", "Pull around",
    "Puxador frontal com pegada triângulo", "T-bar row", "Remada baixa",
    "Remada curvada com peito apoiado no banco", "Remada serrote",
    "Puxador frontal com pegada pronada", "Puxador frontal com pegada supinada",
    "High-row supinado", "High-row neutro", "Low-row", "Puxada alta articulada",
    "Pullover máquina"
  ],
  Ombro: [
    "Elevação lateral com halteres", "Elevação lateral na polia baixa",
    "Elevação lateral na polia média", "Elevação frontal com halteres",
    "Elevação frontal na polia baixa", "Desenvolvimento com halteres",
    "Desenvolvimento no smith", "Desenvolvimento na máquina", "Face pull",
    "Crucifixo invertido com halteres", "Voador invertido"
  ],
  Bíceps: [
    "Rosca scott", "Rosca scott unilateral com halter", "Rosca bayesian",
    "Rosca banco 45°", "Rosca direta com barra", "Rosca martelo com halteres",
    "Rosca alternada", "Rosca concentrada", "Rosca martelo na polia"
  ],
  Tríceps: [
    "Tríceps francês na polia", "Tríceps testa na polia", "Tríceps corda",
    "Tríceps carter", "Tríceps unilateral na polia alta", "Paralela"
  ],
  Quadríceps: [
    "Hack 45°", "Leg press 45°", "Agachamento livre", "Agachamento no smith",
    "Agachamento máquina articulada", "Cadeira extensora", "Afundo",
    "Agachamento búlgaro", "Leg press horizontal", "Flexão nórdica reversa",
    "Agachamento pêndulo"
  ],
  Abdômen: [
    "Prancha", "Elevação de pernas", "Abdominal na polia alta",
    "Abdominal na máquina", "Abdominal no banco romano"
  ],
  Antebraço: [
    "Flexão de punho", "Rosca punho", "Rosca de punho inversa"
  ],
  Isquiotibiais: [
    "Mesa flexora", "Cadeira flexora", "Stiff", "Levantamento terra",
    "Agachamento sumo", "Bom dia"
  ],
  Panturrilha: [
    "Panturrilha em pé na máquina", "Panturrilha no leg press horizontal",
    "Panturrilha sentado na máquina", "Panturrilha no leg press 45°",
    "Panturrilha em pé no smith"
  ],
  Adutores: [
    "Adutor na máquina", "Adutor na polia baixa", "Cadeira adutora",
    "Adutor na polia alta", "Adutor na polia baixa em pé", "Abdução de quadril em pé"
  ],
  Glúteos: [
    "Elevação pélvica", "Agachamento búlgaro", "Cadeira abdutora",
    "Glúteo na polia baixa"
  ]
};

export const DEFAULT_TECNICAS = [
  { nome: 'Drop-set', desc: 'Realiza falha, reduz carga 20-30%, falha novamente sem descanso.' },
  { nome: 'Rest-pause', desc: 'Descansar 10-20 segundos e continuar até a falha.' },
  { nome: 'Bi-set', desc: 'Fazer dois exercícios conjugados' },
  { nome: 'Super-set', desc: 'Dois exercícios para grupos musculares antagonistas, feitos em sequência, normalmente com pouco ou nenhum descanso entre eles.' },
  { nome: 'Cluster set', desc: 'Divide a série em blocos menores com pausas mais longas entre eles, priorizando manter força e qualidade das repetições. Ex.: 2 + 2 + 2 + 2.' },
  { nome: 'Myo-reps', desc: 'Série de ativação próxima da falha seguida de mini-séries curtas com pausas breves — alto estímulo com pouco volume e tempo.' },
  { nome: 'Back-off set', desc: 'Depois de uma série pesada, reduz a carga e faz mais repetições. Ex.: 6 reps pesadas → reduz 15% → 10 reps.' },
  { nome: 'Muscle rounds', desc: 'Divide uma série pesada em vários mini-blocos de repetições, com descansos de ~10-15s. Ex.: 4 + 4 + 4 + 4 + 4.' },
];

export const DEFAULT_INSTRUCOES = [
  'Buscar a falha',
  'Manter boa carga com boa execução',
  'Se não tiver 2 polias livres, fazer unilateral',
  'Controlar a descida (excêntrica)',
  'Segurar 1 segundo na contração máxima',
  'Amplitude completa do movimento',
];
