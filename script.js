// 전역 변수 설정
let chatHistory = [];
let chatIdx = 0;
let isProcessing = false;
let lastMessageTime = 0;
let messageDebounceTime = 1000; // 메시지 전송 간 최소 시간 간격 (밀리초)

// DOM이 로드된 후 실행
$(document).ready(function() {
    // 저장된 설정 불러오기
    loadSettings();
    
    // 이벤트 리스너 설정
    setupEventListeners();
});

// 이벤트 리스너 설정 함수
function setupEventListeners() {
    // 전송 버튼 클릭 이벤트
    $('#send-button').on('click', sendMessage);
    
    // 사용자 입력 엔터키 이벤트 (Shift+Enter는 줄바꿈)
    $('#user-input').on('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 모델 선택 변경 이벤트
    $('input[name="model"]').on('change', function() {
        const selectedModel = $('input[name="model"]:checked').val();
        
        // Gemini 모델 선택 시 Gemini 옵션 표시
        if (selectedModel.includes('gemini')) {
            $('.gemini-options').show();
        } else {
            $('.gemini-options').hide();
        }
        
        // 설정 저장
        saveSettings();
    });
    
    // 파라미터 변경 이벤트
    $('.parameter input[type="range"]').on('input', function() {
        const id = $(this).attr('id');
        const value = $(this).val();
        $(`#${id}-value`).text(value);
        
        // 설정 저장
        saveSettings();
    });
    
    // Gemini 옵션 변경 이벤트
    $('#grounding-option').on('change', saveSettings);
    
    // 지역 선택 변경 이벤트
    $('#region-select').on('change', function() {
        const selectedRegion = $(this).val();
        
        // '직접 입력' 옵션 선택 시 커스텀 입력 필드 표시
        if (selectedRegion === 'custom') {
            $('.custom-region').show();
        } else {
            $('.custom-region').hide();
        }
        
        saveSettings();
    });
    
    // 커스텀 지역 입력 변경 이벤트
    $('#custom-region-input').on('change keyup', saveSettings);
    
    // OpenAI API 키 변경 이벤트
    $('#openai-key').on('change', saveSettings);
}

// 메시지 전송 함수
function sendMessage() {
    // 이미 처리 중이면 중복 전송 방지
    if (isProcessing) {
        $('#user-input').val('');
        return;
    }
    
    // 연속 호출 방지 (디바운스)
    const now = Date.now();
    if (now - lastMessageTime < messageDebounceTime) {
        $('#user-input').val('');
        return;
    }
    
    const userInput = $('#user-input').val().trim();
    if (!userInput) return;
    
    // 마지막 메시지 시간 업데이트
    lastMessageTime = now;
    
    // 사용자 메시지 추가
    addMessage(userInput, 'user');
    
    // 입력창 초기화
    $('#user-input').val('');
    
    // 선택된 모델 확인
    const selectedModel = $('input[name="model"]:checked').val();
    
    // 로딩 표시 추가
    addLoadingIndicator();
    
    // 처리 중 상태로 변경
    isProcessing = true;
    $('#send-button').prop('disabled', true);
    
    // 선택된 모델에 따라 API 호출
    if (selectedModel.includes('gpt')) {
        callOpenAI(userInput);
    } else if (selectedModel.includes('gemini')) {
        callGemini(userInput);
    }
}

// 메시지 추가 함수
function addMessage(content, sender) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageClass = sender === 'user' ? 'user-message' : 'assistant-message';
    
    // AI 응답 텍스트 포맷팅 처리
    let formattedContent = content;
    
    if (sender === 'assistant') {
        // 줄바꿈을 HTML <br> 태그로 변환
        formattedContent = formattedContent.replace(/\n/g, '<br>');
        
        // 코드 블록 포맷팅 (```로 감싸진 부분)
        formattedContent = formattedContent.replace(/```([\s\S]*?)```/g, '<pre class="code-block">$1</pre>');
        
        // 인라인 코드 포맷팅 (`로 감싸진 부분)
        formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // 목록 포맷팅
        formattedContent = formattedContent.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
        formattedContent = formattedContent.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
        
        // 제목 포맷팅 (# 으로 시작하는 부분)
        formattedContent = formattedContent.replace(/^#\s+(.+)$/gm, '<h3>$1</h3>');
        formattedContent = formattedContent.replace(/^##\s+(.+)$/gm, '<h4>$1</h4>');
        formattedContent = formattedContent.replace(/^###\s+(.+)$/gm, '<h5>$1</h5>');
    }
    
    const messageHtml = `
        <div class="message ${messageClass}">
            <div class="message-content">${formattedContent}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    $('#chat-messages').append(messageHtml);
    
    // 채팅 히스토리 업데이트
    chatHistory.push({
        role: sender === 'user' ? 'user' : 'assistant',
        content: content
    });
    
    // 스크롤을 최하단으로 이동
    scrollToBottom();
}

// 로딩 표시 추가 함수
function addLoadingIndicator() {
    const loadingHtml = `
        <div class="loading-indicator assistant-message" id="loading-indicator">
            <div>AI가 응답 중입니다</div>
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    $('#chat-messages').append(loadingHtml);
    scrollToBottom();
}

// 로딩 표시 제거 함수
function removeLoadingIndicator() {
    $('#loading-indicator').remove();
}

// 스크롤을 최하단으로 이동하는 함수
function scrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// OpenAI API 호출 함수
function callOpenAI(userInput) {
    const openaiAccessKey = $('#openai-key').val();

    if (!openaiAccessKey) {
        removeLoadingIndicator();
        addMessage('OpenAI API 키를 입력해주세요.', 'assistant');
        // 처리 완료
        isProcessing = false;
        $('#send-button').prop('disabled', false);
        
        // 디바운스 타이머 설정 (추가 안전장치)
        setTimeout(() => {
            if (isProcessing) isProcessing = false;
        }, 500);
        return;
    }
    
    // 파라미터 가져오기
    const temperature = parseFloat($('#temperature').val());
    const maxLength = parseInt($('#max-length').val());
    const topP = parseFloat($('#top-p').val());
    const frequencyPenalty = parseFloat($('#frequency-penalty').val());
    const presencePenalty = parseFloat($('#presence-penalty').val());
    
    // 시스템 프롬프트 가져오기
    const systemPrompt = $('#system-prompt').val().trim();
    
    // 메시지 배열 구성
    const messages = [];
    
    // 시스템 프롬프트가 있으면 추가
    if (systemPrompt) {
        messages.push({
            role: 'system',
            content: systemPrompt
        });
    }
    
    // 채팅 히스토리 추가
    chatHistory.forEach(msg => {
        messages.push({
            role: msg.role,
            content: msg.content
        });
    });
    
    // API 요청 데이터
    const request = {
        model: $('input[name="model"]:checked').val(),
        messages: messages,
        temperature: temperature,
        max_tokens: maxLength,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty
    };
    
    // OpenAI API 호출
    $.ajax({
        url: 'https://api.openai.com/v1/chat/completions',
        type: 'POST',
        contentType: 'application/json',
        headers: { 'Authorization': `Bearer ${openaiAccessKey}` },
        data: JSON.stringify(request),
        success: function(data) {
            console.log('OpenAI 서버 응답:', data);
            const responseContent = data.choices[0].message.content;
            
            // 로딩 표시 제거
            removeLoadingIndicator();
            
            // 응답 메시지 추가
            addMessage(responseContent, 'assistant');
            
            // 처리 완료
            isProcessing = false;
            $('#send-button').prop('disabled', false);
        },
        error: function(xhr, status, error) {
            console.error('에러 발생:', error);
            console.log(xhr.responseText);
            
            // 로딩 표시 제거
            removeLoadingIndicator();
            
            // 오류 메시지 추가
            addMessage(`OpenAI API Error: ${xhr.responseText}`, 'assistant');
            
            // 처리 완료
            isProcessing = false;
            $('#send-button').prop('disabled', false);
        }
    });
}

// Gemini API 호출 함수
function callGemini(userInput) {
    // 파라미터 가져오기
    const temperature = parseFloat($('#temperature').val());
    const maxLength = parseInt($('#max-length').val());
    const topP = parseFloat($('#top-p').val());
    
    // Gemini 옵션 가져오기
    const groundingOption = $('#grounding-option').is(':checked');
    
    // 지역 설정
    let region = $('#region-select').val();
    if (region === 'custom') {
        const customRegion = $('#custom-region-input').val().trim();
        if (customRegion) {
            region = customRegion;
        }
    }
    
    // 시스템 프롬프트 가져오기
    const systemPrompt = $('#system-prompt').val().trim();
    
    // 메시지 배열 구성
    const messages = [];
    
    // 시스템 프롬프트가 있으면 추가
    if (systemPrompt) {
        messages.push({
            role: 'MODEL',
            content: systemPrompt
        });
    }
    
    // 채팅 히스토리 추가
    chatHistory.forEach(msg => {
        messages.push({
            role: 'USER',
            content: msg.content
        });
    });
    
    // API 요청 데이터
    const request = {
        model: $('input[name="model"]:checked').val(),
        messages: messages,
        temperature: temperature,
        maxLength: maxLength,
        topP: topP,
        groundingOption: groundingOption,
        region: region
    };
    
    // Gemini API 호출
    $.ajax({
        url: 'http://searchadmindev.hanatour.com:8082/playground/chat/',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(request),
        success: function(data) {
            console.log('Gemini 서버 응답:', data);
            const responseContent = data;
            
            // 로딩 표시 제거
            removeLoadingIndicator();
            
            // 응답 메시지 추가
            addMessage(responseContent, 'assistant');
            
            // 처리 완료
            isProcessing = false;
            $('#send-button').prop('disabled', false);
        },
        error: function(xhr, status, error) {
            console.error('에러 발생:', error);
            console.log(xhr.responseText);
            
            // 로딩 표시 제거
            removeLoadingIndicator();
            
            // 오류 메시지 추가
            addMessage(`Gemini API Error: ${xhr.responseText}`, 'assistant');
            
            // 처리 완료
            isProcessing = false;
            $('#send-button').prop('disabled', false);
        }
    });
}

// 설정 저장 함수
function saveSettings() {
    // 지역 설정
    let region = $('#region-select').val();
    if (region === 'custom') {
        const customRegion = $('#custom-region-input').val().trim();
        if (customRegion) {
            region = customRegion;
        }
    }
    
    const settings = {
        model: $('input[name="model"]:checked').val(),
        temperature: $('#temperature').val(),
        maxLength: $('#max-length').val(),
        topP: $('#top-p').val(),
        frequencyPenalty: $('#frequency-penalty').val(),
        presencePenalty: $('#presence-penalty').val(),
        groundingOption: $('#grounding-option').is(':checked'),
        region: region,
        customRegion: $('#custom-region-input').val(),
        isCustomRegion: region === 'custom',
        openaiKey: $('#openai-key').val(),
        systemPrompt: $('#system-prompt').val()
    };
    
    localStorage.setItem('llmChatSettings', JSON.stringify(settings));
}

// 설정 불러오기 함수
function loadSettings() {
    const savedSettings = localStorage.getItem('llmChatSettings');
    
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // 모델 선택 적용
        $(`input[name="model"][value="${settings.model}"]`).prop('checked', true);
        
        // Gemini 옵션 표시 여부 설정
        if (settings.model.includes('gemini')) {
            $('.gemini-options').show();
        } else {
            $('.gemini-options').hide();
        }
        
        // 파라미터 값 적용
        $('#temperature').val(settings.temperature);
        $('#temperature-value').text(settings.temperature);
        
        $('#max-length').val(settings.maxLength);
        $('#max-length-value').text(settings.maxLength);
        
        $('#top-p').val(settings.topP);
        $('#top-p-value').text(settings.topP);
        
        $('#frequency-penalty').val(settings.frequencyPenalty);
        $('#frequency-penalty-value').text(settings.frequencyPenalty);
        
        $('#presence-penalty').val(settings.presencePenalty);
        $('#presence-penalty-value').text(settings.presencePenalty);
        
        // Gemini 옵션 적용
        $('#grounding-option').prop('checked', settings.groundingOption);
        
        // 지역 설정 적용
        if (settings.isCustomRegion) {
            $('#region-select').val('custom');
            $('.custom-region').show();
            $('#custom-region-input').val(settings.customRegion);
        } else {
            $('#region-select').val(settings.region);
            $('.custom-region').hide();
        }
        
        // OpenAI API 키 적용
        $('#openai-key').val(settings.openaiKey);
        
        // 시스템 프롬프트 적용
        $('#system-prompt').val(settings.systemPrompt);
    }
}
