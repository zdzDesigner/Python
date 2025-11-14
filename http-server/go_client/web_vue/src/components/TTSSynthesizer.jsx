import { ref, computed, defineComponent } from "vue"
import SpinnerIcon from "./SpinnerIcon.jsx"

export default defineComponent({
  props: {
    isSynthesizing: Boolean,
    selectedFile: Object,
  },
  emits: ["synthesize"],
  setup(props, { emit }) {
    const text = ref("你好，这是一个在网页上生成的语音。")

    const handleSubmit = (e) => {
      e.preventDefault()
      if (!text.value.trim() || props.isSynthesizing) return
      emit("synthesize", text.value)
    }

    return () => (
      <div class="p-4 border-t border-slate-200">
        <form onSubmit={handleSubmit}>
          <textarea
            value={text.value}
            onInput={(e) => (text.value = e.target.value)}
            class="w-full h-24 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 resize-none"
            placeholder="Enter text to synthesize..."
            disabled={props.isSynthesizing}
          />

          <button
            type="submit"
            disabled={props.isSynthesizing || !text.value.trim()}
            class="mt-3 w-full flex justify-center items-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {props.isSynthesizing ? (
              <>
                <SpinnerIcon class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Generating...
              </>
            ) : (
              "Generate Audio"
            )}
          </button>
        </form>
      </div>
    )
  },
})
