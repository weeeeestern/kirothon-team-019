#!/usr/bin/env python3
"""Read supplied public CSV/XLSX files without modifying originals; no dependencies.

python3 scripts/collect/import_public_data.py --source-dir ~/Downloads
XLSX worksheets are streamed, including sparse/empty cells. Only Seoul urban-air
stations are aggregated from the national air-quality files. No API keys needed.
"""
import argparse
import csv
import datetime as dt
import hashlib
import json
import math
import re
import unicodedata
import zipfile
from collections import defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
RID = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
DAYS = {'평일': 'weekday', '토요일': 'saturday', '일요일': 'sunday'}
ROOT = Path(__file__).resolve().parents[2]


def normalized(value):
    return unicodedata.normalize('NFC', str(value or '')).strip()


def number(value):
    if value is None or str(value).strip() in ('', '-', 'NA', 'N/A'):
        return None
    try:
        result = float(str(value).strip().replace(',', ''))
        return result if math.isfinite(result) and result >= 0 else None
    except ValueError:
        return None


def col_index(ref):
    value = 0
    for ch in re.match(r'[A-Z]+', ref).group():
        value = value * 26 + ord(ch) - 64
    return value - 1


def xlsx_tables(path):
    """Yield (sheet name, row iterator); consume one iterator before the next."""
    with zipfile.ZipFile(path) as archive:
        strings = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            for _, elem in ET.iterparse(archive.open('xl/sharedStrings.xml'), events=('end',)):
                if elem.tag == NS + 'si':
                    strings.append(''.join(t.text or '' for t in elem.iter(NS + 't')))
                    elem.clear()
        rels = {e.attrib['Id']: e.attrib['Target'] for e in ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
        for sheet in ET.fromstring(archive.read('xl/workbook.xml')).iter(NS + 'sheet'):
            target = rels[sheet.attrib[RID]]
            member = target.lstrip('/') if target.startswith('/') else 'xl/' + target

            def rows(member=member):
                parent = None
                with archive.open(member) as stream:
                    for event, elem in ET.iterparse(stream, events=('start', 'end')):
                        if event == 'start' and elem.tag == NS + 'sheetData':
                            parent = elem
                        if event != 'end' or elem.tag != NS + 'row':
                            continue
                        cells = {}
                        for cell in elem:
                            if cell.tag != NS + 'c':
                                continue
                            index = col_index(cell.attrib['r'])
                            value = cell.find(NS + 'v')
                            text = value.text if value is not None else ''
                            if cell.attrib.get('t') == 's' and text:
                                text = strings[int(text)]
                            elif cell.attrib.get('t') == 'inlineStr':
                                text = ''.join(t.text or '' for t in cell.iter(NS + 't'))
                            cells[index] = text or ''
                        result = [cells.get(i, '') for i in range(max(cells, default=-1) + 1)]
                        elem.clear()
                        if parent is not None:
                            parent.remove(elem)
                        if any(result):
                            yield result

            yield sheet.attrib['name'], rows()


def tables(path):
    if path.suffix.lower() == '.xlsx':
        yield from xlsx_tables(path)
    else:
        with path.open('rb') as stream:
            sample = stream.read(65536)
        try:
            sample.decode('utf-8-sig')
            encoding = 'utf-8-sig'
        except UnicodeDecodeError:
            encoding = 'cp949'
        with path.open(encoding=encoding, newline='') as stream:
            yield 'CSV', csv.reader(stream)


def records(path):
    for sheet, rows in tables(path):
        header = next(rows)
        header = [normalized(c) for c in header]
        for row in rows:
            if not any(str(c).strip() for c in row):
                continue
            yield sheet, dict(zip(header, row)), header


def file_meta(path, kind):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return {'filename': normalized(path.name), 'kind': kind, 'bytes': path.stat().st_size,
            'sha256': digest.hexdigest(), 'parsedRows': 0, 'usedRows': 0, 'missingValues': 0, 'duplicateRows': 0}


def time_minutes(label):
    match = re.match(r'(\d{1,2})(?:시|:)(\d{2})', label)
    if not match:
        return None
    hour, minute = map(int, match.groups())
    # Railway service day continues past midnight: 00:00 == 24:00.
    if hour < 5:
        hour += 24
    return hour * 60 + minute


def import_congestion(paths):
    metadata = []
    latest = None
    for path in sorted(paths, key=lambda p: normalized(p.name)):
        meta = file_meta(path, 'subway-congestion')
        reference = re.search(r'(\d{8})\.', path.name).group(1)
        reference = f'{reference[:4]}-{reference[4:6]}-{reference[6:]}'
        meta['referenceDate'] = reference
        rows = []
        seen = set()
        slots = None
        for sheet, record, header in records(path):
            meta['parsedRows'] += 1
            day = DAYS.get(normalized(record.get('구분') or record.get('요일구분') or sheet))
            station = normalized(record.get('역명') or record.get('출발역'))
            line = normalized(record.get('호선'))
            code = normalized(record.get('역번호'))
            direction = normalized(record.get('상하구분'))
            if not all((day, station, line, code, direction)):
                raise ValueError(f'Unknown congestion schema: {path.name}, row {meta["parsedRows"]}')
            time_headers = [c for c in header if time_minutes(c) is not None]
            current_slots = [time_minutes(c) for c in time_headers]
            if slots is not None and current_slots != slots:
                raise ValueError('Inconsistent congestion slots')
            slots = current_slots
            values = [number(record.get(c)) for c in time_headers]
            if not slots or len(slots) != len(set(slots)):
                raise ValueError('Invalid congestion slots')
            meta['missingValues'] += values.count(None)
            key = (code, line, direction, day)
            if key in seen:
                meta['duplicateRows'] += 1
                raise ValueError(f'Duplicate congestion record: {key}')
            seen.add(key)
            rows.append({'station': station, 'stationCode': code, 'line': line, 'direction': direction,
                         'day': day, 'values': [round(v, 3) if v is not None else None for v in values]})
            meta['usedRows'] += 1
        metadata.append(meta)
        if latest is None or reference > latest['referenceDate']:
            latest = {'referenceDate': reference, 'unit': '%', 'slots': slots, 'rows': rows,
                      'filename': meta['filename'], 'dailyVarianceAvailable': False}
        print(f'{meta["filename"]}: {meta["parsedRows"]} rows', flush=True)
    if latest is None:
        raise ValueError('No congestion input files')
    return latest, metadata


class Moments:
    def __init__(self):
        self.n, self.mean, self.m2 = 0, 0.0, 0.0

    def add(self, value):
        if value is None:
            return
        self.n += 1
        delta = value - self.mean
        self.mean += delta / self.n
        self.m2 += delta * (value - self.mean)

    def result(self):
        return [round(self.mean, 3) if self.n else None,
                round(math.sqrt(max(self.m2, 0) / (self.n - 1)), 3) if self.n > 1 else None, self.n]


def weekday(date):
    return 'weekday' if date.weekday() < 5 else ('saturday' if date.weekday() == 5 else 'sunday')


def import_ridership(path):
    meta = file_meta(path, 'subway-ridership')
    groups = {}
    seen = set()
    first, last = None, None
    columns = None
    for _, record, header in records(path):
        meta['parsedRows'] += 1
        date = dt.date.fromisoformat(record['수송일자'])
        first = min(first or date, date)
        last = max(last or date, date)
        if columns is None:
            columns = header[6:]
        key = tuple(normalized(record[k]) for k in ('역명', '호선', '역번호', '승하차구분'))
        unique = (date, *key)
        if unique in seen:
            meta['duplicateRows'] += 1
            raise ValueError(f'Duplicate ridership record: {unique}')
        seen.add(unique)
        group = (*key, weekday(date))
        stats = groups.setdefault(group, [Moments() for _ in columns])
        for stat, col in zip(stats, columns):
            val = number(record.get(col))
            meta['missingValues'] += val is None
            stat.add(val)
        meta['usedRows'] += 1
    rows = []
    for (station, line, code, direction, day), stats in sorted(groups.items()):
        rows.append({'station': station, 'line': line, 'stationCode': code,
                     'direction': direction, 'day': day, 'values': [s.result() for s in stats]})
    meta.update({'periodStart': str(first), 'periodEnd': str(last)})
    print(f'{meta["filename"]}: {meta["parsedRows"]} rows', flush=True)
    return {'periodStart': str(first), 'periodEnd': str(last), 'unit': '명', 'columns': columns,
            'rows': rows, 'statistic': '[mean, sampleStandardDeviation, sampleDays]',
            'calendar': 'calendar-weekday; public holidays are not excluded', 'filename': meta['filename']}, meta


def import_air(paths):
    metadata, groups = [], {}
    first, last = None, None
    for path in sorted(paths):
        meta = file_meta(path, 'air-quality')
        seen = set()
        for _, record, _ in records(path):
            meta['parsedRows'] += 1
            if not normalized(record.get('지역')).startswith('서울 ') or normalized(record.get('망')) != '도시대기':
                continue
            stamp = str(record.get('측정일시', '')).strip()
            if not re.fullmatch(r'\d{10}', stamp):
                raise ValueError('Unknown air-quality timestamp')
            date = dt.date(int(stamp[:4]), int(stamp[4:6]), int(stamp[6:8]))
            end_hour = int(stamp[8:])
            if not 1 <= end_hour <= 24:
                raise ValueError('Air measurement hour must be 01..24')
            code, station = normalized(record['측정소코드']), normalized(record['측정소명'])
            unique = (code, stamp)
            if unique in seen:
                meta['duplicateRows'] += 1
                raise ValueError(f'Duplicate air measurement: {unique}')
            seen.add(unique)
            first, last = min(first or date, date), max(last or date, date)
            district = normalized(record['지역']).removeprefix('서울 ')
            for pollutant in ('PM10', 'PM25'):
                key = (district, station, code, pollutant, weekday(date))
                stats = groups.setdefault(key, [Moments() for _ in range(24)])
                val = number(record.get(pollutant))
                meta['missingValues'] += val is None
                stats[end_hour - 1].add(val)
            meta['usedRows'] += 1
        metadata.append(meta)
        print(f'{meta["filename"]}: {meta["parsedRows"]} total / {meta["usedRows"]} Seoul rows', flush=True)
    rows = [{'district': district, 'station': station, 'stationCode': code, 'pollutant': pollutant, 'day': day,
             'values': [s.result() for s in stats]} for (district, station, code, pollutant, day), stats in sorted(groups.items())]
    return {'periodStart': str(first), 'periodEnd': str(last), 'unit': 'µg/m³', 'rows': rows,
            'statistic': '[mean, sampleStandardDeviation, sampleHours]',
            'timeConvention': 'source hour 01..24 is interval ending hour; index 0 = 00:00–01:00',
            'calendar': 'calendar-weekday; public holidays are not excluded'}, metadata


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, default=Path.home() / 'Downloads')
    parser.add_argument('--output', type=Path, default=ROOT / 'src/data/public')
    parser.add_argument('--skip-air', action='store_true', help='Develop subway parsing without reading large air workbooks')
    args = parser.parse_args()
    files = list(args.source_dir.iterdir())
    congestion_files = [p for p in files if '서울교통공사_지하철혼잡도정보_' in normalized(p.name) and p.suffix.lower() in ('.xlsx', '.csv')]
    ridership_files = [p for p in files if '서울교통공사_역별 일별 시간대별 승하차인원 정보_' in normalized(p.name) and p.suffix.lower() == '.csv']
    if not ridership_files:
        raise ValueError('Missing daily ridership CSV')
    congestion, manifest = import_congestion(congestion_files)
    ridership, meta = import_ridership(sorted(ridership_files)[-1])
    manifest.append(meta)
    air, air_meta = import_air([] if args.skip_air else list((args.source_dir / '2026').glob('*.xlsx')))
    manifest += air_meta
    args.output.mkdir(parents=True, exist_ok=True)
    for name, content in [('congestion', congestion), ('ridership', ridership), ('air-quality', air)]:
        (args.output / f'{name}.json').write_text(json.dumps(content, ensure_ascii=False, separators=(',', ':')) + '\n')
    provenance = {'schemaVersion': 1, 'importedAt': dt.datetime.now(dt.timezone.utc).isoformat(), 'mode': 'historical-public-data',
                  'sources': manifest, 'limitations': [
                      '혼잡도는 분기별 시간대 평균이며 현재 열차 혼잡도나 일별 분산이 아닙니다.',
                      '승하차 인원은 역 개찰구 이용량이며 열차 혼잡도 %로 변환하지 않습니다.',
                      '평일·토요일·일요일 구분이며 공휴일·연휴 다음날은 별도로 분리하지 않았습니다.',
                      '00시대 지하철 자료는 이전 운행일의 24시대로 조회합니다.',
                      '대기질은 서울 도시대기 측정소만 사용하며 01시는 00–01시 측정 구간입니다.',
                      '과거 기준선만 제공하며 실시간 이상 여부를 이 자료만으로 판단하지 않습니다.'
                  ]}
    (args.output / 'provenance.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
    print('Output:', args.output)


if __name__ == '__main__':
    main()
