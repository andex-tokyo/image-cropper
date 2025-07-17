// HTMLの各要素を取得
const imageInput = document.getElementById('image-input');
const imageToCrop = document.getElementById('image-to-crop');
const previewCircle = document.querySelector('.preview-circle');
const previewCanvas = document.getElementById('preview-canvas');
const cropButton = document.getElementById('crop-button');
const logoButton = document.getElementById('logo-button');
const profileModeBtn = document.getElementById('profile-mode');
const logoModeBtn = document.getElementById('logo-mode');
const profilePreview = document.getElementById('profile-preview');
const logoPreview = document.getElementById('logo-preview');

// ロゴ調整用のスライダー
const sizeSlider = document.getElementById('size-slider');
const xSlider = document.getElementById('x-slider');
const ySlider = document.getElementById('y-slider');
const sizeValue = document.getElementById('size-value');
const xValue = document.getElementById('x-value');
const yValue = document.getElementById('y-value');
const resetButton = document.getElementById('reset-button');

let cropper;
let originalImageWidth, originalImageHeight;
let originalFileName;
let currentMode = 'profile'; // 'profile' または 'logo'
let croppedImageData = null; // クロップした画像データを保存

// モード切り替え
profileModeBtn.addEventListener('click', () => {
    switchMode('profile');
});

logoModeBtn.addEventListener('click', () => {
    switchMode('logo');
});

function switchMode(mode) {
    currentMode = mode;

    if (mode === 'profile') {
        profileModeBtn.classList.add('active');
        logoModeBtn.classList.remove('active');
        profilePreview.style.display = 'block';
        logoPreview.style.display = 'none';
        cropButton.style.display = 'inline-block';
        logoButton.style.display = 'none';
    } else {
        profileModeBtn.classList.remove('active');
        logoModeBtn.classList.add('active');
        profilePreview.style.display = 'none';
        logoPreview.style.display = 'block';
        cropButton.style.display = 'none';
        logoButton.style.display = 'inline-block';
    }

    // 既存のcropperがあれば再初期化
    if (cropper && imageToCrop.src) {
        initializeCropper();
    }
}

// 画像が選択されたときの処理
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    originalFileName = file.name;

    const reader = new FileReader();
    reader.onload = (event) => {
        imageToCrop.src = event.target.result;

        if (cropper) {
            cropper.destroy();
        }

        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            originalImageWidth = img.naturalWidth;
            originalImageHeight = img.naturalHeight;
            initializeCropper();
        };
    };
    reader.readAsDataURL(file);
});

function initializeCropper() {
    if (cropper) {
        cropper.destroy();
    }

    if (currentMode === 'profile') {
        // プロフィール画像モード
        cropper = new Cropper(imageToCrop, {
            aspectRatio: 1 / 1,
            viewMode: 1,
            preview: previewCircle,
            autoCropArea: 0.8,
            background: false,
        });
    } else {
        // ロゴモード（アスペクト比固定なし）
        cropper = new Cropper(imageToCrop, {
            viewMode: 1,
            autoCropArea: 0.8,
            background: false,
            crop: updateLogoPreview
        });

        // 初期プレビューを更新
        setTimeout(() => {
            updateLogoPreview();
        }, 100);
    }
}

// ロゴプレビューを更新する関数
function updateLogoPreview() {
    if (!cropper || currentMode !== 'logo') return;

    const croppedCanvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    if (croppedCanvas) {
        croppedImageData = croppedCanvas;
        drawLogoPreview();
    }
}

// プレビューキャンバスに描画
function drawLogoPreview() {
    if (!croppedImageData) return;

    const canvas = previewCanvas;
    const ctx = canvas.getContext('2d');

    // キャンバスをクリア（透過背景）
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // スライダーの値を取得
    const scale = sizeSlider.value / 100;
    const xPos = xSlider.value / 100;
    const yPos = ySlider.value / 100;

    // 最終出力サイズ: 200×1000px
    // プレビューサイズ: 20×100px (1/10)
    const finalWidth = 1000;
    const finalHeight = 200;
    const previewScale = 0.1; // 1/10サイズでプレビュー

    // 画像の最大サイズを計算（最終出力の90%まで）
    const maxImgWidth = finalWidth * 0.9;
    const maxImgHeight = finalHeight * 0.9;

    // クロップ画像のアスペクト比を維持しながら、最大サイズ内に収める
    const imgAspect = croppedImageData.width / croppedImageData.height;
    let targetWidth, targetHeight;

    if (maxImgWidth / maxImgHeight > imgAspect) {
        // 高さ基準
        targetHeight = maxImgHeight * scale;
        targetWidth = targetHeight * imgAspect;
    } else {
        // 幅基準
        targetWidth = maxImgWidth * scale;
        targetHeight = targetWidth / imgAspect;
    }

    // プレビュー用にスケール
    const previewWidth = targetWidth * previewScale;
    const previewHeight = targetHeight * previewScale;

    // 位置を計算
    const x = (canvas.width - previewWidth) * xPos;
    const y = (canvas.height - previewHeight) * yPos;

    // 画像を描画
    ctx.drawImage(croppedImageData, x, y, previewWidth, previewHeight);
}

// スライダーのイベントリスナー
sizeSlider.addEventListener('input', (e) => {
    sizeValue.textContent = e.target.value + '%';
    drawLogoPreview();
});

xSlider.addEventListener('input', (e) => {
    xValue.textContent = e.target.value + '%';
    drawLogoPreview();
});

ySlider.addEventListener('input', (e) => {
    yValue.textContent = e.target.value + '%';
    drawLogoPreview();
});

// リセットボタン
resetButton.addEventListener('click', () => {
    sizeSlider.value = 80;
    xSlider.value = 50;
    ySlider.value = 50;
    sizeValue.textContent = '80%';
    xValue.textContent = '50%';
    yValue.textContent = '50%';
    drawLogoPreview();
});

// プロフィール画像ダウンロード
cropButton.addEventListener('click', () => {
    if (!cropper) {
        alert('まず画像をアップロードしてください。');
        return;
    }

    const shorterSide = Math.min(originalImageWidth, originalImageHeight);

    const croppedCanvas = cropper.getCroppedCanvas({
        width: shorterSide,
        height: shorterSide,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    const baseName = originalFileName.split('.').slice(0, -1).join('.');
    const newFileName = `${baseName}_cropped.png`;

    const link = document.createElement('a');
    link.href = croppedCanvas.toDataURL('image/png');
    link.download = newFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// ロゴ画像ダウンロード
logoButton.addEventListener('click', () => {
    if (!cropper || !croppedImageData) {
        alert('まず画像をアップロードしてください。');
        return;
    }

    // 最終的な200×1000のキャンバスを作成
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = 1000;  // 横1000px
    finalCanvas.height = 200;  // 縦200px
    const ctx = finalCanvas.getContext('2d');

    // 透過背景にする
    ctx.clearRect(0, 0, 1000, 200);

    // スライダーの値を取得
    const scale = sizeSlider.value / 100;
    const xPos = xSlider.value / 100;
    const yPos = ySlider.value / 100;

    // 画像の最大サイズを計算（最終出力の90%まで）
    const maxImgWidth = 1000 * 0.9;  // 900px
    const maxImgHeight = 200 * 0.9;  // 180px

    // クロップ画像のアスペクト比を維持しながら、最大サイズ内に収める
    const imgAspect = croppedImageData.width / croppedImageData.height;
    let targetWidth, targetHeight;

    if (maxImgWidth / maxImgHeight > imgAspect) {
        // 高さ基準
        targetHeight = maxImgHeight * scale;
        targetWidth = targetHeight * imgAspect;
    } else {
        // 幅基準
        targetWidth = maxImgWidth * scale;
        targetHeight = targetWidth / imgAspect;
    }

    // 位置を計算
    const x = (1000 - targetWidth) * xPos;
    const y = (200 - targetHeight) * yPos;

    // 画像を描画
    ctx.drawImage(croppedImageData, x, y, targetWidth, targetHeight);

    // ファイル名を作成
    const baseName = originalFileName.split('.').slice(0, -1).join('.');
    const newFileName = `${baseName}_logo_200x1000.png`;

    // ダウンロード
    const link = document.createElement('a');
    link.href = finalCanvas.toDataURL('image/png');
    link.download = newFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});