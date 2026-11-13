import math
import unittest
from unittest.mock import patch

import pyproj
from shapely.affinity import rotate, scale
from shapely.geometry import Polygon, box
from shapely.ops import transform, unary_union

from unit_slice_patterns import classify_unit_slice_pattern, precompute_unit_slices


TO_4326 = pyproj.Transformer.from_crs("EPSG:5186", "EPSG:4326", always_xy=True)
TO_5186 = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:5186", always_xy=True)


def make_lines(count):
    return [{"line": f"{index + 1:02d}", "count": 30} for index in range(count)]


class UnitSlicePatternTests(unittest.TestCase):
    def assert_partition(self, footprint, lines, expected_pattern, rotation_degrees=0):
        source = rotate(footprint, rotation_degrees, origin="centroid")
        self.assertEqual(classify_unit_slice_pattern(source), expected_pattern)
        slices = precompute_unit_slices(source, lines, TO_4326)
        self.assertIsNotNone(slices)
        self.assertEqual(len(slices), len(lines))
        self.assertEqual([item["line"] for item in slices], [item["line"] for item in lines])

        generated = []
        for slice_data in slices:
            polygons = []
            for polygon_data in slice_data["polygons"]:
                polygon = Polygon(polygon_data["outer"], polygon_data["holes"])
                polygons.append(transform(TO_5186.transform, polygon))
            generated.append(unary_union(polygons))

        merged = unary_union(generated)
        self.assertLessEqual(source.symmetric_difference(merged).area, max(0.02, source.area * 1e-6))
        self.assertLessEqual(sum(part.area for part in generated) - merged.area,
                             max(0.02, source.area * 1e-6))

        for cell in generated:
            cell_local = rotate(cell, -rotation_degrees, origin=source.centroid)
            for part in getattr(cell_local, "geoms", [cell_local]):
                if part.geom_type != "Polygon":
                    continue
                coordinates = list(part.exterior.coords)
                for index in range(len(coordinates) - 1):
                    dx = coordinates[index + 1][0] - coordinates[index][0]
                    dy = coordinates[index + 1][1] - coordinates[index][1]
                    if math.hypot(dx, dy) < 1e-4:
                        continue
                    self.assertLessEqual(min(abs(dx), abs(dy)) / math.hypot(dx, dy), 0.035)
        return sorted(cell.area for cell in generated)

    def test_square_uses_two_by_two_grid(self):
        self.assert_partition(box(0, 0, 20, 20), make_lines(4), "square-compact")

    def test_slab_uses_parallel_bands_in_local_frame(self):
        self.assert_partition(box(0, 0, 42, 12), make_lines(4), "slab", rotation_degrees=23)

    def test_slab_assigns_sequential_lines_east_to_west(self):
        footprint = box(0, 0, 60, 10)
        lines = [
            {"line": "03", "count": 30},
            {"line": "01", "count": 10},
            {"line": "02", "count": 20},
        ]

        slices = precompute_unit_slices(footprint, lines, TO_4326)
        self.assertEqual([item["line"] for item in slices], ["01", "02", "03"])

        cells = [
            transform(TO_5186.transform, Polygon(item["polygons"][0]["outer"]))
            for item in slices
        ]
        centroids_x = [cell.centroid.x for cell in cells]
        self.assertEqual(centroids_x, sorted(centroids_x, reverse=True))
        self.assertAlmostEqual(cells[0].area / cells[1].area, 0.5, delta=0.03)
        self.assertAlmostEqual(cells[1].area / cells[2].area, 2 / 3, delta=0.03)

    def test_square_grid_starts_at_eastern_side(self):
        slices = precompute_unit_slices(box(0, 0, 20, 20), make_lines(4), TO_4326)
        cells = [
            unary_union([
                transform(TO_5186.transform, Polygon(polygon["outer"], polygon["holes"]))
                for polygon in item["polygons"]
            ])
            for item in slices
        ]
        self.assertGreater(cells[0].centroid.x, cells[-1].centroid.x)

    def test_l_shape_is_split_by_wings(self):
        footprint = Polygon([(0, 0), (30, 0), (30, 10), (10, 10), (10, 30), (0, 30)])
        areas = self.assert_partition(footprint, make_lines(4), "l-shape")
        self.assertGreater(min(areas), footprint.area / 4 * 0.55)

    def test_l_shape_line_order_follows_long_axis(self):
        footprint = Polygon([(0, 0), (30, 0), (30, 10), (10, 10), (10, 30), (0, 30)])
        slices = precompute_unit_slices(footprint, make_lines(4), TO_4326)
        cells = [
            unary_union([
                transform(TO_5186.transform, Polygon(polygon["outer"], polygon["holes"]))
                for polygon in item["polygons"]
            ])
            for item in slices
        ]
        centroids_x = [cell.centroid.x for cell in cells]
        self.assertEqual(centroids_x, sorted(centroids_x, reverse=True))

    def test_l_shape_uses_weighted_bands_when_wing_areas_do_not_match_lines(self):
        footprint = Polygon([(0, 0), (30, 0), (30, 10), (10, 10), (10, 30), (0, 30)])
        lines = [
            {"line": "01", "count": 40},
            {"line": "02", "count": 10},
            {"line": "03", "count": 10},
            {"line": "04", "count": 40},
        ]
        slices = precompute_unit_slices(footprint, lines, TO_4326)
        cells = [
            unary_union([
                transform(TO_5186.transform, Polygon(polygon["outer"], polygon.get("holes") or []))
                for polygon in item["polygons"]
            ])
            for item in slices
        ]

        self.assertEqual([item["line"] for item in slices], ["01", "02", "03", "04"])
        self.assertEqual([cell.centroid.x for cell in cells],
                         sorted((cell.centroid.x for cell in cells), reverse=True))
        self.assertAlmostEqual(cells[0].area / cells[1].area, 4.0, delta=0.1)
        self.assertAlmostEqual(cells[1].area / cells[2].area, 1.0, delta=0.1)
        self.assertAlmostEqual(cells[3].area / cells[2].area, 4.0, delta=0.1)

    def test_mirrored_l_shape_is_split_by_wings(self):
        footprint = Polygon([(0, 0), (30, 0), (30, 10), (10, 10), (10, 30), (0, 30)])
        mirrored = scale(footprint, xfact=-1, origin="centroid")
        areas = self.assert_partition(mirrored, make_lines(4), "l-shape")
        self.assertGreater(min(areas), mirrored.area / 4 * 0.55)

    def test_two_notch_shape_is_split_by_wings(self):
        footprint = Polygon([(0, 0), (30, 0), (30, 30), (20, 30), (20, 10),
                             (10, 10), (10, 30), (0, 30)])
        self.assert_partition(footprint, make_lines(5), "two-notch-wing", rotation_degrees=17)

    @patch("unit_slice_patterns._partition_wings", return_value=[])
    def test_concave_pattern_falls_back_to_orthogonal_bands(self, _partition_wings):
        footprint = Polygon([(0, 0), (30, 0), (30, 10), (10, 10), (10, 30), (0, 30)])
        self.assert_partition(footprint, make_lines(4), "l-shape", rotation_degrees=23)


if __name__ == "__main__":
    unittest.main()
