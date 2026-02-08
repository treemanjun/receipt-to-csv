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
processButton.addEventListener('click', async () => {
    if (!capturedImageData) {
        alert('画像が選択されていません');
        return;
    }

    // 処理中画面を表示
    cameraSection.style.display = 'none';
    processingSection.style.display = 'block';

    try {
        // Tesseract.jsでOCR処理を実行
        console.log('OCR処理を開始します...');

        const result = await Tesseract.recognize(
            capturedImageData,
            'jpn+eng', // 日本語と英語に対応
            {
                logger: (m) => {
                    // 進捗状況をコンソールに表示
                    if (m.status === 'recognizing text') {
                        console.log(`OCR進捗: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );

        console.log('OCR処理完了！');
        console.log('認識されたテキスト:', result.data.text);

        // 次のフェーズでデータ編集画面に遷移
        alert('OCR処理が完了しました！\n\n認識されたテキスト:\n' + result.data.text.substring(0, 200));

        // 一旦カメラ画面に戻る（次のフェーズでデータ編集画面を実装）
        processingSection.style.display = 'none';
        cameraSection.style.display = 'block';

    } catch (error) {
        console.error('OCR処理エラー:', error);
        alert('OCR処理中にエラーが発生しました: ' + error.message);

        // エラー時はカメラ画面に戻る
        processingSection.style.display = 'none';
        cameraSection.style.display = 'block';
    }
});

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('レシートCSV変換アプリ起動');
    
    // カメラが使えるか確認
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('このブラウザはカメラ機能に対応していない可能性があります');
    }
});
