/**
 * 내용: 파일 변환 프로세스에서 사용하는 공통 데이터 구조 및 상수 정의
 */

export const CONVERSION_THEMES = {
  GENESIS: 'genesis',
  GENIUS: 'genius',
};

export const IMAGE_SIZE_OPTIONS = {
  STANDARD: 'standard',
  ORIGINAL: 'original',
};

/**
 * 내용: 초기 그룹 데이터를 생성하는 헬퍼 함수
 */
export const createInitialGroup = (files = []) => {
  const getBaseName = (fileName) => {
    if (!fileName) return "문서";
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
  };

  const defaultName = files.length > 0 ? getBaseName(files[0].name) : "새 문서";

  return {
    id: Date.now(),
    filename: defaultName,
    documentTitle: defaultName,
    imageSize: IMAGE_SIZE_OPTIONS.STANDARD,
    files: [...files]
  };
};
