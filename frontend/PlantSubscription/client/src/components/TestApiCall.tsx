import React, { useState, useCallback } from 'react';
import axios from 'axios'; // API 호출을 위해 axios 라이브러리 사용 가정

// 백엔드 기본 URL 설정
// 실제 환경에 맞게 변경해주세요. (예: 배포 환경 URL)
const API_BASE_URL = 'http://localhost:8080'; 

function TestApiCall() {
    const [resultMessage, setResultMessage] = useState('버튼을 눌러 연결을 테스트하세요.');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(null); // null: 초기, true: 성공, false: 실패

    // API 호출 로직을 useCallback으로 감싸 성능 최적화
    const handleTestConnection = useCallback(async () => {
        setIsLoading(true);
        setResultMessage('API 호출 중...');
        setIsSuccess(null);

        try {
            // GET 요청: http://localhost:8080/tests
            const response = await axios.get(`${API_BASE_URL}/tests`);

            // 응답 상태가 200 OK이고, 백엔드에서 보낸 메시지가 있다면
            if (response.status === 200 && response.data) {
                setResultMessage(`연결 성공! 응답 메시지: "${response.data}"`);
                setIsSuccess(true);
            } else {
                setResultMessage('연결 성공, 하지만 예상치 못한 응답입니다.');
                setIsSuccess(false);
            }
        } catch (error) {
            // 네트워크 오류, CORS 문제, 4xx/5xx 응답 등 모든 오류 처리
            console.error("API 호출 오류 발생:", error);
            
            // 오류 메시지 표시
            if (error.response) {
                // 서버가 응답했으나 2xx 범위가 아닌 경우 (예: 404, 500)
                setResultMessage(`연결 실패! 상태 코드: ${error.response.status}, 서버 오류`);
            } else if (error.request) {
                // 요청은 보냈으나 응답을 받지 못한 경우 (예: CORS, 네트워크 다운)
                setResultMessage('연결 실패! 백엔드 서버가 작동 중인지, CORS 설정이 올바른지 확인하세요.');
            } else {
                // 기타 오류
                setResultMessage('API 호출 중 알 수 없는 오류 발생.');
            }
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 결과 메시지 스타일 동적 지정
    const style = {
        padding: '10px',
        margin: '10px 0',
        borderRadius: '5px',
        textAlign: 'center',
        color: isSuccess === true ? '#155724' : isSuccess === false ? '#721c24' : '#004085',
        backgroundColor: isSuccess === true ? '#d4edda' : isSuccess === false ? '#f8d7da' : '#cce5ff',
        border: `1px solid ${isSuccess === true ? '#c3e6cb' : isSuccess === false ? '#f5c6cb' : '#b8daff'}`,
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>백엔드 연결 테스트</h2>
            
            <button 
                onClick={handleTestConnection} 
                disabled={isLoading}
                style={{ padding: '10px 20px', fontSize: '16px', cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
                {isLoading ? '연결 확인 중...' : 'GET /tests 호출'}
            </button>

            <div style={style}>
                <strong>결과:</strong> {resultMessage}
            </div>

            {/* 디버깅 용도: 백엔드 콘솔에 "정상 작동" 로그가 찍히는지 확인 */}
            <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                * 호출 성공 시, 백엔드 콘솔(터미널)에 "정상 작동" 로그가 찍히는지 확인하세요.
            </p>
        </div>
    );
}

export default TestApiCall;