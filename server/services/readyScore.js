/**
 * ReadyScore engine — the signature metric.
 *
 * A 0–100 score of how ready a student is for a SPECIFIC target role,
 * built from 4 explainable pillars:
 *   Skills 40% · Applied ability 25% · Consistency 20% · Soft signals 15%
 *
 * It also returns the skill gap ("what to fix next") so the score is actionable.
 */

export const PILLAR_WEIGHTS = {
  skills: 0.4,
  applied: 0.25,
  consistency: 0.2,
  soft: 0.15,
};

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const round = (n) => Math.round(n);

/**
 * @param {Object} profile - user.studentProfile (skills, projectsCompleted, activeDays, ...)
 * @param {Object} role    - target Role doc (requiredSkills, requiredProjects)
 */
export function computeReadyScore(profile = {}, role = null) {
  const skills = profile.skills || [];
  const skillMap = new Map(skills.map((s) => [s.name.toLowerCase(), s.level || 0]));

  // ---- Pillar 1: Skills (40%) — coverage of the role's required skills ----
  const required = role?.requiredSkills || [];
  const gaps = [];
  let skillsScore = 0;

  if (required.length > 0) {
    const totalWeight = required.reduce((sum, r) => sum + (r.weight || 1), 0);
    let weightedCoverage = 0;

    for (const req of required) {
      const have = skillMap.get(req.name.toLowerCase()) || 0;
      const need = req.minLevel || 60;
      const coverage = clamp((have / need) * 100); // % of the requirement met
      weightedCoverage += coverage * (req.weight || 1);

      if (have < need) {
        gaps.push({
          skill: req.name,
          have,
          need,
          gap: need - have,
          weight: req.weight || 1,
        });
      }
    }
    skillsScore = weightedCoverage / totalWeight;
  } else {
    // No target role set: fall back to the student's average skill level
    skillsScore = skills.length
      ? skills.reduce((sum, s) => sum + (s.level || 0), 0) / skills.length
      : 0;
  }

  // ---- Pillar 2: Applied ability (25%) — real projects completed ----
  const requiredProjects = role?.requiredProjects || 3;
  const appliedScore = clamp(((profile.projectsCompleted || 0) / requiredProjects) * 100);

  // ---- Pillar 3: Consistency (20%) — active learning days (target: 30) ----
  const consistencyScore = clamp(((profile.activeDays || 0) / 30) * 100);

  // ---- Pillar 4: Soft signals (15%) — endorsements + mock interviews ----
  const softRaw = (profile.mentorEndorsements || 0) * 20 + (profile.mockInterviews || 0) * 25;
  const softScore = clamp(softRaw);

  // ---- Weighted total ----
  const total =
    skillsScore * PILLAR_WEIGHTS.skills +
    appliedScore * PILLAR_WEIGHTS.applied +
    consistencyScore * PILLAR_WEIGHTS.consistency +
    softScore * PILLAR_WEIGHTS.soft;

  // Sort gaps by biggest impact (gap size × weight) — the fastest wins first
  gaps.sort((a, b) => b.gap * b.weight - a.gap * a.weight);

  return {
    readyScore: round(total),
    targetRole: role?.name || profile.targetRole || 'Not set',
    verdict: verdictFor(round(total)),
    pillars: {
      skills: { score: round(skillsScore), weight: PILLAR_WEIGHTS.skills * 100 },
      applied: { score: round(appliedScore), weight: PILLAR_WEIGHTS.applied * 100 },
      consistency: { score: round(consistencyScore), weight: PILLAR_WEIGHTS.consistency * 100 },
      soft: { score: round(softScore), weight: PILLAR_WEIGHTS.soft * 100 },
    },
    gaps: gaps.slice(0, 5), // top 5 things to fix
    recommendations: buildRecommendations(gaps, appliedScore, consistencyScore, softScore),
  };
}

function verdictFor(score) {
  if (score >= 80) return { label: 'Interview ready', tone: 'success' };
  if (score >= 60) return { label: 'Nearly ready', tone: 'good' };
  if (score >= 40) return { label: 'Getting there', tone: 'warn' };
  return { label: 'Early stage', tone: 'danger' };
}

// Turn the score into an actionable roadmap ("what to do next")
function buildRecommendations(gaps, applied, consistency, soft) {
  const recs = [];
  for (const g of gaps.slice(0, 3)) {
    recs.push(`Raise ${g.skill} from ${g.have} to ${g.need} (take a course/test).`);
  }
  if (applied < 60) recs.push('Complete more real projects to boost Applied ability.');
  if (consistency < 60) recs.push('Keep a daily learning streak to improve Consistency.');
  if (soft < 60) recs.push('Do a mock interview and get a mentor endorsement.');
  return recs;
}
