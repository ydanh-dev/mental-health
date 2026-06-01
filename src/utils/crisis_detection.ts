const crisisPatterns = [
  /mu[oố]n\s+ch[eế]t/i,
  /kh[oô]ng\s+mu[oố]n\s+s[oố]ng/i,
  /t[uự]\s*t[uử]/i,
  /k[eế]t\s+th[uú]c\s+cu[oộ]c\s+[đd][ơờ]i/i,
  /l[aà]m\s+[đd]au\s+b[aả]n\s+th[aâ]n/i,
  /t[oô]i\s+s[ẽe]\s+ch[eế]t/i,
  /ch[eế]t\s+cho\s+xong/i,
  /i\s+want\s+to\s+die/i,
  /kill\s+myself/i,
  /end\s+my\s+life/i,
  /hurt\s+myself/i,
  /suicide|suicidal/i,
];

export function containsCrisisLanguage(text: string) {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return false;
  }

  return crisisPatterns.some((pattern) => pattern.test(normalizedText));
}
