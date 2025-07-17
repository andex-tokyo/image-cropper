// HTMLの各要素を取得
const imageInput = document.getElementById('image-input');
const imageToCrop = document.getElementById('image-to-crop');
const previewCircle = document.querySelector('.preview-circle');
const cropButton = document.getElementById('crop-button');

let cropper;
let originalImageWidth, originalImageHeight;
let originalFileName; // ← 変更点: ファイル名を保存する変数を追加

// 1. 画像が選択されたときの処理
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    originalFileName = file.name; // ← 変更点: ファイル名を取得して保存

    const reader = new FileReader();
    reader.onload = (event) => {
        imageToCrop.src = event.target.result;

        // もし既にcropperインスタンスが存在すれば破棄する
        if (cropper) {
            cropper.destroy();
        }

        // 画像の元のサイズを取得しておく
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            originalImageWidth = img.naturalWidth;
            originalImageHeight = img.naturalHeight;

            // 2. Cropper.jsを初期化
            cropper = new Cropper(imageToCrop, {
                aspectRatio: 1 / 1,       // アスペクト比を1:1 (正方形)に固定
                viewMode: 1,              // クロップボックスが画像の外にはみ出さないようにする
                preview: previewCircle,   // プレビューを表示する要素を指定
                autoCropArea: 0.8,        // 最初に表示されるクロップエリアの大きさ
                background: false,        // グリッド背景を非表示
            });
        };
    };
    reader.readAsDataURL(file);
});


// 3. ダウンロードボタンがクリックされたときの処理
cropButton.addEventListener('click', () => {
    if (!cropper) {
        alert('まず画像をアップロードしてください。');
        return;
    }

    // 元画像の短辺の長さを取得
    const shorterSide = Math.min(originalImageWidth, originalImageHeight);

    // Cropper.jsの機能で、指定したサイズで切り抜いた画像データを取得
    const croppedCanvas = cropper.getCroppedCanvas({
        width: shorterSide,  // 書き出す画像の幅
        height: shorterSide, // 書き出す画像の高さ
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    // --- ここからファイル名の処理を変更 --- // ← 変更点

    // 元のファイル名から拡張子を除いた部分を取得
    // 例: "my-photo.jpeg" -> "my-photo"
    const baseName = originalFileName.split('.').slice(0, -1).join('.');

    // 新しいファイル名を作成（元ファイル名 + "_cropped" + .png）
    const newFileName = `${baseName}_cropped.png`;

    // ダウンロード用のリンクを動的に作成してクリックさせる
    const link = document.createElement('a');
    link.href = croppedCanvas.toDataURL('image/png'); // PNG形式のデータURLを取得
    link.download = newFileName; // ← 変更点: 作成した新しいファイル名を設定
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});