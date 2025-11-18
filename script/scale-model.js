// scale-model.js
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

async function scaleModel(inputPath, outputPath, scaleX = 1, scaleY = 1, scaleZ = 1) {
  try {
    // 初始化 IO 并注册所有扩展（包括 Draco）
    const io = new NodeIO()
      .registerExtensions(ALL_EXTENSIONS)
      .registerDependencies({
        'draco3d.decoder': await draco3d.createDecoderModule(),
        'draco3d.encoder': await draco3d.createEncoderModule(),
      })

    console.warn('正在读取模型文件...')
    const document = await io.read(inputPath)

    const root = document.getRoot()
    const meshes = root.listMeshes()

    let totalVertices = 0

    // 对每个网格应用缩放
    for (const mesh of meshes) {
      const primitives = mesh.listPrimitives()
      for (const primitive of primitives) {
        const position = primitive.getAttribute('POSITION')
        if (position) {
          const array = position.getArray()
          totalVertices += array.length / 3

          // 缩放每个顶点
          for (let i = 0; i < array.length; i += 3) {
            array[i] *= scaleX // X 轴
            array[i + 1] *= scaleY // Y 轴
            array[i + 2] *= scaleZ // Z 轴
          }
          position.setArray(array)
        }
      }
    }

    console.warn(`处理了 ${totalVertices} 个顶点`)
    console.warn('正在写入文件...')

    await io.write(outputPath, document)
    console.warn(`✅ 模型缩放完成: X=${scaleX}, Y=${scaleY}, Z=${scaleZ}`)
    console.warn(`输出文件: ${outputPath}`)
  }
  catch (error) {
    console.error('❌ 处理过程中发生错误:', error)
    throw error
  }
}

// 从命令行参数获取输入
const args = process.argv.slice(2)
if (args.length >= 5) {
  const [inputPath, outputPath, scaleX, scaleY, scaleZ] = args
  scaleModel(inputPath, outputPath, Number.parseFloat(scaleX), Number.parseFloat(scaleY), Number.parseFloat(scaleZ))
    .catch(console.error)
}
else {
  console.warn(`
使用方法:
  node scale-model.js <输入文件> <输出文件> <X缩放> <Y缩放> <Z缩放>

示例:
  node scale-model.js input.glb output.glb 2 1.5 0.8
  `)

  // 如果没有参数，使用默认值运行示例
  if (args.length === 0) {
    console.warn('使用默认参数运行示例...')
    scaleModel('input.glb', 'output.glb', 2, 1.5, 0.8)
      .catch(console.error)
  }
}
