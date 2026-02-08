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

// 強化された画像前処理関数
function preprocessImage(imageData) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 画像を2倍にスケールアップ（OCR精度向上）
            const scale = 2;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            // スムージングを無効化（シャープに）
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // ピクセルデータ取得
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // グレースケール化 + コントラスト強化
            for (let i = 0; i < data.length; i += 4) {
                // グレースケール変換
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

                // コントラスト強化（シグモイド関数）
                const contrast = 1.5; // コントラスト係数
                const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                let enhanced = factor * (gray - 128) + 128;

                // 適応的二値化（より明確な白黒）
                const threshold = 140;
                enhanced = enhanced > threshold ? 255 : 0;

                data[i] = data[i + 1] = data[i + 2] = enhanced;
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL());
        };
        img.src = imageData;
    });
}

// OCRテキスト補正関数
function correctOCRText(text) {
    // 丸囲み数字を通常数字に変換
    const circledNumbers = {
        '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5',
        '⑥': '6', '⑦': '7', '⑧': '8', '⑨': '9', '⑩': '10',
        '⓪': '0'
    };

    for (const [circled, normal] of Object.entries(circledNumbers)) {
        text = text.replaceAll(circled, normal);
    }

    // 全角数字を半角に変換
    text = text.replace(/[０-９]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    // 全角英字を半角に変換
    text = text.replace(/[Ａ-Ｚａ-ｚ]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    // 連続する空白を1つに
    text = text.replace(/\s+/g, ' ');

    return text;
}

// OCR処理関数
async function startOCRProcessing() {
    cameraSection.style.display = 'none';
    processingSection.style.display = 'block';

    try {
        console.log('OCR処理開始...');

        const processedImage = await preprocessImage(capturedImageData);

        const result = await Tesseract.recognize(
            processedImage,
            'jpn',
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`処理中: ${Math.round(m.progress * 100)}%`);
                    }
                },
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
                tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY, // 最新のLSTMエンジン
                preserve_interword_spaces: '1'
            }
        );

        // OCR結果を取得して補正
        let ocrText = result.data.text;
        ocrText = correctOCRText(ocrText);

        console.log('OCR結果（補正後）:', ocrText);

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
