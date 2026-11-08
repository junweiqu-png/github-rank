// GitHub-backed evidence of HOW a repository entered the catalog.
// A seed-list membership is NOT proof of independent discovery.
export const ORGANIC_SOURCES=Object.freeze([
 'period-top100','general-search','recent-search','skill-search'
]);
export const CONFIGURED_SOURCES=Object.freeze([
 ...ORGANIC_SOURCES,'curated-general','curated-skill'
]);
const known=new Set(CONFIGURED_SOURCES);
export function recordDiscovery(previous={},source,at=new Date().toISOString()){
 if(!known.has(source))throw TypeError('Unknown discovery source: '+source);
 if(!Number.isFinite(Date.parse(at)))throw TypeError('Invalid discovery timestamp');
 const prior=Array.isArray(previous.discovery_sources)?previous.discovery_sources.filter(x=>known.has(x)):[];
 const dates=previous.discovery_seen_at&&typeof previous.discovery_seen_at==='object'&&!Array.isArray(previous.discovery_seen_at)?previous.discovery_seen_at:{};
 return {
  discovery_sources:[...new Set([...prior,source])].sort(),
  discovery_seen_at:{...dates,[source]:at},
 };
}
export function independentDiscovery(record){
 return Array.isArray(record?.discovery_sources)&&record.discovery_sources.some(s=>ORGANIC_SOURCES.includes(s));
}
export function explainDiscovery(record){
 if(!record)return 'not_collected';
 if(independentDiscovery(record))return 'independent_search_observed';
 if(record.curated_seed_listed)return 'seed_listed_no_independent_search_evidence';
 return 'legacy_or_uncertain_provenance';
}
