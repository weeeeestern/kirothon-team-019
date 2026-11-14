"""Rebuild the submission PDF with reportlab; no network or API credentials used."""
from pathlib import Path
import os
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
FONT = os.environ.get('JAMJAM_PDF_FONT', '/System/Library/Fonts/Supplemental/Arial Unicode.ttf')
pdfmetrics.registerFont(TTFont('Korean', FONT))
pdfmetrics.registerFont(TTFont('LatinBold', os.environ.get('JAMJAM_PDF_BOLD_FONT', '/System/Library/Fonts/Supplemental/Arial Bold.ttf')))
W,H=960,540
BG='#0B0A10'; SURFACE='#191620'; TEXT='#F5F2FA'; MUTED='#B8AEC8'; PURPLE='#B59BFA'; GREEN='#9CE4C0'; BORDER='#332C42'; AMBER='#F2C46B'
c=canvas.Canvas(str(ROOT/'PRESENTATION.pdf'), pagesize=(W,H))
c.setTitle('잠잠 | 평소와 다른 날에만');c.setAuthor('KIROTHON 2026 · Team 019')
c.setSubject('문제 정의, 사용자 흐름, 실제 공공데이터, 합성 평가와 구현 범위')

def text(x,y,s,size=18,color=TEXT,font='Korean'):
 if font=='Helvetica-Bold': font='LatinBold' if s.isascii() else 'Korean'
 c.setFillColor(HexColor(color));c.setFont(font,size);c.drawString(x,y,s)
def wrap(s,width,size=18):
 lines=[];line=''
 for char in s:
  if char=='\n': lines.append(line);line='';continue
  if pdfmetrics.stringWidth(line+char,'Korean',size)>width and line:
   lines.append(line);line=char
  else:line+=char
 if line:lines.append(line)
 return lines
def para(x,y,s,width,size=18,color=MUTED,leading=None):
 lead=leading or size*1.5
 for line in wrap(s,width,size):text(x,y,line,size,color);y-=lead
 return y
def box(x,y,w,h,fill=SURFACE):
 c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(BORDER));c.roundRect(x,y,w,h,14,fill=1,stroke=1)
def tag(x,y,s,color=PURPLE):
 width=pdfmetrics.stringWidth(s,'Korean',12)+24
 c.setFillColor(HexColor(SURFACE));c.roundRect(x,y-9,width,26,13,fill=1,stroke=0);text(x+12,y,s,12,color)
def base(n,label,title,sub=None):
 c.setFillColor(HexColor(BG));c.rect(0,0,W,H,fill=1,stroke=0)
 text(48,494,'잠잠',18,PURPLE);text(113,495,'KIROTHON 2026  /  TEAM 019',10,MUTED)
 text(48,449,label,12,GREEN);text(48,401,title,32)
 if sub:para(48,366,sub,860,15)
 c.setStrokeColor(HexColor(BORDER));c.line(48,44,912,44)
 text(48,24,'평소와 다른 날에만  ·  github.com/weeeeestern/kirothon-team-019',9,MUTED)
 text(872,24,f'{n:02d} / 08',10,MUTED)
def end():c.showPage()

base(1,'QUIET BY DEFAULT','내가 다니는 길이, 평소와 다를 때만.')
text(48,268,'잠잠',88,PURPLE)
para(52,218,'알림의 가치는 많이 울리는 데서가 아니라\n필요한 순간을 골라내는 데서 나옵니다.',600,24,TEXT)
tag(52,91,'내 경로');tag(159,91,'내 출발 시각');tag(308,91,'평소와의 차이')
text(731,112,'01',86,SURFACE,'Helvetica-Bold');end()

base(2,'PROBLEM & HYPOTHESIS','오늘, 내가 다르게 행동해야 할까요?','같은 길을 반복해서 이동하는 사람에게 필요한 질문입니다.')
for x,num,title,body in [(48,'01','도시 전체보다 내 길','출근길과 하원길에 영향을 주는\n구간과 시간에 집중합니다.'),(344,'02','현재 수치보다 평소 대비','현재 값만으로 판단하지 않고\n같은 요일·시간대의 기준을 봅니다.'),(640,'03','알림 다음의 행동','변화와 비교 근거, 행동 제안을\n한 화면에서 확인합니다.')]:
 box(x,136,272,185);text(x+22,278,num,17,PURPLE,'Helvetica-Bold');text(x+22,236,title,20);para(x+22,199,body,230,15)
para(48,91,'제품 가설입니다. 특정 앱 전체의 한계나 사용자 시간 절감 효과를 측정했다고 주장하지 않습니다.',864,12,MUTED);end()

base(3,'USER JOURNEY','검색하고, 확인하고, 내 길로 저장해요.','장소 검색부터 판단 근거까지 이어지는 흐름을 제공합니다.')
steps=[('장소 선택','카카오 장소 검색\n출발·도착 확정'),('경로 확인','ODsay 경로 후보\n시간·환승·도보·요금'),('지도와 저장','지도 + 구간 목록\n이동 요일·출발 시각'),('변화 살펴보기','과거 기준 + 현재 신호\n출처와 시각 확인')]
for i,(title,body) in enumerate(steps):
 x=48+i*219;box(x,161,207,153);text(x+18,272,str(i+1),19,PURPLE,'Helvetica-Bold');text(x+18,233,title,19);para(x+18,199,body,176,14)
para(48,108,'길찾기 화면·서버 계약은 구현했습니다. 실제 카카오·ODsay 조회는 제공자 키와 서비스·도메인 설정이 필요합니다.',864,13,AMBER)
para(48,77,'위치 권한을 요청하지 않습니다. 지도나 조회가 실패해도 오류 안내와 수동 경로 등록을 유지합니다.',864,13,MUTED);end()

base(4,'DATA WITH CONTEXT','과거 기준과 지금의 관측을 구분합니다.')
rows=[('과거 혼잡도','서울교통공사 분기 파일','요일·30분·호선·방향별 혼잡도 %'),('과거 이용량','2025년 일별 승하차 CSV','인원 평균·변동·표본수, 혼잡도 %와 별도'),('과거 대기질','2026년 1~4월 에어코리아 XLSX','시간별 PM10 / PM2.5, 농도 단위 유지'),('현재 지역 신호','서울시 실시간 도시데이터','강남역·여의도의 날씨·대기질·인구와 시각')]
for i,(label,source,desc) in enumerate(rows):
 y=307-i*53;box(48,y-18,864,46);text(65,y,label,16,PURPLE);text(224,y,source,14);text(519,y,desc,12,MUTED)
para(48,70,'원본 10개 검증 · 최신 혼잡도 1,671행 · 승하차 199,290행 · 서울 대기질 72,000행. 단위와 시점을 구분합니다.',864,12,GREEN);end()

base(5,'EXPLAINABLE ENGINE','편차 × 경로 겹침 × 시간 겹침 ≥ 개인 임계값','핵심 판정은 UI와 분리된 하나의 순수 엔진으로 실행합니다.')
for x,value,label in [(48,'0건','평범한 날 알림'),(344,'10 / 10','관련 이상 탐지'),(640,'75%','비교군 대비 알림 감소')]:
 box(x,188,272,128);text(x+22,251,value,42,PURPLE,'Helvetica-Bold' if '/' in value or '%' in value else 'Korean');text(x+22,214,label,16)
tag(48,152,'합성 시나리오 기준',GREEN)
para(48,115,'24개 시나리오 · 비교군 40건 → 엔진 10건. 비교군은 경로·시간을 무시한 z ≥ 1 규칙입니다.\n실제 교통 앱 비교나 실사용자 성능이 아닙니다. 도움됨 비율은 미측정입니다.',864,13,MUTED)
text(48,60,'근거: src/data/evaluation.json  /  재현: npm run evaluate',10,MUTED);end()

base(6,'PARTICIPATION','제보가 쌓이면, 키로도 함께 자라요.','공식 데이터가 놓치는 현장 정보를 이웃의 참여로 보완하는 시연입니다.')
items=[('제보','+10 P','상황·장소·시간·한 줄 설명'),('서로 확인','2명','다른 이웃 2명 확인 후 신뢰도 상승'),('피드백','+1 P','필요한 알림 수준을 조정'),('꾸미기','Lv. 1-5','해금된 옷과 당일 한정판')]
for i,(label,value,body) in enumerate(items):
 x=48+i*219;box(x,158,207,163);text(x+18,281,label,17);text(x+18,235,value,29,PURPLE,'Helvetica-Bold');para(x+18,196,body,170,13)
para(48,108,'제보·포인트·경로는 현재 브라우저에 저장됩니다. 확인자는 시뮬레이션이며, 실제 계정·기기 간 동기화는 없습니다.',864,13,MUTED)
para(48,77,'같은 행동의 중복 적립을 막고, 해금한 아이템만 착용할 수 있도록 검증합니다.',864,13,GREEN);end()

base(7,'KIRO ARTIFACTS','기획을 요구사항과 작업 단위로 구체화했습니다.')
for i,(num,title,body) in enumerate([('4','Specs','요구사항 → 설계 → 작업\n기능별 추적 가능한 번호'),('5','Steering','제품·기술·구조·디자인·인프라\n항상 / 자동 포함 규칙'),('2','Hooks','스펙 동기화·비밀정보 점검\n저장 후 에이전트 확인 요청'),('4','Custom agents','데이터·길찾기·문서·통합\n역할 설정과 형식 검증')]):
 x=48+i*219;box(x,156,207,170);text(x+18,277,num,43,PURPLE,'Helvetica-Bold');text(x+18,241,title,18);para(x+18,205,body,170,12)
para(48,108,'설정 검증과 실제 실행은 구분합니다. 커스텀 통합 세션은 읽기 후 중단되어, 병렬 구현을 수행했다고 기록하지 않습니다.',864,12,MUTED)
para(48,77,'Hooks는 점검 요청이며 자동 차단 게이트가 아닙니다. 상세 근거: BUILD_REPORT.md 및 .kiro/',864,12,GREEN);end()

base(8,'DEMO & NEXT','조용한 날에는 잠잠하게. 필요한 날에는 분명하게.')
box(48,197,864,137)
text(70,294,'공개 데모',15,PURPLE);text(70,251,'kirothon-team-019.vercel.app',27)
text(70,218,'비로그인 HTTP 200 확인 · 최신 코드 배포와 화면 검증은 별도',13,MUTED)
c.linkURL('https://kirothon-team-019.vercel.app/',(65,241,726,281),relative=0)
para(48,159,'남은 운영 조건',864,18,TEXT)
para(48,125,'카카오 서비스·허용 도메인 / ODsay 키 인증 설정\n실제 다중 사용자·예약 푸시 / 공휴일 달력 / 실제 관측 기반 효과 검증',864,15,MUTED)
text(48,59,'발표의 수치와 시연 한계는 README.md 및 BUILD_REPORT.md와 함께 확인해 주세요.',11,GREEN)
end();c.save()
print(ROOT/'PRESENTATION.pdf')
