// ===========================
// グローバル変数
// ===========================
let customers = [];
let places = [];
let selectedCustomer = null;
let selectedPlaces = {};
let currentCategoryIndex = 0;
const categories = ['morning', 'lunch', 'afternoon', 'night', 'stay'];
const categoryNames = {
    morning: '午前の観光',
    lunch: 'ランチ',
    afternoon: '午後の観光',
    night: '夜の過ごし方',
    stay: '宿泊'
};

// ===========================
// 初期化
// ===========================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // データ読み込み
        await loadData();
        
        // localStorage確認（リロード復帰）
        const savedCustomerId = localStorage.getItem('selectedCustomerId');
        const savedCategoryIndex = localStorage.getItem('currentCategoryIndex');
        
        if (savedCustomerId && savedCategoryIndex !== null) {
            // 復帰処理
            selectedCustomer = customers.find(c => c.id === savedCustomerId);
            currentCategoryIndex = parseInt(savedCategoryIndex);
            selectedPlaces = JSON.parse(localStorage.getItem('selectedPlaces') || '{}');
            
            if (currentCategoryIndex < categories.length) {
                showInterviewScreen();
            } else {
                showPlanScreen();
            }
        } else {
            // 新規開始: スタート画面を表示
            showHomeScreen();
        }
    } catch (error) {
        showError('データの読み込みに失敗しました: ' + error.message);
    }
});

// ===========================
// データ読み込み
// ===========================
async function loadData() {
    try {
        const [customersRes, placesRes] = await Promise.all([
            fetch('data/customers.json'),
            fetch('data/places.json')
        ]);
        
        if (!customersRes.ok || !placesRes.ok) {
            throw new Error('データファイルが見つかりません');
        }
        
        customers = await customersRes.json();
        places = await placesRes.json();
        
        console.log('データ読み込み完了:', { customers: customers.length, places: places.length });
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        throw error;
    }
}

// ===========================
// 画面切り替え
// ===========================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// ===========================
// Home画面
// ===========================
function showHomeScreen() {
    // localStorageをクリア（新規スタート）
    localStorage.clear();
    
    showScreen('screen-home');
    
    const btnStart = document.getElementById('btn-start');
    if (!btnStart) {
        console.error('btn-start要素が見つかりません');
        return;
    }
    
    console.log('スタートボタンのイベントを設定しました');
    
    btnStart.onclick = () => {
        console.log('スタートボタンがクリックされました');
        console.log('顧客データ数:', customers.length);
        
        if (customers.length === 0) {
            showError('顧客データが読み込まれていません');
            return;
        }
        
        // ランダムに顧客を選択
        const randomIndex = Math.floor(Math.random() * customers.length);
        selectedCustomer = customers[randomIndex];
        
        console.log('選択された顧客:', selectedCustomer.name);
        
        // localStorage保存
        localStorage.setItem('selectedCustomerId', selectedCustomer.id);
        localStorage.setItem('currentCategoryIndex', '0');
        localStorage.setItem('selectedPlaces', JSON.stringify({}));
        
        currentCategoryIndex = 0;
        selectedPlaces = {};
        
        showInterviewScreen();
    };
}

// ===========================
// Interview画面
// ===========================
function showInterviewScreen() {
    showScreen('screen-interview');
    updateProgress();
    
    // 初回のみ顧客情報を表示
    if (currentCategoryIndex === 0) {
        updateCustomerHint();
    }
    
    showCategoryQuestion();
    
    // ボタンイベントを設定
    setupInterviewButtons();
}

function setupInterviewButtons() {
    // 「一つ前に戻る」ボタン
    const btnBack = document.getElementById('btn-back');
    btnBack.disabled = currentCategoryIndex === 0;
    btnBack.onclick = () => {
        if (currentCategoryIndex > 0) {
            currentCategoryIndex--;
            // 前のカテゴリの選択を削除
            const category = categories[currentCategoryIndex];
            delete selectedPlaces[category];
            
            // localStorage更新
            localStorage.setItem('currentCategoryIndex', currentCategoryIndex.toString());
            localStorage.setItem('selectedPlaces', JSON.stringify(selectedPlaces));
            
            // 画面更新
            showInterviewScreen();
        }
    };
    
    // 「最初からやり直す」ボタン
    const btnRestartInterview = document.getElementById('btn-restart-interview');
    btnRestartInterview.onclick = () => {
        if (confirm('最初からやり直しますか？')) {
            restart();
        }
    };
}

function updateCustomerHint() {
    const hintContainer = document.getElementById('customer-hint');
    const category = categories[currentCategoryIndex];
    const categoryHint = selectedCustomer.categoryHints?.[category] || selectedCustomer.persona;
    const categoryName = categoryNames[category];
    
    hintContainer.innerHTML = `
        <h3>💡 ${selectedCustomer.name}</h3>
        <p style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #ccc;">${selectedCustomer.persona}</p>
        <h4 style="font-size: 16px; color: #667eea; margin: 15px 0 10px 0;">📌 ${categoryName}について</h4>
        <p>${categoryHint}</p>
    `;
}

function updateProgress() {
    const progress = ((currentCategoryIndex + 1) / categories.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
}

function addChatMessage(message) {
    const container = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.textContent = message;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function showCategoryQuestion() {
    const category = categories[currentCategoryIndex];
    const categoryName = categoryNames[category];
    
    // スクロールを一番上に戻す
    const mainArea = document.querySelector('.interview-main');
    if (mainArea) {
        mainArea.scrollTop = 0;
    }
    
    // カテゴリに応じた具体的なヒントを左側に表示
    updateCustomerHint();
    
    // 右側にはシンプルなタイトルのみ
    document.getElementById('interview-title').textContent = `【${categoryName}】を選んでください`;
    
    const categoryPlaces = places.filter(p => p.category === category);
    renderPlaceCards(categoryPlaces);
}

function renderPlaceCards(categoryPlaces) {
    const container = document.getElementById('place-cards');
    container.innerHTML = categoryPlaces.map(place => `
        <div class="place-card" data-place-id="${place.id}" onclick="showDetailModal('${place.id}')" style="cursor: pointer;">
            <div class="place-card-image">
                ${place.photo ? `<img src="${place.photo}" alt="${place.name}" onerror="this.style.display='none'">` : '🏞️'}
            </div>
            <div class="place-card-body">
                <h3>${place.name}</h3>
                <p>${place.description}</p>
                <div class="place-card-meta">
                    <span class="meta-tag">対象: ${place.age}</span>
                    <span class="meta-tag">⏱️ ${place.durationMin}分</span>
                    <span class="meta-tag">💰 ${place.costYen}円${place.costYen === 0 ? '(無料)' : ''}</span>
                    ${place.rainyOk ? '<span class="meta-tag highlight">☔雨OK</span>' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// ===========================
// モーダル: 詳細と深掘り
// ===========================
function showDetailModal(placeId) {
    const place = places.find(p => p.id === placeId);
    if (!place) return;
    
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <div class="modal-image">
            ${place.photo ? `<img src="${place.photo}" alt="${place.name}" onerror="this.style.display='none'">` : '🏞️'}
        </div>
        <h2>${place.name}</h2>
        <p>${place.detail}</p>
        
        <div class="modal-actions" style="display: flex; gap: 15px; margin-top: 30px; justify-content: center;">
            <button id="btn-confirm-selection" class="btn btn-primary">確定する</button>
        </div>
    `;
    
    modal.classList.add('active');
    
    // 「確定する」ボタンのイベント
    document.getElementById('btn-confirm-selection').addEventListener('click', () => {
        selectPlaceWithDeepOption(place, null);
    });
    
    // モーダルを閉じる
    modal.querySelector('.modal-close').onclick = () => {
        modal.classList.remove('active');
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    };
}

function selectPlaceWithDeepOption(place, optionIndex) {
    // 選択したplaceをそのまま保存（深堀りタグは不要）
    const selectedPlace = place;
    
    // カテゴリに保存
    const category = categories[currentCategoryIndex];
    selectedPlaces[category] = selectedPlace;
    
    // localStorage保存
    localStorage.setItem('selectedPlaces', JSON.stringify(selectedPlaces));
    
    // モーダルを閉じる
    document.getElementById('modal').classList.remove('active');
    
    // 次のカテゴリへ
    setTimeout(() => {
        currentCategoryIndex++;
        localStorage.setItem('currentCategoryIndex', currentCategoryIndex.toString());
        
        if (currentCategoryIndex < categories.length) {
            updateProgress();
            showCategoryQuestion();
        } else {
            // 全カテゴリ完了 → Plan画面へ
            showPlanScreen();
        }
    }, 300);
}

// ===========================
// Plan画面: タイムライン
// ===========================
function showPlanScreen() {
    showScreen('screen-plan');
    renderTimeline();
    
    document.getElementById('btn-to-result').onclick = () => {
        showResultScreen();
    };
}

function renderTimeline() {
    const timeline = document.getElementById('timeline');
    
    // 固定時間割
    const schedule = [
        { time: '09:00-11:00', category: 'morning' },
        { time: '12:00-13:00', category: 'lunch' },
        { time: '13:30-16:00', category: 'afternoon' },
        { time: '17:00-19:00', category: 'night' },
        { time: '19:00-', category: 'stay' }
    ];
    
    timeline.innerHTML = schedule.map(item => {
        const place = selectedPlaces[item.category];
        if (!place) return '';
        
        return `
            <div class="timeline-item">
                <div class="timeline-time">${item.time}</div>
                <div class="timeline-content">
                    <h3>${place.name}</h3>
                    <p>${place.description}</p>
                    <div class="timeline-meta">
                        <span>⏱️ 約${place.durationMin}分</span>
                        <span>💰 ${place.costYen}円</span>
                        ${place.rainyOk ? '<span>☔ 雨でもOK</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===========================
// Result画面: スコア評価
// ===========================
function showResultScreen() {
    showScreen('screen-result');
    
    const score = calculateScore();
    renderScore(score);
    renderFeedback(score);
    
    document.getElementById('btn-restart').onclick = restart;
}

function calculateScore() {
    // 正解プランとの一致度で採点
    const correctPlan = selectedCustomer.correctPlan;
    const categories = ['morning', 'lunch', 'afternoon', 'night', 'stay'];
    
    let correctMatches = 0;
    const matchDetails = {};
    
    categories.forEach(category => {
        const selectedPlace = selectedPlaces[category];
        const correctId = correctPlan[category];
        
        if (selectedPlace && selectedPlace.id === correctId) {
            correctMatches++;
            matchDetails[category] = 'correct';
        } else {
            matchDetails[category] = 'incorrect';
        }
    });
    
    // スコア計算: 各カテゴリー20点満点
    const score = correctMatches * 20;
    
    // 選択したplaceの全tagsを集計（参考情報として）
    const allTags = [];
    Object.values(selectedPlaces).forEach(place => {
        allTags.push(...place.tags);
    });
    
    return {
        score: score,
        correctMatches,
        totalCategories: categories.length,
        matchDetails,
        allTags
    };
}

function renderScore(scoreData) {
    const container = document.getElementById('score-display');
    
    let comment = '';
    if (scoreData.score === 100) {
        comment = '完璧です！全て正解しました！🎉';
    } else if (scoreData.score >= 80) {
        comment = 'とても良いプランです！';
    } else if (scoreData.score >= 60) {
        comment = '良いプランです！';
    } else if (scoreData.score >= 40) {
        comment = 'もう少し工夫できそうです';
    } else {
        comment = '次はもっと良いプランを作りましょう！';
    }
    
    container.innerHTML = `
        <div class="score-number">${scoreData.score}点</div>
        <div class="score-comment">${comment}</div>
    `;
}

function renderFeedback(scoreData) {
    const container = document.getElementById('feedback');
    const categories = ['morning', 'lunch', 'afternoon', 'night', 'stay'];
    const categoryNames = {
        'morning': '午前の観光',
        'lunch': 'ランチ',
        'afternoon': '午後の観光',
        'night': '夜の過ごし方',
        'stay': '宿泊'
    };
    
    // 正解・不正解の内訳を表示
    const feedbackItems = categories.map(category => {
        const correctId = selectedCustomer.correctPlan[category];
        const selectedPlace = selectedPlaces[category];
        const correctPlace = places.find(p => p.id === correctId);
        
        const isCorrect = selectedPlace && selectedPlace.id === correctId;
        
        if (isCorrect) {
            return `<li class="feedback-correct">✅ <strong>${categoryNames[category]}</strong>: ${selectedPlace.name} - 正解です！</li>`;
        } else {
            return `<li class="feedback-incorrect">❌ <strong>${categoryNames[category]}</strong>: ${selectedPlace ? selectedPlace.name : '未選択'} → 正解は「${correctPlace.name}」でした</li>`;
        }
    });
    
    let overallHint = '';
    if (scoreData.score === 100) {
        overallHint = '<p class="feedback-perfect">🎉 全てのスポットが正解です！お客さんの希望を完璧に理解していますね！</p>';
    } else if (scoreData.score >= 60) {
        overallHint = '<p class="feedback-good">👍 いい感じです！お客さんのヒントをもう一度よく読んでみましょう。</p>';
    } else {
        overallHint = '<p class="feedback-try">💪 お客さんの好みやヒントをじっくり読んで、それに合うスポットを選んでみましょう！</p>';
    }
    
    container.innerHTML = `
        <h3>📋 採点結果（正解: ${scoreData.correctMatches}/${scoreData.totalCategories}）</h3>
        ${overallHint}
        <ul class="feedback-list">
            ${feedbackItems.join('')}
        </ul>
    `;
}

// ===========================
// リスタート
// ===========================
function restart() {
    // localStorageクリア
    localStorage.removeItem('selectedCustomerId');
    localStorage.removeItem('currentCategoryIndex');
    localStorage.removeItem('selectedPlaces');
    
    // 変数リセット
    selectedCustomer = null;
    selectedPlaces = {};
    currentCategoryIndex = 0;
    
    // スタート画面へ
    showHomeScreen();
}

// ===========================
// エラー表示
// ===========================
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.querySelector('p').textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// ===========================
// 拡張ポイント（コメント）
// ===========================
/*
【今後の拡張アイデア】

1. データ拡張
   - places.jsonにさらにスポットを追加（各カテゴリ10件以上推奨）
   - customers.jsonに顧客タイプを追加
   - 各placeにより詳細な属性を追加

2. スコアリング改善
   - カテゴリごとの重み付け
   - 時間や予算の整合性チェック
   - 地理的な移動距離を考慮

3. UI/UX改善
   - アニメーション追加
   - 地図表示（Leaflet.jsなど）
   - 画像の実装
   - 音声ガイド

4. 機能追加
   - プラン保存・共有機能
   - プラン比較機能
   - 印刷用レイアウト
   - 多言語対応

5. アクセシビリティ
   - キーボード操作対応
   - スクリーンリーダー対応
   - ハイコントラストモード
*/
