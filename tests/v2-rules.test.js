const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const V2 = require('../v2/rules.js');

test('V2 display contract has only the three approved families', () => {
  assert.deepEqual(Object.keys(V2.DISPLAY), ['terrain', 'skeleton', 'place']);
  assert.deepEqual(V2.DISPLAY.skeleton.road, ['trunk', 'primary']);
  assert.deepEqual(V2.SURFACE_PRIORITY, ['grass', 'sand', 'farmland', 'forest', 'water']);
});

test('railway filter rejects subway and tunnels', () => {
  assert.equal(V2.isVisibleRailFeature({ class:'rail', subclass:'tram' }), true);
  assert.equal(V2.isVisibleRailFeature({ class:'rail', subclass:'monorail' }), true);
  assert.equal(V2.isVisibleRailFeature({ class:'transit', subclass:'subway' }), false);
  assert.equal(V2.isVisibleRailFeature({ class:'rail', subclass:'rail', brunnel:'tunnel' }), false);
});

test('road filter admits only primary and trunk outside tunnels', () => {
  assert.equal(V2.isVisibleRoadFeature({ class:'primary' }), true);
  assert.equal(V2.isVisibleRoadFeature({ class:'trunk', brunnel:'bridge' }), true);
  assert.equal(V2.isVisibleRoadFeature({ class:'secondary' }), false);
  assert.equal(V2.isVisibleRoadFeature({ class:'primary', brunnel:'tunnel' }), false);
});

test('POI whitelist contains only the five landmark families', () => {
  assert.equal(V2.poiKind({ class:'railway', subclass:'station' }), 'station');
  assert.equal(V2.poiKind({ class:'religion', subclass:'place_of_worship' }), 'worship');
  assert.equal(V2.poiKind({ class:'education', subclass:'university' }), 'school');
  assert.equal(V2.poiKind({ class:'attraction', subclass:'castle' }), 'castle');
  assert.equal(V2.poiKind({ class:'attraction', subclass:'lighthouse' }), 'lighthouse');
  assert.equal(V2.poiKind({ class:'shop', subclass:'bakery' }), null);
  assert.equal(V2.poiKind({ class:'attraction', subclass:'monument' }), null);
});

test('suburbs are limited to two per source tile while city and town survive', () => {
  const feature = (kind, x, name, rank = 10) => ({
    type:1, props:{ class:kind, name, rank }, geom:[[[x, 10]]],
  });
  const selected = V2.selectPlaces([
    feature('suburb', 1, 'A', 3), feature('suburb', 2, 'B', 2), feature('suburb', 3, 'C', 1),
    feature('city', 4, 'City'), feature('town', 5, 'Town'), feature('neighbourhood', 6, 'No'),
  ]);
  assert.deepEqual(selected.map(f => f.props.class).sort(), ['city', 'suburb', 'suburb', 'town']);
});

test('importance promotes wikidata, heritage and area', () => {
  assert.deepEqual(V2.importance({}, 0), { score:0, size:'S', label:'hover' });
  assert.deepEqual(V2.importance({ wikidata:'Q1', heritage:'1', area_m2:6000 }), {
    score:10, size:'L', label:'always',
  });
});

test('osmium filter contains the contract without prohibited display selectors', () => {
  const expressions = fs.readFileSync(path.join(__dirname, '../v2/osmium-tags-filter.txt'), 'utf8');
  assert.match(expressions, /natural=water,wood,beach,sand,grassland,heath,scrub/);
  assert.match(expressions, /highway=trunk,primary/);
  assert.match(expressions, /place=city,town,suburb/);
  assert.match(expressions, /historic=castle/);
  assert.match(expressions, /man_made=lighthouse/);
  assert.doesNotMatch(expressions, /place=[^\n#]*neighbourhood/);
  assert.doesNotMatch(expressions, /highway=[^\n#]*(secondary|tertiary|residential|service|path|footway)/);
  assert.doesNotMatch(expressions, /^nwr\/building\s*$/m);
});
