// DOM要素の取得
const cameraInput = document.getElementById('camera-input');
const previewArea = document.getElementById('preview-area');
const previewImage = document.getElementById('preview-image');
const retryButton = document.getElementById('retry-button');
const processButton = document.getElementById('process-button');
const cameraSection = document.getElementById('camera-section');
const processingSection = document.getElementById('processing-section');

// 撮影した画像データを保持
let capturedImageData = null;

// カメラ入力の変更イベント（画像が選択されたとき）
cameraInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    
    if (file) {
        // 画像をプレビュー表示
        const reader = new FileReader();
        
        reader.onload = (e) => {
            capturedImageData = e.target.result;
            previewImage.src = capturedImageData;
            previewArea.style.display = 'block';
        };
        
        reader.readAsDataURL(file);
    }
});

// 撮り直しボタン
retryButton.addEventListener('click', () => {
    // プレビューを非表示にして、カメラ入力をリセット
    previewArea.style.display = 'none';
    cameraInput.value = '';
    capturedImageData = null;
});

// この画像を使うボタン
processButton.addEventListener('click', () => {
    if (!capturedImageData) {
        alert('画像が選択されていません');
        return;
    }
    
    // OCR処理へ進む（次のフェーズで実装）
    console.log('画像データ:', capturedImageData.substring(0, 50) + '...');
    alert('次のフェーズでOCR処理を実装します！');
    
    // 処理中画面を表示（デモ）
    // cameraSection.style.display = 'none';
    // processingSection.style.display = 'block';
});

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('レシートCSV変換アプリ起動');
    
    // カメラが使えるか確認
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('このブラウザはカメラ機能に対応していない可能性があります');
    }
});
