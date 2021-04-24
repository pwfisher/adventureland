// [...new Set(Object.entries(G.skills).map(([_, o]) => o.type).filter(Boolean))]
export type SkillType = 'ability' | 'skill' | 'gm' | 'utility' | 'monster' | 'passive'
