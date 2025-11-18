#!/bin/bash

# GLTF 模型优化脚本
# 用法: ./optimize-model.sh <模型文件路径>
# 示例: ./optimize-model.sh /Users/mac/my-project/cube-city/public/models/theme_park_level1.glb

# 检查参数
if [ $# -eq 0 ]; then
    echo "错误: 请提供模型文件路径作为参数"
    echo "用法: $0 <模型文件路径>"
    exit 1
fi

MODEL_PATH="$1"

# 检查文件是否存在
if [ ! -f "$MODEL_PATH" ]; then
    echo "错误: 文件不存在: $MODEL_PATH"
    exit 1
fi

# 检查 gltf-transform 是否安装
if ! command -v gltf-transform &> /dev/null; then
    echo "错误: gltf-transform 未安装"
    echo "请运行: npm install -g @gltf-transform/cli"
    exit 1
fi

echo "开始优化模型: $MODEL_PATH"
echo ""

# 步骤 1: 调整纹理大小
echo "步骤 1/3: 调整纹理大小 (512x512)..."
gltf-transform resize --width 512 --height 512 "$MODEL_PATH" "$MODEL_PATH"
if [ $? -ne 0 ]; then
    echo "错误: 纹理大小调整失败"
    exit 1
fi
echo "✓ 纹理大小调整完成"
echo ""

# 步骤 2: 简化模型
echo "步骤 2/3: 简化模型 (ratio: 0.25)..."
gltf-transform simplify --ratio 0.25 "$MODEL_PATH" "$MODEL_PATH"
if [ $? -ne 0 ]; then
    echo "错误: 模型简化失败"
    exit 1
fi
echo "✓ 模型简化完成"
echo ""

# 步骤 3: Draco 压缩
echo "步骤 3/3: 应用 Draco 压缩..."
gltf-transform draco "$MODEL_PATH" "$MODEL_PATH"
if [ $? -ne 0 ]; then
    echo "错误: Draco 压缩失败"
    exit 1
fi
echo "✓ Draco 压缩完成"
echo ""

echo "模型优化完成: $MODEL_PATH"

