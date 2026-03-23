# 로컬 Whisper STT 프로그램 설계서

## 1. 문서 개요

본 문서는 로컬 Whisper 기반 STT 프로그램의 CLI 및 Streamlit 웹 UI 구조, 구성 요소, 데이터 흐름, 소스 폴더 구조 및 테스트 방안을 정리한 설계 문서이다.

## 2. 시스템 개요

프로그램은 사용자가 지정한 음성 파일 또는 폴더를 입력받거나 웹 UI에서 파일을 업로드하여, 로컬에 저장된 Whisper 모델을 이용해 텍스트로 변환한다.  
CLI는 결과를 `.txt` 파일로 저장하고, 웹 UI는 결과를 화면에 표시하며 파일별 다운로드를 제공한다.

주요 관심사:

- CLI 인자 처리
- 웹 UI 진입 및 업로드 처리
- 설정 파일 로딩
- 입력 파일 탐색
- Whisper 전사 처리
- 공통 전사 서비스
- 결과 저장 및 다운로드

## 3. 기술 스택

- Language: Python 3.10+
- STT Engine: `faster-whisper`
- Config Loader: `PyYAML`
- Web UI: `Streamlit`
- Packaging: `setuptools`, `pyproject.toml`
- Test: `unittest`

## 4. 아키텍처 설계

### 4.1 CLI 처리 흐름

1. 사용자가 CLI로 `--config`, `--input`, 선택적으로 `--model` 값을 전달한다.
2. 프로그램이 YAML 설정 파일을 로드한다.
3. 설정에서 모델 프로필을 해석한다.
4. 입력 경로가 파일인지 폴더인지 판별한다.
5. 처리 대상 음성 파일 목록을 생성한다.
6. 선택된 모델로 Whisper를 초기화한다.
7. 공통 서비스 계층으로 파일 전사를 수행한다.
8. 결과를 `output_dir` 아래 `.txt` 파일로 저장한다.
9. 성공/실패 건수를 집계하여 종료한다.

### 4.2 웹 UI 처리 흐름

1. 사용자가 Streamlit 앱을 실행한다.
2. 프로그램이 YAML 설정 파일을 로드한다.
3. 사용자가 모델 프로필(`small`, `large`)을 선택한다.
4. 사용자가 음성 파일을 다중 업로드한다.
5. 업로드 파일을 임시 디렉터리에 저장한다.
6. 선택 모델로 Whisper를 초기화한다.
7. 공통 서비스 계층으로 파일 전사를 수행한다.
8. 결과를 화면에 표시하고 파일별 `.txt` 다운로드를 제공한다.

### 4.3 모듈 분리 원칙

- CLI는 흐름 제어와 콘솔 출력만 담당한다.
- 웹 UI는 업로드, 실행 트리거, 결과 표시만 담당한다.
- 설정 파싱은 별도 모듈에서 담당한다.
- 입력 파일 탐색은 독립 함수로 구성한다.
- 모델 초기화와 실제 전사는 전용 클래스에 위임한다.
- 다중 파일 전사와 결과 구조화는 공용 서비스 계층에서 담당한다.
- 파일 저장은 별도 모듈로 분리한다.

## 5. 소스 폴더 구조

```text
stt/
├─ config.example.yaml
├─ config.yaml
├─ pyproject.toml
├─ README.md
├─ docs/
│  ├─ 01_요구사항분석.md
│  ├─ 02_설계서_task.md
│  └─ 03_사용자매뉴얼.md
├─ src/
│  └─ stt_cli/
│     ├─ __init__.py
│     ├─ __main__.py
│     ├─ cli.py
│     ├─ config.py
│     ├─ discovery.py
│     ├─ service.py
│     ├─ transcriber.py
│     ├─ web_app.py
│     └─ writer.py
└─ tests/
   ├─ test_config.py
   ├─ test_discovery.py
   └─ test_service.py
```

## 6. 모듈 상세 설계

### 6.1 `config.py`

역할:

- YAML 설정 파일 로딩
- 모델 프로필 구조 해석
- 구버전 `model_path` 설정과의 호환 유지
- 런타임용 모델 설정 객체 생성

주요 객체:

- `AppConfig`
  - `models: dict[str, Path]`
  - `default_model: str`
  - `device`, `compute_type`, `language`, `beam_size`, `output_dir`, `supported_extensions`
- `RuntimeConfig`
  - 선택된 모델 1개에 대한 실행 전용 설정

### 6.2 `cli.py`

역할:

- 명령행 인자 파싱
- 설정/입력 검증
- 공용 전사 서비스 호출
- 콘솔 결과 출력 및 종료 코드 결정

### 6.3 `discovery.py`

역할:

- 입력 경로 존재 여부 확인
- 단일 파일 또는 폴더 분기 처리
- 지원 확장자 파일 목록 생성

### 6.4 `transcriber.py`

역할:

- `faster-whisper` 모델 로딩
- 음성 파일 전사 수행

주요 설계 포인트:

- 선택된 모델 프로필의 경로를 기준으로 `WhisperModel` 초기화
- `beam_size`, `language`, `device`, `compute_type`를 런타임 설정으로 적용

### 6.5 `service.py`

역할:

- 다중 파일 전사 공통 처리
- 파일별 성공/실패 결과 구조화
- CLI와 웹 UI가 공통으로 사용할 서비스 계층 제공

주요 객체:

- `TranscriptionResult`
  - `source_name`
  - `source_path`
  - `transcript`
  - `status`
  - `error_message`
  - `output_path`

### 6.6 `writer.py`

역할:

- 출력 디렉터리 생성
- CLI 전사 결과 `.txt` 파일 저장

### 6.7 `web_app.py`

역할:

- Streamlit 기반 웹 UI 제공
- 다중 파일 업로드 처리
- 모델 선택 UI 제공
- 전사 결과 화면 표시 및 다운로드 버튼 제공

### 6.8 `__main__.py`

역할:

- `python -m stt_cli` 실행 진입점 제공

## 7. 설정 파일 설계

### 7.1 설정 예시

```yaml
models:
  small: "D:/models/faster-whisper-small"
  large: "D:/models/faster-whisper-large-v3"
default_model: "small"
device: "cpu"
compute_type: "int8"
language: null
beam_size: 5
output_dir: "outputs"
supported_extensions:
  - ".mp3"
  - ".wav"
  - ".m4a"
  - ".flac"
  - ".ogg"
```

### 7.2 필드 설명

- `models.small`: small 모델 디렉터리 경로
- `models.large`: large 모델 디렉터리 경로
- `default_model`: CLI 기본 모델 프로필
- `device`: 실행 장치
- `compute_type`: 연산 타입
- `language`: 고정 언어 또는 자동 감지
- `beam_size`: 전사 품질 옵션
- `output_dir`: CLI 결과 저장 폴더
- `supported_extensions`: 처리 허용 확장자 목록

## 8. 인터페이스 설계

### 8.1 CLI 인터페이스

```bash
stt-cli --config <config_path> --input <file_or_directory> [--model <profile_name>]
```

```bash
python -m stt_cli --config <config_path> --input <file_or_directory> [--model <profile_name>]
```

### 8.2 Web 인터페이스

```bash
streamlit run src/stt_cli/web_app.py -- --config <config_path>
```

### 8.3 종료 코드 정책

- `0`: 전체 파일 처리 성공
- `1`: 초기화 실패 또는 일부 파일 이상 발생

## 9. 예외 처리 설계

### 초기화 단계 예외

- 설정 파일 미존재
- 모델 프로필 미존재
- 모델 경로 미존재
- 입력 경로 미존재
- 지원하지 않는 파일 확장자

처리 방식:

- CLI는 즉시 실패하고 표준 에러로 원인을 출력
- 웹 UI는 화면에 오류를 표시

### 처리 단계 예외

- 특정 음성 파일 디코딩 실패
- Whisper 전사 중 오류 발생
- 결과 파일 저장 실패

처리 방식:

- 실패 파일만 결과 객체에 기록
- 나머지 파일은 계속 처리
- 마지막에 전체 요약 반영

## 10. 테스트 설계

### 단위 테스트 대상

- 설정 파일 로딩 및 확장자 정규화
- 모델 프로필/구버전 설정 호환
- 폴더 입력 시 파일 필터링
- 공용 전사 서비스 성공/실패 처리

### 현재 테스트 파일

- `tests/test_config.py`
- `tests/test_discovery.py`
- `tests/test_service.py`

### 향후 추가 권장 테스트

- `cli.py` 인자 처리 테스트
- `transcriber.py` Mock 기반 단위 테스트
- Streamlit UI 스모크 테스트
- 실제 샘플 음성 기반 통합 테스트

## 11. 설계상 의사결정

- Whisper 백엔드는 실사용성과 속도를 고려해 `faster-whisper` 채택
- 설정 파일 형식은 YAML 채택
- 웹 UI는 구현 속도와 로컬 사용성을 고려해 Streamlit 채택
- CLI와 웹 UI는 공통 서비스 계층을 공유
- 웹 UI 모델 선택은 `small`, `large` 두 프로필로 제한

## 12. 향후 개선 방향

- ZIP 일괄 다운로드
- 재귀 폴더 탐색
- `srt`, `json` 출력 포맷 추가
- 진행률 표시 강화
- 병렬 처리 옵션
- 별도 API 인터페이스 추가
