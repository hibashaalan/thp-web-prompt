'use client'
import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import ThemeToggle from '../ThemeToggle'

type Step = {
  id: number
  order_by: number
  description: string | null
  llm_system_prompt: string | null
  llm_user_prompt: string | null
  llm_temperature: number | null
  llm_input_type_id: number
  llm_output_type_id: number
  llm_model_id: number
  humor_flavor_step_type_id: number
}

export default function FlavorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()

  const [flavor, setFlavor] = useState<any>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [stepTypes, setStepTypes] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])
  const [inputTypes, setInputTypes] = useState<any[]>([])
  const [outputTypes, setOutputTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFlavor, setEditingFlavor] = useState(false)
  const [flavorDesc, setFlavorDesc] = useState('')
  const [flavorSlug, setFlavorSlug] = useState('')
  const [addingStep, setAddingStep] = useState(false)
  const [editingStep, setEditingStep] = useState<number | null>(null)
  const [testImageUrl, setTestImageUrl] = useState('')
  const [testResults, setTestResults] = useState<any[]>([])
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState('')
  const [saving, setSaving] = useState(false)

  const [newStep, setNewStep] = useState({
    description: '', llm_system_prompt: '', llm_user_prompt: '',
    llm_temperature: '0.7', llm_input_type_id: 1, llm_output_type_id: 1,
    llm_model_id: 1, humor_flavor_step_type_id: 1,
  })

  const load = async () => {
    const [
      { data: flavorData },
      { data: stepsData },
      { data: stepTypesData },
      { data: modelsData },
      { data: inputTypesData },
      { data: outputTypesData },
    ] = await Promise.all([
      supabase.from('humor_flavors').select('*').eq('id', id).single(),
      supabase.from('humor_flavor_steps').select('*').eq('humor_flavor_id', id).order('order_by'),
      supabase.from('humor_flavor_step_types').select('*').order('id'),
      supabase.from('llm_models').select('*').order('id'),
      supabase.from('llm_input_types').select('*').order('id'),
      supabase.from('llm_output_types').select('*').order('id'),
    ])
    setFlavor(flavorData)
    setFlavorDesc(flavorData?.description || '')
    setFlavorSlug(flavorData?.slug || '')
    setSteps(stepsData || [])
    setStepTypes(stepTypesData || [])
    setModels(modelsData || [])
    setInputTypes(inputTypesData || [])
    setOutputTypes(outputTypesData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const saveFlavor = async () => {
    const { data: userData } = await supabase.auth.getUser()
    await supabase.from('humor_flavors').update({
      slug: flavorSlug, description: flavorDesc,
      modified_by_user_id: userData?.user?.id,
      modified_datetime_utc: new Date().toISOString(),
    }).eq('id', id)
    setEditingFlavor(false)
    load()
  }

  const addStep = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const maxOrder = steps.length > 0 ? Math.max(...steps.map(s => s.order_by)) : 0
    await supabase.from('humor_flavor_steps').insert({
      humor_flavor_id: Number(id),
      order_by: maxOrder + 1,
      description: newStep.description || null,
      llm_system_prompt: newStep.llm_system_prompt || null,
      llm_user_prompt: newStep.llm_user_prompt || null,
      llm_temperature: newStep.llm_temperature ? Number(newStep.llm_temperature) : null,
      llm_input_type_id: Number(newStep.llm_input_type_id),
      llm_output_type_id: Number(newStep.llm_output_type_id),
      llm_model_id: Number(newStep.llm_model_id),
      humor_flavor_step_type_id: Number(newStep.humor_flavor_step_type_id),
      created_by_user_id: userData?.user?.id,
      modified_by_user_id: userData?.user?.id,
    })
    setAddingStep(false)
    setNewStep({ description: '', llm_system_prompt: '', llm_user_prompt: '', llm_temperature: '0.7', llm_input_type_id: 1, llm_output_type_id: 1, llm_model_id: 1, humor_flavor_step_type_id: 1 })
    load()
  }

  const updateStep = async (step: Step) => {
    const { data: userData } = await supabase.auth.getUser()
    await supabase.from('humor_flavor_steps').update({
      description: step.description,
      llm_system_prompt: step.llm_system_prompt,
      llm_user_prompt: step.llm_user_prompt,
      llm_temperature: step.llm_temperature,
      llm_input_type_id: step.llm_input_type_id,
      llm_output_type_id: step.llm_output_type_id,
      llm_model_id: step.llm_model_id,
      humor_flavor_step_type_id: step.humor_flavor_step_type_id,
      modified_by_user_id: userData?.user?.id,
      modified_datetime_utc: new Date().toISOString(),
    }).eq('id', step.id)
    setEditingStep(null)
    load()
  }

  const deleteStep = async (stepId: number) => {
    if (!confirm('Delete this step?')) return
    await supabase.from('humor_flavor_steps').delete().eq('id', stepId)
    load()
  }

  const moveStep = async (stepId: number, direction: 'up' | 'down') => {
    const idx = steps.findIndex(s => s.id === stepId)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === steps.length - 1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const stepA = steps[idx]
    const stepB = steps[swapIdx]
    await Promise.all([
      supabase.from('humor_flavor_steps').update({ order_by: stepB.order_by }).eq('id', stepA.id),
      supabase.from('humor_flavor_steps').update({ order_by: stepA.order_by }).eq('id', stepB.id),
    ])
    load()
  }

  const testFlavor = async () => {
    if (!testImageUrl.trim()) return
    setTesting(true)
    setTestError('')
    setTestResults([])
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error('Not authenticated')

      const BASE = 'https://api.almostcrackd.ai'
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

      // Step 1: Register image URL
      const registerRes = await fetch(`${BASE}/pipeline/upload-image-from-url`, {
        method: 'POST', headers,
        body: JSON.stringify({ imageUrl: testImageUrl.trim(), isCommonUse: false }),
      })
      if (!registerRes.ok) throw new Error(`Register failed: ${registerRes.status}`)
      const { imageId } = await registerRes.json()

      // Step 2: Generate captions with this flavor
      const captionRes = await fetch(`${BASE}/pipeline/generate-captions`, {
        method: 'POST', headers,
        body: JSON.stringify({ imageId, humorFlavorId: Number(id) }),
      })
      if (!captionRes.ok) throw new Error(`Caption generation failed: ${captionRes.status}`)
      const captionData = await captionRes.json()
      setTestResults(Array.isArray(captionData) ? captionData : [captionData])
    } catch (err: any) {
      setTestError(err.message || 'Something went wrong')
    }
    setTesting(false)
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 6, color: 'var(--text)', fontSize: 13,
  }
  const selectStyle = { ...inputStyle }
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, color: 'var(--text-muted)', display: 'block' as const, marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <header style={{
        borderBottom: '1px solid var(--border)', background: 'var(--surface)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/flavors" style={{ fontSize: 20 }}>🧪</Link>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>/</span>
          <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--accent)' }}>{flavor?.slug}</code>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ThemeToggle />
          <Link href="/flavors" style={{ padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 12, color: 'var(--text-muted)' }}>
            ← All Flavors
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Flavor header */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', marginBottom: 24 }}>
          {editingFlavor ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={labelStyle}>Slug</label>
                <input value={flavorSlug} onChange={e => setFlavorSlug(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={flavorDesc} onChange={e => setFlavorDesc(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveFlavor} style={{ padding: '7px 16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 13 }}>Save</button>
                <button onClick={() => setEditingFlavor(false)} style={{ padding: '7px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-muted)', fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <code style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{flavor?.slug}</code>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>id: {flavor?.id}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>{flavor?.description || <span style={{ color: 'var(--text-muted)' }}>No description</span>}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'DM Mono, monospace' }}>
                  {steps.length} steps · created {new Date(flavor?.created_datetime_utc).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setEditingFlavor(true)} style={{ padding: '7px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Steps */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Steps ({steps.length})</h2>
            <button onClick={() => setAddingStep(true)} style={{ padding: '7px 14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 12 }}>
              + Add Step
            </button>
          </div>

          {/* Add step form */}
          {addingStep && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 12, padding: '20px', marginBottom: 14, animation: 'fadeUp 0.2s ease both' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>New Step</h3>
              <StepForm
                step={newStep as any}
                onChange={setNewStep as any}
                stepTypes={stepTypes}
                models={models}
                inputTypes={inputTypes}
                outputTypes={outputTypes}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={addStep} style={{ padding: '7px 16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 13 }}>Add Step</button>
                <button onClick={() => setAddingStep(false)} style={{ padding: '7px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-muted)', fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Step list */}
          {steps.length === 0 && !addingStep && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 12, border: '1px dashed var(--border)' }}>
              No steps yet. Add one above.
            </div>
          )}

          <div style={{ display: 'grid', gap: 10 }}>
            {steps.map((step, idx) => (
              <div key={step.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                {/* Step header */}
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'var(--accent)', fontFamily: 'DM Mono, monospace',
                  }}>{step.order_by}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                      {step.description || stepTypes.find(t => t.id === step.humor_flavor_step_type_id)?.description || 'Step'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                      {models.find(m => m.id === step.llm_model_id)?.name || `model:${step.llm_model_id}`}
                      {step.llm_temperature !== null && ` · temp:${step.llm_temperature}`}
                      {' · '}{inputTypes.find(t => t.id === step.llm_input_type_id)?.slug || `in:${step.llm_input_type_id}`}
                      {' → '}{outputTypes.find(t => t.id === step.llm_output_type_id)?.slug || `out:${step.llm_output_type_id}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => moveStep(step.id, 'up')} disabled={idx === 0} style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', color: idx === 0 ? 'var(--text-muted)' : 'var(--text)', fontSize: 13, opacity: idx === 0 ? 0.4 : 1 }}>↑</button>
                    <button onClick={() => moveStep(step.id, 'down')} disabled={idx === steps.length - 1} style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', color: idx === steps.length - 1 ? 'var(--text-muted)' : 'var(--text)', fontSize: 13, opacity: idx === steps.length - 1 ? 0.4 : 1 }}>↓</button>
                    <button onClick={() => setEditingStep(editingStep === step.id ? null : step.id)} style={{ padding: '0 10px', height: 28, borderRadius: 6, background: editingStep === step.id ? 'var(--accent)' : 'var(--surface2)', border: '1px solid var(--border)', color: editingStep === step.id ? '#000' : 'var(--text)', fontSize: 12, fontWeight: 600 }}>Edit</button>
                    <button onClick={() => deleteStep(step.id)} style={{ padding: '0 10px', height: 28, borderRadius: 6, background: 'transparent', border: '1px solid rgba(224,92,92,0.3)', color: 'var(--danger)', fontSize: 12 }}>Del</button>
                  </div>
                </div>

                {/* Step prompts preview */}
                {editingStep !== step.id && (
                  <div style={{ padding: '0 16px 14px', display: 'grid', gap: 8 }}>
                    {step.llm_system_prompt && (
                      <div style={{ background: 'var(--surface2)', borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>System</div>
                        <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{step.llm_system_prompt}</p>
                      </div>
                    )}
                    {step.llm_user_prompt && (
                      <div style={{ background: 'var(--surface2)', borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>User</div>
                        <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{step.llm_user_prompt}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Edit form */}
                {editingStep === step.id && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <EditStepForm
                      step={step}
                      stepTypes={stepTypes}
                      models={models}
                      inputTypes={inputTypes}
                      outputTypes={outputTypes}
                      onSave={updateStep}
                      onCancel={() => setEditingStep(null)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Test panel */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 14 }}>🧪 Test This Flavor</h2>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <input
              value={testImageUrl}
              onChange={e => setTestImageUrl(e.target.value)}
              placeholder="Paste an image URL to test with..."
              style={{ flex: 1, padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}
            />
            <button onClick={testFlavor} disabled={testing || !testImageUrl.trim()} style={{
              padding: '9px 20px', background: testing ? 'var(--surface2)' : 'var(--accent)',
              color: testing ? 'var(--text-muted)' : '#000',
              border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
              cursor: testing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {testing ? (
                <><div style={{ width: 14, height: 14, border: '2px solid #33333a', borderTopColor: '#888', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Generating…</>
              ) : 'Generate Captions'}
            </button>
          </div>

          {testImageUrl && (
            <div style={{ marginBottom: 14 }}>
              <img src={testImageUrl} alt="test" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8, objectFit: 'contain', border: '1px solid var(--border)' }} onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
          )}

          {testError && (
            <div style={{ background: 'var(--danger-dim)', border: '1px solid rgba(224,92,92,0.2)', borderRadius: 8, padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 14 }}>
              ⚠️ {testError}
            </div>
          )}

          {testResults.length > 0 && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Generated {testResults.length} captions:</p>
              <div style={{ display: 'grid', gap: 8 }}>
                {testResults.map((c: any, i: number) => (
                  <div key={i} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px', borderLeft: '3px solid var(--accent)' }}>
                    <p style={{ fontSize: 13, fontStyle: 'italic', lineHeight: 1.6 }}>"{c.content || c.caption || c.text || JSON.stringify(c)}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}

function StepForm({ step, onChange, stepTypes, models, inputTypes, outputTypes }: any) {
  const inputStyle = { width: '100%', padding: '7px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13 }
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, color: 'var(--text-muted)', display: 'block' as const, marginBottom: 3, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Step Type</label>
          <select value={step.humor_flavor_step_type_id} onChange={e => onChange({ ...step, humor_flavor_step_type_id: Number(e.target.value) })} style={inputStyle}>
            {stepTypes.map((t: any) => <option key={t.id} value={t.id}>{t.slug}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Model</label>
          <select value={step.llm_model_id} onChange={e => onChange({ ...step, llm_model_id: Number(e.target.value) })} style={inputStyle}>
            {models.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Input Type</label>
          <select value={step.llm_input_type_id} onChange={e => onChange({ ...step, llm_input_type_id: Number(e.target.value) })} style={inputStyle}>
            {inputTypes.map((t: any) => <option key={t.id} value={t.id}>{t.slug}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Output Type</label>
          <select value={step.llm_output_type_id} onChange={e => onChange({ ...step, llm_output_type_id: Number(e.target.value) })} style={inputStyle}>
            {outputTypes.map((t: any) => <option key={t.id} value={t.id}>{t.slug}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
        <div>
          <label style={labelStyle}>Description</label>
          <input value={step.description || ''} onChange={e => onChange({ ...step, description: e.target.value })} placeholder="What does this step do?" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Temp</label>
          <input value={step.llm_temperature ?? ''} onChange={e => onChange({ ...step, llm_temperature: e.target.value })} placeholder="0.7" style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>System Prompt</label>
        <textarea value={step.llm_system_prompt || ''} onChange={e => onChange({ ...step, llm_system_prompt: e.target.value })} rows={3} placeholder="You are a..." style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div>
        <label style={labelStyle}>User Prompt</label>
        <textarea value={step.llm_user_prompt || ''} onChange={e => onChange({ ...step, llm_user_prompt: e.target.value })} rows={3} placeholder="Analyze this image and..." style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
    </div>
  )
}

function EditStepForm({ step: initialStep, stepTypes, models, inputTypes, outputTypes, onSave, onCancel }: any) {
  const [step, setStep] = useState({ ...initialStep })
  return (
    <div>
      <StepForm step={step} onChange={setStep} stepTypes={stepTypes} models={models} inputTypes={inputTypes} outputTypes={outputTypes} />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={() => onSave(step)} style={{ padding: '7px 16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 13 }}>Save</button>
        <button onClick={onCancel} style={{ padding: '7px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-muted)', fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  )
}
