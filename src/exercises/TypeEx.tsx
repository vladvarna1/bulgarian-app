import { useEffect, useState } from 'react'
import { speak } from '../lib/audio'
import { useShow } from '../lib/useShow'
import { SpeakBtn } from '../components/ui'
import { TextInput } from './TextInput'
import type { ExerciseProps, TypeEx } from './types'

export function TypeAnswer({ ex, onAnswer, onSubmit, locked }: ExerciseProps<TypeEx>) {
  const show = useShow()
  const [text, setText] = useState('')

  useEffect(() => {
    if (ex.speak) speak(ex.speak)
  }, [ex.speak])

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-extrabold">{ex.hidePrompt ? ex.prompt : show(ex.prompt)}</h2>
      {ex.speak && (
        <div className="flex items-center gap-3">
          <SpeakBtn text={ex.speak} size="lg" />
          <SpeakBtn text={ex.speak} slow size="md" />
        </div>
      )}
      <TextInput
        value={text}
        onChange={(v) => {
          setText(v)
          onAnswer(v.trim() ? v : null)
        }}
        onSubmit={onSubmit}
        disabled={locked}
        lang={ex.targetLang}
      />
    </div>
  )
}
