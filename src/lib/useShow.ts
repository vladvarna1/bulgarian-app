import { stripStress } from '../domain/text'
import { useProgress } from '../stores/progress'

/** Returns a formatter that shows or hides stress marks according to the user setting. */
export function useShow(): (s: string) => string {
  const stress = useProgress((s) => s.settings.stress)
  return (s) => (stress ? s : stripStress(s))
}
