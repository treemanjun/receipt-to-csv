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

// 画像前処理関数（コントラスト強化）
function preprocessImage(imageData) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;

            // 画像を描画
            ctx.drawImage(img, 0, 0);

            // ピクセルデータを取得
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // コントラスト強化（グレースケール化 + 二値化）
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const value = avg > 128 ? 255 : 0; // 二値化
                data[i] = data[i + 1] = data[i + 2] = value;
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL());
        };
        img.src = imageData;
    });
}

// OCR処理関数
async function startOCRProcessing() {
    cameraSection.style.display = 'none';
    processingSection.style.display = 'block';

    try {
        console.log('OCR処理開始...');

        // 画像の前処理（コントラスト強化）
        const processedImage = await preprocessImage(capturedImageData);

        // Tesseract.jsでOCR実行
        const result = await Tesseract.recognize(
            processedImage,
            'jpn+eng', // 日本語と英語の両方認識
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`処理中: ${Math.round(m.progress * 100)}%`);
                    }
                },
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
                preserve_interword_spaces: '1'
            }
        );

        const ocrText = result.data.text;
        console.log('OCR結果:', ocrText);

        alert('OCR完了！\n\n抽出されたテキスト:\n' + ocrText.substring(0, 300) + '...');

        processingSection.style.display = 'none';
        cameraSection.style.display = 'block';

    } catch (error) {
        console.error('OCRエラー:', error);
        alert('OCR処理中にエラーが発生しました: ' + error.message);

        processingSection.style.display = 'none';
        cameraSection.style.display = 'block';
    }
}

// この画像を使うボタン
processButton.addEventListener('click', async () => {
    if (!capturedImageData) {
        alert('画像が選択されていません');
        return;
    }

    await startOCRProcessing();
});

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('レシートCSV変換アプリ起動');
    
    // カメラが使えるか確認
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('このブラウザはカメラ機能に対応していない可能性があります');
    }
});
