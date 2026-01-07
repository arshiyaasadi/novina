export interface Question {
  id: number;
  question: string;
  options: {
    id: number;
    text: string;
    score: number; // 1, 2, or 3
  }[];
}

export const questions: Question[] = [
  {
    id: 1,
    question: "فرض کن یک سال از امروز گذشته و به سرمایه‌گذاری‌ای که بیشتر از بقیه دوستش داری نگاه می‌کنی. کدوم نتیجه باعث می‌شه با خودت بگی «تصمیم بدی نگرفتم»؟",
    options: [
      {
        id: 1,
        text: "اگر ارزش پولم حفظ شده باشه و نسبت به تورم عقب نیفتاده باشم، برام قابل قبوله.",
        score: 1, // conservative
      },
      {
        id: 2,
        text: "اگه بازدهی مشخص و بالاتری از گزینه‌های کم‌ریسک داشته باشه، راضی‌ام.",
        score: 2, // balanced
      },
      {
        id: 3,
        text: "انتظار دارم بازدهی خیلی بالاتری بگیرم؛ وگرنه اصلاً وارد این نوع سرمایه‌گذاری نمی‌شدم.",
        score: 3, // aggressive
      },
    ],
  },
  {
    id: 2,
    question: "فرض کن بازار دچار افت شده و ارزش سرمایه‌گذاری‌ات حدود ۱۰٪ کمتر از قبل شده. معمولاً کدوم رفتار به تو نزدیک‌تره؟",
    options: [
      {
        id: 1,
        text: "ترجیح می‌دم از موقعیت خارج بشم تا جلوی ضرر بیشتر رو بگیرم، حتی اگه بعداً بازار برگرده.",
        score: 1, // conservative
      },
      {
        id: 2,
        text: "شرایط رو بررسی می‌کنم ولی تصمیم فوری نمی‌گیرم و منتظر می‌مونم.",
        score: 2, // balanced
      },
      {
        id: 3,
        text: "افت قیمت رو بخشی از مسیر می‌دونم و اگه شرایط منطقی باشه، حتی ممکنه سرمایه‌گذاری رو بیشتر کنم.",
        score: 3, // aggressive
      },
    ],
  },
  {
    id: 3,
    question: "این پولی که می‌خوای سرمایه‌گذاری کنی، از نظر زمانی چه جایگاهی توی زندگی‌ت داره؟",
    options: [
      {
        id: 1,
        text: "ممکنه در آینده نزدیک بهش نیاز پیدا کنم، بنابراین دسترسی سریع برام مهمه.",
        score: 1, // conservative
      },
      {
        id: 2,
        text: "برای یک هدف مشخص در بازه حدود دو تا سه سال کنار گذاشتمش.",
        score: 2, // balanced
      },
      {
        id: 3,
        text: "این سرمایه برای بلندمدته و فعلاً برنامه‌ای برای خرج کردنش ندارم.",
        score: 3, // aggressive
      },
    ],
  },
  {
    id: 4,
    question: "کدوم وضعیت باعث می‌شه از نظر ذهنی احساس راحت‌تری داشته باشی؟",
    options: [
      {
        id: 1,
        text: "بازدهی کمتر ولی قابل پیش‌بینی، بدون نوسان‌های آزاردهنده.",
        score: 1, // conservative
      },
      {
        id: 2,
        text: "مقداری نوسان رو می‌پذیرم، به شرطی که منطق و برنامه پشتش باشه.",
        score: 2, // balanced
      },
      {
        id: 3,
        text: "نوسان برام مسئله‌ی اصلی نیست، چون تمرکزم روی نتیجه‌ی بلندمدته.",
        score: 3, // aggressive
      },
    ],
  },
  {
    id: 5,
    question: "نقش خودت رو در سرمایه‌گذاری چطور تعریف می‌کنی؟",
    options: [
      {
        id: 1,
        text: "ترجیح می‌دم تصمیم‌های اصلی توسط افراد یا ابزارهای تخصصی گرفته بشه.",
        score: 1, // conservative
      },
      {
        id: 2,
        text: "دوست دارم در جریان تصمیم‌ها باشم، اما مسئولیت نهایی رو به متخصص‌ها می‌سپرم.",
        score: 2, // balanced
      },
      {
        id: 3,
        text: "خودم تصمیم‌گیر اصلی هستم و مسئولیت نتایجش رو هم می‌پذیرم.",
        score: 3, // aggressive
      },
    ],
  },
];

export type RiskProfile = "conservative" | "balanced" | "aggressive";

export interface RiskResult {
  profile: RiskProfile;
  score: number;
  emoji: string;
  title: string;
  description: string;
  recommendation: string;
}

export function calculateRiskProfile(answers: number[]): RiskResult {
  // Calculate score properly
  // answers array contains option indices (0, 1, or 2) for each question
  let actualScore = 0;
  for (let i = 0; i < answers.length; i++) {
    const question = questions[i];
    const optionIndex = answers[i];
    const option = question?.options[optionIndex];
    if (option) {
      actualScore += option.score;
    }
  }

  if (actualScore >= 5 && actualScore <= 8) {
    return {
      profile: "conservative",
      score: actualScore,
      emoji: "🛡️",
      title: "محافظه‌کار",
      description: "اولویت با حفظ سرمایه و آرامش ذهنی",
      recommendation: "صندوق‌های درآمد ثابت و دارایی‌های کم‌نوسان",
    };
  } else if (actualScore >= 9 && actualScore <= 12) {
    return {
      profile: "balanced",
      score: actualScore,
      emoji: "⚖️",
      title: "متعادل",
      description: "تعادل بین رشد و ریسک",
      recommendation: "سبد ترکیبی از سهام، طلا و درآمد ثابت",
    };
  } else {
    return {
      profile: "aggressive",
      score: actualScore,
      emoji: "🚀",
      title: "جسور",
      description: "تمایل به بازدهی بالا با پذیرش ریسک بیشتر",
      recommendation: "سرمایه‌گذاری در سهام و دارایی‌های با پتانسیل رشد بالا",
    };
  }
}

/**
 * Get RiskResult by profile type
 * If score is provided, it will be used; otherwise, a default score will be calculated based on profile
 */
export function getRiskResultByProfile(
  profile: RiskProfile,
  score?: number,
  answers?: number[]
): RiskResult {
  // If score is not provided, calculate it from answers if available
  let actualScore = score;
  if (actualScore === undefined && answers) {
    actualScore = 0;
    for (let i = 0; i < answers.length; i++) {
      const question = questions[i];
      const optionIndex = answers[i];
      const option = question?.options[optionIndex];
      if (option) {
        actualScore += option.score;
      }
    }
  }
  // Default score if neither score nor answers provided
  if (actualScore === undefined) {
    actualScore = profile === "conservative" ? 6 : profile === "balanced" ? 10 : 14;
  }

  switch (profile) {
    case "conservative":
      return {
        profile: "conservative",
        score: actualScore,
        emoji: "🛡️",
        title: "محافظه‌کار",
        description: "اولویت با حفظ سرمایه و آرامش ذهنی",
        recommendation: "صندوق‌های درآمد ثابت و دارایی‌های کم‌نوسان",
      };
    case "balanced":
      return {
        profile: "balanced",
        score: actualScore,
        emoji: "⚖️",
        title: "متعادل",
        description: "تعادل بین رشد و ریسک",
        recommendation: "سبد ترکیبی از سهام، طلا و درآمد ثابت",
      };
    case "aggressive":
      return {
        profile: "aggressive",
        score: actualScore,
        emoji: "🚀",
        title: "جسور",
        description: "تمایل به بازدهی بالا با پذیرش ریسک بیشتر",
        recommendation: "سرمایه‌گذاری در سهام و دارایی‌های با پتانسیل رشد بالا",
      };
  }
}

