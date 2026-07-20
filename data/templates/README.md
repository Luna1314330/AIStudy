# 初始花园 · 核心词 Excel 模板

用 Excel / WPS 打开 `gardenBookList.reference.csv` 即可编辑（UTF-8，中文正常显示）。

## 文件说明

| 文件 | 用途 |
|------|------|
| `gardenBookList.reference.csv` | **主模板**：72 本书，一行一本，填「词1英文/词1中文」～「词6英文/词6中文」 |
| `gardenBookVocab.template.csv` | 长表示例（同一本书多行），可选 |

## 填写规则

1. **不要改** `bookId` 列（与系统内绘本 ID 对应）
2. 每本书建议填 **4～6 组词**（至少 1 组才能挑战）
3. `英文书名`、`中文书名`、`系列` 仅方便核对，导入时会忽略
4. 空词组会被跳过；同一英文单词重复只保留一条

## 导入步骤

1. 在 Excel 中编辑并**另存为 CSV UTF-8**（或保持 `.csv`）
2. 在项目根目录执行：

```bash
npm run vocab:import -- data/templates/gardenBookList.reference.csv
```

3. 刷新浏览器，对应绘本即可做「打勾 + 配对」挑战

## 其他命令

```bash
# 重新生成空模板（会覆盖 reference 文件里的填写内容，慎用）
npm run vocab:books

# 全量替换词汇（删除 JSON 里未出现在 CSV 中的书）
npm run vocab:import -- data/templates/gardenBookList.reference.csv -- --replace
```

## 宽表示例（一行）

| bookId | 词1英文 | 词1中文 | 词2英文 | 词2中文 |
|--------|---------|---------|---------|---------|
| youyou-3-33 | strong | 强壮的 | bear | 熊 |
