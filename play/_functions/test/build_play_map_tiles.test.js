const assert = require('node:assert/strict');
const test = require('node:test');
const { addPropertyRecord, createMarkerAccumulator, finalizeMarkerIndex, regionNameFromAddress, tileForCoordinates } = require('../scripts/build_play_map_tiles');

test('assigns world origin to the only z0 tile', () => {
  assert.deepEqual(tileForCoordinates(0, 0, 0), { x: 0, y: 0 });
});

test('groups apartment properties into one complex marker', () => {
  const accumulator = createMarkerAccumulator();
  addPropertyRecord(accumulator, { id: 'unit-1', data: {
    complex_id: 'complex-1', complex_name: '샘플아파트', x: 127.1, y: 37.3,
    legal_dong_address: '경기도 용인시 수지구 죽전동 1', initial_price: 500000000,
    property_status: 'NORMAL', tradable: true, representative_area_sqm: 84
  } });
  addPropertyRecord(accumulator, { id: 'unit-2', data: {
    complex_id: 'complex-1', complex_name: '샘플아파트', x: 127.1, y: 37.3,
    legal_dong_address: '경기도 용인시 수지구 죽전동 1', initial_price: 400000000,
    property_status: 'NORMAL', tradable: true, representative_area_sqm: 59
  } });

  const index = finalizeMarkerIndex(accumulator, 14);
  assert.equal(index.markerCount, 1);
  assert.equal(index.sourceDocumentCount, 2);
  assert.equal(index.tiles.size, 1);
  const marker = Array.from(index.tiles.values())[0][0];
  assert.equal(marker.property_count, 2);
  assert.equal(marker.tradable_count, 2);
  assert.equal(marker.initial_price, 400000000);
  assert.equal(index.featuredRegions[0].name, '용인시 수지구');
});

test('skips records without coordinates and recognizes special-city regions', () => {
  const accumulator = createMarkerAccumulator();
  addPropertyRecord(accumulator, { id: 'missing-coordinate', data: {
    complex_id: 'missing-coordinate', complex_name: '좌표없음', x: null, y: null
  } });
  assert.equal(finalizeMarkerIndex(accumulator).markerCount, 0);
  assert.equal(regionNameFromAddress('서울특별시 강남구 역삼동 1'), '강남구');
});
