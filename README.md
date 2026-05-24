# れんらくボード (contact-board)

Displays the names of frequently-contacted family with a short note in large text; memo only, no calling function.

れんらくボードは、高齢者・介護シーンで見やすいよう、よく連絡する家族の名前と短いメモを大きな文字で表示する Chrome 拡張です。発信、通話、メッセージ送信、外部送信は行いません。

## 単一用途

Displays the names of frequently-contacted family with a short note in large text; memo only, no calling function.

## 主な特徴

- Chrome Manifest V3
- `storage` 権限のみ
- host permissions なし
- API/ネットワーク通信なし、完全オフライン
- 日本語デフォルト、英語ローカライズあり
- 大きめ文字・高コントラストの表示
- 純ロジックは `src/core/`、Chrome storage 実装は `src/storage/`
- Premium $3 買い切り・7日トライアルの判定枠組みあり
- Premium 無効時も基本の名前・メモ表示と編集は利用可能

## 使い方

1. 拡張の popup を開きます。
2. 「名前」と「短いメモ」を入力して保存します。
3. 保存した内容は、この端末の Chrome storage にのみ保存されます。
4. 表示カードの「編集」「削除」から内容を更新できます。

## 開発

```bash
npm install
npm run build
```

`npm run build` で `dist/` が生成され、Chrome 拡張として読み込める `manifest.json`、`_locales/`、`icons/`、ビルド済み UI が入ります。

## Chrome での確認

1. `npm run build` を実行します。
2. Chrome の `chrome://extensions` を開きます。
3. 「デベロッパーモード」を有効にします。
4. 「パッケージ化されていない拡張機能を読み込む」から `dist/` を選びます。

## 非医療・プライバシー

本拡張は非医療の生活支援ツールです。診断、治療、医療助言、健康改善の提案は行いません。

入力データは Chrome の `storage` API でローカル保存され、外部へ送信されません。詳細は以下を参照してください。

- [プライバシーポリシー](legal/PRIVACY.md)
- [免責事項](legal/DISCLAIMER.md)

## オーナー TODO

- 実決済後の Premium 有効化フローを接続する
