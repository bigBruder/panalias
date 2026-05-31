/**
 * Ukrainian team name generator
 * Generates funny team names: Adjective + Noun (with emoji)
 */

const adjectives = [
  "Хитрі", "Грізні", "Космічні", "Вогняні", "Блискавичні",
  "Шалені", "Епічні", "Магічні", "Легендарні", "Нестримні",
  "Відважні", "Залізні", "Кришталеві", "Турбо", "Надзвукові",
  "Таємничі", "Іскристі", "Крижані", "Сонячні", "Громові",
  "Тіньові", "Зоряні", "Смарагдові", "Рубінові", "Діамантові",
  "Атомні", "Квантові", "Лазерні", "Ультра", "Мега",
  "Супер", "Гіпер", "Небесні", "Підземні", "Підводні",
  "Полум'яні", "Крилаті", "Рогаті", "Зубасті", "Пухнасті",
  "Колючі", "Слизькі", "Сталеві", "Титанові", "Безстрашні",
  "Могутні", "Спритні", "Прудкі", "Дерзькі", "Неймовірні",
];

const nouns = [
  "Лисиці", "Ведмеді", "Козаки", "Дракони", "Їжаки",
  "Вовки", "Орли", "Тигри", "Леви", "Акули",
  "Панди", "Єноти", "Бобри", "Бурундуки", "Соколи",
  "Коти", "Дельфіни", "Єдинороги", "Фенікси", "Грифони",
  "Мамонти", "Динозаври", "Кракени", "Василіски", "Мінотаври",
  "Гаргулі", "Вовкулаки", "Циклопи", "Титани", "Олімпійці",
  "Спартанці", "Самураї", "Вікінги", "Пірати", "Ніндзі",
  "Ковбої", "Мушкетери", "Чарівники", "Рейнджери", "Гвардійці",
  "Берсерки", "Центуріони", "Гладіатори", "Амазонки", "Валькірії",
  "Кентаври", "Сфінкси", "Химери", "Мавки", "Перелесники",
];

const emojis = [
  "🦊", "🐻", "⚔️", "🐉", "🦔",
  "🐺", "🦅", "🐯", "🦁", "🦈",
  "🐼", "🦝", "🦫", "🐿️", "🦅",
  "🐱", "🐬", "🦄", "🔥", "🦅",
  "🦣", "🦕", "🐙", "🐍", "🐂",
  "👹", "🐺", "👁️", "⚡", "🏛️",
  "🛡️", "⚔️", "⛵", "🏴‍☠️", "🥷",
  "🤠", "🤺", "🧙", "🎯", "💂",
  "🪓", "🏛️", "⚔️", "🏹", "⚡",
  "🐴", "🗿", "🔥", "🧚", "✨",
];

/**
 * Generate a random team name
 * @returns {{ name: string, emoji: string }}
 */
export function generateTeamName() {
  const adjIdx = Math.floor(Math.random() * adjectives.length);
  const nounIdx = Math.floor(Math.random() * nouns.length);
  
  return {
    name: `${adjectives[adjIdx]} ${nouns[nounIdx]}`,
    emoji: emojis[nounIdx],
  };
}

/**
 * Generate multiple unique team names
 * @param {number} count
 * @returns {Array<{ name: string, emoji: string }>}
 */
export function generateMultipleTeamNames(count = 2) {
  const names = new Set();
  const results = [];

  while (results.length < count && results.length < adjectives.length * nouns.length) {
    const teamName = generateTeamName();
    if (!names.has(teamName.name)) {
      names.add(teamName.name);
      results.push(teamName);
    }
  }

  return results;
}

// Team colors palette — vibrant, distinct colors
export const teamColors = [
  "#7c3aed", // purple
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#8b5cf6", // violet
  "#06b6d4", // cyan
];
