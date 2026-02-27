# OnlyOnes Supabase MVP

Supabase(Postgres) 기반 StitchFix 벤치마킹 MVP입니다.

## 핵심 흐름
1. 사용자가 `/quiz`에서 답변 제출
2. 프론트에서 답변 JSON을 `derived_tags`로 룰 기반 변환
3. `quiz_submissions`에 `answers`, `derived_tags` 저장 후 `submission_id` 확보
4. `/results?sid=<submission_id>` 이동
5. Results에서 `rpc('get_recommendations')` 호출
6. DB 함수가 `products`를 태그 교집합 점수(`match_score`)로 정렬하고 최소 8개 반환

## 실행 순서
1. 마이그레이션 적용
```bash
supabase db push
```
2. 시드 적용 (로컬 전체 초기화 포함)
```bash
supabase db reset
```
3. 앱 실행
```bash
npm run dev
```
4. 로그인 후 `/quiz` 완료
5. `/results?sid=<uuid>`에서 추천 8~20개 카드 확인

## DB 구성
- `public.products`
- `public.quiz_submissions`
- `public.get_recommendations(p_submission_id uuid, p_limit int default 12)`

## 디버깅 가이드: "Failed to generate recommendations"

### 1) RLS에 막히는 경우
- 증상: RPC 에러 코드 `42501` 또는 권한 관련 메시지
- 확인: `quiz_submissions`의 `user_id`와 현재 로그인 `auth.uid()`가 일치하는지
- 예시 로그 (Results `console.error`):
  - `status`
  - `message`
  - `hint`

### 2) `products`가 비어있는 경우
- 증상: 추천 결과가 0~소수개
- 확인 SQL:
```sql
select count(*) from public.products where active = true;
```
- 조치: `supabase db reset` 또는 seed 재적용

### 3) `sid` 누락/잘못된 uuid
- 증상: Results에서 즉시 에러
- 확인:
  - URL에 `?sid=` 존재 여부
  - UUID 형식 여부
- RPC 내부 예외:
  - `submission_not_found` (`P0002`) + hint: sid 확인

## 핵심 코드 위치
- Quiz 제출 + `derived_tags` 저장: `src/pages/Quiz.tsx`
- 태그 추출 룰: `src/lib/quizTags.ts`
- Results RPC 호출 + 로딩/에러/재시도: `src/pages/Results.tsx`
- 스키마/RLS/RPC: `supabase/migrations/20260227120000_catalog_recommendations.sql`
- 시드(40+ products): `supabase/seed.sql`
