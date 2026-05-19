<script setup lang="ts">
import { Bold, Italic } from 'lucide-vue-next'
import type { Editor } from '@tiptap/core'

const editor = shallowRef<Editor | null>(null)
const EditorContent = shallowRef<Component | null>(null)

onMounted(async () => {
  const [{ Editor: TiptapEditor, EditorContent: TiptapEditorContent }, { default: StarterKit }] = await Promise.all([
    import('@tiptap/vue-3'),
    import('@tiptap/starter-kit')
  ])

  EditorContent.value = TiptapEditorContent
  editor.value = new TiptapEditor({
    extensions: [StarterKit],
    content: `
      <h2>可编辑模式示意</h2>
      <p>后台不是传统管理平台，而是在前台同等级视觉上叠加编辑能力。这里后续会接入文章 JSON、腾讯云 COS 图片上传和发布流程。</p>
      <p>选中文字时会出现工具浮层，未来可以继续扩展自定义语法和自定义节点。</p>
    `
  })
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="glass-panel editor-surface relative rounded-[2rem] p-6">
    <div class="mb-5 flex gap-1 rounded-full border border-border bg-white/75 p-1 shadow-sm">
      <button class="grid size-9 place-items-center rounded-full hover:bg-bg-soft" @click="editor?.chain().focus().toggleBold().run()">
        <Bold :size="16" />
      </button>
      <button class="grid size-9 place-items-center rounded-full hover:bg-bg-soft" @click="editor?.chain().focus().toggleItalic().run()">
        <Italic :size="16" />
      </button>
    </div>
    <component :is="EditorContent" v-if="editor && EditorContent" :editor="editor" />
    <div v-else class="grid min-h-80 place-items-center muted">编辑器加载中</div>
  </div>
</template>
