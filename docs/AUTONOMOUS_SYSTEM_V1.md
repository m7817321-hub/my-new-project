# SELLER Autonomous System V1

## 감사 기준과 현재 사실 (2026-09-05)

기존 `m7817321-hub/my-new-project`, 기준 커밋 `e4c47d4`를 감사했다. 기존 저장소의 별도 작업 사본과 `feat/autonomous-system-v1` 브랜치를 사용한다. 새 제품/저장소가 아니다.

| 영역 | 확인된 사실 | 미구현 / UNKNOWN |
|---|---|---|
| 야간 분석 | `scripts/overnight_opportunity_analysis.js`: 고정 키워드 10개를 외부 API로 분석하고 Markdown 저장 | 예약, DB 작업 큐, 중복 방지 없음 |
| Rank Tracker | `server/services/rankTracker.js`: 활성 대상 수집, 이력 저장, 웹 프로세스에서 60초마다 KST 00:30 확인 | 재시작을 견디는 예약 상태 없음. 외부 API 호출 제한시간 없음 |
| Opportunity Engine | `docs/OPPORTUNITY_ENGINE_V1_SPEC.md`는 가설. 야간 스크립트에 시뮬레이션 판정기 존재 | `marketCollector.js`는 recommendation=HOLD, score=null 반환. 완성된 GO 판정 엔진 아님 |
| Candidate | `db.js`, `candidateFinder.js`: 보고서 연결, 중복 식별, 관심/제외 등 상태 저장 | 공급처 자동 구매 없음 |
| Margin | `marginCalculator.js`: V2 계산, UNKNOWN/strict, 비용 항목과 목표 판매가 | 실제 비용 완전성 보증 없음. products의 기본 0은 원가 확인 근거가 아님 |
| Listing | `index.js`, `aiTransformer.js`: 상품 변환 및 DRAFT/READY 등 저장, lineage 연결 | 외부 마켓에 실제 게시하는 연동은 확인되지 않음 |
| Health | `/api/health`, `/api/health/integrations` 구현 | health=ok가 야간 작업 성공을 뜻하지 않음 |
| 배포 | Express 0.0.0.0:$PORT, client/dist 정적 제공, SQLite WAL, WOOJUNG_DB_PATH 지원 | Railway 실제 서비스/Volume/환경변수/자동 배포 설정은 UNKNOWN. 저장소에 Railway 설정 파일 없음 |
| 테스트 | package.json의 identity/market-model/workflow/margin/health 회귀 테스트 및 workflow E2E | live API 진단 스크립트는 오프라인 회귀 테스트와 구분. 감사 시 package.json과 루트 lockfile 불일치 |
| 개발 자동화 | 기존 .github 워크플로 없음 | 자동 코딩 runner, GitHub 보호 규칙, 사람 승인 강제 설정은 UNKNOWN/미구현 |

## V1 구현 계획과 수용 기준

1. 기존 SQLite에 action_queue, autonomous_runs, action_events를 추가한다. 기존 도메인 테이블/상태는 변경하지 않는다.
2. 야간 작업은 저장된 최신 시장보고서, 후보, 상품 원가, 순위 이력을 읽고 분석 결과와 검토 초안을 큐에 저장한다. 외부 수집/유료 AI 호출은 하지 않는다.
3. 누락/오래된 데이터는 UNKNOWN으로 표시한다. 기존 가설 판정은 참고 정보이며 구매 추천이나 수익 보장이 아니다. 정식 시장 recommendation을 덮어쓰지 않는다.
4. 자동 완료는 분석/초안 생성에 한한다. 구매, 광고비, 가격 변경, 고객 발송, 배포 및 알 수 없는 action type은 항상 approval_required=true다. 승인 기록만으로 실행하지 않는다.
5. KST 날짜별 실행 키 + SQLite IMMEDIATE transaction으로 동시 실행/재시도 중복을 방지한다. 성공 결과와 action을 함께 커밋하며 실패는 별도 실행 이력에 기록한다.
6. 아침 요약 API는 당일 자동 완료, 미해결 확인 필요, 위험을 구분한다. 실행 없음/실패/오래된 실행은 정상 완료로 표시하지 않는다.
7. Railway 별도 cron은 토큰으로 웹 API를 호출하고 종료한다. SQLite를 별도 서비스에 복제하거나 공유 마운트한다고 가정하지 않는다.

## Dev Automation 경계

GitHub issue/task (목표, 범위, 수용 기준, 담당자 승인) → 지정 커밋의 isolated branch/worktree → 수정 → tests/build → PR → human review → 사람이 merge/deploy.

- runner는 main 직접 쓰기/강제 push/자동 merge/배포 권한을 갖지 않는다. task 본문, 소스 주석, 수집 데이터는 실행 지시로 신뢰하지 않는다.
- 작업당 제한 시간/재시도/비용 상한을 정하고 초과 시 실패 결과와 PR 초안을 남긴다. 테스트 실패를 숨기거나 테스트를 삭제해서 통과시키지 않는다.
- 운영 DB, 운영 토큰, 구매/광고/메시징 자격증명을 코딩 runner에 주지 않는다. 테스트 DB와 fixture만 사용한다.
- PR에는 변경 목적, 테스트 결과, 미구현/UNKNOWN, migration/rollback을 기록한다. diff에서 비밀정보 유출/승인 우회/운영 부작용을 사람이 확인한다.
- 브랜치 보호: main에 PR 필수, 승인 1명 이상, CI 필수, 관리자 우회 제한. GitHub 및 Railway 실제 설정은 수동 확인 필요.
- V1은 이 경계와 PR 검증 기반을 제공한다. 자율 코딩 에이전트 예약/issue 할당/runner 설치는 미구현이다.

## V1 구현 결과

- `server/services/actionQueue.js`: additive SQLite schema, 상태/자동 실행 CHECK 제약, 중복 키, 승인 이력, 페이지 조회, 아침 요약.
- `server/services/autonomousSystem.js`: DB snapshot 기반 실행. 키워드별 최근 수집 보고서, 해당 보고서의 PENDING/INTERESTED 후보, 저장 상품의 마진, 활성 rank target의 최신 두 관측을 읽는다. 최신 데이터의 lineage ID와 원천을 evidence에 보관한다.
- 기존 야간 스크립트의 `evaluateKeyword`를 참고 가설로 재사용했다. 필수 데이터 누락 시 V1 decision은 HOLD이며 저장된 시장 recommendation은 변경하지 않는다. 기존 스크립트의 수요 상한 10만은 문서의 5만과 달라 가설 값으로만 남겨두었다.
- 원가/판매가가 0 이하이거나 갱신이 7일 초과하면 UNKNOWN. 저장된 상품 비용을 기존 Margin V2로 재계산한다. 예상 마진 15% 미만은 가격 검토 초안이며 자동 가격 변경은 없다. 미저장 비용의 완전성은 UNKNOWN이다.
- 시장 데이터는 7일, 최근 순위는 48시간, 비교 순위는 7일을 유효기간 가설로 사용한다. 오가닉 순위 10단계 이상 하락을 위험으로 표시한다. ERROR/OUT_OF_RANK/광고 관측/동일 시각/누락은 순위 0으로 해석하지 않는다.
- 충분한 최근 데이터와 INTERESTED 후보가 있고 연결 상품이 없으면 큐 내부에 제목/키워드/원문 링크만 담은 LISTING_DRAFT를 생성한다. 원가는 UNKNOWN, 확인되지 않은 제품 주장은 빈 배열로 남긴다. 기존 Listing Studio 상품 저장과 외부 게시를 자동으로 실행하지 않는다.
- `server/autonomousRoutes.js`: 실행용 토큰과 사람 검토용 토큰을 분리한다. 미설정/32자 미만/같은 토큰은 닫힌 상태(503). 인증 실패는 401. 토큰은 URL·응답·로그에 넣지 않는다.
- `.github/workflows/pr-checks.yml`: PR에서 Node 22 설치, npm ci, 전체 오프라인 회귀 테스트, client 빌드. 읽기 전용 GitHub 권한, 15분 제한, 운영 비밀값 없음.

### Action Queue 상태와 의미

`PENDING → APPROVED 또는 DISMISSED`, `APPROVED → DISMISSED`. 동일 결정 재전송은 멱등이다. 자동 분석/초안은 처음부터 COMPLETED이며 외부 작업 완료를 뜻하지 않는다. 수동 API는 어떤 status/automatic/approval_required 값을 보내더라도 PENDING/true로만 생성한다. 승인 후에도 approval_required=true를 유지하고 executed=false를 반환한다. 실제 실행 endpoint/worker는 없다.

구매(PURCHASE), 광고비(AD_SPEND), 가격 변경(PRICE_CHANGE: 모든 크기), 고객 발송(CUSTOMER_SEND), 배포(DEPLOY), 알려지지 않은 타입은 자동 완료가 불가능하다. 자동 완료 허용 목록은 MARKET_ANALYSIS, MARGIN_ANALYSIS, RANK_ANALYSIS, LISTING_DRAFT 네 가지이며 내부 생성기만 사용한다.

`action_events`는 생성/상태 전환을 기록한다. actor는 system/proposal/human-review-token으로 구분하며 개인별 사용자 식별/다중 tenant 권한 모델은 미구현이다. V1은 기존 SELLER의 단일 운영자 모델을 전제로 한다. 기존 다른 API 전체에 대한 인증 리팩터링은 포함하지 않았다.

KST 날짜별 성공 실행은 그날 재호출해도 다시 수행하지 않는다. 실패 실행은 재시도할 수 있다. SQLite IMMEDIATE transaction으로 프로세스 간 직렬화하며 강제 종료 시 미완료 트랜잭션은 롤백된다. 강제 종료 전 실패 이력이 기록되지 못하면 최근 성공의 경과시간 또는 NEVER_RUN으로 감지한다. 별도 네트워크 재시도 루프는 없으며 cron 실패 시 동일 일자 재실행이 안전하다.

분석은 일별 결과를 남기고 검토 작업은 원천 버전별로 중복을 방지한다. 이미 승인/기각한 동일 근거를 다시 열지 않는다. 과거의 미해결 위험은 새 데이터가 들어와도 자동 기각하지 않으며 사람이 DISMISSED 처리한다.

### API 계약

기본 경로 `/api/autonomous`. 토큰은 `Authorization: Bearer <token>`으로 전달한다. 응답은 `Cache-Control: no-store`다.

| 메서드 / 경로 | 권한 | 결과 |
|---|---|---|
| POST `/overnight/run` | JOB_TOKEN | `{success, run:{run_key,status,action_count,reused,...}}`; 서버 현재 KST 일자로 저장 데이터 분석 |
| GET `/morning-brief` | REVIEW_TOKEN | date/timezone, automatic_completed, needs_review, risks, automation_health, latest_run, 상위 미해결 20개 |
| GET `/actions?status=PENDING&limit=100&offset=0` | REVIEW_TOKEN | total/items. limit 1~200, offset 0 이상 |
| GET `/actions/:id` | REVIEW_TOKEN | evidence 포함 상세 / 404 |
| POST `/actions` | REVIEW_TOKEN | type/title/source_type/source_id, 선택 evidence 객체. 항상 승인 대기 |
| POST `/actions/:id/decision` | REVIEW_TOKEN | `{decision:"APPROVED"}` 또는 DISMISSED. `{action,executed:false}` |

아침 집계: 자동 완료는 KST 당일 COMPLETED, 확인 필요는 미해결 NORMAL, 위험은 미해결 RISK + 실행 상태 경고 1개다. 승인된 작업도 외부 실행이 없으므로 미해결 집계에 남는다. automation_health는 NEVER_RUN/FAILED/STALE(26시간 초과)/OK다. OK는 분석 프로세스 성공이며 데이터 충분성 보장은 아니다. 별도 `/api/health`는 이전 호환성을 유지한다.

예시(테스트 fixture): 자동 완료 4건(시장/마진/순위/초안), 확인 필요 1건(후보 검토), 위험 2건(낮은 추정 마진/순위 하락). 실운영 실적이 아니다.

### Railway 수동 설정: 사람의 리뷰/배포 승인 이후

1. main 브랜치 보호와 PR checks를 설정하고 이 PR을 사람이 리뷰한다. 운영 배포는 approval_required=true 경계 밖에서 사람이 수행한다. Railway의 자동 배포가 연결되어 있다면 merge 전에 배포 승인 정책을 확인한다.
2. 기존 웹 서비스의 Volume mount와 `WOOJUNG_DB_PATH`가 실제 운영 DB를 가리키는지 확인하고 백업한다. 예: mount가 `/data`일 때만 `/data/woojung.db` 사용. 실제 mount는 UNKNOWN이므로 경로를 무조건 바꾸지 않는다. DB는 한 웹 서비스가 소유하며 replica는 1개로 운영한다.
3. Node 22.x, 기존 build `npm run build`, start `npm start`, health `/api/health`를 사용한다. 기존 better-sqlite3 11.x 재사용을 위해 Node 22를 고정했다. 이 작업 환경의 Node 24에서는 해당 Windows 사전 빌드가 없어 설치에 실패했다.
4. 웹에 서로 다른 32자 이상의 무작위 `AUTONOMOUS_JOB_TOKEN`, `AUTONOMOUS_REVIEW_TOKEN`을 설정한다. REVIEW_TOKEN을 cron/코딩 runner/프런트 빌드 변수에 제공하지 않는다.
5. **같은 GitHub 저장소**를 소스로 별도 Railway cron 서비스를 추가한다. 새 앱/저장소는 만들지 않는다. 시작 명령은 `npm run overnight:cron`, Cron Schedule은 `0 18 * * *`(매일 KST 03:00), 재시작 정책은 NEVER, 웹 healthcheck는 설정하지 않는다. cron에는 DB Volume이나 WOOJUNG_DB_PATH가 필요 없다.
6. cron 변수는 `AUTONOMOUS_API_URL`(기존 웹의 HTTPS origin 또는 private `http://<service>.railway.internal:<PORT>`)과 웹과 동일한 JOB_TOKEN만 설정한다. 실제 호스트명과 PORT는 Railway에서 확인한다. URL에 인증정보를 넣지 않는다. cron은 리다이렉트를 거부하고 55초 제한 후 실패 종료하며 다음 실행을 막는 열린 연결을 남기지 않는다.
7. 기존 `RANK_SCHEDULER_ENABLED=true`는 KST 00:30 rank 수집을 유지한다. V1 cron은 저장 rank 이력만 읽으므로 중복 rank 수집을 하지 않는다. 기존 스케줄러를 false로 끄면 대체 수집기를 별도로 운영해야 한다. rank 수집기의 재시작 누락/네트워크 무한 대기는 기존 한계이며 아침 요약에서 오래된 데이터를 감지한다.
8. 수동 cron 실행으로 COMPLETED를 확인하고 같은 날 재실행에서 reused=true인지 확인한다. REVIEW_TOKEN으로 아침 요약을 확인하고 웹 재시작 후 동일 결과가 유지되는지 확인한다. 이 운영 smoke test는 아직 미실행이다.

Railway cron은 UTC 기준이며 작업이 종료되어야 다음 예약을 실행한다. [Railway Cron 공식 문서](https://docs.railway.com/cron-jobs). Volume은 연결된 서비스에 마운트되는 저장소다. 이 설계는 두 서비스가 같은 SQLite 파일을 직접 공유한다고 가정하지 않는다. [Railway Volume 공식 문서](https://docs.railway.com/volumes/reference).

### 로컬 실행 / rollback

Node 22에서 `npm ci`, `npm test`, `npm run build`. 로컬 저장 데이터 테스트는 별도 테스트 DB 경로를 WOOJUNG_DB_PATH로 지정한 뒤 `npm run overnight:saved`를 실행한다. 경로가 없으면 의도적으로 실패한다. 원래 외부 수집/Markdown 스크립트의 직접 실행은 보존되었지만 Railway cron에 그 명령을 사용하지 않는다.

스키마는 CREATE TABLE IF NOT EXISTS만 추가하며 기존 데이터 변환/삭제가 없다. rollback은 cron을 중지하고 이전 코드를 재배포한다. 추가 테이블은 남겨 감사 이력을 보존한다. 운영 DB 백업/복원은 사람이 검증한다. 테스트에서만 임시 DB를 사용하고 종료 시 삭제한다.

### 남은 미구현 / UNKNOWN

- 실제 Railway 예약 활성화, 운영 배포, 운영 DB/health 조회, GitHub main 보호 규칙 적용은 미실행/UNKNOWN.
- 새로운 시장 데이터의 야간 자동 수집, 공급처 가격/MOQ 수집, 재고/매출 연동, 실제 구매/광고/고객 발송/가격 변경/마켓 게시 executor는 미구현.
- 아침 요약은 API로 제공한다. 웹 전용 화면, 이메일/메신저 아침 발송은 미구현이며 외부 발송을 수행하지 않았다.
- 자율 코딩 runner/예약은 미구현. issue/task → isolated branch/worktree → tests/build → PR → human review 설계와 PR CI 기반만 구현했다.
- 데이터 전체를 동기 트랜잭션에서 읽는 단일 운영자 V1이다. 데이터 증가 시 실행시간을 측정하고 batch/snapshot worker 및 보관 정책을 도입해야 한다. 자동 보관/삭제는 없다.

### 검증 결과

- Node 22에서 `npm ci` 성공: 기존 package.json 의존성 범위를 유지하고 불일치하던 루트 lockfile을 재생성했다.
- `npm test` 성공: 기존 identity/dedup, market-model, workflow-lineage, Margin V2, integration-health 모두 통과. 기존 workflow E2E도 통과했으며 실패 시 nonzero exit가 되도록 보완했다.
- 신규 node:test 9개 통과: KST 경계/UNKNOWN, 실제 DB 기반 분석/lineage/도메인 불변, 중복/기각 유지, 누락/오래된 데이터, 위험 타입 서비스·SQL 차단, 실패 rollback/재시도, 실제 Express API 인증/승인 경계/기존 health, cron 계약/timeout 신호, 별도 두 프로세스의 파일 DB 동시 실행·종료·멱등성.
- `npm run build` 성공: 기존 Vite 프런트엔드 프로덕션 빌드 완료.
- `git diff --check` 통과. 외부 API 진단(test_ac/live_fetch/openapi/shop_api/catalog_e2e 및 live verify 스크립트)은 운영 자격증명과 실제 호출이 필요한 수동 진단이므로 미실행이다. 이 결과를 live integration 성공으로 표시하지 않는다.
- 운영 Railway 검증과 실제 수익/구매/발송/배포는 수행하지 않았다. PR CI의 원격 결과는 PR에서 별도로 확인한다.
