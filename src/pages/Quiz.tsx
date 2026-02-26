import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

type QuizQuestion = {
  id: string
  question: string
  type: 'single' | 'multi' | 'scale'
  options: {
    options?: string[]
    min?: number
    max?: number
    labels?: Record<string, string>
  } | null
  order_index: number
}

type AnswerValue = string | string[] | number

export default function Quiz() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})

  useEffect(() => {
    let active = true

    const loadQuestions = async () => {
      if (import.meta.env.DEV) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        console.info(
          '[quiz] fetching:',
          `${supabaseUrl}/rest/v1/quiz_questions?select=id,question,type,options,order_index&order=order_index.asc`,
        )
      }
      const { data, error: fetchError } = await supabase
        .from('quiz_questions')
        .select('id, question, type, options, order_index')
        .order('order_index', { ascending: true })

      if (!active) return
      if (fetchError) {
        console.error('quiz_questions fetch failed', {
          status: fetchError.status,
          code: fetchError.code,
          message: fetchError.message,
          details: fetchError.details,
        })

        if (fetchError.code === 'PGRST205') {
          setError(
            'Quiz table is missing. Please run Supabase migrations for quiz_questions.',
          )
          setLoading(false)
          return
        }

        if (fetchError.status === 401 || fetchError.status === 403) {
          setError(
            'You do not have access to quiz questions. Check RLS policies.',
          )
          setLoading(false)
          return
        }

        throw fetchError
      }

      setQuestions((data ?? []) as QuizQuestion[])
      setLoading(false)
    }

    loadQuestions().catch((err) => {
      if (!active) return
      console.error(err)
      setError('Failed to load quiz. Please try again.')
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const currentQuestion = questions[stepIndex]
  const totalSteps = questions.length

  const isStepAnswered = useMemo(() => {
    if (!currentQuestion) return false
    const value = answers[currentQuestion.id]
    if (currentQuestion.type === 'multi') {
      return Array.isArray(value) && value.length > 0
    }
    if (currentQuestion.type === 'scale') {
      return typeof value === 'number'
    }
    return typeof value === 'string' && value.length > 0
  }, [answers, currentQuestion])

  const handleSingleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleMultiToggle = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const current = prev[questionId]
      const currentArray = Array.isArray(current) ? current : []
      const exists = currentArray.includes(value)
      return {
        ...prev,
        [questionId]: exists
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value],
      }
    })
  }

  const handleScaleChange = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (stepIndex < totalSteps - 1) {
      setStepIndex((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!currentUser) {
      navigate('/login', { replace: true })
      return
    }

    setSaving(true)
    setError(null)

    try {
      const rows = questions.map((question) => ({
        user_id: currentUser.id,
        question_id: question.id,
        answer: answers[question.id] ?? null,
      }))

      await supabase.from('quiz_answers').delete().eq('user_id', currentUser.id)

      const { error: insertError } = await supabase
        .from('quiz_answers')
        .insert(rows)

      if (insertError) {
        throw insertError
      }

      navigate('/results', { replace: true })
    } catch (err) {
      console.error(err)
      setError('Failed to save your answers. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page quiz">
      <Card>
        <h1>Style quiz</h1>
        {loading ? <p>Loading questions...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error && currentQuestion ? (
          <div className="quiz-step">
            <div className="quiz-progress">
              Step {stepIndex + 1} of {totalSteps}
            </div>
            <h2>{currentQuestion.question}</h2>
            {currentQuestion.type === 'single' ? (
              <div className="quiz-options">
                {(currentQuestion.options?.options ?? []).map((option) => (
                  <label key={option} className="quiz-option">
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={() => handleSingleSelect(currentQuestion.id, option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : null}
            {currentQuestion.type === 'multi' ? (
              <div className="quiz-options">
                {(currentQuestion.options?.options ?? []).map((option) => (
                  <label key={option} className="quiz-option">
                    <input
                      type="checkbox"
                      value={option}
                      checked={
                        Array.isArray(answers[currentQuestion.id]) &&
                        (answers[currentQuestion.id] as string[]).includes(option)
                      }
                      onChange={() => handleMultiToggle(currentQuestion.id, option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : null}
            {currentQuestion.type === 'scale' ? (
              <div className="quiz-scale">
                <input
                  type="range"
                  min={currentQuestion.options?.min ?? 1}
                  max={currentQuestion.options?.max ?? 5}
                  value={
                    typeof answers[currentQuestion.id] === 'number'
                      ? (answers[currentQuestion.id] as number)
                      : currentQuestion.options?.min ?? 1
                  }
                  onChange={(event) =>
                    handleScaleChange(
                      currentQuestion.id,
                      Number(event.target.value),
                    )
                  }
                />
                <div className="quiz-scale-labels">
                  <span>
                    {currentQuestion.options?.labels?.[
                      String(currentQuestion.options?.min ?? 1)
                    ] ?? 'Low'}
                  </span>
                  <span>
                    {currentQuestion.options?.labels?.[
                      String(currentQuestion.options?.max ?? 5)
                    ] ?? 'High'}
                  </span>
                </div>
              </div>
            ) : null}
            <div className="quiz-actions">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={stepIndex === 0 || saving}
              >
                Back
              </Button>
              {stepIndex < totalSteps - 1 ? (
                <Button onClick={handleNext} disabled={!isStepAnswered || saving}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!isStepAnswered || saving}>
                  {saving ? 'Saving...' : 'Finish'}
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Card>
    </section>
  )
}
