import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

/**
 * 내용: 파일 드래그 앤 드롭 업로더 컴포넌트입니다. PDF와 PPTX 파일만 허용합니다.
 * param: onFilesAdded - 사용자가 추가한 파일 배열을 처리하는 콜백 함수
 * return: JSX 요소
 */
function FileUploader({ onFilesAdded }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFilesAdded(acceptedFiles);
    }
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    multiple: true
  });

  return (
    <div
      {...getRootProps()}
      className={`uploader-container ${isDragActive ? 'active' : 'idle'}`}
    >
      <input {...getInputProps()} />
      <Upload 
        size={48} 
        color={isDragActive ? '#2196f3' : '#999'} 
        className="uploader-icon"
      />
      {isDragActive ? (
        <p className="uploader-text active">여기에 파일을 놓으세요...</p>
      ) : (
        <p className="uploader-text idle">
          PDF 또는 PPTX 파일을 드래그 앤 드롭 하거나,<br />
          클릭하여 파일을 선택하세요.
        </p>
      )}
    </div>
  );
}

export default FileUploader;