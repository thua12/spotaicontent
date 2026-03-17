/**
 * Returns a brief plain-language explanation of why content got a given AI score.
 */
export function scoreExplanation(
  aiScore: number,
  contentType: string,
  sentenceCount: number = 0
): string {
  const type = contentType.toLowerCase();

  if (type === "text") {
    if (aiScore >= 67) {
      const reasons = [
        "uniform sentence structure with little variation",
        "overly formal tone with few personal touches",
        "repetitive phrasing patterns common in AI output",
        "lack of first-hand experience or personal voice",
      ];
      return `The text shows signs commonly associated with AI-generated writing, including ${reasons[aiScore % reasons.length]}. ${sentenceCount > 0 ? "Individual sentences are highlighted above based on their AI probability." : ""}`.trim();
    }
    if (aiScore >= 34) {
      return "The text has a mix of human and AI-like characteristics. Some passages read naturally while others show patterns typical of AI writing tools. It may be human-written with AI assistance, or AI-generated with human edits.";
    }
    return "The text shows signs typical of human writing — natural variation in sentence length, personal voice, and an informal tone that AI models tend to struggle with. It may contain minor imperfections consistent with human authorship.";
  }

  if (type === "image") {
    if (aiScore >= 67) {
      return "The image shows visual patterns commonly produced by AI image generators, such as overly smooth textures, unnatural lighting consistency, or subtle artifacts in fine details like hair, hands, or backgrounds.";
    }
    if (aiScore >= 34) {
      return "The image has some characteristics of AI generation but also elements consistent with a real photograph or human-made graphic. The algorithm cannot confidently classify it either way.";
    }
    return "The image shows characteristics typical of real photographs or human-made graphics — natural noise, lighting inconsistencies, and detail patterns that AI generators tend not to replicate accurately.";
  }

  if (type === "video") {
    if (aiScore >= 67) {
      return "The video shows patterns associated with AI-generated content, such as unnatural motion, inconsistent facial features across frames, or visual artifacts typical of deepfake or generative video models.";
    }
    if (aiScore >= 34) {
      return "The video has some AI-like characteristics but the algorithm is not confident either way. Motion patterns and visual consistency are ambiguous.";
    }
    return "The video shows characteristics consistent with real footage — natural motion, consistent lighting, and frame-to-frame detail that AI video generators typically struggle to reproduce.";
  }

  return "The score is based on patterns in the content compared against known AI and human-generated samples.";
}
