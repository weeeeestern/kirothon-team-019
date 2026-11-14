import tempfile
import unittest
import zipfile
from pathlib import Path

from import_public_data import Moments, number, time_minutes, xlsx_tables


class ImportTests(unittest.TestCase):
    def test_blank_is_not_zero_and_nonfinite_is_missing(self):
        self.assertIsNone(number(''))
        self.assertIsNone(number('NaN'))
        self.assertIsNone(number('-999'))
        self.assertEqual(number('0'), 0)

    def test_statistics_use_sample_variance_and_ignore_missing(self):
        moments = Moments()
        for value in (2, 4, None, 6):
            moments.add(value)
        self.assertEqual(moments.result(), [4, 2, 3])
        single = Moments()
        single.add(0)
        self.assertEqual(single.result(), [0, None, 1])

    def test_midnight_is_previous_service_day(self):
        self.assertEqual(time_minutes('00시30분'), 1470)
        self.assertEqual(time_minutes('24:30~25:00'), 1470)
        self.assertIsNone(time_minutes('요일구분'))

    def test_xlsx_sparse_cells_and_sheet_relationships(self):
        main = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
        rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'fixture.xlsx'
            with zipfile.ZipFile(path, 'w') as archive:
                archive.writestr('xl/workbook.xml', f'<workbook xmlns="{main}" xmlns:r="{rel}"><sheets><sheet name="토요일" sheetId="7" r:id="rId8"/></sheets></workbook>')
                archive.writestr('xl/_rels/workbook.xml.rels', '<Relationships><Relationship Id="rId8" Target="worksheets/sheet7.xml"/></Relationships>')
                archive.writestr('xl/sharedStrings.xml', f'<sst xmlns="{main}"><si><t>강남</t></si></sst>')
                archive.writestr('xl/worksheets/sheet7.xml', f'<worksheet xmlns="{main}"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1"><v>0</v></c><c r="D1" t="inlineStr"><is><t>하선</t></is></c></row></sheetData></worksheet>')
            tables = xlsx_tables(path)
            sheet, rows = next(tables)
            self.assertEqual(sheet, '토요일')
            self.assertEqual(list(rows), [['강남', '', '0', '하선']])
            tables.close()


if __name__ == '__main__':
    unittest.main()
