import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recordDiscovery,independentDiscovery,explainDiscovery} from '../scripts/lib/discovery-evidence.mjs';

test('A seed-listed repository is NOT automatically considered discovered by the crawler',()=>{
 const prior={id:123,full_name:'test/curated-item',curated_seed_listed:true};
 assert.equal(independentDiscovery(prior),false);
 assert.equal(explainDiscovery(prior),'seed_listed_no_independent_search_evidence');
 const seeded={...prior,...recordDiscovery(prior,'curated-general','2026-11-08T10:00:00Z')};
 assert.equal(independentDiscovery(seeded),false);
 assert.equal(explainDiscovery(seeded),'seed_listed_no_independent_search_evidence');
});
test('Evidence is recorded only after a real repository search, and survives renaming and overlapping scopes',()=>{
 const base={id:123,full_name:'test/generic-holdout'};
 const recent={...base,...recordDiscovery(base,'recent-search','2026-11-08T12:00:00Z')};
 assert.equal(independentDiscovery(recent),true);
 assert.deepEqual(recent.discovery_sources,['recent-search']);
 const renamed={...recent,full_name:'neworg/generic-holdout'};
 const broader={...renamed,...recordDiscovery(renamed,'general-search','2026-11-09T12:00:00Z')};
 assert.deepEqual(broader.discovery_sources,['general-search','recent-search']);
 assert.equal(broader.discovery_seen_at['recent-search'],'2026-11-08T12:00:00Z');
 assert.equal(explainDiscovery(broader),'independent_search_observed');
 const repeated={...broader,...recordDiscovery(broader,'general-search','2026-11-10T12:00:00Z')};
 assert.deepEqual(repeated.discovery_sources,broader.discovery_sources);
 assert.equal(repeated.discovery_seen_at['general-search'],'2026-11-10T12:00:00Z');
});
test('Unknown historical provenance remains unknown rather than being invented',()=>{
 assert.equal(explainDiscovery({id:123,full_name:'old/repo'}),'legacy_or_uncertain_provenance');
 assert.equal(explainDiscovery(undefined),'not_collected');
 assert.throws(()=>recordDiscovery({},'not-a-real-source'),/Unknown discovery source/);
 assert.throws(()=>recordDiscovery({},'recent-search','not-a-date'),/Invalid discovery timestamp/);
});
