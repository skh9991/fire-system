/**
 * 앱에 함께 배포할 실물 사진 목록. 키는 부품 이름(줄바꿈은 공백), 값은 public/photos 기준 파일명.
 * 예: '체크밸브': 'check-valve.jpg'
 * 교수 모드에서 넣은 사진은 그 기기에만 저장되므로, 모든 학생에게 보이려면 여기에 등록합니다.
 */
export const BUNDLED_PHOTOS: Record<string, string> = {};
